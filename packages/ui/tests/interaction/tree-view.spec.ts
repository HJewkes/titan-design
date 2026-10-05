import { test, expect, type Page } from '@playwright/test'

const DEFAULT_STORY = 'components-organisms-treeview--default'
const LARGE_STORY = 'components-organisms-treeview-interactions--very-large-playground'

async function open(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('treeitem').first()).toBeVisible()
}

const focused = (page: Page) =>
  page.evaluate(() => ({
    label: document.activeElement?.getAttribute('aria-label') ?? null,
    role: document.activeElement?.getAttribute('role') ?? null,
    tabStops: document.querySelectorAll('[role="treeitem"][tabindex="0"]').length,
  }))

async function expectFocusOn(page: Page, label: string) {
  await expect.poll(() => focused(page)).toEqual({ label, role: 'treeitem', tabStops: 1 })
}

const rowLabels = (page: Page) =>
  page.getByRole('treeitem').evaluateAll((rows) => rows.map((r) => r.getAttribute('aria-label')))

test('Tab enters the tree once, on one row, and the next Tab leaves it', async ({ page }) => {
  await open(page, DEFAULT_STORY)
  const [first] = await rowLabels(page)
  await page.getByRole('treeitem').first().focus()
  await expectFocusOn(page, first ?? '')
  await page.keyboard.press('Tab')
  expect((await focused(page)).role).not.toBe('treeitem')
  await page.keyboard.press('Shift+Tab')
  await expectFocusOn(page, first ?? '')
})

test('Down, Up, End and Home move focus through the visible rows', async ({ page }) => {
  await open(page, DEFAULT_STORY)
  const labels = (await rowLabels(page)).map(String)
  await page.getByRole('treeitem').first().focus()
  await page.keyboard.press('ArrowDown')
  await expectFocusOn(page, labels[1])
  await page.keyboard.press('ArrowUp')
  await expectFocusOn(page, labels[0])
  await page.keyboard.press('End')
  await expectFocusOn(page, labels[labels.length - 1])
  await page.keyboard.press('Home')
  await expectFocusOn(page, labels[0])
})

test('Right on an unloaded row shows a spinner, and the failed load closes it again', async ({
  page,
}) => {
  await open(page, DEFAULT_STORY)
  await page.getByRole('treeitem').first().focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  const label = (await focused(page)).label ?? ''
  const row = page.getByRole('treeitem', { name: label, exact: true })
  await expect(row).toHaveAttribute('aria-expanded', 'false')
  await page.keyboard.press('ArrowRight')
  await expect(row).toHaveAttribute('aria-busy', 'true')
  await expect(row).toHaveAttribute('aria-expanded', 'false', { timeout: 5_000 })
  await expect(row).not.toHaveAttribute('aria-busy')
})

test('Enter selects the focused row exactly once', async ({ page }) => {
  await open(page, DEFAULT_STORY)
  const row = page.getByRole('treeitem').nth(1)
  await row.focus()
  await page.keyboard.press('Enter')
  await expect(row).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('[role="treeitem"][aria-selected="true"]')).toHaveCount(1)
})

test('End on 5,000 rows scrolls the last row in, then focuses it', async ({ page }) => {
  await open(page, LARGE_STORY)
  const first = (await rowLabels(page))[0] ?? ''
  const mounted = await page.getByRole('treeitem').count()
  expect(mounted).toBeLessThan(40)
  await page.getByRole('treeitem').first().focus()

  await page.keyboard.press('End')

  await expect.poll(async () => (await focused(page)).role).toBe('treeitem')
  const state = await page.evaluate(() => {
    const row = document.activeElement as HTMLElement
    const scroller = row.closest('[role="tree"]')?.parentElement?.parentElement as HTMLElement
    const r = row.getBoundingClientRect()
    const s = scroller.getBoundingClientRect()
    return { inView: r.top >= s.top - 1 && r.bottom <= s.bottom + 1, scrollTop: scroller.scrollTop }
  })
  expect(state.inView).toBe(true)
  expect(state.scrollTop).toBeGreaterThan(100_000)
  await expect(page.getByRole('treeitem', { name: first, exact: true })).toHaveCount(0)
  expect(await page.getByRole('treeitem').count()).toBeLessThan(40)

  await page.keyboard.press('Home')
  await expectFocusOn(page, first)
})

test('arrowing down past the window keeps focus on screen and one tab stop', async ({ page }) => {
  await open(page, LARGE_STORY)
  await page.getByRole('treeitem').first().focus()
  for (let i = 0; i < 30; i += 1) await page.keyboard.press('ArrowDown')
  const state = await page.evaluate(() => {
    const row = document.activeElement as HTMLElement
    const scroller = row.closest('[role="tree"]')?.parentElement?.parentElement as HTMLElement
    const r = row.getBoundingClientRect()
    const s = scroller.getBoundingClientRect()
    return {
      inView: r.top >= s.top - 1 && r.bottom <= s.bottom + 1,
      scrolled: scroller.scrollTop > 0,
    }
  })
  expect(state).toEqual({ inView: true, scrolled: true })
  expect((await focused(page)).tabStops).toBe(1)
})
