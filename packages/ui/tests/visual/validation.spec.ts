import { test } from '@playwright/test'
import path from 'path'

const VALIDATION_DIR = path.join(__dirname, 'validation')

test.describe('Storybook Validation Screenshots', () => {
  test('default preset story', async ({ page }) => {
    await page.goto('/iframe.html?id=theme-presets--default')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(VALIDATION_DIR, 'preset-default.png'), fullPage: true })
  })

  test('audiobook preset story', async ({ page }) => {
    await page.goto('/iframe.html?id=theme-presets--audiobook')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(VALIDATION_DIR, 'preset-audiobook.png'), fullPage: true })
  })

  test('button with default theme', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--primary')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(VALIDATION_DIR, 'storybook-button-post.png'), fullPage: true })
  })

  test('progress with default theme', async ({ page }) => {
    await page.goto('/iframe.html?id=components-progress--default')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(VALIDATION_DIR, 'storybook-progress-post.png'), fullPage: true })
  })
})

test.describe('Audiobook Validation Screenshots', () => {
  test('audiobook dashboard after migration', async ({ page }) => {
    const response = await page.goto('http://localhost:5173').catch(() => null)
    if (!response) {
      console.log('Audiobook dev server not running on port 5173 — skipping')
      test.skip()
      return
    }
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(VALIDATION_DIR, 'audiobook-dashboard-post.png'), fullPage: true })
  })
})
