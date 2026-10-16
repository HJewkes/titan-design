// Synthetic packet inputs: an invented repo, run and baselines, every PNG built in code. The fake gh
// and git answer only the calls from-ci plans to make; any other call throws.
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { Collected } from '../src/packet.ts'
import { CI_SOURCES, type CiIo } from '../src/packet-ci.ts'
import { gitBlobId } from '../src/packet-classify.ts'
import { solidImage, writePng } from '../src/packet-png.ts'
import type { LayerSources } from '../src/packet-types.ts'
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

export const tempDir = () => mkdtemp(join(tmpdir(), 'titan-packet-test-'))

/** A layer with nothing regenerated and nothing shown, to override. */
export function layer(over: Partial<LayerSources> & Pick<LayerSources, 'layer'>): LayerSources {
  return { regenerated: false, diagnostics: false, unchanged: 0, shown: [], ...over }
}

/** What a packet is written from, bound to the invented run, head and main. */
export function collected(layers: LayerSources[] = [], over: Partial<Collected> = {}): Collected {
  const of = (name: LayerSources['layer']) => layers.find((l) => l.layer === name)
  return {
    target: { repo: REPO, pr: PR, head: HEAD, run: RUN, clone: '/nonexistent-clone' },
    binding: {
      url: `https://example.test/runs/${RUN}`,
      conclusion: 'failure',
      visualJob: 'failure',
      headTree: TREE,
      mainSha: MAIN,
      mergeBase: MERGE_BASE,
    },
    layers: [
      of('component') ?? layer({ layer: 'component' }),
      of('story') ?? layer({ layer: 'story' }),
    ],
    warnings: [],
    side: [],
    ...over,
  }
}

export interface FakeArtifact {
  id: number
  name: string
  expired: boolean
  created_at: string
}

export interface World {
  run: { headSha: string; status: string; conclusion: string; workflowName: string }
  pr: { headRefOid: string; state: string }
  artifacts: FakeArtifact[]
  /** Each artifact's files by its id, relative to its root. */
  downloads: Record<number, Record<string, Buffer>>
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

export const UPLOADED = '2026-01-01T00:00:00Z'

/** Adds an artifact to the world with these files, under the next id. */
export function withArtifact(
  w: World,
  name: string,
  files: Record<string, Buffer>,
  over: Partial<Omit<FakeArtifact, 'id' | 'name'>> = {}
): World {
  const id = w.artifacts.length + 1
  return {
    ...w,
    artifacts: [...w.artifacts, { id, name, expired: false, created_at: UPLOADED, ...over }],
    downloads: { ...w.downloads, [id]: files },
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
    ghDownload: async (repo, id, dir) => {
      calls.push(['gh', 'api', `repos/${repo}/actions/artifacts/${id}/zip`])
      const files = w.downloads[id]
      if (!files) throw new Error(`unplanned download: ${id}`)
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

/** The argv for one from-ci run into `out`. */
export const fromCiArgs = (out: string, extra: string[] = []) => [
  ...['packet', 'from-ci', '--repo', REPO, '--pr', String(PR), '--head', HEAD],
  ...['--run', RUN, '--out', out, '--clone', '/nonexistent-clone', ...extra],
]
