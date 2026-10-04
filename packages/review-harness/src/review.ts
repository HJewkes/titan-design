import { createHash } from 'node:crypto'
import { mkdir, open, readFile, realpath, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import {
  ManifestSchema,
  isImageVariant,
  isLoopbackUrl,
  isStoryVariant,
  type Feedback,
  type ImageVariant,
  type Manifest,
} from './schema.ts'
import { urlParamProblems } from './round.ts'
import { startReviewServer, type PageHandler } from './server.ts'

export const EXIT_OK = 0
export const EXIT_INVALID = 2
export const EXIT_INTERRUPTED = 130

export const LAUNCH_HINT =
  'start one from titan-design/packages/ui: node scripts/storybook-launch.mjs --isolated'

export class ReviewError extends Error {}

export interface LoadedRound {
  manifest: Manifest
  manifestSha256: string
  storybookUrl: string
  /** Absolute path of each image variant's PNG, by variant key. */
  images: Record<string, string>
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

/** Resolves an image against the round's directory, following symlinks, and refuses escapes. */
async function resolveImage(roundDir: string, variant: ImageVariant): Promise<string> {
  const where = `variant ${variant.key}: image ${variant.image}`
  const file = await realpath(resolve(roundDir, variant.image)).catch(() => {
    throw new ReviewError(`${where} does not exist (paths resolve against ${roundDir})`)
  })
  const inside = relative(roundDir, file)
  if (inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside))
    throw new ReviewError(`${where} resolves outside the round directory ${roundDir}`)
  if (!(await startsWithPngSignature(file).catch(() => false)))
    throw new ReviewError(`${where} is not a PNG file`)
  return file
}

async function resolveImages(path: string, manifest: Manifest): Promise<Record<string, string>> {
  const roundDir = await realpath(dirname(resolve(path)))
  const entries = await Promise.all(
    manifest.variants
      .filter(isImageVariant)
      .map(async (v) => [v.key, await resolveImage(roundDir, v)] as const)
  )
  return Object.fromEntries(entries)
}

export async function loadRound(path: string, storybookOverride?: string): Promise<LoadedRound> {
  const raw = await readFile(path).catch(() => {
    throw new ReviewError(`cannot read ${path}`)
  })
  let json: unknown
  try {
    json = JSON.parse(raw.toString('utf8'))
  } catch {
    throw new ReviewError(`${path} is not JSON`)
  }
  const parsed = ManifestSchema.safeParse(json)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
    throw new ReviewError(`invalid manifest ${path}:\n${issues.join('\n')}`)
  }
  const stripped = urlParamProblems(parsed.data)
  if (stripped.length)
    throw new ReviewError(
      `Storybook would drop these URL args; give each variant its own story:\n  ${stripped.join('\n  ')}`
    )
  if (storybookOverride && !isLoopbackUrl(storybookOverride))
    throw new ReviewError(
      `only loopback Storybook hosts (127.0.0.1, localhost, [::1]) are allowed: ${storybookOverride}`
    )
  const images = await resolveImages(path, parsed.data)
  const manifestSha256 = createHash('sha256').update(raw).digest('hex')
  const storybookUrl = (storybookOverride ?? parsed.data.storybookUrl).replace(/\/$/, '')
  return { manifest: parsed.data, manifestSha256, storybookUrl, images }
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
  contrastOverride?: string
}

/** Serves the page until the human submits (feedback) or the signal aborts (null). */
export async function collectFeedback(
  round: LoadedRound,
  deps: ReviewDeps
): Promise<Feedback | null> {
  const page = await deps.createPage()
  const server = await startReviewServer({
    ...round,
    page: page.handler,
    port: deps.port,
    contrastOverride: deps.contrastOverride,
  })
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
