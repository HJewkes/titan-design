import { test, expect } from '@playwright/test'

test.describe('E1rmBadge Visual', () => {
  test('default variant matches snapshot', async ({ page }) => {
    await page.goto('/iframe.html?id=custom-workout-e1rmbadge--default')
    await page.waitForSelector('[data-testid="e1rm-badge"]')

    const badge = page.locator('[data-testid="e1rm-badge"]')

    const styles = await badge.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return {
        backgroundColor: cs.backgroundColor,
        borderRadius: cs.borderRadius,
        borderColor: cs.borderColor,
        fontFamily: cs.fontFamily,
      }
    })

    expect(styles.borderRadius).toBe('2px')
    // backgroundColor should be surface-raised (#1C1C1C = rgb(28, 28, 28))
    expect(styles.backgroundColor).toContain('28, 28, 28')
    // borderColor should be border-default (#1F1F1F = rgb(31, 31, 31))
    expect(styles.borderColor).toContain('31, 31, 31')
  })
})
