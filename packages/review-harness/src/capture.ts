import { copyFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { chromium, type Page } from '@playwright/test'
import {
  isImageVariant,
  isStoryVariant,
  type ImageVariant,
  type Manifest,
  type StoryVariant,
  type Variant,
} from './schema.ts'
import { storyUrl } from './round.ts'
import { AUTO_FALLBACK_HEIGHT, frameHeight, isAuto } from './sections.ts'

const SETTLE_MS = 1500

export function captureFileName(variant: StoryVariant, width: number): string {
  return `${width}-${variant.key}-${variant.storyId.split('--').pop()}.png`
}

/** The canvas a story is rendered on; the shot itself is cropped to `#storybook-root`. */
export function captureViewportHeight(manifest: Manifest, variant: Variant): number {
  const height = frameHeight(manifest, variant)
  return isAuto(height) ? AUTO_FALLBACK_HEIGHT : height
}

/** Defence in depth: the schema already constrains key/storyId, but never write outside outDir. */
function assertInsideOutDir(file: string, outDir: string): string {
  const resolvedOutDir = resolve(outDir)
  const resolvedFile = resolve(file)
  if (resolvedFile !== resolvedOutDir && !resolvedFile.startsWith(resolvedOutDir + sep))
    throw new Error(`refusing to write capture outside outDir: ${resolvedFile}`)
  return resolvedFile
}

async function shoot(page: Page, url: string, file: string): Promise<void> {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(SETTLE_MS)
  const storyError = await page.evaluate(() =>
    document.body.classList.contains('sb-show-errordisplay')
      ? document.querySelector('#error-message')?.textContent || 'unknown error'
      : null
  )
  if (storyError) throw new Error(`story failed to render: ${storyError.slice(0, 300)}`)
  await page.locator('#storybook-root').first().screenshot({ path: file, animations: 'disabled' })
}

/** An image variant's record is its own PNG, copied once; the page showed it unchanged at every width. */
export function imageCopyName(variant: ImageVariant): string {
  return `${variant.key}-image.png`
}

async function copyImages(
  manifest: Manifest,
  images: Record<string, string>,
  outDir: string
): Promise<string[]> {
  const files: string[] = []
  for (const variant of manifest.variants.filter(isImageVariant)) {
    const source = resolve(images[variant.key])
    const file = assertInsideOutDir(join(outDir, imageCopyName(variant)), outDir)
    if (file !== source) await copyFile(source, file)
    files.push(file)
  }
  return files
}

async function shootStories(
  stories: StoryVariant[],
  manifest: Manifest,
  storybookUrl: string,
  outDir: string
): Promise<string[]> {
  if (stories.length === 0) return []
  const browser = await chromium.launch()
  const files: string[] = []
  try {
    const page = await browser.newPage({ deviceScaleFactor: 2 })
    for (const variant of stories) {
      for (const width of manifest.widths) {
        await page.setViewportSize({ width, height: captureViewportHeight(manifest, variant) })
        const file = assertInsideOutDir(join(outDir, captureFileName(variant, width)), outDir)
        await shoot(page, storyUrl(storybookUrl, variant), file)
        files.push(file)
      }
    }
  } finally {
    await browser.close()
  }
  return files
}

/** The round's post-submit record: one PNG per story variant per width, plus each image variant's PNG. */
export async function captureRound(
  manifest: Manifest,
  storybookUrl: string,
  outDir: string,
  images: Record<string, string> = {}
): Promise<string[]> {
  const stories = manifest.variants.filter(isStoryVariant)
  const shots = await shootStories(stories, manifest, storybookUrl, outDir)
  return [...shots, ...(await copyImages(manifest, images, outDir))]
}
