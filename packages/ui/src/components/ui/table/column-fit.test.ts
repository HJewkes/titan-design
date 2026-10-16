import { describe, it, expect } from 'vitest'
import { fitColumns, type TableColumnFit } from './column-fit'

/**
 * Five 100px columns: two that must survive, three that drop in a declared
 * order. Every width below is picked to land on one step of that order.
 */
const COLUMNS: TableColumnFit[] = [
  { key: 'id', minWidth: 100 },
  { key: 'title', minWidth: 100 },
  { key: 'sev', minWidth: 100, dropPriority: 1 },
  { key: 'pri', minWidth: 100, dropPriority: 2 },
  { key: 'tags', minWidth: 100, dropPriority: 3 },
]

const fitAt = (available: number | null) => fitColumns(COLUMNS, available)

describe('fitColumns', () => {
  it('keeps every column until one has been measured', () => {
    expect(fitAt(null).visibleKeys).toEqual(['id', 'title', 'sev', 'pri', 'tags'])
    expect(fitAt(null).isScrolling).toBe(false)
  })

  it('keeps all five columns at a width that fits them', () => {
    expect(fitAt(500).visibleKeys).toEqual(['id', 'title', 'sev', 'pri', 'tags'])
    expect(fitAt(500).contentMinWidth).toBe(500)
    expect(fitAt(500).isScrolling).toBe(false)
  })

  it('drops the first column in the order when four fit', () => {
    expect(fitAt(450).visibleKeys).toEqual(['id', 'title', 'pri', 'tags'])
    expect(fitAt(450).contentMinWidth).toBe(400)
  })

  it('drops the second when three fit', () => {
    expect(fitAt(350).visibleKeys).toEqual(['id', 'title', 'tags'])
    expect(fitAt(350).contentMinWidth).toBe(300)
  })

  it('drops the third when only two fit', () => {
    expect(fitAt(250).visibleKeys).toEqual(['id', 'title'])
    expect(fitAt(250).contentMinWidth).toBe(200)
    expect(fitAt(250).isScrolling).toBe(false)
  })

  it('stops dropping at the undroppable columns and scrolls instead', () => {
    const fit = fitAt(150)
    expect(fit.visibleKeys).toEqual(['id', 'title'])
    expect(fit.contentMinWidth).toBe(200)
    expect(fit.isScrolling).toBe(true)
  })

  it('drops one column at a time rather than everything droppable at once', () => {
    // 450 fits four columns; a fit that dropped by category would leave two.
    expect(fitAt(450).visibleKeys).toHaveLength(4)
    expect(fitAt(350).visibleKeys).toHaveLength(3)
  })

  it('breaks a tied priority by declaration order', () => {
    const tied: TableColumnFit[] = [
      { key: 'keep', minWidth: 100 },
      { key: 'left', minWidth: 100, dropPriority: 1 },
      { key: 'right', minWidth: 100, dropPriority: 1 },
    ]
    expect(fitColumns(tied, 200).visibleKeys).toEqual(['keep', 'right'])
  })

  it('reports what the survivors need, which is what the table scrolls to', () => {
    expect(fitColumns([{ key: 'only', minWidth: 320 }], 100)).toEqual({
      visibleKeys: ['only'],
      contentMinWidth: 320,
      isScrolling: true,
    })
  })
})
