import fs from 'node:fs'
import { test, expect, type Page, type TestInfo } from '@playwright/test'

/**
 * Proves the Layer-2 screenshot gate sees a small alpha change (TD-3 S1).
 *
 * PR #178 changed MesoProgressBar's track alphas and every visual gate passed,
 * because Playwright's default per-pixel threshold (0.2) ignores a grey shift
 * under about 53 of 255 levels. This spec renders the committed
 * `custom-workout-mesoprogressbar--default` baseline, overrides the upcoming
 * track token `--color-hairline-subtle` (rgba 255/255/255 at 0.10) on the story
 * root, and asserts that the gate rejects the result. 0.50 is the #178-sized
 * change; 0.13 pins the 0.02 threshold floor.
 *
 * The file name ends in `stories.spec.ts` so the CI step
 * `playwright test stories.spec.ts` runs it beside the baselines it reads.
 */

const STORY_ID = 'custom-workout-mesoprogressbar--default'
// The baseline belongs to stories.spec.ts; read it from that spec's snapshot directory.
const BASELINE = ['..', 'stories.spec.ts-snapshots', `${STORY_ID}.png`]
const FIXED_TIME = new Date('2024-01-01T16:12:07')
const SHOT_OPTIONS = { animations: 'disabled', caret: 'hide' } as const

function guardBaseline(testInfo: TestInfo) {
  test.skip(process.platform !== 'linux', 'baselines exist only as *-chromium-linux.png')
  const update = testInfo.config.updateSnapshots
  test.skip(
    update === 'all' || update === 'changed',
    'a mutated render must never be written over the baseline'
  )
  const baseline = testInfo.snapshotPath(...BASELINE)
  expect(fs.existsSync(baseline), `baseline ${baseline} must exist`).toBe(true)
}

async function renderStory(page: Page, testInfo: TestInfo) {
  guardBaseline(testInfo)
  await page.clock.install({ time: FIXED_TIME })
  await page.clock.pauseAt(FIXED_TIME)
  await page.goto(`/iframe.html?id=${STORY_ID}&viewMode=story`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  return page.locator('#storybook-root')
}

test('unmutated MesoProgressBar matches its baseline', async ({ page }, testInfo) => {
  const root = await renderStory(page, testInfo)
  await expect(root).toHaveScreenshot(BASELINE, SHOT_OPTIONS)
})

for (const alpha of ['0.50', '0.13']) {
  test(`hairline-subtle track 0.10 to ${alpha} fails the gate`, async ({ page }, testInfo) => {
    const root = await renderStory(page, testInfo)
    await root.evaluate((el, value) => {
      el.style.setProperty('--color-hairline-subtle', value)
    }, `rgba(255, 255, 255, ${alpha})`)

    const error = await expect(root)
      .toHaveScreenshot(BASELINE, { ...SHOT_OPTIONS, timeout: 3000 })
      .then(
        () => null,
        (e: Error) => e
      )

    expect(error, `a 0.10 to ${alpha} track change must fail the gate`).not.toBeNull()
    const diffLine = error?.message.split('\n').find((line) => /pixels.*different/.test(line))
    console.log(`[sensitivity] 0.10 -> ${alpha}: ${diffLine?.trim()}`)
  })
}
