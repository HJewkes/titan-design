import { chromium, type Page } from '@playwright/test'
import type { ThemeMode } from '@titan-design/review-schema'

const SETTLE_MS = 1500

export const STORY_ROOT = '#storybook-root'

export interface Viewport {
  width: number
  height: number
}

/** One element under the story root, in viewport CSS px relative to the root's top left. */
export interface TargetBox {
  x: number
  y: number
  width: number
  height: number
  target: { testId?: string; role?: string; text?: string }
}

export interface ShotResult {
  /** The theme that applied. */
  theme: ThemeMode
  boxes: TargetBox[]
}

/** One open browser that shoots story frames; `close` releases it. */
export interface FrameShooter {
  /** Renders the story at `url` on `viewport` and writes `#storybook-root` to `file`. */
  shoot: (url: string, viewport: Viewport, file: string) => Promise<ShotResult>
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

/** Every test id or role element under `root`. Runs in the page, so it must stay self-contained. */
function collectTargets(root: Element): TargetBox[] {
  const origin = root.getBoundingClientRect()
  return Array.from(root.querySelectorAll('[data-testid],[role]'), (element) => {
    const { left, top, width, height } = element.getBoundingClientRect()
    const testId = element.getAttribute('data-testid')
    const role = element.getAttribute('role')
    const text = element.textContent?.replace(/\s+/g, ' ').trim()
    return {
      x: left - origin.left,
      y: top - origin.top,
      width,
      height,
      target: {
        ...(testId ? { testId } : {}),
        ...(role ? { role } : {}),
        ...(text ? { text } : {}),
      },
    }
  })
}

/** Headless Chromium at 2x, the renderer every capture in the harness shares. */
export const openChromiumShooter: OpenShooter = async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ deviceScaleFactor: 2 })
  return {
    shoot: async (url, viewport, file) => {
      await page.setViewportSize(viewport)
      await renderStory(page, url)
      const root = page.locator(STORY_ROOT).first()
      await root.screenshot({ path: file, animations: 'disabled' })
      return { theme: await appliedTheme(page), boxes: await root.evaluate(collectTargets) }
    },
    close: () => browser.close(),
  }
}
