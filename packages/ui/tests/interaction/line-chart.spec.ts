import { test, expect, type Page } from '@playwright/test'

const PLAYGROUND = 'components-organisms-linechart-interactions--points-playground'
const ANIMATED = 'components-organisms-linechart-interactions--points-playground-animated'

async function open(page: Page, story: string) {
  await page.goto(`/iframe.html?id=${story}&viewMode=story`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('line-chart-points')).toBeVisible()
}

const target = (page: Page) => page.getByTestId('line-chart-points')

/** The accessible name of the node `aria-activedescendant` points at, or null with none active. */
const announced = (page: Page) =>
  target(page).evaluate((el) => {
    const id = el.getAttribute('aria-activedescendant')
    return id ? (document.getElementById(id)?.getAttribute('aria-label') ?? null) : null
  })

/** Horizontal centre of a box, in px. */
const centreX = async (page: Page, selector: string) => {
  const box = await page.locator(selector).first().boundingBox()
  return (box?.x ?? 0) + (box?.width ?? 0) / 2
}

test('the chart is one tab stop and Tab leaves it for the next control', async ({ page }) => {
  await open(page, PLAYGROUND)
  await page.keyboard.press('Tab')
  await expect(target(page)).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'After the chart' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(target(page)).toBeFocused()
})

test('arrow keys move the active point, its announced name and the readout', async ({ page }) => {
  await open(page, PLAYGROUND)
  await target(page).focus()
  expect(await announced(page)).toBeNull()

  await page.keyboard.press('ArrowRight')
  expect(await announced(page)).toBe('Alpha, 0, 10 rps')
  await expect(page.getByTestId('line-chart-readout')).toContainText('10 rps')

  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  expect(await announced(page)).toBe('Alpha, 2, no value: not-measured')

  await page.keyboard.press('ArrowDown')
  expect(await announced(page)).toBe('Beta, 2, 5 rps')
  await page.keyboard.press('End')
  await page.keyboard.press('ArrowRight')
  expect(await announced(page)).toBe('Beta, 3, 9 rps')
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowLeft')
  expect(await announced(page)).toBe('Beta, 0, 4 rps')

  await page.keyboard.press('Escape')
  expect(await announced(page)).toBeNull()
  await expect(page.getByTestId('line-chart-readout')).toHaveCount(0)
})

test('the browser exposes the active point as the active descendant', async ({ page }) => {
  await open(page, PLAYGROUND)
  await target(page).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - 'application "Requests: data points"':
      - img "Alpha, 0, 10 rps"
  `)
})

test('Enter and Space each press the active point once', async ({ page }) => {
  await open(page, PLAYGROUND)
  await target(page).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('press-count')).toHaveText('0')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('press-count')).toHaveText('1')
  await page.keyboard.press('Space')
  await expect(page.getByTestId('press-count')).toHaveText('2')
})

test('the readout arrow stays on the active point as it moves', async ({ page }) => {
  await open(page, PLAYGROUND)
  await target(page).focus()
  const arrowOffset = async () =>
    Math.abs(
      (await centreX(page, '[data-testid="line-chart-readout"] .border-4')) -
        (await centreX(page, '[data-testid="line-chart-crosshair"]'))
    )
  for (const key of ['ArrowRight', 'ArrowRight', 'End', 'ArrowDown']) {
    await page.keyboard.press(key)
    // The anchor has no height, so the readout is checked by count rather than visibility.
    await expect(page.getByTestId('line-chart-readout')).toHaveCount(1)
    // The readout fades in once, moving as it does; the poll outlasts that first entrance.
    await expect.poll(arrowOffset).toBeLessThan(1.5)
  }
})

test('the pointer activates the nearest point and leaving clears it', async ({ page }) => {
  await open(page, PLAYGROUND)
  const box = await target(page).boundingBox()
  await page.mouse.move(
    (box?.x ?? 0) + (box?.width ?? 0) - 2,
    (box?.y ?? 0) + (box?.height ?? 0) - 2
  )
  expect(await announced(page)).toBe('Beta, 3, 9 rps')
  await page.mouse.click(
    (box?.x ?? 0) + (box?.width ?? 0) - 2,
    (box?.y ?? 0) + (box?.height ?? 0) - 2
  )
  await expect(page.getByTestId('press-count')).toHaveText('1')
  await page.getByRole('button', { name: 'After the chart' }).hover()
  expect(await announced(page)).toBe('Beta, 3, 9 rps')
  await page.getByRole('button', { name: 'After the chart' }).focus()
  await page.mouse.move((box?.x ?? 0) + 2, (box?.y ?? 0) + 2)
  expect(await announced(page)).toBe('Alpha, 0, 10 rps')
  await page.getByRole('button', { name: 'After the chart' }).hover()
  expect(await announced(page)).toBeNull()
})

test('the entrance draws the line, and reduced motion paints the final frame at once', async ({
  page,
}) => {
  const dashOffsets = () =>
    page
      .locator('[data-testid="line-chart-path"]')
      .evaluateAll((paths) => paths.map((path) => (path as SVGPathElement).style.strokeDashoffset))

  await open(page, ANIMATED)
  await expect.poll(dashOffsets).toEqual(['0', '0'])

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, ANIMATED)
  expect(await dashOffsets()).toEqual(['', ''])
})
