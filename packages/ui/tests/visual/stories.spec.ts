import fs from 'node:fs'
import { test as base, expect, type Browser, type Page, type TestInfo } from '@playwright/test'
import { blankRenderReason, type RootMetrics } from '../../src/test/blank-render'
import { STORY_INDEX_ENV } from './story-index.global-setup'

/**
 * Storybook story visual-regression baselines.
 *
 * Declares one test per in-scope story from the Storybook index that
 * `story-index.global-setup.ts` fetches, and screenshots each story's rendered
 * root against a committed baseline (`toHaveScreenshot`). Every story first
 * passes a blank-render guard. CI runs it as `test:visual:stories` in the `visual`
 * job (`.github/workflows/ci.yml`). `src/test/visual-coverage.test.ts` fails when a
 * story under a required prefix has no committed baseline.
 *
 * Determinism: the clock is installed AND paused at a fixed instant (so
 * `DateTime live` clocks render a fixed time however long the run takes) and CSS
 * animations are disabled (pulse / ping), so control-driven, animated stories
 * snapshot stably.
 *
 * Scope: the shell family + the icon foundation story (`Foundations/Icons`,
 * whose Storybook id is `foundations-icons--*`), MesoProgressBar, every
 * VelocityStrip title (`custom-workout-dataviz-velocitystrip*`, including its
 * Expanded, Hero, Dual and Compact sheets), DualVelocityStrip, MesoCard,
 * SegmentedBar, GoalTrajectoryChart, StrengthTrendChart and the Active Workout,
 * Exercise Detail, Program Planning and Training Status pages, every
 * `Custom/ActiveWork` story, plus the Chat stories named in `CHAT_STORIES`.
 * Widen `SCOPE` to cover more of the library as baselines are seeded.
 *
 * Baselines must be generated in the pinned Playwright Linux container
 * (`mcr.microsoft.com/playwright:v1.58.2-noble`) so the committed PNGs are
 * byte-identical to CI: download the `storybook-visual-baselines` artifact
 * that the `visual` job's refresh step uploads on a failed run and commit the
 * changed PNGs. A local `pnpm test:visual:stories:update` writes darwin PNGs
 * that are gitignored and never gate.
 */

const SCOPE =
  /^(shell-|foundations-icons--|custom-workout-mesoprogressbar--|custom-workout-dataviz-velocitystrip|custom-workout-dataviz-dualvelocitystrip--|custom-workout-mesocard--|custom-workout-segmentedbar--|custom-workout-dataviz-goaltrajectorychart--|custom-workout-dataviz-strengthtrendchart--|pages-active-workout--|pages-exercise-detail--|pages-program-planning--|pages-training-status--|custom-activework-)/

// The owner-locked Chat design (VW-393), listed by id so the interactive stories stay out.
const CHAT_STORIES = new Set([
  'custom-chat-coachpreset--phone',
  'custom-chat-coachpreset--wall-drawer',
  'custom-chat-messagelist--direct',
  'custom-chat-messagelist--group',
  'custom-chat-messagelist--endorsed',
  'custom-chat-messagelist--revealed-times',
  'custom-chat-messagelist--windowed',
  'custom-chat-composer--typed',
])

const inScope = (id: string) => SCOPE.test(id) || CHAT_STORIES.has(id)

const FIXED_TIME = new Date('2024-01-01T16:12:07')
// Far more than any install-to-pauseAt delay, so pauseAt only ever moves forward.
const CLOCK_START = new Date(FIXED_TIME.getTime() - 60_000)
const SHOT_OPTIONS = { animations: 'disabled', caret: 'hide' } as const

interface IndexEntry {
  id: string
  type: string
}

// Read at collect time; empty when globalSetup did not run, which the first test reports.
function readInScopeStoryIds(): string[] {
  const file = process.env[STORY_INDEX_ENV]
  if (!file) return []
  const index = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    entries: Record<string, IndexEntry>
  }
  return Object.values(index.entries)
    .filter((entry) => entry.type === 'story' && inScope(entry.id))
    .map((entry) => entry.id)
}

const storyIds = readInScopeStoryIds()

async function readRootMetrics(page: Page): Promise<RootMetrics | null> {
  return page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    if (!root) return null
    const { width, height } = root.getBoundingClientRect()
    return { width, height, childElementCount: root.childElementCount }
  })
}

// A stale-cache blank story must fail here rather than be frozen as its own baseline.
async function expectRendered(page: Page, label: string, timeout = 5000) {
  await expect
    .poll(async () => blankRenderReason(await readRootMetrics(page)), {
      message: `blank render guard for ${label}`,
      timeout,
    })
    .toBeNull()
}

// GoalTrajectoryChart plays an entrance that the paused clock freezes at frame 0, so its
// baselines would show the band with no actuals; `animate` off renders the settled final frame.
const SETTLED_ARGS_PREFIX = 'custom-workout-dataviz-goaltrajectorychart--'
const storyUrl = (id: string) =>
  `/iframe.html?id=${id}&viewMode=story${id.startsWith(SETTLED_ARGS_PREFIX) ? '&args=animate:!false' : ''}`

// StrengthTrendChart's 600 ms mount draw also freezes at frame 0, and its Interactive story
// renders without args, so this prefix runs the paused clock past the draw instead.
const SETTLED_CLOCK_PREFIX = 'custom-workout-dataviz-strengthtrendchart--'
const SETTLE_MS = 1000

// A blank root says nothing about why, so a failed guard reports what the page logged and what its
// root and body held at that moment (TD-636: a zero-height root with no trace to explain it).
const pageEvents = new WeakMap<Page, string[]>()

function recordPageEvents(page: Page): void {
  const events: string[] = []
  pageEvents.set(page, events)
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning')
      events.push(`console.${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', (e) => events.push(`pageerror: ${e.message}`))
  page.on('requestfailed', (r) =>
    events.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`)
  )
  page.on('response', (r) => {
    if (r.status() >= 400) events.push(`http ${r.status()}: ${r.url()}`)
  })
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) events.push(`navigated: ${f.url()}`)
  })
}

async function describeBlankPage(page: Page, events: string[]): Promise<string> {
  const state = await page
    .evaluate(() => ({
      bodyClass: document.body.className,
      root: document.querySelector('#storybook-root')?.outerHTML.slice(0, 1500) ?? null,
      errorDisplay: document.querySelector('#error-message')?.textContent?.slice(0, 500) ?? null,
    }))
    .catch((e: Error) => ({ evaluateFailed: e.message }))
  return JSON.stringify({ state, events }, null, 2)
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

const VIEWPORT = { width: 1280, height: 720 }

// install() alone keeps ticking from FIXED_TIME in real time, so a story rendered late in the run
// showed 16:13 instead of 16:12 (#250); it starts early so pauseAt never rewinds.
async function openClockedPage(browser: Browser) {
  const context = await browser.newContext({ viewport: VIEWPORT })
  await context.clock.install({ time: CLOCK_START })
  await context.addInitScript(repauseClock, FIXED_TIME.getTime())
  const page = await context.newPage()
  recordPageEvents(page)
  return { context, page }
}

// One context and page per worker: a story is a navigation inside it, so the preview loads once a
// worker instead of once a story (TD-730). The clock cannot rewind, so a story that advances it
// (SETTLED_CLOCK_PREFIX) takes a page of its own via `isolatedPage` and never reaches this one.
const test = base.extend<{ isolatedPage: () => Promise<Page> }, { storyPage: Page }>({
  storyPage: [
    async ({ browser }, use) => {
      const { context, page } = await openClockedPage(browser)
      await use(page)
      await context.close()
    },
    { scope: 'worker' },
  ],
  isolatedPage: async ({ browser }, use) => {
    const contexts: Array<Awaited<ReturnType<typeof openClockedPage>>['context']> = []
    await use(async () => {
      const opened = await openClockedPage(browser)
      contexts.push(opened.context)
      return opened.page
    })
    await Promise.all(contexts.map((context) => context.close()))
  },
})

const advancesClock = (id: string) => id.startsWith(SETTLED_CLOCK_PREFIX)

async function renderStory(page: Page, id: string) {
  const events = pageEvents.get(page) ?? []
  events.length = 0
  await page.clock.pauseAt(FIXED_TIME)
  await page.goto(storyUrl(id))
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await expectRendered(page, id).catch(async (e: Error) => {
    e.message += `\nblank page state: ${await describeBlankPage(page, events)}`
    throw e
  })
  if (advancesClock(id)) await page.clock.runFor(SETTLE_MS)
  return page.locator('#storybook-root')
}

test('the story index lists every in-scope story', () => {
  expect(process.env[STORY_INDEX_ENV], 'globalSetup wrote the story index').toBeTruthy()
  expect(storyIds.length, 'in-scope stories were found').toBeGreaterThan(0)
  const chatIds = storyIds.filter((id) => CHAT_STORIES.has(id))
  expect(chatIds.sort(), 'every listed Chat story exists').toEqual([...CHAT_STORIES].sort())
})

test.describe('storybook story baselines', () => {
  for (const id of storyIds) {
    test(id, async ({ storyPage, isolatedPage }) => {
      const page = advancesClock(id) ? await isolatedPage() : storyPage
      const root = await renderStory(page, id)
      await expect(root, `visual drift for ${id}`).toHaveScreenshot(`${id}.png`, SHOT_OPTIONS)
    })
  }
})

const BLANK_FIXTURES = {
  'an empty root': '<div id="storybook-root"></div>',
  'a zero-size root': '<div id="storybook-root" style="height: 0; overflow: hidden"><p>x</p></div>',
}

test.describe('blank render guard', () => {
  for (const [name, html] of Object.entries(BLANK_FIXTURES)) {
    test(`fails ${name}`, async ({ page }) => {
      await page.setContent(html)
      const error = await expectRendered(page, name, 500).then(
        () => null,
        (e: Error) => e
      )
      expect(error?.message, `${name} must fail the guard`).toContain('blank render guard')
    })
  }

  test('passes a root with rendered content', async ({ page }) => {
    await page.setContent('<div id="storybook-root"><p>rendered</p></div>')
    await expectRendered(page, 'a rendered root', 500)
  })
})

/**
 * Sensitivity proof for the 0.02 threshold (TD-3 S1). PR #178 changed
 * MesoProgressBar's track alphas and every gate passed under the default 0.2.
 * These tests override the upcoming track token `--color-hairline-subtle`
 * (rgba 255/255/255 at 0.10) on the story root and assert that the committed
 * baseline rejects the render with a pixel diff. 0.50 is the #178-sized change;
 * 0.13 pins the threshold floor. They live in this file to share its snapshots.
 */
const SENSITIVITY_STORY = 'custom-workout-mesoprogressbar--default'
const SENSITIVITY_BASELINE = `${SENSITIVITY_STORY}.png`

function guardSensitivityBaseline(testInfo: TestInfo) {
  test.skip(process.platform !== 'linux', 'baselines exist only as *-chromium-linux.png')
  const update = testInfo.config.updateSnapshots
  test.skip(
    update === 'all' || update === 'changed',
    'a mutated render must never be written over the baseline'
  )
  const baseline = testInfo.snapshotPath(SENSITIVITY_BASELINE)
  expect(fs.existsSync(baseline), `baseline ${baseline} must exist`).toBe(true)
}

async function renderSensitivityStory(page: Page, testInfo: TestInfo) {
  guardSensitivityBaseline(testInfo)
  return renderStory(page, SENSITIVITY_STORY)
}

test('sensitivity: unmutated MesoProgressBar matches its baseline', async ({ storyPage }, testInfo) => {
  const root = await renderSensitivityStory(storyPage, testInfo)
  await expect(root).toHaveScreenshot(SENSITIVITY_BASELINE, SHOT_OPTIONS)
  console.log('[sensitivity] unmutated 0.10: matches baseline')
})

for (const alpha of ['0.50', '0.13']) {
  test(`sensitivity: hairline-subtle track 0.10 to ${alpha} fails the gate`, async ({
    storyPage,
  }, testInfo) => {
    const root = await renderSensitivityStory(storyPage, testInfo)
    await root.evaluate((el, value) => {
      el.style.setProperty('--color-hairline-subtle', value)
    }, `rgba(255, 255, 255, ${alpha})`)

    const error = await expect(root)
      .toHaveScreenshot(SENSITIVITY_BASELINE, { ...SHOT_OPTIONS, timeout: 3000 })
      .then(
        () => null,
        (e: Error) => e
      )

    // Any other error (a bad path, a timeout) would make the rejection vacuous.
    const diffLine = error?.message.split('\n').find((line) => /pixels \(ratio/.test(line))
    expect(diffLine, `a 0.10 to ${alpha} track change must fail with a pixel diff`).toBeDefined()
    console.log(`[sensitivity] 0.10 -> ${alpha}: ${diffLine?.trim()}`)
  })
}
