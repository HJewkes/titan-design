import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseLocks, type Locks } from '@titan-design/review-schema'
import { HARNESS_DIR } from './harness-freshness.ts'
import {
  GLOBAL_CSS,
  TAILWIND_CONFIG,
  deriveFootprint,
  type FootprintBody,
} from './locks-footprint.ts'
import {
  PR_STATE_FIELDS,
  planSync,
  syncTargets,
  type PrState,
  type SyncFootprints,
  type SyncReport,
} from './locks-sync.ts'
import { ReviewError } from './review.ts'
import { themeLeaves } from './tailwind-theme.ts'

/** The read-only git and gh calls the footprint makes; tests fake them. */
export interface LocksIo {
  /** Trimmed stdout of `git -C <repo> <args>`. */
  git: (repo: string, args: string[]) => Promise<string>
  /** Raw stdout of `git -C <repo> <args>` fed `stdin`, for `cat-file --batch`. */
  gitBatch: (repo: string, args: string[], stdin: string) => Promise<Buffer>
  /** Trimmed stdout of `gh <args>`, run inside `repo`. */
  gh: (repo: string, args: string[]) => Promise<string>
}

export interface FootprintOptions {
  pr?: string
  /**
   * Commits the head may be stacked on, such as a holder's recorded and current heads. The
   * diff then starts at the nearest of these and the base, so a dependent stacked on the
   * recorded head does not count the holder's later commits as its own.
   */
  stackedOn?: string[]
  base?: string
  head?: string
  repo?: string
}

/** The L1 `footprint` shape: the body plus the shas it was derived from. */
export interface LockFootprint extends FootprintBody {
  derivedFrom: { mainSha: string; headSha: string }
}

export const REPO_ROOT = join(HARNESS_DIR, '..', '..')
const COMPONENTS_DIR = 'packages/ui/src/components/'
const EXEC_LIMIT = 256 * 1024 * 1024

/** A component implementation at the head: not a test, type test, story, snapshot or type stub. */
export function isComponentSource(path: string): boolean {
  return (
    path.startsWith(COMPONENTS_DIR) &&
    /\.tsx?$/.test(path) &&
    !/\.(test|test-d|stories|d)\.tsx?$/.test(path) &&
    !path.includes('/__snapshots__/')
  )
}

interface Refs {
  base: string
  head: string
}

/** A PR's base branch (as `origin/<name>`) and head sha from gh, after fetching both. */
async function prRefs(pr: string, repo: string, io: LocksIo): Promise<Refs> {
  if (!/^\d+$/.test(pr)) throw new ReviewError(`expected a PR number, got ${pr}`)
  const args = ['pr', 'view', pr, '--json', 'baseRefName,headRefOid']
  const view = JSON.parse(await io.gh(repo, args)) as {
    baseRefName: string
    headRefOid: string
  }
  await io.git(repo, ['fetch', '--quiet', 'origin', view.baseRefName, `refs/pull/${pr}/head`])
  return { base: `origin/${view.baseRefName}`, head: view.headRefOid }
}

function resolveRefs(opts: FootprintOptions, repo: string, io: LocksIo): Promise<Refs> {
  if (opts.pr && (opts.base || opts.head))
    throw new ReviewError('give a PR number or --base and --head, not both')
  if (opts.base && opts.head) return Promise.resolve({ base: opts.base, head: opts.head })
  if (opts.base || opts.head) throw new ReviewError('--base and --head go together')
  if (!opts.pr) throw new ReviewError('expected a PR number, or --base <ref> --head <ref>')
  return prRefs(opts.pr, repo, io)
}

const ABSENT_AT_REF = /does not exist in|exists on disk, but not in/

/** The file's text at `ref`, or `''` when that ref has no such path; any other failure throws. */
function fileAt(repo: string, ref: string, path: string, io: LocksIo): Promise<string> {
  return io.git(repo, ['show', `${ref}:${path}`]).catch((err: Error) => {
    if (ABSENT_AT_REF.test(err.message)) return ''
    throw err
  })
}

async function themeAt(repo: string, ref: string, io: LocksIo) {
  const source = await fileAt(repo, ref, TAILWIND_CONFIG, io)
  if (!source) throw new ReviewError(`${TAILWIND_CONFIG} is missing at ${ref}; readers need it`)
  return themeLeaves(source)
}

/** Parses `git cat-file --batch` output: a `<sha> <type> <size>` header, the bytes, a newline. */
export function parseBatch(paths: string[], out: Buffer): Map<string, string> {
  const files = new Map<string, string>()
  let cursor = 0
  for (const path of paths) {
    const eol = out.indexOf(0x0a, cursor)
    const header = out.subarray(cursor, eol).toString('utf8').split(' ')
    cursor = eol + 1
    if (header[1] === 'missing') continue
    const size = Number(header[2])
    files.set(path, out.subarray(cursor, cursor + size).toString('utf8'))
    cursor += size + 1
  }
  return files
}

async function componentSources(repo: string, head: string, io: LocksIo) {
  const listing = await io.git(repo, ['ls-tree', '-r', '--name-only', head, '--', COMPONENTS_DIR])
  const paths = listing.split('\n').filter(isComponentSource)
  if (paths.length === 0) return new Map<string, string>()
  const stdin = paths.map((p) => `${head}:${p}\n`).join('')
  return parseBatch(paths, await io.gitBatch(repo, ['cat-file', '--batch'], stdin))
}

const commitExists = (repo: string, sha: string, io: LocksIo) =>
  io.git(repo, ['rev-parse', '--verify', '--quiet', `${sha}^{commit}`]).then(
    () => true,
    () => false
  )

/**
 * The merge-base of `head` with `base` or with whichever present `stackedOn` commit leaves the
 * fewest commits to `head`. A head stacked on a holder's recorded head can share two best
 * merge-bases with the holder's fast-forwarded head (that recorded head, and a main tip both
 * merged in), and `git merge-base` names either one.
 */
async function mergeBase(
  repo: string,
  base: string,
  head: string,
  stackedOn: string[],
  io: LocksIo
): Promise<string> {
  const present = await Promise.all(stackedOn.map((sha) => commitExists(repo, sha, io)))
  const candidates = [base, ...stackedOn.filter((_, i) => present[i])]
  if (candidates.length === 1) return io.git(repo, ['merge-base', base, head])
  const bases = await Promise.all(candidates.map((c) => io.git(repo, ['merge-base', c, head])))
  const counts = await Promise.all(
    bases.map((b) => io.git(repo, ['rev-list', '--count', `${b}..${head}`]).then(Number))
  )
  return bases[counts.indexOf(Math.min(...counts))]!
}

/** Derives the footprint of `head` against `merge-base(base, head)`, reading only through git. */
export async function lockFootprint(opts: FootprintOptions, io: LocksIo): Promise<LockFootprint> {
  const repo = opts.repo ?? REPO_ROOT
  const refs = await resolveRefs(opts, repo, io)
  const headSha = await io.git(repo, ['rev-parse', '--verify', `${refs.head}^{commit}`])
  const mainSha = await mergeBase(repo, refs.base, headSha, opts.stackedOn ?? [], io)
  const [diff, baseCss, headCss, theme, sources] = await Promise.all([
    io.git(repo, ['diff', '--name-only', mainSha, headSha]),
    fileAt(repo, mainSha, GLOBAL_CSS, io),
    fileAt(repo, headSha, GLOBAL_CSS, io),
    themeAt(repo, headSha, io),
    componentSources(repo, headSha, io),
  ])
  const changedFiles = diff ? diff.split('\n') : []
  return {
    derivedFrom: { mainSha, headSha },
    ...deriveFootprint({ baseCss, headCss, theme, changedFiles, sources }),
  }
}

/** Env var naming the registry when `--registry` is not given. */
export const REGISTRY_ENV = 'TITAN_LOCKS_REGISTRY'

/** Reads and validates a `titan-locks/1` registry; never writes it. */
export async function readRegistry(path: string | undefined): Promise<Locks> {
  if (!path) throw new ReviewError(`pass --registry <locks.json> or set ${REGISTRY_ENV}`)
  const text = await readFile(path, 'utf8').catch((err: Error) => {
    throw new ReviewError(`cannot read the registry ${path}: ${err.message}`)
  })
  try {
    return parseLocks(JSON.parse(text))
  } catch (err) {
    throw new ReviewError(`${path} is not a titan-locks/1 registry: ${(err as Error).message}`)
  }
}

async function prState(pr: number, repo: string, io: LocksIo): Promise<PrState> {
  return JSON.parse(await io.gh(repo, ['pr', 'view', String(pr), '--json', PR_STATE_FIELDS]))
}

async function prStates(prs: number[], repo: string, io: LocksIo) {
  const states = await Promise.all(prs.map((pr) => prState(pr, repo, io)))
  return new Map(prs.map((pr, i) => [pr, states[i]!]))
}

/** Footprints at each moved holder head and of each open dependent of its lock, one PR at a time. */
async function movedFootprints(
  registry: Locks,
  prs: Map<number, PrState>,
  repo: string,
  io: LocksIo
): Promise<SyncFootprints> {
  const fps: SyncFootprints = { holders: new Map(), dependents: new Map() }
  for (const lock of registry.locks.filter((l) => l.status === 'open')) {
    const moved = lock.holders.filter((h) => {
      const pr = prs.get(h.pr)
      return pr?.state === 'OPEN' && pr.headRefOid !== h.headSha
    })
    if (moved.length === 0) continue
    for (const h of moved)
      fps.holders.set(h.pr, await lockFootprint({ pr: String(h.pr), repo }, io))
    const stackedOn = moved.flatMap((h) => [h.headSha, prs.get(h.pr)!.headRefOid])
    for (const d of registry.dependents.filter((d) => d.lock === lock.id))
      if (prs.get(d.pr)?.state === 'OPEN' && !fps.dependents.has(d.pr))
        fps.dependents.set(d.pr, await lockFootprint({ pr: String(d.pr), repo, stackedOn }, io))
  }
  return fps
}

async function repoSlug(registry: Locks, repo: string, io: LocksIo): Promise<string> {
  if (registry.repo) return registry.repo
  return io.gh(repo, ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'])
}

/**
 * Reads every open lock's holders, and their dependents, through gh, re-derives the footprint of
 * any holder with a new head, and reports what a coordinator would change and run. Writes nothing.
 */
export async function lockSync(
  registry: Locks,
  repoPath: string | undefined,
  io: LocksIo
): Promise<SyncReport> {
  const repo = repoPath ?? REPO_ROOT
  const targets = syncTargets(registry)
  const prs = await prStates([...new Set([...targets.holders, ...targets.dependents])], repo, io)
  const footprints = await movedFootprints(registry, prs, repo, io)
  const slug = await repoSlug(registry, repo, io)
  return planSync({ registry, repo: slug, prs, footprints })
}

function run(cmd: string, args: string[], stdin?: string, cwd?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      cmd,
      args,
      { encoding: 'buffer', maxBuffer: EXEC_LIMIT, cwd },
      (err, stdout, stderr) => {
        if (err)
          reject(new ReviewError(`${cmd} ${args[0]}: ${stderr.toString().trim() || err.message}`))
        else resolve(stdout)
      }
    )
    child.stdin?.end(stdin ?? '')
  })
}

export const locksIo: LocksIo = {
  git: (repo, args) => run('git', ['-C', repo, ...args]).then((b) => b.toString('utf8').trim()),
  gitBatch: (repo, args, stdin) => run('git', ['-C', repo, ...args], stdin),
  gh: (repo, args) => run('gh', args, undefined, repo).then((b) => b.toString('utf8').trim()),
}
