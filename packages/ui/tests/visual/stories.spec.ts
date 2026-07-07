import { test, expect } from '@playwright/test'

/**
 * Storybook story visual-regression baselines.
 *
 * Enumerates the Storybook index and screenshots each in-scope story's rendered
 * root, asserting against a committed baseline (`toHaveScreenshot`). Unlike the
 * dead `screenshots.spec.ts` it replaces, this actually gates drift.
 *
 * Determinism: the clock is frozen (so `DateTime live` clocks render a fixed
 * time) and CSS animations are disabled (pulse / ping), so control-driven,
 * animated stories snapshot stably.
 *
 * Scope: the shell family + the shared icon primitive (the newest, token-pure
 * work). Widen `SCOPE` to cover more of the library as baselines are seeded.
 *
 * Baselines must be generated in the pinned Playwright Linux container
 * (`mcr.microsoft.com/playwright:v1.58.2-noble`) so the committed PNGs are
 * byte-identical to CI — regenerate with `pnpm test:visual:update`.
 */

const SCOPE = /^(shell-|icons-|icons--)/

const FIXED_TIME = new Date('2024-01-01T16:12:07')

test('storybook story baselines (shell + icons)', async ({ page, request }) => {
  await page.clock.install({ time: FIXED_TIME })

  const index = (await (await request.get('/index.json')).json()) as {
    entries: Record<string, { id: string; type: string; title: string }>
  }
  const stories = Object.values(index.entries).filter(
    (e) => e.type === 'story' && SCOPE.test(e.id)
  )

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
