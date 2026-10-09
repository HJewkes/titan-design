import { copyFile, realpath } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import {
  isImageVariant,
  isStoryVariant,
  type ImageVariant,
  type Manifest,
  type StoryVariant,
} from '@titan-design/review-schema'
import { frameKey, frameViewport } from './frames.ts'
import { storyUrl } from './round.ts'
import { openChromiumShooter } from './shooter.ts'

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

interface Shot {
  variant: StoryVariant
  width: number
  file: string
}

/** Every story shot's file, checked before a browser starts, so a refusal writes nothing. */
function plannedShots(manifest: Manifest, outDir: string, sources: Set<string>): Shot[] {
  return manifest.variants.filter(isStoryVariant).flatMap((variant) =>
    manifest.widths.map((width) => {
      const file = assertInsideOutDir(join(outDir, captureFileName(variant, width)), outDir)
      return { variant, width, file: assertNotSource(file, sources) }
    })
  )
}

async function shootStories(shots: Shot[], manifest: Manifest, storybookUrl: string) {
  if (shots.length === 0) return []
  const shooter = await openChromiumShooter()
  try {
    for (const { variant, width, file } of shots)
      await shooter.shoot(
        storyUrl(storybookUrl, variant),
        frameViewport(manifest, variant, width),
        file
      )
  } finally {
    await shooter.close()
  }
  return shots.map((s) => s.file)
}

/**
 * The round's post-submit record: one PNG per story variant per width, plus a copy of each
 * image variant's PNG. `images` holds real paths (loadRound), so outDir is compared as one too.
 */
export async function captureRound(
  manifest: Manifest,
  storybookUrl: string,
  outDir: string,
  images: Record<string, string> = {}
): Promise<string[]> {
  const dir = await realpath(outDir).catch(() => resolve(outDir))
  const sources = new Set(Object.values(images))
  const shots = plannedShots(manifest, dir, sources)
  const files = await shootStories(shots, manifest, storybookUrl)
  return [...files, ...(await copyImages(manifest, images, dir))]
}
