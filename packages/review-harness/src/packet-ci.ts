// The read-only gh and git side of `packet from-ci`: it binds a CI run to a PR head, then gathers
// each visual layer's baselines from the run's artifacts, from main and from the PR's own commits.
import { execFile } from 'node:child_process'
import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { classify, gitBlobId, isBaseline, stemOf } from './packet-classify.ts'
import { PNG_LIMITS } from './packet-png.ts'
import type { Binding, CiDiff, CiTarget, Gathered, Layer, LayerSources } from './packet-types.ts'
import { ReviewError } from './review.ts'

/** The gh and git calls from-ci makes, none of which writes; tests fake them. */
export interface CiIo {
  /** Trimmed stdout of `gh <args>`. */
  gh: (args: string[]) => Promise<string>
  /** Trimmed stdout of `git -C <clone> <args>`. */
  git: (clone: string, args: string[]) => Promise<string>
  /** The raw bytes of `git -C <clone> show <spec>`, for a PNG at `<ref>:<path>`. */
  gitBlob: (clone: string, spec: string) => Promise<Buffer>
  /** Artifact `id` of `repo`, unzipped into `dir`. */
  ghDownload: (repo: string, id: number, dir: string) => Promise<void>
}

export interface CiSource {
  layer: Layer
  /** The regenerated baselines, uploaded only when the visual job fails. */
  artifact: string
  /** The repo directory the artifact's files are relative to. */
  prefix: string
  /** Playwright's `<stem>-diff.png` and `<stem>-expected.png` from the gate (TD-921). */
  diagnostics: string
}

export const CI_SOURCES: readonly CiSource[] = [
  {
    layer: 'component',
    artifact: 'component-visual-baselines',
    prefix: 'packages/ui/specimen/baseline/',
    diagnostics: 'component-visual-diffs',
  },
  {
    layer: 'story',
    artifact: 'storybook-visual-baselines',
    prefix: 'packages/ui/tests/visual/reference/stories.spec.ts-snapshots/',
    diagnostics: 'storybook-visual-diffs',
  },
]

export const CI_WORKFLOW = 'CI'
const VISUAL_JOB = 'visual'

interface RunView {
  headSha: string
  status: string
  conclusion: string
  workflowName: string
  url: string
  jobs: { name: string; conclusion: string }[]
}

const json = async <T>(io: CiIo, args: string[]) => JSON.parse(await io.gh(args)) as T

/** Refuses unless the run is a finished CI run of `head` and the PR is still open at `head`. */
export async function checkBinding(t: CiTarget, io: CiIo): Promise<Binding> {
  const runFields = 'headSha,status,conclusion,event,workflowName,url,jobs'
  const run = await json<RunView>(io, ['run', 'view', t.run, '--repo', t.repo, '--json', runFields])
  if (run.headSha !== t.head)
    throw new ReviewError(`run ${t.run} is of head ${run.headSha}, not --head ${t.head}`)
  if (run.workflowName !== CI_WORKFLOW)
    throw new ReviewError(`run ${t.run} is workflow "${run.workflowName}", not "${CI_WORKFLOW}"`)
  if (run.status !== 'completed')
    throw new ReviewError(`run ${t.run} is ${run.status}; wait for it to complete`)
  const prArgs = ['pr', 'view', String(t.pr), '--repo', t.repo, '--json', 'headRefOid,state']
  const pr = await json<{ headRefOid: string; state: string }>(io, prArgs)
  if (pr.state !== 'OPEN') throw new ReviewError(`${t.repo}#${t.pr} is ${pr.state}, not open`)
  if (pr.headRefOid !== t.head)
    throw new ReviewError(
      `${t.repo}#${t.pr} has moved to ${pr.headRefOid}; --head ${t.head} is no longer its head`
    )
  const treeArgs = ['api', `repos/${t.repo}/git/commits/${t.head}`, '--jq', '.tree.sha']
  return {
    url: run.url,
    conclusion: run.conclusion,
    visualJob: run.jobs.find((j) => j.name === VISUAL_JOB)?.conclusion ?? null,
    headTree: await io.gh(treeArgs),
    ...(await mainRefs(t, io)),
  }
}

async function mainRefs(t: CiTarget, io: CiIo) {
  await io.git(t.clone, ['fetch', '--quiet', 'origin', 'main', `refs/pull/${t.pr}/head`])
  const mainSha = await io.git(t.clone, ['rev-parse', 'origin/main'])
  return { mainSha, mergeBase: await io.git(t.clone, ['merge-base', mainSha, t.head]) }
}

interface Artifact {
  id: number
  name: string
  expired: boolean
  created_at: string
}

const newer = (a: Artifact, b: Artifact) =>
  a.created_at === b.created_at ? a.id > b.id : a.created_at > b.created_at

/** Each name's latest upload: a rerun attempt uploads again under the same name. */
function latestByName(artifacts: Artifact[]): Map<string, Artifact> {
  const latest = new Map<string, Artifact>()
  for (const a of artifacts) {
    const seen = latest.get(a.name)
    if (!seen || newer(a, seen)) latest.set(a.name, a)
  }
  return latest
}

/** The artifact id from-ci reads for each name, refusing an expired one rather than reading it as absent. */
export async function liveArtifacts(t: CiTarget, io: CiIo): Promise<Map<string, number>> {
  const path = `repos/${t.repo}/actions/runs/${t.run}/artifacts?per_page=100`
  const { artifacts } = await json<{ artifacts: Artifact[] }>(io, ['api', path])
  const wanted = new Set(CI_SOURCES.flatMap((s) => [s.artifact, s.diagnostics]))
  const ours = [...latestByName(artifacts.filter((a) => wanted.has(a.name))).values()]
  const expired = ours.filter((a) => a.expired).map((a) => a.name)
  if (expired.length)
    throw new ReviewError(`run ${t.run}'s artifact ${expired.join(', ')} has expired`)
  return new Map(ours.map((a) => [a.name, a.id]))
}

/** Every PNG under `dir`, by its path relative to `dir` with forward slashes. */
export async function readPngTree(dir: string): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>()
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.png')) continue
    const file = join(entry.parentPath, entry.name)
    const { size } = await stat(file)
    if (size > PNG_LIMITS.maxBytes)
      throw new ReviewError(`${entry.name} is ${size} bytes, over the ${PNG_LIMITS.maxBytes} cap`)
    files.set(relative(dir, file).split(sep).join('/'), await readFile(file))
  }
  return files
}

async function download(t: CiTarget, name: string, ctx: GatherContext, io: CiIo) {
  const dir = join(ctx.scratch, name)
  await io.ghDownload(t.repo, ctx.live.get(name)!, dir)
  return readPngTree(dir)
}

function diagnosticsByStem(files: Map<string, Buffer>): Map<string, CiDiff> {
  const byName = new Map<string, Buffer[]>()
  for (const [path, bytes] of files) {
    const name = path.slice(path.lastIndexOf('/') + 1)
    byName.set(name, [...(byName.get(name) ?? []), bytes])
  }
  const pairs = new Map<string, CiDiff>()
  for (const [name, [diff, ...more]] of byName) {
    if (!name.endsWith('-diff.png') || more.length) continue
    const stem = name.slice(0, -'-diff.png'.length)
    const expected = byName.get(`${stem}-expected.png`)
    if (expected?.length === 1) pairs.set(stem, { diff, expected: expected[0] })
  }
  return pairs
}

async function mainBlobs(t: CiTarget, mainSha: string, prefix: string, io: CiIo) {
  const listing = await io.git(t.clone, ['ls-tree', '-r', mainSha, '--', prefix])
  const blobs = new Map<string, string>()
  for (const line of listing.split('\n').filter(Boolean)) {
    const [meta, path] = line.split('\t')
    blobs.set(path, meta.split(' ')[2])
  }
  return blobs
}

/** PNGs the PR itself adds or modifies: a green run regenerates nothing, so these reach no artifact. */
async function prBaselines(t: CiTarget, mergeBase: string, prefix: string, io: CiIo) {
  const args = ['diff', '--name-only', '--diff-filter=AM', mergeBase, t.head, '--', prefix]
  return (await io.git(t.clone, args)).split('\n').filter(isBaseline)
}

async function fromGit(
  t: CiTarget,
  layer: Layer,
  paths: string[],
  main: Map<string, string>,
  io: CiIo
): Promise<Gathered[]> {
  const shown: Gathered[] = []
  for (const path of paths) {
    const after = await io.gitBlob(t.clone, `${t.head}:${path}`)
    const mainBlob = main.get(path)
    if (mainBlob === gitBlobId(after)) continue
    shown.push({ layer, path, change: mainBlob ? 'changed' : 'new', source: 'git', after })
  }
  return shown
}

export interface GatherContext {
  target: CiTarget
  binding: Binding
  /** Artifact ids by name, from liveArtifacts. */
  live: Map<string, number>
  scratch: string
}

/** The layer's regenerated files by repo path and its CI diffs by stem; empty when not uploaded. */
async function artifactSide(source: CiSource, ctx: GatherContext, io: CiIo) {
  const { target: t, live } = ctx
  const regenerated = live.has(source.artifact)
  const diagnostics = live.has(source.diagnostics)
  return {
    regenerated,
    diagnostics,
    artifact: regenerated
      ? prefixed(await download(t, source.artifact, ctx, io), source.prefix)
      : new Map<string, Buffer>(),
    ciDiffs: diagnostics
      ? diagnosticsByStem(await download(t, source.diagnostics, ctx, io))
      : new Map<string, CiDiff>(),
  }
}

/** One layer's shown baselines with their bytes, and the count of unchanged ones. */
export async function gatherLayer(
  source: CiSource,
  ctx: GatherContext,
  io: CiIo
): Promise<LayerSources> {
  const { target: t, binding } = ctx
  const { regenerated, diagnostics, artifact, ciDiffs } = await artifactSide(source, ctx, io)
  const main = await mainBlobs(t, binding.mainSha, source.prefix, io)
  const classified = classify(main, artifact, regenerated)
  const fromArtifact: Gathered[] = classified.shown.map((s) => ({
    ...s,
    layer: source.layer,
    source: 'artifact',
    after: artifact.get(s.path),
  }))
  const prOwn = await prBaselines(t, binding.mergeBase, source.prefix, io)
  const extra = prOwn.filter((p) => !artifact.has(p))
  const fromCommits = await fromGit(t, source.layer, extra, main, io)
  const shown = [...fromArtifact, ...fromCommits].sort((a, b) => (a.path < b.path ? -1 : 1))
  for (const item of shown) await withBefore(item, t, binding.mainSha, ciDiffs, io)
  return { layer: source.layer, regenerated, diagnostics, unchanged: classified.unchanged, shown }
}

const prefixed = (files: Map<string, Buffer>, prefix: string) =>
  new Map([...files].map(([path, bytes]) => [`${prefix}${path}`, bytes]))

/** Main's bytes, read only for a changed or removed baseline, and the CI diff for its stem. */
async function withBefore(
  item: Gathered,
  t: CiTarget,
  mainSha: string,
  ciDiffs: Map<string, CiDiff>,
  io: CiIo
) {
  if (item.change === 'new') return
  item.before = await io.gitBlob(t.clone, `${mainSha}:${item.path}`)
  item.ciDiff = ciDiffs.get(stemOf(item.path))
}

/** Main's baseline changes since the merge-base: they would read as this PR's changes. */
export async function mainMoved(t: CiTarget, binding: Binding, io: CiIo): Promise<string[]> {
  if (binding.mergeBase === binding.mainSha) return []
  const prefixes = CI_SOURCES.map((s) => s.prefix)
  const args = ['diff', '--name-only', binding.mergeBase, binding.mainSha, '--', ...prefixes]
  return (await io.git(t.clone, args)).split('\n').filter(isBaseline)
}

const EXEC_LIMIT = 256 * 1024 * 1024
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000

function exec(cmd: 'gh' | 'git' | 'unzip', args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { encoding: 'buffer', maxBuffer: EXEC_LIMIT, timeout: DOWNLOAD_TIMEOUT_MS },
      (err, stdout, stderr) => {
        if (err)
          reject(new ReviewError(`${cmd} ${args[0]}: ${stderr.toString().trim() || err.message}`))
        else resolve(stdout)
      }
    )
  })
}

export const ciIo: CiIo = {
  gh: (args) => exec('gh', args).then((b) => b.toString('utf8').trim()),
  git: (clone, args) => exec('git', ['-C', clone, ...args]).then((b) => b.toString('utf8').trim()),
  gitBlob: (clone, spec) => exec('git', ['-C', clone, 'show', spec]),
  ghDownload: async (repo, id, dir) => {
    const zip = await exec('gh', ['api', `repos/${repo}/actions/artifacts/${id}/zip`])
    await writeFile(`${dir}.zip`, zip)
    await exec('unzip', ['-q', `${dir}.zip`, '-d', dir])
  },
}
