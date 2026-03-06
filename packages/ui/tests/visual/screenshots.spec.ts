import { test } from '@playwright/test'
import path from 'path'

const REFERENCE_DIR = path.join(__dirname, 'reference')

test.describe('Storybook Reference Screenshots', () => {
  test('button stories', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--primary')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(REFERENCE_DIR, 'storybook-button.png'), fullPage: true })
  })

  test('card stories', async ({ page }) => {
    await page.goto('/iframe.html?id=components-card--default')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(REFERENCE_DIR, 'storybook-card.png'), fullPage: true })
  })

  test('progress stories', async ({ page }) => {
    await page.goto('/iframe.html?id=components-progress--default')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(REFERENCE_DIR, 'storybook-progress.png'), fullPage: true })
  })

  test('input stories', async ({ page }) => {
    await page.goto('/iframe.html?id=components-input--default')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(REFERENCE_DIR, 'storybook-input.png'), fullPage: true })
  })

  test('toast stories', async ({ page }) => {
    await page.goto('/iframe.html?id=components-toast--default')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(REFERENCE_DIR, 'storybook-toast.png'), fullPage: true })
  })
})

test.describe('Audiobook Reference Screenshots', () => {
  test('audiobook dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(REFERENCE_DIR, 'audiobook-dashboard.png'), fullPage: true })
  })
})
