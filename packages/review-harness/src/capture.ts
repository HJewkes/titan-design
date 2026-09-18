import { join } from 'node:path'
import { chromium, type Page } from '@playwright/test'
import type { Manifest, Variant } from './schema.ts'
import { storyUrl } from './round.ts'

const SETTLE_MS = 1500

export function captureFileName(variant: Variant, width: number): string {
  return `${width}-${variant.key}-${variant.storyId.split('--').pop()}.png`
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

/** The round's post-submit record: one PNG per variant per width, same URLs the page showed. */
export async function captureRound(
  manifest: Manifest,
  storybookUrl: string,
  outDir: string
): Promise<string[]> {
  const browser = await chromium.launch()
  const files: string[] = []
  try {
    const page = await browser.newPage({ deviceScaleFactor: 2 })
    for (const variant of manifest.variants) {
      for (const width of manifest.widths) {
        await page.setViewportSize({ width, height: manifest.height })
        const file = join(outDir, captureFileName(variant, width))
        await shoot(page, storyUrl(storybookUrl, variant), file)
        files.push(file)
      }
    }
  } finally {
    await browser.close()
  }
  return files
}
