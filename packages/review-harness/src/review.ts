import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ManifestSchema, isLoopbackUrl, type Feedback, type Manifest } from './schema.ts'
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
  const manifestSha256 = createHash('sha256').update(raw).digest('hex')
  const storybookUrl = (storybookOverride ?? parsed.data.storybookUrl).replace(/\/$/, '')
  return { manifest: parsed.data, manifestSha256, storybookUrl }
}

export async function assertStoriesExist(round: LoadedRound): Promise<void> {
  const res = await fetch(`${round.storybookUrl}/index.json`).catch(() => null)
  if (!res?.ok) throw new ReviewError(`no Storybook at ${round.storybookUrl}; ${LAUNCH_HINT}`)
  const entries = ((await res.json()) as { entries?: Record<string, unknown> }).entries ?? {}
  const unknown = round.manifest.variants.map((v) => v.storyId).filter((id) => !(id in entries))
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
