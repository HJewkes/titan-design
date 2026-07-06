import { test, expect } from '@playwright/test'

/**
 * Layer 1 — component screenshot baselines (TD-04.04).
 *
 * The foundation layer of the visual suite: a pixel baseline of every React
 * workout component, captured from the same specimen comparison page the
 * Layer-3 parity suite (`comparison.visual.test.ts`) drives. Where parity
 * asserts computed styles _against the HTML ground truth_, this layer freezes
 * the React render itself so unintended visual drift (a spacing tweak, a colour
 * regression, a dropped shadow) surfaces as a pixel diff.
 *
 * Rather than hard-coding the component list (which would duplicate — and drift
 * from — the specimen's `ComparisonPair`s), the test enumerates every
 * `[data-testid^="compare-"]` pair the page renders and snapshots that pair's
 * `.react-version` column. The set therefore stays automatically in lockstep
 * with whatever the parity layer covers.
 *
 * Baselines are generated inside the pinned Playwright Linux image
 * (`mcr.microsoft.com/playwright:v1.58.2-noble`) so the committed
 * `*-chromium-linux.png` snapshots are byte-identical to what CI renders in the
 * same container. Regenerate with `pnpm test:visual:baseline:update`.
 */

test('workout component screenshot baselines', async ({ page }) => {
  await page.goto('/comparison.html')
  await page.waitForLoadState('networkidle')
  // Web fonts (Inter / Nunito Sans / Space Grotesk) load from the CDN; block on
  // them so text metrics are stable before any pixel is captured.
  await page.evaluate(() => document.fonts.ready)

  const testIds = await page
    .locator('[data-testid^="compare-"]')
    .evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute('data-testid')).filter((id): id is string => Boolean(id))
    )

  expect(testIds.length, 'specimen renders at least one comparison pair').toBeGreaterThan(0)

  for (const testId of testIds) {
    const reactColumn = page.locator(`[data-testid="${testId}"] .react-version`)
    await expect
      .soft(reactColumn, `baseline drift for ${testId}`)
      .toHaveScreenshot(`${testId}.png`, {
        animations: 'disabled',
        caret: 'hide',
      })
  }
})
