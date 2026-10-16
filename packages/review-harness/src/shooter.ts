import { chromium, type Page } from '@playwright/test'
import type { ThemeMode } from '@titan-design/review-schema'

const SETTLE_MS = 1500

export const STORY_ROOT = '#storybook-root'

export interface Viewport {
  width: number
  height: number
}

/** One open browser that shoots story frames; `close` releases it. */
export interface FrameShooter {
  /** Renders the story at `url` on `viewport`, writes `#storybook-root` to `file`, returns the theme that applied. */
  shoot: (url: string, viewport: Viewport, file: string) => Promise<ThemeMode>
  close: () => Promise<void>
}

export type OpenShooter = () => Promise<FrameShooter>

/** Loads a story and lets it settle; a story that threw rejects instead of rendering blank. */
export async function renderStory(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(SETTLE_MS)
  const storyError = await page.evaluate(() =>
    document.body.classList.contains('sb-show-errordisplay')
      ? document.querySelector('#error-message')?.textContent || 'unknown error'
      : null
  )
  if (storyError) throw new Error(`story failed to render: ${storyError.slice(0, 300)}`)
}

/** The theme a rendered frame actually got: `.light` on <html> is light, anything else is dark. */
export async function appliedTheme(page: Page): Promise<ThemeMode> {
  const light = await page.evaluate(() => document.documentElement.classList.contains('light'))
  return light ? 'light' : 'dark'
}

/** Headless Chromium at 2x, the renderer every capture in the harness shares. */
export const openChromiumShooter: OpenShooter = async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ deviceScaleFactor: 2 })
  return {
    shoot: async (url, viewport, file) => {
      await page.setViewportSize(viewport)
      await renderStory(page, url)
      await page.locator(STORY_ROOT).first().screenshot({ path: file, animations: 'disabled' })
      return appliedTheme(page)
    },
    close: () => browser.close(),
  }
}
