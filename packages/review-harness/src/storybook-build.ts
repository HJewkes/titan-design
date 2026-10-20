// `build --storybook-build`: a static Storybook of the tree's HEAD, shipped with the round so the
// console can serve live frames pinned to the exact commit (TP-3793), plus the sidecar that
// names every file by sha256.
import { execFile, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstat, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ReviewError } from './review.ts'

export const STORYBOOK_DIR = 'storybook'
export const STORYBOOK_STATIC_DIR = 'static'
export const STORYBOOK_FILE = 'storybook.json'
export const STORYBOOK_SCHEMA = 'titan-review/storybook@1'

/** The package in the tree whose Storybook the round shows. */
const UI_PACKAGE = 'packages/ui'

export interface StorybookFile {
  /** Relative to `storybook/static`, `/`-separated. */
  path: string
  sha256: string
  bytes: number
}

export interface StorybookSidecar {
  schema: typeof STORYBOOK_SCHEMA
  /** `owner/name` of the tree's origin. */
  repo: string
  sha: string
  /** The tree had uncommitted changes (tracked or untracked) when the build started. */
  dirty: boolean
  builtAt: string
  storybookVersion: string
  /** How many stories (not docs entries) the build's index.json lists. */
  storyIds: number
  files: StorybookFile[]
}

export interface TreeState {
  sha: string
  dirty: boolean
  repo: string
}

export interface StorybookBuildIo {
  /** Runs `build-storybook --output-dir <outDir>` in the tree. */
  build: (tree: string, outDir: string) => Promise<void>
  treeState: (tree: string) => Promise<TreeState>
  storybookVersion: (tree: string) => Promise<string>
  now: () => number
}

export interface StorybookBuildResult {
  sidecar: StorybookSidecar
  path: string
  elapsedMs: number
}

async function walk(root: string, rel = '', out: string[] = []): Promise<string[]> {
  for (const name of (await readdir(join(root, rel))).sort()) {
    const path = rel ? `${rel}/${name}` : name
    const stat = await lstat(join(root, path))
    if (stat.isDirectory()) await walk(root, path, out)
    else if (stat.isFile()) out.push(path)
    else throw new ReviewError(`--storybook-build: the build holds a non-file at ${path}; refused`)
  }
  return out
}

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

/** Every regular file under `root`, sorted by path; a symlink or other non-file refuses. */
export async function listFiles(root: string): Promise<StorybookFile[]> {
  const paths = (await walk(root)).sort()
  return Promise.all(
    paths.map(async (path) => {
      const bytes = await readFile(join(root, path))
      return { path, sha256: sha256(bytes), bytes: bytes.length }
    })
  )
}

async function countStories(staticDir: string): Promise<number> {
  const raw = await readFile(join(staticDir, 'index.json'), 'utf8').catch(() => {
    throw new ReviewError('--storybook-build: the build wrote no index.json')
  })
  const entries = (JSON.parse(raw) as { entries?: Record<string, { type?: string }> }).entries
  return Object.values(entries ?? {}).filter((e) => e.type === 'story').length
}

/**
 * Builds the tree's Storybook into `<roundDir>/storybook/static`, replacing any earlier build,
 * and writes `storybook.json` beside it. The tree's state is read before the build, so `sha` and
 * `dirty` describe what was built.
 */
export async function buildStorybook(
  tree: string,
  roundDir: string,
  io: StorybookBuildIo
): Promise<StorybookBuildResult> {
  const dir = join(roundDir, STORYBOOK_DIR)
  const staticDir = join(dir, STORYBOOK_STATIC_DIR)
  const state = await io.treeState(tree)
  const storybookVersion = await io.storybookVersion(tree)
  await rm(dir, { recursive: true, force: true })
  const started = io.now()
  await io.build(tree, staticDir)
  const finished = io.now()
  const sidecar: StorybookSidecar = {
    schema: STORYBOOK_SCHEMA,
    ...state,
    builtAt: new Date(finished).toISOString(),
    storybookVersion,
    storyIds: await countStories(staticDir),
    files: await listFiles(staticDir),
  }
  const path = join(dir, STORYBOOK_FILE)
  await writeFile(path, `${JSON.stringify(sidecar, null, 2)}\n`)
  return { sidecar, path, elapsedMs: finished - started }
}

function git(tree: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', ['-C', tree, ...args], { timeout: 10_000 }, (err, stdout, stderr) => {
      if (err)
        reject(
          new ReviewError(`--storybook-build: git ${args[0]} in ${tree}: ${String(stderr).trim()}`)
        )
      else resolve(String(stdout).trim())
    })
  })
}

/** `owner/name` from an https or ssh remote url. */
export function repoName(url: string): string {
  const match = /[:/]([^/:]+\/[^/]+?)(?:\.git)?\/?$/.exec(url)
  if (!match) throw new ReviewError(`--storybook-build: cannot read owner/name from ${url}`)
  return match[1]
}

export async function readTreeState(tree: string): Promise<TreeState> {
  const [sha, status, remote] = await Promise.all([
    git(tree, ['rev-parse', '--verify', 'HEAD^{commit}']),
    git(tree, ['status', '--porcelain']),
    git(tree, ['remote', 'get-url', 'origin']),
  ])
  return { sha, dirty: status !== '', repo: repoName(remote) }
}

function runBuild(tree: string, outDir: string): Promise<void> {
  const args = ['--dir', join(tree, UI_PACKAGE), 'run', 'build-storybook', '--output-dir', outDir]
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', args, { stdio: ['ignore', 2, 2] })
    child.once('error', reject)
    child.once('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new ReviewError(`--storybook-build: build-storybook exited ${code}`))
    )
  })
}

export const storybookBuildIo: StorybookBuildIo = {
  build: runBuild,
  treeState: readTreeState,
  storybookVersion: async (tree) => {
    const pkg = join(tree, UI_PACKAGE, 'node_modules', 'storybook', 'package.json')
    return (JSON.parse(await readFile(pkg, 'utf8')) as { version: string }).version
  },
  now: () => Date.now(),
}
