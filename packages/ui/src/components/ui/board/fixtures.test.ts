import { describe, expect, it } from 'vitest'
import { BOARD_FIXTURES, BOARD_LANES, BOARD_MISSING, BOARD_VERY_LARGE } from './fixtures'

const wellFormed = Object.entries(BOARD_FIXTURES).filter(
  ([name]) => name !== 'hostile' && name !== 'missing'
)

describe('Board fixtures', () => {
  it('lists every contract fixture once', () => {
    expect(Object.keys(BOARD_FIXTURES).sort()).toEqual(
      [
        'default',
        'empty',
        'hostile',
        'lanes',
        'longLabel',
        'missing',
        'noColumns',
        'oneItem',
        'overLimit',
        'veryLarge',
      ].sort()
    )
  })

  it.each(wellFormed)('%s has unique ids and only known column and lane ids', (_name, fixture) => {
    const columnIds = new Set(fixture.columns.map((c) => c.id))
    const laneIds = new Set(fixture.lanes.map((l) => l.id))
    expect(new Set(fixture.items.map((i) => i.id)).size).toBe(fixture.items.length)
    expect(columnIds.size).toBe(fixture.columns.length)
    expect(laneIds.size).toBe(fixture.lanes.length)
    for (const item of fixture.items) {
      expect(columnIds.has(item.columnId), `column ${item.columnId}`).toBe(true)
      if (item.laneId !== undefined)
        expect(laneIds.has(item.laneId), `lane ${item.laneId}`).toBe(true)
    }
  })

  it('keeps Very large at 900 items with 432 in the last column', () => {
    const last = BOARD_VERY_LARGE.columns[BOARD_VERY_LARGE.columns.length - 1].id
    expect(BOARD_VERY_LARGE.items).toHaveLength(900)
    expect(BOARD_VERY_LARGE.items.filter((i) => i.columnId === last)).toHaveLength(432)
  })

  it('gives Default 24 items in the contract column split with Drafting at its limit', () => {
    const { columns, items } = BOARD_FIXTURES.default
    const counts = columns.map((c) => items.filter((i) => i.columnId === c.id).length)
    expect(counts).toEqual([3, 6, 5, 4, 6])
    expect(columns[1].limit).toBe(6)
  })

  it('leaves two lane cells empty in Lanes', () => {
    const cells = BOARD_LANES.lanes.flatMap((lane) =>
      BOARD_LANES.columns.map((column) =>
        BOARD_LANES.items.filter((i) => i.laneId === lane.id && i.columnId === column.id)
      )
    )
    expect(BOARD_LANES.items).toHaveLength(24)
    expect(cells.filter((cell) => cell.length === 0)).toHaveLength(2)
  })

  it('gives Missing four items with no lane and one with an unknown lane', () => {
    const laneIds = new Set(BOARD_MISSING.lanes.map((l) => l.id))
    expect(BOARD_MISSING.items.filter((i) => i.laneId === undefined)).toHaveLength(4)
    expect(BOARD_MISSING.items.filter((i) => i.laneId && !laneIds.has(i.laneId))).toHaveLength(1)
  })
})
