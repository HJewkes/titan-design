import fs from 'node:fs'
import type { Page } from '@playwright/test'
import { blankRenderReason, type RootMetrics } from '../../src/test/blank-render'
import { STORY_INDEX_ENV } from './story-index.global-setup'

/**
 * The story-render routine the Playwright specs share: a page whose clock is installed and paused
 * at a fixed instant, the story URL with its settling arguments, and the blank-render guard.
 *
 * `contrast.spec.ts` uses it today. `stories.spec.ts` carries its own copy until the per-worker
 * page rewrite (TD-730, PR #724) lands; moving it onto this module is that PR's follow-up.
 */

export const FIXED_TIME = new Date('2024-01-01T16:12:07')
// Far more than any install-to-pauseAt delay, so pauseAt only ever moves forward.
export const CLOCK_START = new Date(FIXED_TIME.getTime() - 60_000)

export type StoryTheme = 'dark' | 'light'

interface IndexEntry {
  id: string
  type: string
}

/** Every story id in the index `story-index.global-setup.ts` wrote; empty when it did not run. */
export function readStoryIds(): string[] {
  const file = process.env[STORY_INDEX_ENV]
  if (!file) return []
  const index = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    entries: Record<string, IndexEntry>
  }
  return Object.values(index.entries)
    .filter((entry) => entry.type === 'story')
    .map((entry) => entry.id)
}

// GoalTrajectoryChart plays an entrance that the paused clock freezes at frame 0, so its
// baselines would show the band with no actuals; `animate` off renders the settled final frame.
const SETTLED_ARGS_PREFIX = 'custom-workout-dataviz-goaltrajectorychart--'

// StrengthTrendChart's 600 ms mount draw also freezes at frame 0, and its Interactive story
// renders without args, so this prefix runs the paused clock past the draw instead.
const SETTLED_CLOCK_PREFIX = 'custom-workout-dataviz-strengthtrendchart--'
const SETTLE_MS = 1000

export function storyUrl(id: string, theme: StoryTheme = 'dark'): string {
  const args = id.startsWith(SETTLED_ARGS_PREFIX) ? '&args=animate:!false' : ''
  const globals = theme === 'light' ? '&globals=theme:light' : ''
  return `/iframe.html?id=${id}&viewMode=story${args}${globals}`
}

interface InjectedClock {
  __pwClock?: { controller: { pauseAt(time: number): Promise<number> } }
}

// Playwright 1.58 arms a one-shot real-time timer when it injects the clock into a new document,
// and replaying `pauseAt` there does not cancel it. About 100 ms after load it fires every timer
// already queued, so a fast load ran react-native-web's onLayout measurement and a slow one did not
// (TD-729). Pausing again at document start cancels it, so no timer fires before the screenshot.
function repauseClock(time: number) {
  void (globalThis as InjectedClock).__pwClock?.controller.pauseAt(time)
}

/** Installs the clock paused at `FIXED_TIME` on a page that has not navigated yet. */
export async function installPausedClock(page: Page): Promise<void> {
  // install() alone keeps ticking from FIXED_TIME in real time, so a story
  // rendered late in the run showed 16:13 instead of 16:12 (#250); it starts early so pauseAt never rewinds.
  await page.clock.install({ time: CLOCK_START })
  await page.clock.pauseAt(FIXED_TIME)
  await page.addInitScript(repauseClock, FIXED_TIME.getTime())
}

export async function readRootMetrics(page: Page): Promise<RootMetrics | null> {
  return page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    if (!root) return null
    const { width, height } = root.getBoundingClientRect()
    return { width, height, childElementCount: root.childElementCount }
  })
}

/** Why the root is still blank after `timeout`, or null once it rendered. */
export async function blankAfter(page: Page, timeout = 5000): Promise<string | null> {
  const end = Date.now() + timeout
  let reason = blankRenderReason(await readRootMetrics(page))
  while (reason && Date.now() < end) {
    await page.waitForTimeout(100)
    reason = blankRenderReason(await readRootMetrics(page))
  }
  return reason
}

/**
 * Navigates a clock-paused page to the story, waits for fonts and the network, then settles the
 * stories that need the clock run forward. Returns the blank-render reason, or null when it rendered
 * within `renderTimeout`.
 */
export async function loadStory(
  page: Page,
  id: string,
  theme: StoryTheme = 'dark',
  renderTimeout = 5000
): Promise<string | null> {
  await page.goto(storyUrl(id, theme))
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  const blank = await blankAfter(page, renderTimeout)
  if (id.startsWith(SETTLED_CLOCK_PREFIX)) await page.clock.runFor(SETTLE_MS)
  return blank
}
