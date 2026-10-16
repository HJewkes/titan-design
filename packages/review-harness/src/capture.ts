import { copyFile, realpath } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import {
  isClipVariant,
  isImageVariant,
  isStoryVariant,
  type ImageVariant,
  type Manifest,
  type StoryVariant,
} from '@titan-design/review-schema'
import { frameKey, frameViewport } from './frames.ts'
import { storyUrl, withArg } from './round.ts'
import { openChromiumShooter, type Viewport } from './shooter.ts'

export function captureFileName(variant: StoryVariant, width: number): string {
  return `${frameKey(variant, width)}.png`
}

/** Defence in depth: the schema already constrains key/storyId, but never write outside outDir. */
function assertInsideOutDir(file: string, outDir: string): string {
  const resolvedOutDir = resolve(outDir)
  const resolvedFile = resolve(file)
  if (resolvedFile !== resolvedOutDir && !resolvedFile.startsWith(resolvedOutDir + sep))
    throw new Error(`refusing to write capture outside outDir: ${resolvedFile}`)
  return resolvedFile
}

/** The first of `<key>-image.png`, `<key>-image-2.png`, ... that is not one of the round's source PNGs. */
function imageCopyName(variant: ImageVariant, outDir: string, sources: Set<string>): string {
  for (let n = 1; ; n++) {
    const name = n === 1 ? `${variant.key}-image.png` : `${variant.key}-image-${n}.png`
    if (!sources.has(join(outDir, name))) return name
  }
}

/** Never write over a source PNG: the human's screenshot outranks a record of it. */
function assertNotSource(file: string, sources: Set<string>): string {
  if (sources.has(file)) throw new Error(`refusing to overwrite the round's source image ${file}`)
  return file
}

async function copyImages(
  manifest: Manifest,
  images: Record<string, string>,
  outDir: string
): Promise<string[]> {
  const sources = new Set(Object.values(images))
  const files: string[] = []
  for (const variant of manifest.variants.filter(isImageVariant)) {
    const name = imageCopyName(variant, outDir, sources)
    const file = assertInsideOutDir(join(outDir, name), outDir)
    await copyFile(images[variant.key], file)
    files.push(file)
  }
  return files
}

/** Each clip as `<key>-clip.<ext>`, never over a source file. */
async function copyClips(manifest: Manifest, clips: Record<string, string>, outDir: string) {
  const sources = new Set(Object.values(clips))
  const files: string[] = []
  for (const variant of manifest.variants.filter(isClipVariant)) {
    const name = `${variant.key}-clip${extname(clips[variant.key]).toLowerCase()}`
    const file = assertNotSource(assertInsideOutDir(join(outDir, name), outDir), sources)
    await copyFile(clips[variant.key], file)
    files.push(file)
  }
  return files
}

interface Shot {
  variant: StoryVariant
  viewport: Viewport
  file: string
}

/** `<width>-<key>-<story>-<arg>-<candidate>.png`: one shot per scale candidate, at the frame's size. */
export function scaleCaptureFileName(variant: StoryVariant, candidate: string | number | boolean) {
  const { arg, frame } = variant.scale!
  const value = String(candidate).replace(/[^A-Za-z0-9_-]+/g, '_')
  return `${frameKey(variant, frame.width)}-${arg}-${value}.png`
}

function variantShots(manifest: Manifest, variant: StoryVariant): Omit<Shot, 'file'>[] {
  if (!variant.scale)
    return manifest.widths.map((width) => ({
      variant,
      viewport: frameViewport(manifest, variant, width),
    }))
  const { arg, frame, candidates } = variant.scale
  return candidates.map((c) => ({ variant: withArg(variant, arg, c), viewport: frame }))
}

function shotName(shot: Omit<Shot, 'file'>, original: StoryVariant): string {
  if (!original.scale) return captureFileName(shot.variant, shot.viewport.width)
  return scaleCaptureFileName(original, shot.variant.args![original.scale.arg])
}

/** Every story shot's file, checked before a browser starts, so a refusal writes nothing. */
function plannedShots(manifest: Manifest, outDir: string, sources: Set<string>): Shot[] {
  return manifest.variants.filter(isStoryVariant).flatMap((variant) =>
    variantShots(manifest, variant).map((shot) => {
      const file = assertInsideOutDir(join(outDir, shotName(shot, variant)), outDir)
      return { ...shot, file: assertNotSource(file, sources) }
    })
  )
}

async function shootStories(shots: Shot[], storybookUrl: string) {
  if (shots.length === 0) return []
  const shooter = await openChromiumShooter()
  try {
    for (const { variant, viewport, file } of shots)
      await shooter.shoot(storyUrl(storybookUrl, variant), viewport, file)
  } finally {
    await shooter.close()
  }
  return shots.map((s) => s.file)
}

/**
 * The round's post-submit record: one PNG per story variant per width (per candidate, for a
 * scale reference), plus a copy of each image and clip. `images` and `clips` hold real paths
 * (loadRound), so outDir is compared as one too.
 */
export async function captureRound(
  manifest: Manifest,
  storybookUrl: string,
  outDir: string,
  images: Record<string, string> = {},
  clips: Record<string, string> = {}
): Promise<string[]> {
  const dir = await realpath(outDir).catch(() => resolve(outDir))
  const sources = new Set([...Object.values(images), ...Object.values(clips)])
  const shots = plannedShots(manifest, dir, sources)
  const files = await shootStories(shots, storybookUrl)
  return [
    ...files,
    ...(await copyImages(manifest, images, dir)),
    ...(await copyClips(manifest, clips, dir)),
  ]
}
