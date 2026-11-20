import { test, expect } from '@playwright/test'
import { judge } from '../../scripts/audit-stories/numeral-probes.mjs'
import { collect, loadFixture, type Layout } from './load-fixture'

type Finding = { kind: string; selector: string; detail: string }

const fonts = { mono: 'Fixture Mono' }

// One case's subtree as its own frame, the way a story's root reaches the judges.
function caseLayout(layout: Layout, id: string): Layout {
  const root = layout.nodes.find((n) => n.selector === `[data-testid="${id}"]`)
  if (!root) throw new Error(`no case ${id}`)
  const nodes = layout.nodes
    .filter((n) => n.id === root.id || n.id.startsWith(`${root.id}.`))
    .map((n) => (n === root ? { ...n, parent: null } : n))
  return { ...layout, nodes }
}

const judged = (layout: Layout, id: string) =>
  (judge(caseLayout(layout, id), { fonts }) as Finding[]).map((f) => [f.kind, f.detail])

let layout: Layout

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()
  await loadFixture(page, 'numerals.html')
  layout = await collect(page)
  await page.close()
})

for (const id of ['nm-table-ok', 'nm-spacing-ok', 'nm-grouped', 'nm-live']) {
  test(`${id} gives no finding`, () => {
    expect(judged(layout, id)).toEqual([])
  })
}

test('a left-aligned numeric column with mixed decimals reports align and decimal count', () => {
  const found = judged(layout, 'nm-table-ragged')
  expect(found.map(([kind]) => kind)).toEqual(['numeric-align', 'decimal-count'])
  expect(found[0][1]).toMatch(/^numeric column right edges spread \d+(\.\d+)?px \(limit 1px\)$/)
  expect(found[1][1]).toBe('numeric column mixes 1, 2 decimal places (limit 1 count)')
})

test('a left-aligned header over a right-aligned numeric column reports the header', () => {
  const found = judged(layout, 'nm-header-left')
  expect(found).toHaveLength(1)
  expect(found[0][1]).toMatch(
    /^header right edge is \d+(\.\d+)?px from its right-aligned numeric column/
  )
})

test('a spaced percent and an ungrouped 6-digit number are reported', () => {
  expect(judged(layout, 'nm-spacing')).toEqual([
    ['numeral-spacing', '"85 %" has a space before "%" in "Effort 85 %"'],
  ])
  expect(judged(layout, 'nm-ungrouped')).toEqual([
    ['ungrouped-digits', '"104000" has 6 ungrouped digits (limit 4)'],
  ])
})

test('the collector reports figures for text with a digit only', () => {
  const frame = caseLayout(layout, 'nm-live')
  const timer = frame.nodes.find((n) => n.role === 'timer')!.text!.figures!
  expect(timer).toMatchObject({ variant: 'tabular-nums', live: true, full: '01:45' })
  expect(timer.spread).toBeGreaterThanOrEqual(0)
  const label = frame.nodes.find((n) => n.text?.ownText === 'Rest')!
  expect(label.text!.figures).toBeNull()
})
