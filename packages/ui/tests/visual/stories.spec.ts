import fs from 'node:fs'
import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { blankRenderReason, type RootMetrics } from '../../src/test/blank-render'
import { STORY_INDEX_ENV } from './story-index.global-setup'

/**
 * Storybook story visual-regression baselines.
 *
 * Declares one test per in-scope story from the Storybook index that
 * `story-index.global-setup.ts` fetches, and screenshots each story's rendered
 * root against a committed baseline (`toHaveScreenshot`). Every story first
 * passes a blank-render guard. `src/test/visual-coverage.test.ts` fails when a
 * story under a required prefix has no committed baseline.
 *
 * Determinism: the clock is installed AND paused at a fixed instant (so
 * `DateTime live` clocks render a fixed time however long the run takes) and CSS animations are disabled (pulse / ping), so control-driven,
 * animated stories snapshot stably.
 *
 * Scope: the shell family + the icon foundation story (`Foundations/Icons`,
 * whose Storybook id is `foundations-icons--*`), plus the Chat stories named in
 * `CHAT_STORIES`. Widen `SCOPE` to cover more of the library as baselines are seeded.
 *
 * Baselines must be generated in the pinned Playwright Linux container
 * (`mcr.microsoft.com/playwright:v1.58.2-noble`) so the committed PNGs are
 * byte-identical to CI: download the `storybook-visual-baselines` artifact
 * that the visual workflow's refresh step uploads on a failed run and commit the
 * changed PNGs. A local `pnpm test:visual:stories:update` writes darwin PNGs
 * that are gitignored and never gate.
 */

const SCOPE = /^(shell-|foundations-icons--|custom-workout-mesoprogressbar--)/

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

async function renderStory(page: Page, id: string) {
  // install() alone keeps ticking from FIXED_TIME in real time, so a story
  // rendered late in the run showed 16:13 instead of 16:12 (#250); it starts early so pauseAt never rewinds.
  await page.clock.install({ time: CLOCK_START })
  await page.clock.pauseAt(FIXED_TIME)
  await page.goto(`/iframe.html?id=${id}&viewMode=story`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await expectRendered(page, id)
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
    test(id, async ({ page }) => {
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

test('sensitivity: unmutated MesoProgressBar matches its baseline', async ({ page }, testInfo) => {
  const root = await renderSensitivityStory(page, testInfo)
  await expect(root).toHaveScreenshot(SENSITIVITY_BASELINE, SHOT_OPTIONS)
  console.log('[sensitivity] unmutated 0.10: matches baseline')
})

for (const alpha of ['0.50', '0.13']) {
  test(`sensitivity: hairline-subtle track 0.10 to ${alpha} fails the gate`, async ({
    page,
  }, testInfo) => {
    const root = await renderSensitivityStory(page, testInfo)
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
