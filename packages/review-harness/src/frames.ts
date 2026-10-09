import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import {
  THEME_MODES,
  isLoopbackUrl,
  isStoryVariant,
  type Manifest,
  type StoryVariant,
  type ThemeMode,
  type Variant,
} from '@titan-design/review-schema'
import { storyUrl } from './round.ts'
import { AUTO_FALLBACK_HEIGHT, frameHeight, isAuto } from './sections.ts'
import { openChromiumShooter, type OpenShooter, type Viewport } from './shooter.ts'

export const FRAMES_SCHEMA_ID = 'titan-review/frames@1'
export const FRAMES_DIR = 'frames'
export const FRAMES_FILE = 'frames.json'

/** The Storybook global `withThemeByClassName` reads; light puts `.light` on <html>. */
const THEME_GLOBAL = 'theme'

const LAUNCH_HINT =
  'start one from titan-design/packages/ui: node scripts/storybook-launch.mjs --isolated'

export class FrameRenderError extends Error {}

/** One static frame: a story variant at one width, in the theme that applied. */
export interface FrameRecord {
  /** The file stem, `<width>-<variant key>-<story name>`; the same name the post-submit capture writes. */
  key: string
  variant: string
  storyId: string
  theme: ThemeMode
  viewport: Viewport
  /** Relative to the round directory: `frames/<key>.png`. */
  file: string
  sha256: string
}

export interface FramesIndex {
  schema: typeof FRAMES_SCHEMA_ID
  unit: string
  round: number
  storybookUrl: string
  /** The sha of the round.json these frames were rendered for, when the caller knows it. */
  manifestSha256?: string
  frames: FrameRecord[]
}

export interface RenderFramesOptions {
  roundsDir: string
  roundId: string
  manifestSha256?: string
  /** Opens the browser; the default is headless Chromium at 2x. */
  open?: OpenShooter
  /** The story ids the Storybook serves; the default reads its index.json. */
  storyIds?: (storybookUrl: string) => Promise<Set<string>>
}

interface Shot {
  variant: StoryVariant
  key: string
  viewport: Viewport
  file: string
}

/** `<width>-<key>-<story name>`: the key keeps two variants of one story apart. */
export function frameKey(variant: StoryVariant, width: number): string {
  return `${width}-${variant.key}-${variant.storyId.split('--').pop()}`
}

/** The canvas a story is rendered on; the shot itself is cropped to `#storybook-root`. */
export function captureViewportHeight(manifest: Manifest, variant: Variant): number {
  const height = frameHeight(manifest, variant)
  return isAuto(height) ? AUTO_FALLBACK_HEIGHT : height
}

export function frameViewport(manifest: Manifest, variant: Variant, width: number): Viewport {
  return { width, height: captureViewportHeight(manifest, variant) }
}

/** The theme a variant asks for in its globals, or undefined when it takes the Storybook's default. */
export function declaredTheme(variant: Variant): ThemeMode | undefined {
  const theme = variant.globals?.[THEME_GLOBAL]
  return THEME_MODES.find((mode) => mode === theme)
}

export function framesDir(roundsDir: string, roundId: string): string {
  return join(roundsDir, roundId, FRAMES_DIR)
}

/** Defence in depth: the schema already constrains key/storyId, but never write outside the frames dir. */
function assertInside(file: string, dir: string): string {
  const resolvedDir = resolve(dir)
  const resolvedFile = resolve(file)
  if (!resolvedFile.startsWith(resolvedDir + sep))
    throw new FrameRenderError(`refusing to write a frame outside ${resolvedDir}: ${resolvedFile}`)
  return resolvedFile
}

/** Every frame's file, checked before a browser starts, so a refusal writes nothing. */
function plannedShots(manifest: Manifest, dir: string): Shot[] {
  return manifest.variants.filter(isStoryVariant).flatMap((variant) =>
    manifest.widths.map((width) => {
      const key = frameKey(variant, width)
      return {
        variant,
        key,
        viewport: frameViewport(manifest, variant, width),
        file: assertInside(join(dir, `${key}.png`), dir),
      }
    })
  )
}

async function servedStoryIds(storybookUrl: string): Promise<Set<string>> {
  const res = await fetch(`${storybookUrl}/index.json`).catch(() => null)
  if (!res?.ok) throw new FrameRenderError(`no Storybook at ${storybookUrl}; ${LAUNCH_HINT}`)
  const entries = ((await res.json()) as { entries?: Record<string, unknown> }).entries ?? {}
  return new Set(Object.keys(entries))
}

async function assertStoriesServed(
  shots: Shot[],
  storybookUrl: string,
  options: RenderFramesOptions
) {
  const served = await (options.storyIds ?? servedStoryIds)(storybookUrl)
  const missing = [...new Set(shots.map((s) => s.variant.storyId))].filter((id) => !served.has(id))
  if (missing.length)
    throw new FrameRenderError(
      `unknown story ids on ${storybookUrl} (wrong worktree's port?): ${missing.join(', ')}`
    )
}

/** A frame whose declared theme did not apply is an error, never a frame in the other theme. */
function assertDeclaredTheme(shot: Shot, applied: ThemeMode): ThemeMode {
  const declared = declaredTheme(shot.variant)
  if (declared !== undefined && declared !== applied)
    throw new FrameRenderError(`${shot.key}: the ${declared} theme did not apply (got ${applied})`)
  return applied
}

async function sha256Of(file: string): Promise<string> {
  return createHash('sha256')
    .update(await readFile(file))
    .digest('hex')
}

async function shootAll(shots: Shot[], storybookUrl: string, open: OpenShooter) {
  const records: FrameRecord[] = []
  if (shots.length === 0) return records
  const shooter = await open()
  try {
    for (const shot of shots) {
      const applied = await shooter.shoot(
        storyUrl(storybookUrl, shot.variant),
        shot.viewport,
        shot.file
      )
      records.push({
        key: shot.key,
        variant: shot.variant.key,
        storyId: shot.variant.storyId,
        theme: assertDeclaredTheme(shot, applied),
        viewport: shot.viewport,
        file: `${FRAMES_DIR}/${shot.key}.png`,
        sha256: await sha256Of(shot.file),
      })
    }
  } finally {
    await shooter.close()
  }
  return records
}

/** Frames an earlier render left that this one will not rewrite, so the dir never shows a dropped variant. */
async function removeStaleFrames(dir: string, shots: Shot[]): Promise<void> {
  const previous = await readFramesIndex(dir).catch(() => null)
  const keep = new Set(shots.map((s) => s.file))
  for (const frame of previous?.frames ?? []) {
    const file = resolve(dir, '..', frame.file)
    if (file.startsWith(resolve(dir) + sep) && !keep.has(file)) await rm(file, { force: true })
  }
}

/** The index a frames directory carries, read back from its frames.json. */
export async function readFramesIndex(dir: string): Promise<FramesIndex> {
  return JSON.parse(await readFile(join(dir, FRAMES_FILE), 'utf8')) as FramesIndex
}

/**
 * Renders every story frame the manifest names, at every width, to static PNGs under
 * `<roundsDir>/<roundId>/frames/<key>.png`, and writes `frames.json` beside them. No server:
 * it needs only a running Storybook on loopback. Image variants are already static files
 * beside the round and are not copied. A story the Storybook does not serve, or a declared
 * theme that did not apply, rejects before (or instead of) writing the index.
 */
export async function renderFrames(
  manifest: Manifest,
  storybookUrl: string,
  options: RenderFramesOptions
): Promise<FramesIndex> {
  const base = storybookUrl.replace(/\/$/, '')
  if (!isLoopbackUrl(base))
    throw new FrameRenderError(
      `only loopback Storybook hosts (127.0.0.1, localhost, [::1]) are allowed: ${storybookUrl}`
    )
  const dir = framesDir(options.roundsDir, options.roundId)
  const shots = plannedShots(manifest, dir)
  if (shots.length) await assertStoriesServed(shots, base, options)
  await mkdir(dir, { recursive: true })
  await removeStaleFrames(dir, shots)
  const index: FramesIndex = {
    schema: FRAMES_SCHEMA_ID,
    unit: manifest.unit,
    round: manifest.round,
    storybookUrl: base,
    ...(options.manifestSha256 ? { manifestSha256: options.manifestSha256 } : {}),
    frames: await shootAll(shots, base, options.open ?? openChromiumShooter),
  }
  await writeFile(join(dir, FRAMES_FILE), `${JSON.stringify(index, null, 2)}\n`)
  return index
}
