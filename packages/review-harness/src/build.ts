import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import {
  contrastReport,
  formatContrastReport,
  type ContrastReport,
  type MeasuredFrame,
} from './contrast-gate.ts'
import { MAIN_REF } from './harness-freshness.ts'
import { ReviewError, assertStoriesExist, loadRound, type LoadedRound } from './review.ts'
import type { ContrastOverride, Manifest } from './schema.ts'

/** The round was measured and an undeclared miss (or an unmeasured image) blocked it. */
export const EXIT_REFUSED = 3

export const ROUND_FILE = 'round.json'
export const CONTRAST_FILE = 'contrast.json'

/** The git reads the build makes in the Storybook's tree. */
export interface TreeGit {
  /** The full sha `ref` names in the tree. */
  revParse: (tree: string, ref: string) => Promise<string>
  /** Whether `sha` is `head` or an ancestor of it; false when the tree lacks the commit. */
  isAncestor: (tree: string, sha: string, head: string) => Promise<boolean>
}

export interface BuildIo {
  stderr: (text: string) => void
  measure: (round: LoadedRound) => Promise<MeasuredFrame[]>
  git: TreeGit
}

type BuildProvenance = NonNullable<Manifest['build']>

const REFUSAL =
  `refused: ${ROUND_FILE} not written. Fix each FAIL, or declare it in the section's ` +
  "(or the round's) contrast.knownDefects with a route: the task id that owns the primitive " +
  'or token, or "component".'

interface BoundHead {
  questionId: string
  pr: string
  headSha: string
}

function boundHeads(manifest: Manifest): BoundHead[] {
  return manifest.questions.flatMap((q) =>
    q.kind === 'pick-one' && q.merge
      ? [{ questionId: q.id, pr: `${q.merge.repo}#${q.merge.pr}`, headSha: q.merge.headSha }]
      : []
  )
}

/**
 * What the tree was built from, or the lines refusing it: a round that binds a pick-one to a
 * PR head needs a tree, and every bound head must be in the tree's HEAD.
 */
async function treeProvenance(
  bound: BoundHead[],
  tree: string | undefined,
  git: TreeGit
): Promise<{ build?: BuildProvenance } | { refusal: string[] }> {
  if (tree === undefined) {
    if (!bound.length) return {}
    const ids = bound.map((b) => b.questionId).join(', ')
    return { refusal: [`a PR head is bound by ${ids}; pass --tree <path>, the Storybook's tree`] }
  }
  const mergeSha = await git.revParse(tree, 'HEAD')
  const absent: BoundHead[] = []
  for (const b of bound) if (!(await git.isAncestor(tree, b.headSha, mergeSha))) absent.push(b)
  if (absent.length)
    return {
      refusal: absent.map(
        (b) => `${b.pr} at ${b.headSha} (${b.questionId}) is not in ${tree} at HEAD ${mergeSha}`
      ),
    }
  return { build: { mainSha: await git.revParse(tree, MAIN_REF), mergeSha } }
}

/** The bytes round.json gets: the draft's own, or the draft with the build's provenance. */
async function roundBytes(draftPath: string, build: BuildProvenance | undefined) {
  const draft = await readFile(draftPath)
  if (!build) return draft
  const manifest = JSON.parse(draft.toString('utf8')) as Record<string, unknown>
  return Buffer.from(`${JSON.stringify({ ...manifest, build }, null, 2)}\n`)
}

async function loadDraft(draftPath: string, storybook: string | undefined) {
  if (basename(draftPath) === ROUND_FILE)
    throw new ReviewError(`the draft must not be ${ROUND_FILE}; build writes that file`)
  const round = await loadRound(draftPath, storybook)
  if (round.manifest.contrastOverride)
    throw new ReviewError('a draft never carries contrastOverride; serving writes it')
  if (round.manifest.build)
    throw new ReviewError('a draft never carries build; the build writes it')
  return round
}

/**
 * Measures a draft round in light and dark, writes contrast.json beside it, and writes
 * round.json only when nothing undeclared failed: the draft byte for byte, or with `--tree`
 * the draft plus `build`. contrast.json records the sha of the bytes round.json gets.
 */
export async function buildRound(
  draftPath: string,
  storybook: string | undefined,
  io: BuildIo,
  tree?: string
): Promise<number> {
  const round = await loadDraft(draftPath, storybook)
  const provenance = await treeProvenance(boundHeads(round.manifest), tree, io.git)
  if ('refusal' in provenance) {
    provenance.refusal.forEach((line) => io.stderr(`refused: ${line}`))
    io.stderr(`refused: ${ROUND_FILE} not written`)
    return EXIT_REFUSED
  }
  await assertStoriesExist(round)
  const bytes = await roundBytes(draftPath, provenance.build)
  const manifestSha256 = createHash('sha256').update(bytes).digest('hex')
  const report = contrastReport({ ...round, manifestSha256, frames: await io.measure(round) })
  const dir = dirname(draftPath)
  await writeFile(join(dir, CONTRAST_FILE), `${JSON.stringify(report, null, 2)}\n`)
  formatContrastReport(report).forEach((line) => io.stderr(line))
  io.stderr(`wrote ${join(dir, CONTRAST_FILE)}`)
  if (!report.passed) {
    io.stderr(REFUSAL)
    return EXIT_REFUSED
  }
  await writeFile(join(dir, ROUND_FILE), bytes)
  io.stderr(`wrote ${join(dir, ROUND_FILE)}`)
  return 0
}

function git(tree: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', ['-C', tree, ...args], { timeout: 10_000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(String(stderr).trim() || err.message))
      else resolve(String(stdout).trim())
    })
  })
}

export const treeGit: TreeGit = {
  revParse: (tree, ref) =>
    git(tree, ['rev-parse', '--verify', `${ref}^{commit}`]).catch((err: Error) => {
      throw new ReviewError(`--tree ${tree}: cannot read ${ref}: ${err.message.split('\n')[0]}`)
    }),
  isAncestor: (tree, sha, head) =>
    git(tree, ['merge-base', '--is-ancestor', sha, head]).then(
      () => true,
      () => false
    ),
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
