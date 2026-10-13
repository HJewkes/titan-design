import { createHash } from 'node:crypto'
import { mkdir, open, readFile, realpath, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import {
  RoundSchema,
  choiceMismatchMessage,
  isClipVariant,
  isImageVariant,
  isLoopbackUrl,
  isStoryVariant,
  settingMismatches,
  type Feedback,
  type Manifest,
} from '@titan-design/review-schema'
import { baseImageKey } from './pr-tabs.ts'
import { urlParamProblems } from './round.ts'
import { startReviewServer, type PageHandler } from './server.ts'

export const EXIT_OK = 0
export const EXIT_INVALID = 2
export const EXIT_INTERRUPTED = 130

const LAUNCH_HINT =
  'start one from titan-design/packages/ui: node scripts/storybook-launch.mjs --isolated'

export class ReviewError extends Error {}

export interface LoadedRound {
  manifest: Manifest
  manifestSha256: string
  storybookUrl: string
  /** Absolute path of each image variant's PNG, by variant key. */
  images: Record<string, string>
  /** Absolute path of each clip variant's mp4 or webm, by variant key. */
  clips: Record<string, string>
  /** A page banner saying the harness is not origin/main's, or could not be checked. */
  harnessWarning?: string
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

async function startsWithPngSignature(file: string): Promise<boolean> {
  const handle = await open(file)
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(8), 0, 8, 0)
    return bytesRead === 8 && buffer.equals(PNG_SIGNATURE)
  } finally {
    await handle.close()
  }
}

async function readHead(file: string, bytes: number): Promise<Buffer> {
  const handle = await open(file)
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(bytes), 0, bytes, 0)
    return buffer.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

const WEBM_SIGNATURE = Buffer.from([0x1a, 0x45, 0xdf, 0xa3])

/** An mp4 names its `ftyp` box at byte 4; a webm opens with the EBML magic. */
export function isVideoHead(head: Buffer): boolean {
  return (
    head.subarray(0, 4).equals(WEBM_SIGNATURE) || head.subarray(4, 8).toString('latin1') === 'ftyp'
  )
}

/** Resolves a path against the round's directory, following symlinks, and refuses escapes. */
async function resolveInside(roundDir: string, where: string, path: string): Promise<string> {
  const file = await realpath(resolve(roundDir, path)).catch(() => {
    throw new ReviewError(`${where} does not exist (paths resolve against ${roundDir})`)
  })
  const inside = relative(roundDir, file)
  if (inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside))
    throw new ReviewError(`${where} resolves outside the round directory ${roundDir}`)
  return file
}

async function resolveImage(roundDir: string, where: string, image: string): Promise<string> {
  const file = await resolveInside(roundDir, where, image)
  if (!(await startsWithPngSignature(file).catch(() => false)))
    throw new ReviewError(`${where} is not a PNG file`)
  return file
}

async function resolveClip(roundDir: string, where: string, clip: string): Promise<string> {
  const file = await resolveInside(roundDir, where, clip)
  if (!isVideoHead(await readHead(file, 8).catch(() => Buffer.alloc(0))))
    throw new ReviewError(`${where} is not an mp4 or webm file`)
  return file
}

/** A PNG's pixel width, from its IHDR chunk, which the signature check has already placed. */
async function pngWidth(file: string): Promise<number> {
  const handle = await open(file)
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(4), 0, 4, 16)
    if (bytesRead < 4) throw new ReviewError(`cannot read PNG width from ${file}`)
    return buffer.readUInt32BE(0)
  } finally {
    await handle.close()
  }
}

/** Image frames of one CHOICE strip are captured at one width; the manifest cannot see that. */
async function choiceWidthProblems(manifest: Manifest, images: Record<string, string>) {
  const choices = (manifest.sections ?? []).filter((s) => s.kind === 'CHOICE')
  const problems = await Promise.all(
    choices.map(async (section) => {
      const keys = section.variantKeys.filter((k) => images[k] !== undefined)
      const widths = await Promise.all(keys.map(async (k) => pngWidth(images[k])))
      const settings = new Map(keys.map((k, i) => [k, { 'captured width': `${widths[i]}px` }]))
      const mismatches = settingMismatches(settings)
      return mismatches.length ? [choiceMismatchMessage(section.id, mismatches)] : []
    })
  )
  return problems.flat()
}

/** Names the section, question or variant an issue is in by its id, not its array index. */
function issueWhere(json: unknown, path: PropertyKey[]): string {
  const [list, index, ...rest] = path
  const noun = { sections: 'section', questions: 'question', variants: 'variant' }[String(list)]
  const items = (json as Record<string, unknown> | null)?.[String(list)]
  const item = Array.isArray(items) ? (items[Number(index)] as Record<string, unknown>) : undefined
  const name = item?.id ?? item?.key
  if (!noun || typeof index !== 'number' || typeof name !== 'string')
    return path.map(String).join('.') || '(root)'
  return [`${noun} ${name}`, rest.map(String).join('.')].join(' ').trimEnd()
}

/** Every PNG the page may show, by route key: each image variant's, and each base render. */
function imageSources(manifest: Manifest): { key: string; where: string; image: string }[] {
  return manifest.variants.flatMap((v) => [
    ...(isImageVariant(v)
      ? [{ key: v.key, where: `variant ${v.key}: image ${v.image}`, image: v.image }]
      : []),
    ...(v.baseImage
      ? [
          {
            key: baseImageKey(v.key),
            where: `variant ${v.key}: baseImage ${v.baseImage}`,
            image: v.baseImage,
          },
        ]
      : []),
  ])
}

async function resolveImages(path: string, manifest: Manifest): Promise<Record<string, string>> {
  const roundDir = await realpath(dirname(resolve(path)))
  const entries = await Promise.all(
    imageSources(manifest).map(
      async (s) => [s.key, await resolveImage(roundDir, s.where, s.image)] as const
    )
  )
  return Object.fromEntries(entries)
}

async function resolveClips(path: string, manifest: Manifest): Promise<Record<string, string>> {
  const roundDir = await realpath(dirname(resolve(path)))
  const entries = await Promise.all(
    manifest.variants
      .filter(isClipVariant)
      .map(
        async (v) =>
          [v.key, await resolveClip(roundDir, `variant ${v.key}: clip ${v.clip}`, v.clip)] as const
      )
  )
  return Object.fromEntries(entries)
}

/** A JSON file and its bytes; the error names the path when it cannot be read or parsed. */
export async function readJsonFile(path: string): Promise<{ json: unknown; raw: Buffer }> {
  const raw = await readFile(path).catch(() => {
    throw new ReviewError(`cannot read ${path}`)
  })
  try {
    return { json: JSON.parse(raw.toString('utf8')), raw }
  } catch {
    throw new ReviewError(`${path} is not JSON`)
  }
}

/** The round under the review contract, or every way it falls short of it. */
function parseRound(path: string, json: unknown): Manifest {
  const parsed = RoundSchema.safeParse(json)
  if (parsed.success) return parsed.data
  const issues = parsed.error.issues.map((i) => `  ${issueWhere(json, i.path)}: ${i.message}`)
  throw new ReviewError(`invalid manifest ${path}:\n${issues.join('\n')}`)
}

export async function loadRound(path: string, storybookOverride?: string): Promise<LoadedRound> {
  const { json, raw } = await readJsonFile(path)
  const manifest = parseRound(path, json)
  const stripped = urlParamProblems(manifest)
  if (stripped.length)
    throw new ReviewError(
      `Storybook would drop these URL args; give each variant its own story:\n  ${stripped.join('\n  ')}`
    )
  if (storybookOverride && !isLoopbackUrl(storybookOverride))
    throw new ReviewError(
      `only loopback Storybook hosts (127.0.0.1, localhost, [::1]) are allowed: ${storybookOverride}`
    )
  const images = await resolveImages(path, manifest)
  const clips = await resolveClips(path, manifest)
  const widthProblems = await choiceWidthProblems(manifest, images)
  if (widthProblems.length)
    throw new ReviewError(`invalid manifest ${path}:\n  ${widthProblems.join('\n  ')}`)
  const manifestSha256 = createHash('sha256').update(raw).digest('hex')
  const storybookUrl = (storybookOverride ?? manifest.storybookUrl).replace(/\/$/, '')
  return { manifest, manifestSha256, storybookUrl, images, clips }
}

/** An image-only round never touches Storybook, so it needs none running. */
export async function assertStoriesExist(round: LoadedRound): Promise<void> {
  const storyIds = round.manifest.variants.filter(isStoryVariant).map((v) => v.storyId)
  if (storyIds.length === 0) return
  const res = await fetch(`${round.storybookUrl}/index.json`).catch(() => null)
  if (!res?.ok) throw new ReviewError(`no Storybook at ${round.storybookUrl}; ${LAUNCH_HINT}`)
  const entries = ((await res.json()) as { entries?: Record<string, unknown> }).entries ?? {}
  const unknown = storyIds.filter((id) => !(id in entries))
  if (unknown.length)
    throw new ReviewError(
      `unknown story ids on ${round.storybookUrl} (wrong worktree's port?): ${unknown.join(', ')}`
    )
}

export interface ReviewDeps {
  createPage: () => Promise<{ handler: PageHandler; close: () => Promise<void> }>
  onReady: (url: string) => void
  signal: AbortSignal
  port?: number
}

/** Serves the page until the human submits (feedback) or the signal aborts (null). */
export async function collectFeedback(
  round: LoadedRound,
  deps: ReviewDeps
): Promise<Feedback | null> {
  const page = await deps.createPage()
  const server = await startReviewServer({ ...round, page: page.handler, port: deps.port })
  const aborted = new Promise<null>((resolve) => {
    if (deps.signal.aborted) resolve(null)
    deps.signal.addEventListener('abort', () => resolve(null), { once: true })
  })
  try {
    deps.onReady(server.url)
    return await Promise.race([server.submitted, aborted])
  } finally {
    await server.close()
    await page.close()
  }
}

export async function writeFeedback(outDir: string, feedback: Feedback): Promise<string> {
  await mkdir(outDir, { recursive: true })
  const file = join(outDir, 'feedback.json')
  await writeFile(file, `${JSON.stringify(feedback, null, 2)}\n`)
  return file
}
