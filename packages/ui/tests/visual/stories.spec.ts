import fs from 'node:fs'
import { test, expect, type Page, type TestInfo } from '@playwright/test'

/**
 * Storybook story visual-regression baselines.
 *
 * Enumerates the Storybook index and screenshots each in-scope story's rendered
 * root, asserting against a committed baseline (`toHaveScreenshot`). Unlike the
 * dead `screenshots.spec.ts` it replaces, this actually gates drift.
 *
 * Determinism: the clock is installed AND paused at a fixed instant (so
 * `DateTime live` clocks render a fixed time however long the run takes) and CSS animations are disabled (pulse / ping), so control-driven,
 * animated stories snapshot stably.
 *
 * Scope: the shell family + the icon foundation story (`Foundations/Icons`,
 * whose Storybook id is `foundations-icons--*`). Widen `SCOPE` to cover more
 * of the library as baselines are seeded.
 *
 * Baselines must be generated in the pinned Playwright Linux container
 * (`mcr.microsoft.com/playwright:v1.58.2-noble`) so the committed PNGs are
 * byte-identical to CI: download the `storybook-visual-baselines` artifact
 * that the visual workflow's refresh step uploads on every run and commit the
 * changed PNGs. A local `pnpm test:visual:stories:update` writes darwin PNGs
 * that are gitignored and never gate.
 */

const SCOPE = /^(shell-|foundations-icons--|custom-workout-mesoprogressbar--)/

const FIXED_TIME = new Date('2024-01-01T16:12:07')

test('storybook story baselines (shell + icons)', async ({ page, request }) => {
  // install() alone keeps ticking from FIXED_TIME in real time, so any story
  // rendered more than 53 s into the run showed 16:13 instead of 16:12 (#250).
  await page.clock.install({ time: FIXED_TIME })
  await page.clock.pauseAt(FIXED_TIME)

  const index = (await (await request.get('/index.json')).json()) as {
    entries: Record<string, { id: string; type: string; title: string }>
  }
  const stories = Object.values(index.entries).filter((e) => e.type === 'story' && SCOPE.test(e.id))

  expect(stories.length, 'in-scope stories were found').toBeGreaterThan(0)

  for (const story of stories) {
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)
    await expect
      .soft(page.locator('#storybook-root'), `visual drift for ${story.id}`)
      .toHaveScreenshot(`${story.id}.png`, { animations: 'disabled', caret: 'hide' })
  }
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
const SHOT_OPTIONS = { animations: 'disabled', caret: 'hide' } as const

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
  await page.clock.install({ time: FIXED_TIME })
  await page.clock.pauseAt(FIXED_TIME)
  await page.goto(`/iframe.html?id=${SENSITIVITY_STORY}&viewMode=story`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  return page.locator('#storybook-root')
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
