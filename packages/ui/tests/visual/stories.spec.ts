import fs from 'node:fs'
import { test as base, expect, type Browser, type Page, type TestInfo } from '@playwright/test'
import {
  FIXED_TIME,
  advancesClock,
  blankAfter,
  installPausedClock,
  loadStory,
  readStoryIds,
} from './render-story'

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
 * `Custom/ActiveWork` story, MediaThumb and MediaThumbBadge, plus the Chat stories named in `CHAT_STORIES`.
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
  /^(shell-|foundations-icons--|custom-workout-mesoprogressbar--|custom-workout-dataviz-velocitystrip|custom-workout-dataviz-dualvelocitystrip--|custom-workout-mesocard--|custom-workout-segmentedbar--|custom-workout-dataviz-goaltrajectorychart--|custom-workout-dataviz-strengthtrendchart--|pages-active-workout--|pages-exercise-detail--|pages-program-planning--|pages-training-status--|custom-activework-|components-molecules-mediathumb--|components-atoms-mediathumbbadge--)/

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

const SHOT_OPTIONS = { animations: 'disabled', caret: 'hide' } as const

// Empty when globalSetup did not run, which the first test reports.
const storyIds = readStoryIds().filter(inScope)

// A stale-cache blank story must fail here rather than be frozen as its own baseline.
async function expectRendered(page: Page, label: string, timeout = 5000) {
  expect(await blankAfter(page, timeout), `blank render guard for ${label}`).toBeNull()
}

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

const VIEWPORT = { width: 1280, height: 720 }

// install() alone keeps ticking from FIXED_TIME in real time, so a story rendered late in the run
// showed 16:13 instead of 16:12 (#250); it starts early so pauseAt never rewinds.
async function openClockedPage(browser: Browser) {
  const context = await browser.newContext({ viewport: VIEWPORT })
  const page = await context.newPage()
  await installPausedClock(page)
  recordPageEvents(page)
  return { context, page }
}

// One context and page per worker: a story is a navigation inside it, so the preview loads once a
// worker instead of once a story (TD-730). The clock cannot rewind, so a story that advances it
// (SETTLED_CLOCK_PREFIX, COLD_PAGE_PREFIXES) takes a page of its own via `isolatedPage`.
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

// The VelocityStrip family draws its SVG labels differently on a page that already loaded another
// story (13 baselines drifted by a few hundred pixels, same Chromium, same machine), so each takes a
// cold page like the pre-TD-730 runs did. The cause is retained browser state; it is not pinned down.
const COLD_PAGE_PREFIXES = [
  'custom-workout-dataviz-velocitystrip',
  'custom-workout-dataviz-dualvelocitystrip--',
]
const needsOwnPage = (id: string) =>
  advancesClock(id) || COLD_PAGE_PREFIXES.some((prefix) => id.startsWith(prefix))

async function renderStory(page: Page, id: string) {
  const events = pageEvents.get(page) ?? []
  events.length = 0
  await page.clock.pauseAt(FIXED_TIME)
  const blank = await loadStory(page, id)
  if (blank) {
    const state = await describeBlankPage(page, events)
    expect(blank, `blank render guard for ${id}\nblank page state: ${state}`).toBeNull()
  }
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
      const page = needsOwnPage(id) ? await isolatedPage() : storyPage
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

test('sensitivity: unmutated MesoProgressBar matches its baseline', async ({
  storyPage,
}, testInfo) => {
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
