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
    .filter((e) => e.type === 'story' && INTERACTIONS.test(e.id) && e.tags?.includes('play'))
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

/** Distance between a slide's centre and the viewport's, in px. */
async function slideCentre(page: Page, name: string): Promise<number> {
  const scroller = await page.getByTestId('carousel-viewport').first().boundingBox()
  const slide = await page.getByTestId(`carousel-slide-${name}`).boundingBox()
  const centre = (box: { x: number; width: number } | null) => (box?.x ?? 0) + (box?.width ?? 0) / 2
  return Math.abs(centre(slide) - centre(scroller))
}

test('an arrow press glides to the next card, and jumps under reduced motion', async ({ page }) => {
  await openDefault(page)
  await page.getByRole('button', { name: 'Next slide' }).click()
  expect(await slideCentre(page, 'Back squat')).toBeGreaterThan(2)
  await expect.poll(() => slideCentre(page, 'Back squat')).toBeLessThan(2)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openDefault(page)
  await page.getByRole('button', { name: 'Next slide' }).click()
  await page.evaluate(() => new Promise(requestAnimationFrame))
  expect(await slideCentre(page, 'Back squat')).toBeLessThan(2)
})

test('a width change keeps the same card at the leading edge', async ({ page }) => {
  await openDefault(page)
  for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: 'Next slide' }).click()
  await expect.poll(() => slideCentre(page, 'Cable overhead tricep extension')).toBeLessThan(2)

  await page.setViewportSize({ width: 340, height: 844 })
  await expect.poll(() => slideCentre(page, 'Cable overhead tricep extension')).toBeLessThan(2)
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
  await expect.poll(() => slideCentre(page, 'Romanian deadlift')).toBeLessThan(1)
})

const DRAG_STORY = 'components-molecules-carousel-interactions--drag-playground'
const LOOP_STORY = 'components-molecules-carousel-interactions--drag-playground-looping'
const CONTROLLED_STORY = 'components-molecules-carousel-interactions--controlled-ignoring-changes'

/** Count the carousel's 150 ms settle timers, so a leak at rest shows. */
async function countSettleTimers(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __settleTimers: number; setTimeout: typeof setTimeout }
    w.__settleTimers = 0
    const original = window.setTimeout.bind(window)
    w.setTimeout = ((handler: TimerHandler, ms?: number, ...rest: unknown[]) => {
      if (ms === 150) w.__settleTimers += 1
      return original(handler, ms, ...rest)
    }) as typeof setTimeout
  })
}

const settleTimers = (page: Page) =>
  page.evaluate(() => (window as unknown as { __settleTimers: number }).__settleTimers)

/** The counter's number and the name of the centred real slide agree. */
async function centredMatchesCounter(page: Page) {
  return page.evaluate(() => {
    const view = document.querySelector('[data-testid=carousel-viewport]') as HTMLElement
    const vb = view.getBoundingClientRect()
    const centre = (vb.left + vb.right) / 2
    const slides = [
      ...document.querySelectorAll('[data-testid^="carousel-slide-"]'),
    ] as HTMLElement[]
    const centred = slides.find((el) => {
      const b = el.getBoundingClientRect()
      return Math.abs((b.left + b.right) / 2 - centre) < 1.5
    })
    const counter = document.querySelector('[data-testid=carousel-position]')?.textContent ?? ''
    const name = centred?.getAttribute('aria-label') ?? ''
    return { counter, name, agree: name.startsWith(`${counter}:`) }
  })
}

async function openDragStory(page: Page, id: string = DRAG_STORY) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('carousel-position')).toBeVisible()
  await page.waitForTimeout(500)
}

/** A mouse drag across the cards, in `steps` moves over `ms`, so the speed is deliberate. */
async function drag(page: Page, dx: number, dy: number, ms: number, steps = 20) {
  const box = await page.getByTestId('carousel-viewport').first().boundingBox()
  const x = (box?.x ?? 0) + (box?.width ?? 0) / 2
  const y = (box?.y ?? 0) + 30
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(x + (dx * i) / steps, y + (dy * i) / steps)
    await page.waitForTimeout(ms / steps)
  }
  await page.mouse.up()
}

test('a quick flick of the mouse moves exactly one card', async ({ page }) => {
  await openDragStory(page)
  await drag(page, -150, 0, 0, 3)
  await expect(page.getByTestId('carousel-position')).toHaveText('2 of 9')
  await expect.poll(() => slideCentre(page, 'Back squat')).toBeLessThan(1)
})

test('a slow drag lands on the card it was left nearest', async ({ page }) => {
  await openDragStory(page)
  await drag(page, -560, 0, 900)
  await expect(page.getByTestId('carousel-position')).toHaveText('3 of 9')
  await expect.poll(() => slideCentre(page, 'Romanian deadlift')).toBeLessThan(1)
})

test('a vertical drag scrolls the page and leaves the carousel where it was', async ({ page }) => {
  await page.goto(`/iframe.html?id=pages-goals-carousel--default&viewMode=story`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
  const before = await page
    .getByTestId('carousel-viewport')
    .first()
    .evaluate((el) => el.scrollLeft)
  await drag(page, 0, -300, 300)
  const after = await page
    .getByTestId('carousel-viewport')
    .first()
    .evaluate((el) => el.scrollLeft)
  expect(after).toBe(before)
})

test('dragging off a card does not press it, and a plain click still does', async ({ page }) => {
  await openDragStory(page)
  const button = page.getByRole('button', { name: 'Open Bench press' })
  const box = await button.boundingBox()
  await page.mouse.move((box?.x ?? 0) + 10, (box?.y ?? 0) + 10)
  await page.mouse.down()
  for (let i = 1; i <= 5; i += 1)
    await page.mouse.move((box?.x ?? 0) + 10 - i * 24, (box?.y ?? 0) + 10)
  await page.mouse.up()
  await expect(page.getByTestId('press-count')).toHaveText('0')

  await page.getByRole('button', { name: 'Open Back squat' }).click()
  await expect(page.getByTestId('press-count')).toHaveText('1')
})

test('each arrow keeps a 44 px hit target', async ({ page }) => {
  await openDefault(page)
  for (const name of ['Previous slide', 'Next slide']) {
    const box = await page.getByRole('button', { name }).boundingBox()
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  }
})

test('a flick jumps instead of gliding under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openDragStory(page)
  await drag(page, -150, 0, 0, 3)
  await page.evaluate(() => new Promise(requestAnimationFrame))
  expect(await slideCentre(page, 'Back squat')).toBeLessThan(1)
  await expect(page.getByTestId('carousel-position')).toHaveText('2 of 9')
})

test('a flick back from the first card wraps to the last', async ({ page }) => {
  await openDragStory(page, LOOP_STORY)
  await expect(page.getByTestId('carousel-position')).toHaveText('1 of 9')
  await drag(page, 150, 0, 0, 3)
  await expect(page.getByTestId('carousel-position')).toHaveText('9 of 9')
  await expect.poll(() => slideCentre(page, 'Cable chest press')).toBeLessThan(2)
})

test('the wrap is a jump under reduced motion, and still one card', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openDragStory(page, LOOP_STORY)
  await page.getByRole('button', { name: 'Previous slide' }).click()
  await expect(page.getByTestId('carousel-position')).toHaveText('9 of 9')
  await expect.poll(() => slideCentre(page, 'Cable chest press')).toBeLessThan(2)
})

test('neither arrow is ever disabled while it loops', async ({ page }) => {
  await openDragStory(page, LOOP_STORY)
  for (const name of ['Previous slide', 'Next slide']) {
    await expect(page.getByRole('button', { name })).not.toHaveAttribute('aria-disabled', 'true')
  }
})

test('the copies at each end are hidden from assistive technology and unfocusable', async ({
  page,
}) => {
  await openDragStory(page, LOOP_STORY)
  const clones = page.locator('[data-testid^="carousel-clone-"]')
  await expect(clones).toHaveCount(2)
  for (const clone of await clones.all()) {
    await expect(clone).toHaveAttribute('aria-hidden', 'true')
    expect(await clone.evaluate((el) => (el as HTMLElement & { inert: boolean }).inert)).toBe(true)
  }
  await expect(page.getByRole('group')).toHaveCount(9)
})

test('Tab walks the real cards in order and never lands in a copy', async ({ page }) => {
  await openDragStory(page, LOOP_STORY)
  await page.getByRole('button', { name: 'Drop first card' }).focus()
  // The arrows come first in the tab order (owner, S7), then the cards.
  for (const name of ['Previous slide', 'Next slide']) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe(name)
  }
  const expected = ['Bench press', 'Back squat', 'Romanian deadlift']
  for (const name of expected) {
    await page.keyboard.press('Tab')
    const focus = await page.evaluate(() => {
      const active = document.activeElement
      return {
        text: active?.textContent ?? '',
        inCopy: active?.closest('[data-testid^="carousel-clone-"]') !== null,
      }
    })
    expect(focus.inCopy).toBe(false)
    expect(focus.text).toBe(`Open ${name}`)
  }
  await expect(page.getByTestId('carousel-position')).toHaveText('3 of 9')
  await expect.poll(() => slideCentre(page, 'Romanian deadlift')).toBeLessThan(2)
})

test('dropping a card mid-wrap leaves the counter and the centred card agreeing, with no timer left running', async ({
  page,
}) => {
  await countSettleTimers(page)
  await openDragStory(page, LOOP_STORY)
  await page.getByRole('button', { name: 'Previous slide' }).click()
  await page.waitForTimeout(80)
  await page.getByRole('button', { name: 'Drop first card' }).click()
  await page.waitForTimeout(1500)
  const state = await centredMatchesCounter(page)
  expect(state.agree, JSON.stringify(state)).toBe(true)
  expect(state.counter).toBe('8 of 8')
  const before = await settleTimers(page)
  await page.waitForTimeout(1000)
  expect(await settleTimers(page)).toBe(before)
})

test('a width change mid-wrap still lands centred on the card it committed', async ({ page }) => {
  await countSettleTimers(page)
  await openDragStory(page, LOOP_STORY)
  await page.getByRole('button', { name: 'Previous slide' }).click()
  await page.waitForTimeout(80)
  await page.setViewportSize({ width: 340, height: 844 })
  await page.waitForTimeout(1500)
  const state = await centredMatchesCounter(page)
  expect(state.agree, JSON.stringify(state)).toBe(true)
  expect(state.counter).toBe('9 of 9')
  const before = await settleTimers(page)
  await page.waitForTimeout(1000)
  expect(await settleTimers(page)).toBe(before)
})

test('a wheel that takes over a wrap glide ends with the counter naming the centred card', async ({
  page,
}) => {
  await openDragStory(page, LOOP_STORY)
  const box = await page.getByTestId('carousel-viewport').boundingBox()
  await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 20)
  await page.getByRole('button', { name: 'Previous slide' }).click()
  await page.waitForTimeout(60)
  await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 20)
  await page.mouse.wheel(700, 0)
  await page.waitForTimeout(1500)
  const state = await centredMatchesCounter(page)
  expect(state.agree, JSON.stringify(state)).toBe(true)
})

test('three quick presses back across the wrap land three cards back', async ({ page }) => {
  await openDragStory(page, LOOP_STORY)
  for (let i = 0; i < 3; i += 1) {
    await page.getByRole('button', { name: 'Previous slide' }).click()
    await page.waitForTimeout(200)
  }
  await expect(page.getByTestId('carousel-position')).toHaveText('7 of 9')
  await expect.poll(() => slideCentre(page, 'Incline dumbbell press')).toBeLessThan(2)
})

test('a controlled carousel whose owner declines a swipe returns to its value', async ({
  page,
}) => {
  await page.goto(`/iframe.html?id=${CONTROLLED_STORY}&viewMode=story`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('carousel-position')).toBeVisible()
  await page.waitForTimeout(500)
  const box = await page.getByTestId('carousel-viewport').boundingBox()
  await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 20)
  await page.mouse.wheel(700, 0)
  await page.waitForTimeout(1500)
  await expect(page.getByTestId('carousel-position')).toHaveText('1 of 9')
  await expect.poll(() => slideCentre(page, 'Bench press')).toBeLessThan(2)
})

test('without a loop, focus stays on an arrow after the last press disables it', async ({
  page,
}) => {
  await openDragStory(page)
  await page.getByRole('button', { name: 'Next slide' }).focus()
  for (let i = 0; i < 8; i += 1) await page.keyboard.press('Enter')
  await expect(page.getByTestId('carousel-position')).toHaveText('9 of 9')
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
  expect(focused).toBe('Previous slide')
})

test('axe in a real browser finds no unfocusable scroll region', async ({ page }) => {
  // axe-core arrives through jest-axe; resolve it from there rather than add a dependency.
  const axePath = require.resolve('axe-core/axe.min.js', { paths: [require.resolve('jest-axe')] })
  for (const id of ['components-molecules-carousel--default', 'pages-goals-carousel--default']) {
    await page.goto(`/iframe.html?id=${id}&viewMode=story`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await page.addScriptTag({ path: axePath })
    const violations = await page.evaluate(async () => {
      const axe = (
        window as unknown as {
          axe: { run: (o: object) => Promise<{ violations: { id: string }[] }> }
        }
      ).axe
      const result = await axe.run({ runOnly: ['scrollable-region-focusable'] })
      return result.violations.map((v) => v.id)
    })
    expect(violations, id).toEqual([])
  }
})

test('Tab reaches both arrows before the first card, while they are still drawn below the cards', async ({
  page,
}) => {
  await openDragStory(page, LOOP_STORY)
  await page.getByRole('button', { name: 'Drop first card' }).focus()
  const stops: string[] = []
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Tab')
    stops.push(
      await page.evaluate(
        () =>
          document.activeElement?.getAttribute('aria-label') ??
          document.activeElement?.textContent ??
          ''
      )
    )
  }
  expect(stops).toEqual(['Previous slide', 'Next slide', 'Open Bench press'])
  const arrow = await page.getByTestId('carousel-previous').boundingBox()
  const cards = await page.getByTestId('carousel-viewport').boundingBox()
  expect(arrow?.y ?? 0).toBeGreaterThanOrEqual((cards?.y ?? 0) + (cards?.height ?? 0) - 1)
})

test('a scroller that takes a Tab stop has a role and a name; one with focusable cards does not', async ({
  page,
}) => {
  await openDefault(page)
  const bare = page.getByTestId('carousel-viewport')
  await expect(bare).toHaveAttribute('tabindex', '0')
  await expect(bare).toHaveAttribute('role', 'group')
  await expect(bare).toHaveAttribute('aria-label', 'Per-lift cards')

  await openDragStory(page, LOOP_STORY)
  const withButtons = page.getByTestId('carousel-viewport')
  await expect(withButtons).not.toHaveAttribute('tabindex', '0')
  await expect(withButtons).not.toHaveAttribute('role', 'group')
})
