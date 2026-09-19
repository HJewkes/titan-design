import { test, expect, type Page } from '@playwright/test'

interface IndexEntry {
  id: string
  type: string
  tags?: string[]
}

const INTERACTIONS = /^components-molecules-carousel-interactions--/
const DEFAULT_STORY = 'components-molecules-carousel--default'

async function interactionStories(page: Page): Promise<string[]> {
  const response = await page.request.get('/index.json')
  const index = (await response.json()) as { entries: Record<string, IndexEntry> }
  return Object.values(index.entries)
    .filter((e) => e.type === 'story' && INTERACTIONS.test(e.id) && e.tags?.includes('interaction'))
    .map((e) => e.id)
}

test('every carousel play function passes in a real browser', async ({ page }) => {
  const ids = await interactionStories(page)
  expect(ids.length).toBeGreaterThanOrEqual(7)
  for (const id of ids) {
    await page.goto(`/iframe.html?id=${id}&viewMode=story`)
    await page.waitForLoadState('networkidle')
    const body = page.locator('body[data-play-status="passed"], body[data-play-status="failed"]')
    await body.waitFor({ timeout: 20_000 })
    const status = await page.locator('body').getAttribute('data-play-status')
    const error = await page.locator('body').getAttribute('data-play-error')
    expect(`${id}: ${status ?? 'none'}${error ? ` (${error})` : ''}`).toBe(`${id}: passed`)
  }
})

async function openDefault(page: Page) {
  await page.goto(`/iframe.html?id=${DEFAULT_STORY}&viewMode=story`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('carousel-position')).toBeVisible()
  await page.waitForTimeout(500)
}

/** Distance of a slide's leading edge from the viewport's, in px. */
async function slideOffset(page: Page, name: string): Promise<number> {
  const scroller = await page.getByTestId('carousel-viewport').boundingBox()
  const slide = await page.getByTestId(`carousel-slide-${name}`).boundingBox()
  return Math.abs((slide?.x ?? 0) - (scroller?.x ?? 0))
}

test('an arrow press glides to the next card, and jumps under reduced motion', async ({ page }) => {
  await openDefault(page)
  await page.getByRole('button', { name: 'Next slide' }).click()
  expect(await slideOffset(page, 'Back squat')).toBeGreaterThan(2)
  await expect.poll(() => slideOffset(page, 'Back squat')).toBeLessThan(2)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openDefault(page)
  await page.getByRole('button', { name: 'Next slide' }).click()
  await page.evaluate(() => new Promise(requestAnimationFrame))
  expect(await slideOffset(page, 'Back squat')).toBeLessThan(2)
})

test('a width change keeps the same card at the leading edge', async ({ page }) => {
  await openDefault(page)
  for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: 'Next slide' }).click()
  await expect.poll(() => slideOffset(page, 'Cable overhead tricep extension')).toBeLessThan(2)

  await page.setViewportSize({ width: 340, height: 844 })
  await expect.poll(() => slideOffset(page, 'Cable overhead tricep extension')).toBeLessThan(2)
  await expect(page.getByTestId('carousel-position')).toHaveText('4 of 9')
})

test('a swipe past the last card cannot trigger browser back-navigation', async ({ page }) => {
  await openDefault(page)
  const overscroll = await page
    .getByTestId('carousel-viewport')
    .evaluate((el) => getComputedStyle(el).overscrollBehaviorX)
  expect(overscroll).toBe('contain')
})

test('a real horizontal swipe snaps to a card and commits it', async ({ page }) => {
  await openDefault(page)
  const box = await page.getByTestId('carousel-viewport').boundingBox()
  await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 20)
  await page.mouse.wheel(700, 0)
  await expect(page.getByTestId('carousel-position')).toHaveText('3 of 9')
  await expect.poll(() => slideOffset(page, 'Romanian deadlift')).toBeLessThan(1)
})
