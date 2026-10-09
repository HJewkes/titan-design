import { test, expect, type Page } from '@playwright/test'

// A 1,480-character line in a 90px viewport, so the code scrolls on both axes.
const LONG_LINE_STORY =
  'components-molecules-codeviewer--default&args=fixture:longLineReal;maxHeight:90'

const offsets = (page: Page) =>
  page.evaluate(() => ({
    x: document.querySelector('[data-testid="code-viewer-code"]')?.scrollLeft ?? 0,
    y: document.querySelector('[data-testid="code-viewer-scroll"]')?.scrollTop ?? 0,
  }))

// Arrow-key scrolling is the browser's own: no handler in CodeViewer moves the code. The focused
// scroller is the horizontal one, and Chromium passes the keys it cannot use to the vertical
// scroller around it. Only a real keyboard exercises that, so it is not a play function.
test('arrow keys in the focused code scroller scroll it on both axes', async ({ page }) => {
  await page.goto(`/iframe.html?id=${LONG_LINE_STORY}&viewMode=story`)
  const code = page.getByTestId('code-viewer-code')
  await expect(code).toBeVisible()
  await code.focus()
  expect(await offsets(page)).toEqual({ x: 0, y: 0 })

  await page.keyboard.press('ArrowDown')
  await expect.poll(async () => (await offsets(page)).y).toBeGreaterThan(0)
  expect((await offsets(page)).x).toBe(0)
  await page.keyboard.press('ArrowUp')
  await expect.poll(async () => (await offsets(page)).y).toBe(0)

  await page.keyboard.press('ArrowRight')
  await expect.poll(async () => (await offsets(page)).x).toBeGreaterThan(0)
  expect((await offsets(page)).y).toBe(0)
  await expect(code).toBeFocused()
})
