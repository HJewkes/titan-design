// A synthetic CI world for `packet from-ci`: an invented repo, run and baselines, every PNG built in
// code. The fake gh and git answer only the calls from-ci plans to make; any other call throws.
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { CI_SOURCES, type CiIo } from '../src/packet-ci.ts'
import { gitBlobId } from '../src/packet-classify.ts'
import { solidImage, writePng } from '../src/packet-png.ts'
import type { CliIo } from '../src/run.ts'
import { noTreeGit } from './fixtures.ts'

export const REPO = 'acme/widgets'
export const PR = 42
export const HEAD = 'a1'.repeat(20)
export const MAIN = 'b2'.repeat(20)
export const MERGE_BASE = 'c3'.repeat(20)
export const TREE = 'd4'.repeat(20)
export const RUN = '1234'
export const [COMPONENT, STORY] = CI_SOURCES

export const GREY = [128, 128, 128, 255]

/** A solid `w`x`h` PNG, with the pixels `changes` lists painted their own colour. */
export function png(w: number, h: number, rgba = GREY, changes: [number, number, number[]][] = []) {
  const image = solidImage(w, h, rgba)
  for (const [x, y, colour] of changes) image.data.set(colour, (y * w + x) * 4)
  return writePng(image)
}

export interface World {
  run: { headSha: string; status: string; conclusion: string; workflowName: string }
  pr: { headRefOid: string; state: string }
  artifacts: { name: string; expired: boolean }[]
  /** Each artifact's files, relative to its root. */
  downloads: Record<string, Record<string, Buffer>>
  /** Main's files by repo path. */
  main: Record<string, Buffer>
  /** The PNGs the PR adds or modifies, by repo path, at its head. */
  prFiles: Record<string, Buffer>
  /** Baselines main changed since the merge-base. */
  moved: string[]
}

export function world(overrides: Partial<World> = {}): World {
  return {
    run: { headSha: HEAD, status: 'completed', conclusion: 'failure', workflowName: 'CI' },
    pr: { headRefOid: HEAD, state: 'OPEN' },
    artifacts: [],
    downloads: {},
    main: {},
    prFiles: {},
    moved: [],
    ...overrides,
  }
}

/** Adds an artifact to the world with these files. */
export function withArtifact(w: World, name: string, files: Record<string, Buffer>): World {
  return {
    ...w,
    artifacts: [...w.artifacts, { name, expired: false }],
    downloads: { ...w.downloads, [name]: files },
  }
}

const under = (files: Record<string, unknown>, prefix: string) =>
  Object.keys(files).filter((p) => p.startsWith(prefix))

function ghReplies(w: World): Record<string, string> {
  const run = { ...w.run, event: 'pull_request', url: `https://example.test/runs/${RUN}` }
  const jobs = [{ name: 'visual', conclusion: w.run.conclusion }]
  return {
    [`run view ${RUN} --repo ${REPO} --json headSha,status,conclusion,event,workflowName,url,jobs`]:
      JSON.stringify({ ...run, jobs }),
    [`pr view ${PR} --repo ${REPO} --json headRefOid,state`]: JSON.stringify(w.pr),
    [`api repos/${REPO}/git/commits/${HEAD} --jq .tree.sha`]: TREE,
    [`api repos/${REPO}/actions/runs/${RUN}/artifacts?per_page=100`]: JSON.stringify({
      artifacts: w.artifacts,
    }),
  }
}

function gitReplies(w: World): Record<string, string> {
  const replies: Record<string, string> = {
    [`fetch --quiet origin main refs/pull/${PR}/head`]: '',
    'rev-parse origin/main': MAIN,
    [`merge-base ${MAIN} ${HEAD}`]: MERGE_BASE,
    [`diff --name-only ${MERGE_BASE} ${MAIN} -- ${CI_SOURCES.map((s) => s.prefix).join(' ')}`]:
      w.moved.join('\n'),
  }
  for (const { prefix } of CI_SOURCES) {
    replies[`ls-tree -r ${MAIN} -- ${prefix}`] = under(w.main, prefix)
      .map((p) => `100644 blob ${gitBlobId(w.main[p])}\t${p}`)
      .join('\n')
    replies[`diff --name-only --diff-filter=AM ${MERGE_BASE} ${HEAD} -- ${prefix}`] = under(
      w.prFiles,
      prefix
    ).join('\n')
  }
  return replies
}

function answer(replies: Record<string, string>, tool: string, args: string[]): string {
  const reply = replies[args.join(' ')]
  if (reply === undefined) throw new Error(`unplanned call: ${tool} ${args.join(' ')}`)
  return reply
}

/** The fake port, and every call it was asked, as `[tool, ...args]`. */
export function fakeCi(w: World): { io: CiIo; calls: string[][] } {
  const calls: string[][] = []
  const gh = ghReplies(w)
  const git = gitReplies(w)
  const io: CiIo = {
    gh: async (args) => (calls.push(['gh', ...args]), answer(gh, 'gh', args)),
    git: async (_clone, args) => (calls.push(['git', ...args]), answer(git, 'git', args)),
    gitBlob: async (_clone, spec) => {
      calls.push(['git', 'show', spec])
      const [ref, path] = [spec.slice(0, 40), spec.slice(41)]
      const bytes = ref === MAIN ? w.main[path] : ref === HEAD ? w.prFiles[path] : undefined
      if (!bytes) throw new Error(`unplanned call: git show ${spec}`)
      return bytes
    },
    ghDownload: async (repo, run, name, dir) => {
      calls.push(['gh', 'run', 'download', run, '--repo', repo, '--name', name])
      const files = w.downloads[name]
      if (!files) throw new Error(`unplanned download: ${name}`)
      for (const [path, bytes] of Object.entries(files)) {
        await mkdir(dirname(join(dir, path)), { recursive: true })
        await writeFile(join(dir, path), bytes)
      }
    },
  }
  return { io, calls }
}

export function cliIo(ci: CiIo, stderr: string[] = []): CliIo {
  return {
    stdout: () => {},
    stderr: (t) => stderr.push(t),
    openBrowser: () => {},
    capture: async () => [],
    measure: async () => [],
    git: noTreeGit,
    createPage: async () => ({ handler: () => {}, close: async () => {} }),
    harnessFreshness: async () => ({ state: 'current' }),
    signal: new AbortController().signal,
    ci,
  }
}

export const tempDir = () => mkdtemp(join(tmpdir(), 'titan-packet-test-'))

/** The argv for one from-ci run into `out`. */
export const fromCiArgs = (out: string, extra: string[] = []) => [
  ...['packet', 'from-ci', '--repo', REPO, '--pr', String(PR), '--head', HEAD],
  ...['--run', RUN, '--out', out, '--clone', '/nonexistent-clone', ...extra],
]
