// packet.json and the packet directory for one PR head: the images, montages and draft written in
// code from gathered baselines. The packet is staged beside its directory and swapped in whole, so a
// refusal or a failure part way through leaves no packet and any earlier one as it was.
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { QuestionSchema, RoundSchema, lintRound } from '@titan-design/review-schema'
import { swapIn } from './frames.ts'
import {
  CI_SOURCES,
  checkBinding,
  gatherLayer,
  liveArtifacts,
  mainMoved,
  type CiIo,
} from './packet-ci.ts'
import { stemOf } from './packet-classify.ts'
import { diffImages } from './packet-diff.ts'
import { packetDraft } from './packet-draft.ts'
import { montage, type MontageEntry } from './packet-montage.ts'
import { declaredSize, readPng, writePng, type Rgba } from './packet-png.ts'
import {
  LAYERS,
  type Binding,
  type CiDiff,
  type CiTarget,
  type Gathered,
  type Layer,
  type LayerSources,
} from './packet-types.ts'
import { ReviewError } from './review.ts'
import { applyRoundRules } from './round-rules.ts'

export const CI_PACKET_SCHEMA_ID = 'titan-review/ci-packet@1'
export const PACKET_FILE = 'packet.json'
export const DRAFT_FILE = 'draft.json'
const SUBDIRS = ['before', 'after', 'diff', 'montage'] as const

const sha256Hex = z.string().regex(/^[0-9a-f]{64}$/)
const sha40 = z.string().regex(/^[0-9a-f]{40}$/)
const count = z.number().int().min(0)
const perLayer = <T extends z.ZodType>(value: T) => z.object({ component: value, story: value })

const SideSchema = z.object({ file: z.string(), sha256: sha256Hex, width: count, height: count })
const DiffSchema = z.object({
  file: z.string(),
  sha256: sha256Hex,
  source: z.enum(['ci', 'computed']),
  diffPixels: count,
  anyChannelPixels: count,
})
const SizeSchema = z.object({ w: count, h: count })

const BASELINE_PATH = /^[A-Za-z0-9._/-]+\.png$/
const isControl = (c: string) => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f

/** Why `path` is not a relative POSIX .png path that stays inside the repo, or null when it is. The
 * path comes from a CI artifact that code at the PR head can shape, so the packet refuses it here. */
function baselinePathProblem(path: string): string | null {
  if (path === '') return 'is empty'
  if ([...path].some(isControl)) return 'contains a control character'
  if (path.includes('\\')) return 'contains a backslash'
  if (path.startsWith('/') || /^[A-Za-z]:/.test(path)) return 'is absolute'
  if (path.split('/').some((s) => s === '' || s === '.' || s === '..'))
    return 'has an empty, . or .. segment'
  if (!BASELINE_PATH.test(path)) return 'is not a .png named in A-Z a-z 0-9 . _ / -'
  return null
}

const prefixOf = (layer: Layer) => CI_SOURCES.find((s) => s.layer === layer)!.prefix

/** `baselinePathProblem`, or why `path` is not under its layer's baseline directory. */
export function imagePathProblem(layer: Layer, path: string): string | null {
  const problem = baselinePathProblem(path)
  if (problem) return problem
  const prefix = prefixOf(layer)
  return path.startsWith(prefix) ? null : `is not under the ${layer} baseline prefix ${prefix}`
}

/** The index of every value an earlier value already holds. */
function repeats(values: string[]): number[] {
  return values.flatMap((v, i) => (values.indexOf(v) < i ? [i] : []))
}

/** One shown baseline: frames@1-shaped (`key`, `file`, `sha256`, `viewport`), plus both sides. */
const PacketImageSchema = z
  .object({
    key: z.string().regex(/^[A-Za-z0-9_-]{1,32}$/),
    layer: z.enum(LAYERS),
    path: z.string(),
    change: z.enum(['changed', 'new', 'removed']),
    source: z.enum(['artifact', 'git']),
    label: z.string().min(1),
    file: z.string(),
    sha256: sha256Hex,
    viewport: z.object({ width: count, height: count }),
    storyId: z.string().optional(),
    before: SideSchema.strict().optional(),
    after: SideSchema.strict().optional(),
    diff: DiffSchema.strict().nullable().optional(),
    size: z.object({ before: SizeSchema, after: SizeSchema }).optional(),
    pixelIdentical: z.literal(true).optional(),
    /** Stays null: the packager writes each image's cause to prose.json, so packet.json stays byte-stable. */
    cause: z.null(),
  })
  .strict()
  .superRefine((image, ctx) => {
    const problem = imagePathProblem(image.layer, image.path)
    if (problem)
      ctx.addIssue({ code: 'custom', path: ['path'], message: `the baseline path ${problem}` })
  })

const ImagesSchema = z.array(PacketImageSchema).superRefine((images, ctx) => {
  for (const field of ['path', 'key'] as const)
    for (const i of repeats(images.map((image) => image[field])))
      ctx.addIssue({ code: 'custom', path: [i, field], message: `another image has this ${field}` })
})

export const CiPacketSchema = z
  .object({
    schema: z.literal(CI_PACKET_SCHEMA_ID),
    packetId: sha256Hex,
    repo: z.string(),
    pr: z.number().int().positive(),
    headSha: sha40,
    headTree: sha40,
    mainSha: sha40,
    mergeBase: sha40,
    ci: z.object({
      runId: z.string(),
      url: z.string(),
      conclusion: z.string(),
      visualJob: z.string().nullable(),
      regenerated: perLayer(z.boolean()),
      diagnostics: perLayer(z.boolean()),
    }),
    images: ImagesSchema,
    unchanged: perLayer(count),
    warnings: z.array(z.string()),
    draft: z.object({ file: z.literal(DRAFT_FILE), sha256: sha256Hex }),
  })
  .strict()

export type CiPacket = z.infer<typeof CiPacketSchema>
type PacketImage = z.infer<typeof PacketImageSchema>

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

function decode(bytes: Buffer, what: string): Rgba {
  try {
    return readPng(bytes)
  } catch (err) {
    throw new ReviewError(`${what}: ${(err as Error).message}`)
  }
}

async function writeSide(staging: string, side: 'before' | 'after', key: string, bytes: Buffer) {
  const image = decode(bytes, `${side} image ${key}`)
  const file = `${side}/${key}.png`
  await writeFile(join(staging, file), bytes)
  return {
    image,
    record: { file, sha256: sha256(bytes), width: image.width, height: image.height },
  }
}

/** The CI diff, when its expected image is main's bytes and it is the after image's size. */
function trustedCiDiff(ci: CiDiff | undefined, before: Buffer, after: Rgba): Buffer | null {
  if (!ci || sha256(ci.expected) !== sha256(before)) return null
  try {
    const { width, height } = declaredSize(ci.diff)
    return width === after.width && height === after.height ? ci.diff : null
  } catch {
    return null
  }
}

type Recorded = Pick<PacketImage, 'diff' | 'size' | 'pixelIdentical'>

/** The diff a changed pair records, and the image its montage shows (none when the size changed). */
async function compare(g: Gathered, before: Rgba, after: Rgba, staging: string, key: string) {
  const result = diffImages(before, after)
  if (result.kind === 'aligned')
    return { shown: null, recorded: { diff: null, size: result.size } as Recorded }
  const ci = trustedCiDiff(g.ciDiff, g.before!, after)
  const bytes = ci ?? writePng(result.image)
  const file = `diff/${key}.png`
  await writeFile(join(staging, file), bytes)
  const { diffPixels, anyChannelPixels } = result
  const source = ci ? ('ci' as const) : ('computed' as const)
  const recorded: Recorded = {
    diff: { file, sha256: sha256(bytes), source, diffPixels, anyChannelPixels },
    ...(anyChannelPixels === 0 ? { pixelIdentical: true as const } : {}),
  }
  return { shown: ci ? decode(ci, `CI diff of ${key}`) : result.image, recorded }
}

/** What an image's montage shows: both sides when it has both, else the one it has. */
export function montageEntry(before?: Rgba, after?: Rgba, diff?: Rgba | null): MontageEntry {
  if (before && after) return { change: 'changed', before, after, diff: diff ?? null }
  return after ? { change: 'new', after } : { change: 'removed', before: before! }
}

async function stageImage(g: Gathered, key: string, staging: string): Promise<PacketImage> {
  const before = g.before && (await writeSide(staging, 'before', key, g.before))
  const after = g.after && (await writeSide(staging, 'after', key, g.after))
  const compared =
    before && after ? await compare(g, before.image, after.image, staging, key) : undefined
  const file = `montage/${key}.png`
  const bytes = montage(montageEntry(before?.image, after?.image, compared?.shown))
  await writeFile(join(staging, file), bytes)
  const viewed = (after ?? before)!.image
  return {
    key,
    ...{ layer: g.layer, path: g.path, change: g.change, source: g.source },
    label: `${g.layer}: ${stemOf(g.path)}`,
    ...{ file, sha256: sha256(bytes) },
    viewport: { width: viewed.width, height: viewed.height },
    ...(g.layer === 'story' ? { storyId: stemOf(g.path) } : {}),
    ...(before ? { before: before.record } : {}),
    ...(after ? { after: after.record } : {}),
    ...compared?.recorded,
    cause: null,
  }
}

/** Canonical JSON: object keys sorted at every depth, so equal content hashes equal. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1))
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

type PacketBody = Omit<CiPacket, 'packetId' | 'draft'>

/** What the packet asserts: this head, this run, this main, these images on each side. */
export function packetIdOf(p: PacketBody): string {
  const images = p.images.map((i) => ({
    path: i.path,
    change: i.change,
    before: i.before?.sha256 ?? null,
    after: i.after?.sha256 ?? null,
  }))
  const { repo, pr, headSha, headTree, mainSha } = p
  const id = { repo, pr, headSha, headTree, runId: p.ci.runId, mainSha, images }
  return sha256(Buffer.from(canonical(id)))
}

/** The checks `build` runs on a draft, so a packet never carries one build would refuse. */
export function checkDraft(draft: ReturnType<typeof packetDraft>): void {
  const parsed = RoundSchema.safeParse(applyRoundRules(draft))
  if (!parsed.success)
    throw new ReviewError(
      `the packet's draft fails the round contract:\n${parsed.error.issues
        .map((i) => `  ${i.path.map(String).join('.')}: ${i.message}`)
        .join('\n')}`
    )
  const problems = lintRound(parsed.data)
  if (problems.length)
    throw new ReviewError(
      `the packet's draft fails lintRound:\n${problems.map((p) => `  ${p.rule}: ${p.message}`).join('\n')}`
    )
}

export type DraftQuestion = Parameters<typeof packetDraft>[1][number]

/** The `--side` questions file: a JSON array of round questions. */
export async function readSide(path: string): Promise<DraftQuestion[]> {
  const raw = await readFile(path, 'utf8').catch(() => {
    throw new ReviewError(`cannot read --side ${path}`)
  })
  let questions: unknown
  try {
    questions = JSON.parse(raw)
  } catch {
    throw new ReviewError(`--side ${path} is not JSON`)
  }
  const parsed = z.array(QuestionSchema).safeParse(questions)
  if (!parsed.success)
    throw new ReviewError(`--side ${path} is not an array of questions: ${parsed.error.message}`)
  return questions as DraftQuestion[]
}

/** Everything a packet is written from. */
export interface Collected {
  target: CiTarget
  binding: Binding
  layers: LayerSources[]
  warnings: string[]
  side: DraftQuestion[]
}

function layerFlags<T>(layers: LayerSources[], pick: (l: LayerSources) => T) {
  const of = (layer: string) => pick(layers.find((l) => l.layer === layer)!)
  return { component: of('component'), story: of('story') }
}

/** Refuses, before anything is staged, a baseline whose path the packet schema would refuse. */
function checkShown(shown: Gathered[]): void {
  for (const g of shown) {
    const problem = imagePathProblem(g.layer, g.path)
    if (problem) throw new ReviewError(`${g.layer} baseline ${JSON.stringify(g.path)} ${problem}`)
  }
  const [twice] = repeats(shown.map((g) => g.path))
  if (twice !== undefined)
    throw new ReviewError(`${shown[twice].layer} baseline ${shown[twice].path} is shown twice`)
}

async function stageImages(layers: LayerSources[], staging: string): Promise<PacketImage[]> {
  await Promise.all(SUBDIRS.map((d) => mkdir(join(staging, d))))
  const shown = layers.flatMap((l) => l.shown)
  checkShown(shown)
  const images: PacketImage[] = []
  for (const [i, g] of shown.entries())
    images.push(await stageImage(g, `img-${String(i + 1).padStart(3, '0')}`, staging))
  return images
}

/** Writes the packet into `staging`: images, then draft.json, then packet.json last. */
async function writePacket(c: Collected, staging: string): Promise<CiPacket> {
  const { target: t, binding: b, layers } = c
  const body: PacketBody = {
    schema: CI_PACKET_SCHEMA_ID,
    ...{ repo: t.repo, pr: t.pr, headSha: t.head, headTree: b.headTree },
    ...{ mainSha: b.mainSha, mergeBase: b.mergeBase },
    ci: {
      ...{ runId: t.run, url: b.url, conclusion: b.conclusion, visualJob: b.visualJob },
      regenerated: layerFlags(layers, (l) => l.regenerated),
      diagnostics: layerFlags(layers, (l) => l.diagnostics),
    },
    images: await stageImages(layers, staging),
    unchanged: layerFlags(layers, (l) => l.unchanged),
    warnings: c.warnings,
  }
  const draft = packetDraft(body, c.side)
  checkDraft(draft)
  const draftBytes = Buffer.from(`${JSON.stringify(draft, null, 2)}\n`)
  await writeFile(join(staging, DRAFT_FILE), draftBytes)
  const draftRef = { file: DRAFT_FILE, sha256: sha256(draftBytes) } as const
  const packet = CiPacketSchema.parse({ ...body, packetId: packetIdOf(body), draft: draftRef })
  await writeFile(join(staging, PACKET_FILE), `${JSON.stringify(packet, null, 2)}\n`)
  return packet
}

/** Writes the packet to `out`; a failure leaves `out` as it was. */
export async function writePacketDir(c: Collected, out: string): Promise<CiPacket> {
  await mkdir(dirname(out), { recursive: true })
  const staging = await mkdtemp(join(dirname(out), '.packet-'))
  try {
    const packet = await writePacket(c, staging)
    await swapIn(staging, out)
    return packet
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
}

export interface PacketOptions extends CiTarget {
  out: string
  side?: string
}

function checkTarget(t: CiTarget): void {
  if (!/^[^/\s]+\/[^/\s]+$/.test(t.repo))
    throw new ReviewError(`--repo is owner/name, got ${t.repo}`)
  if (!Number.isInteger(t.pr) || t.pr < 1) throw new ReviewError('--pr is a PR number')
  if (!/^[0-9a-f]{40}$/.test(t.head)) throw new ReviewError('--head is a full 40-hex sha')
  if (!/^\d+$/.test(t.run)) throw new ReviewError(`--run is a run id, got ${t.run}`)
}

async function collect(o: PacketOptions, scratch: string, io: CiIo): Promise<Collected> {
  const side = o.side ? await readSide(o.side) : []
  const binding = await checkBinding(o, io)
  const live = await liveArtifacts(o, io)
  const moved = await mainMoved(o, binding, io)
  const warnings = moved.length
    ? [`main changed ${moved.length} baselines since the merge-base: ${moved.join(', ')}`]
    : []
  const layers: LayerSources[] = []
  for (const source of CI_SOURCES)
    layers.push(await gatherLayer(source, { target: o, binding, live, scratch }, io))
  return { target: o, binding, layers, warnings, side }
}

/** `packet from-ci`: gathers from the run and git, then writes the packet at `o.out`. Every refusal
 * is a ReviewError and leaves `o.out` untouched. */
export async function packetFromCi(
  o: PacketOptions,
  io: CiIo
): Promise<{ packet: CiPacket; warnings: string[] }> {
  checkTarget(o)
  const scratch = await mkdtemp(join(tmpdir(), 'titan-packet-'))
  try {
    const collected = await collect(o, scratch, io)
    return { packet: await writePacketDir(collected, o.out), warnings: collected.warnings }
  } finally {
    await rm(scratch, { recursive: true, force: true })
  }
}
