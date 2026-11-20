// Playwright driver for the pixel clip oracle (TD-969): screenshot a text box as it renders, lift its
// clip, screenshot again, put the element back as it was, and hand both renders to clipDiff.
// The release-and-diff idea comes from cathrynlavery/diagram-design (MIT); no code is copied.
import type { Page } from '@playwright/test'
import { clipDiff, type Box, type ClipResult } from './clip-oracle.ts'
import { readPng } from './packet-png.ts'

export interface ClipProbeResult extends ClipResult {
  selector: string
  /** The text box in layout units, relative to the viewport. */
  box: Box
  scale: number
}

/**
 * What a release sets, each with `!important` so class rules can't win. Sizes are left alone: a
 * box that changed size would move its neighbours and read as a spill.
 */
export const RELEASE_STYLES: Readonly<Record<string, string>> = {
  overflow: 'visible',
  'text-overflow': 'clip',
  '-webkit-line-clamp': 'unset',
  'line-clamp': 'none',
  'clip-path': 'none',
  clip: 'auto',
}

const RELEASE_MARK = 'data-clip-probe-style'

async function shoot(page: Page) {
  return readPng(await page.screenshot({ animations: 'disabled', caret: 'hide' }))
}

/** Lifts the clip on the element and stashes its style attribute on it for `restoreClip`. */
export async function releaseClip(page: Page, selector: string): Promise<void> {
  await page.locator(selector).evaluate(
    (el, { styles, mark }) => {
      const html = el as HTMLElement
      html.setAttribute(mark, JSON.stringify(html.getAttribute('style')))
      for (const [prop, value] of Object.entries(styles))
        html.style.setProperty(prop, value, 'important')
    },
    { styles: RELEASE_STYLES, mark: RELEASE_MARK }
  )
}

/** Puts back the style attribute `releaseClip` stashed, removing it if there was none. */
export async function restoreClip(page: Page, selector: string): Promise<void> {
  await page.locator(selector).evaluate((el, mark) => {
    const stashed = el.getAttribute(mark)
    if (stashed === null) return
    const style = JSON.parse(stashed) as string | null
    if (style === null) el.removeAttribute('style')
    else el.setAttribute('style', style)
    el.removeAttribute(mark)
  }, RELEASE_MARK)
}

/** Probes one text box. The element is restored even if the second screenshot fails. */
export async function probeClip(page: Page, selector: string): Promise<ClipProbeResult> {
  const target = page.locator(selector)
  const box = await target.boundingBox()
  if (!box) throw new Error(`clip probe: ${selector} has no box`)
  const scale = await page.evaluate(() => window.devicePixelRatio)
  const clipped = await shoot(page)
  await releaseClip(page, selector)
  let released
  try {
    released = await shoot(page)
  } finally {
    await restoreClip(page, selector)
  }
  const layoutBox: Box = { x: box.x, y: box.y, w: box.width, h: box.height }
  return { selector, box: layoutBox, scale, ...clipDiff(clipped, released, layoutBox, scale) }
}
