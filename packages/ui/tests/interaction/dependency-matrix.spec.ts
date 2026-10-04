import { test, expect, type Page } from '@playwright/test'

const PLAYGROUND = 'components-organisms-dependencymatrix-interactions--playground'
const DIRECTIONS = ['row-depends-on-column', 'column-depends-on-row'] as const

async function openPlayground(page: Page, args: string) {
  await page.goto(`/iframe.html?id=${PLAYGROUND}&viewMode=story&args=${args}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('grid')).toBeVisible()
}

async function tabIntoGrid(page: Page) {
  await page.getByRole('button', { name: 'Before the grid' }).focus()
  await page.keyboard.press('Tab')
  await expectFocusAt(page, 2, 2)
}

async function expectFocusAt(page: Page, row: number, col: number) {
  const focused = page.locator(':focus')
  await expect(focused).toHaveAttribute('role', 'gridcell')
  await expect(focused).toHaveAttribute('aria-rowindex', String(row))
  await expect(focused).toHaveAttribute('aria-colindex', String(col))
}

for (const direction of DIRECTIONS) {
  test(`${direction}: Tab enters on one cell and the next Tab leaves the grid`, async ({
    page,
  }) => {
    await openPlayground(page, `direction:${direction}`)
    await tabIntoGrid(page)

    await expect(page.getByRole('grid').locator('[tabindex="0"]')).toHaveCount(1)
    await page.keyboard.press('Tab')

    await expect(page.getByRole('button', { name: 'After the grid' })).toBeFocused()
  })

  test(`${direction}: arrows, Home and End move real focus with matching indexes`, async ({
    page,
  }) => {
    await openPlayground(page, `direction:${direction}`)
    await tabIntoGrid(page)

    await page.keyboard.press('ArrowRight')
    await expectFocusAt(page, 2, 3)
    await page.keyboard.press('ArrowDown')
    await expectFocusAt(page, 3, 3)
    await page.keyboard.press('End')
    await expectFocusAt(page, 3, 32)
    await page.keyboard.press('Control+Home')

    await expectFocusAt(page, 2, 2)
  })

  test(`${direction}: Enter and Space each press the focused cell once`, async ({ page }) => {
    await openPlayground(page, `direction:${direction}`)
    await tabIntoGrid(page)
    const toHub = direction === 'row-depends-on-column' ? 'ArrowDown' : 'ArrowRight'

    await page.keyboard.press(toHub)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('press-count')).toHaveText('1')
    await page.keyboard.press('Space')

    await expect(page.getByTestId('press-count')).toHaveText('2')
    await expect(page.getByTestId('last-press')).toHaveText('module-01 > module-00')
  })

  test(`${direction}: Control+End mounts the far corner of 386 items and scrolls it into view`, async ({
    page,
  }) => {
    await openPlayground(page, `direction:${direction};fixture:Very large`)
    await tabIntoGrid(page)

    await page.keyboard.press('Control+End')

    await expectFocusAt(page, 387, 387)
    await expect(page.locator(':focus')).toBeInViewport()
    const rowHeader = page.getByRole('rowheader', { name: 'file-385' })
    await expect(rowHeader).toBeInViewport()
    const grid = await page.getByRole('grid').boundingBox()
    const header = await rowHeader.boundingBox()
    expect(Math.abs((header?.x ?? 0) - (grid?.x ?? -100))).toBeLessThan(2)
  })
}

test('a disabled grid still moves focus, and Enter presses nothing', async ({ page }) => {
  await openPlayground(page, 'isDisabled:!true')
  await tabIntoGrid(page)

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')

  await expectFocusAt(page, 3, 2)
  await expect(page.getByRole('grid')).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByTestId('press-count')).toHaveText('0')
})
