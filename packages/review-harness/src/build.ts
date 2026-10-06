import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import {
  contrastReport,
  formatContrastReport,
  type ContrastReport,
  type MeasuredFrame,
} from './contrast-gate.ts'
import { ReviewError, assertStoriesExist, loadRound, type LoadedRound } from './review.ts'
import type { ContrastOverride } from './schema.ts'

/** The round was measured and an undeclared miss (or an unmeasured image) blocked it. */
export const EXIT_REFUSED = 3

export const ROUND_FILE = 'round.json'
export const CONTRAST_FILE = 'contrast.json'

export interface BuildIo {
  stderr: (text: string) => void
  measure: (round: LoadedRound) => Promise<MeasuredFrame[]>
}

const REFUSAL =
  `refused: ${ROUND_FILE} not written. Fix each FAIL, or declare it in the section's ` +
  "(or the round's) contrast.knownDefects with a route: the task id that owns the primitive " +
  'or token, or "component".'

/**
 * Measures a draft round in light and dark, writes contrast.json beside it, and copies the
 * draft byte for byte to round.json only when nothing undeclared failed.
 */
export async function buildRound(
  draftPath: string,
  storybook: string | undefined,
  io: BuildIo
): Promise<number> {
  if (basename(draftPath) === ROUND_FILE)
    throw new ReviewError(`the draft must not be ${ROUND_FILE}; build writes that file`)
  const round = await loadRound(draftPath, storybook)
  if (round.manifest.contrastOverride)
    throw new ReviewError('a draft never carries contrastOverride; serving writes it')
  await assertStoriesExist(round)
  const frames = await io.measure(round)
  const report = contrastReport({ ...round, frames })
  const dir = dirname(draftPath)
  await writeFile(join(dir, CONTRAST_FILE), `${JSON.stringify(report, null, 2)}\n`)
  formatContrastReport(report).forEach((line) => io.stderr(line))
  io.stderr(`wrote ${join(dir, CONTRAST_FILE)}`)
  if (!report.passed) {
    io.stderr(REFUSAL)
    return EXIT_REFUSED
  }
  await copyFile(draftPath, join(dir, ROUND_FILE))
  io.stderr(`wrote ${join(dir, ROUND_FILE)}`)
  return 0
}

/** Why a round about to be served has no passing contrast.json for these exact bytes. */
export async function contrastProblem(
  roundPath: string,
  manifestSha256: string
): Promise<string | null> {
  const report = await readReport(roundPath)
  if (report === null) return `no ${CONTRAST_FILE} beside this round`
  if (report.manifestSha256 !== manifestSha256)
    return `${CONTRAST_FILE} measured a different manifest`
  return report.passed ? null : `${CONTRAST_FILE} records undeclared contrast failures`
}

async function readReport(roundPath: string): Promise<Partial<ContrastReport> | null> {
  const path = join(dirname(roundPath), CONTRAST_FILE)
  const raw = await readFile(path, 'utf8').catch((err: NodeJS.ErrnoException) => {
    if (err.code === 'ENOENT') return null
    throw err
  })
  if (raw === null) return null
  try {
    return JSON.parse(raw) as Partial<ContrastReport>
  } catch {
    throw new ReviewError(`${path} is not JSON`)
  }
}

/** The override as recorded: the reason, the gate's objection, and every miss it had found. */
export async function overrideRecord(
  roundPath: string,
  problem: string,
  reason: string
): Promise<ContrastOverride> {
  const failures = ((await readReport(roundPath))?.failures ?? []).map((f) => ({
    variant: f.variant,
    element: f.testId ?? f.selector,
    mode: f.mode,
    kind: f.kind,
    ratio: f.ratio,
    required: f.required,
  }))
  return { reason, problem, failures }
}

/**
 * Writes the override into round.json before it is served, so the round itself (and its
 * sha, which feedback echoes) carries the record of having been shown ungated.
 */
export async function recordOverride(
  roundPath: string,
  override: ContrastOverride,
  storybook: string | undefined
): Promise<LoadedRound> {
  const manifest = JSON.parse(await readFile(roundPath, 'utf8')) as Record<string, unknown>
  await writeFile(
    roundPath,
    `${JSON.stringify({ ...manifest, contrastOverride: override }, null, 2)}\n`
  )
  return loadRound(roundPath, storybook)
}
