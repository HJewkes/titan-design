import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import {
  contrastReport,
  formatContrastReport,
  type ContrastReport,
  type MeasuredFrame,
} from './contrast-gate.ts'
import { ReviewError, assertStoriesExist, loadRound, type LoadedRound } from './review.ts'

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
  const file = join(dirname(roundPath), CONTRAST_FILE)
  const raw = await readFile(file, 'utf8').catch(() => null)
  if (raw === null) return `no ${CONTRAST_FILE} beside this round`
  const report = JSON.parse(raw) as Partial<ContrastReport>
  if (report.manifestSha256 !== manifestSha256)
    return `${CONTRAST_FILE} measured a different manifest`
  return report.passed ? null : `${CONTRAST_FILE} records undeclared contrast failures`
}
