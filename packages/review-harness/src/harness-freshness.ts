import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const HARNESS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
export const MAIN_REF = 'origin/main'
const FETCH_TIMEOUT_MS = 20_000

/**
 * `current`: this package's tree equals main's. `behind`: they differ; `missing` lists the
 * commits on main touching the harness that this checkout lacks (empty when only local edits,
 * committed or not, differ). `unchecked`: the fetch or a lookup failed, so nothing is known.
 */
export type HarnessFreshness =
  | { state: 'current' }
  | { state: 'behind'; missing: string[] }
  | { state: 'unchecked'; reason: string }

function git(args: string[], timeout = 10_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', ['-C', HARNESS_DIR, ...args], { timeout }, (err, stdout, stderr) => {
      if (err) reject(new Error(String(stderr).trim() || err.message))
      else resolve(String(stdout).trim())
    })
  })
}

const firstLine = (err: unknown) => (err as Error).message.split('\n')[0]

/**
 * Compares tree hashes, not commits, so a commit on main outside the harness never trips it.
 * `HEAD:./` ignores the working tree, so uncommitted edits to tracked files count separately.
 */
export async function checkHarnessFreshness(): Promise<HarnessFreshness> {
  try {
    await git(['fetch', '--quiet', 'origin', 'main'], FETCH_TIMEOUT_MS)
  } catch (err) {
    return { state: 'unchecked', reason: `git fetch origin main failed: ${firstLine(err)}` }
  }
  try {
    const [own, main, edits] = await Promise.all([
      git(['rev-parse', 'HEAD:./']),
      git(['rev-parse', `${MAIN_REF}:./`]),
      git(['status', '--porcelain', '--untracked-files=no', '--', '.']),
    ])
    if (own === main && !edits) return { state: 'current' }
    const log = await git(['log', '--oneline', `HEAD..${MAIN_REF}`, '--', '.'])
    return { state: 'behind', missing: log ? log.split('\n') : [] }
  } catch (err) {
    return { state: 'unchecked', reason: `git rev-parse failed: ${firstLine(err)}` }
  }
}

const shellQuote = (value: string) =>
  /^[\w@%+=:,./-]+$/.test(value) ? value : `'${value.replace(/'/g, `'\\''`)}'`

/**
 * One checkout per round directory, so re-checking out main for one round never moves files
 * under a live server for another.
 */
export function serveMainTree(manifestPath: string): string {
  const round = createHash('sha256')
    .update(dirname(resolve(manifestPath)))
    .digest('hex')
  return `"\${TMPDIR:-/tmp}/titan-review-main-${round.slice(0, 12)}"`
}

/**
 * The commands that serve origin/main's harness from a detached checkout against this round.
 * `roundArgs[0]` is the round's manifest path.
 */
export function serveMainCommand(roundArgs: string[]): string {
  const tree = serveMainTree(roundArgs[0])
  return [
    `git -C ${shellQuote(join(HARNESS_DIR, '..', '..'))} worktree add --detach ${tree} ${MAIN_REF} 2>/dev/null ||`,
    `  git -C ${tree} checkout --quiet --detach ${MAIN_REF}`,
    `pnpm -C ${tree} install --frozen-lockfile`,
    `pnpm -C ${tree} review ${roundArgs.map(shellQuote).join(' ')}`,
  ].join('\n')
}

/** Either a refusal for the terminal or, when serving goes ahead, an optional page banner. */
export type HarnessVerdict = { refusal: string } | { banner?: string }

function lacking(missing: string[]): string {
  if (!missing.length)
    return 'it lacks no commit from origin/main, so the difference is this checkout’s own harness edits, committed or not'
  return `it lacks ${missing.length} commit(s):\n  ${missing.join('\n  ')}`
}

export function harnessVerdict(
  freshness: HarnessFreshness,
  allowStale: boolean,
  command: string
): HarnessVerdict {
  if (freshness.state === 'current') return {}
  if (freshness.state === 'unchecked')
    return {
      banner: `This review harness was not checked against origin/main (${freshness.reason}); it may be an old version.`,
    }
  if (allowStale)
    return {
      banner: `Served with --allow-stale: this review harness differs from origin/main (${freshness.missing.length} commit(s) behind), so newer page features may be missing.`,
    }
  return {
    refusal: [
      `this review harness differs from origin/main; ${lacking(freshness.missing)}`,
      `Serve main's harness against this round's Storybook instead:\n${command.replace(/^/gm, '  ')}`,
      'or pass --allow-stale to serve this one with a banner on the page.',
    ].join('\n'),
  }
}
