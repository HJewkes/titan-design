import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../test/property'
import {
  buildBoardModel,
  foldCell,
  limitStatus,
  nextItem,
  UNASSIGNED_LANE_ID,
  type BoardFold,
  type BoardKey,
  type BoardModel,
} from './board-model'
import { BOARD_FIXTURES, BOARD_HOSTILE, BOARD_LANES, BOARD_MISSING } from './fixtures'
import type { BoardItem } from './types'

const KEYS: BoardKey[] = [
  'Down',
  'Up',
  'Left',
  'Right',
  'Home',
  'End',
  'CtrlHome',
  'CtrlEnd',
  'PageDown',
  'PageUp',
]
const NO_FOLD: BoardFold = { maxItemsPerCell: 50, pinnedIds: new Set() }

const COLUMN_IDS = ['c1', 'c2', 'c3']
const LANE_IDS = ['l1', 'l2']
const columnsArb = fc
  .array(fc.constantFrom(...COLUMN_IDS, 'c4'), { maxLength: 6 })
  .map((ids) => ids.map((id) => ({ id, label: id })))
const lanesArb = fc
  .array(fc.constantFrom(...LANE_IDS), { maxLength: 4 })
  .map((ids) => ids.map((id) => ({ id, label: id })))
const itemsArb = fc.array(
  fc.record({
    id: fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'),
    columnId: fc.constantFrom(...COLUMN_IDS, 'c4', 'unknown'),
    laneId: fc.option(fc.constantFrom(...LANE_IDS, 'unknown'), { nil: undefined }),
    label: fc.string(),
  }),
  { maxLength: 40 }
)

const cellItemIds = (model: BoardModel<unknown>): string[] =>
  model.rows.flatMap((row) => row.cells.flatMap((cell) => cell.items.map((i) => i.id)))

function modelOf(name: keyof typeof BOARD_FIXTURES) {
  const f = BOARD_FIXTURES[name]
  return buildBoardModel(f.columns, f.lanes, f.items)
}

describe('buildBoardModel', () => {
  it('puts every kept item in exactly one cell and sums column counts to the kept items', () => {
    fcAssert(
      fc.property(columnsArb, lanesArb, itemsArb, (columns, lanes, items) => {
        const model = buildBoardModel(columns, lanes, items)
        const ids = cellItemIds(model)
        expect(new Set(ids).size).toBe(ids.length)
        expect(ids).toHaveLength(model.keptCount)
        const summed = [...model.columnCounts.values()].reduce((a, b) => a + b, 0)
        expect(summed).toBe(model.keptCount)
        expect(model.rows.reduce((a, row) => a + row.count, 0)).toBe(model.keptCount)
      })
    )
  })

  it('never throws on hostile input and accounts for every unique id as kept or dropped', () => {
    fcAssert(
      fc.property(columnsArb, lanesArb, itemsArb, (columns, lanes, items) => {
        const model = buildBoardModel(columns, lanes, items)
        const dropped = model.problems.filter((p) => p.kind === 'unknown-column').length
        expect(model.keptCount + dropped).toBe(new Set(items.map((i) => i.id)).size)
      })
    )
  })

  it('survives the Hostile fixture and reports each kind of problem', () => {
    const model = modelOf('hostile')
    expect(model.problems.map((p) => p.kind).sort()).toEqual([
      'duplicate-column',
      'duplicate-item',
      'duplicate-lane',
      'unknown-column',
    ])
    expect(model.keptCount).toBe(2)
    expect(BOARD_HOSTILE.items).toHaveLength(4)
  })

  it('builds one row without a lane id when there are no lanes', () => {
    const model = modelOf('default')
    expect(model.rows).toHaveLength(1)
    expect(model.rows[0].laneId).toBeNull()
    expect([...model.columnCounts.values()]).toEqual([3, 6, 5, 4, 6])
  })

  it('builds one row per lane with empty cells kept', () => {
    const model = modelOf('lanes')
    expect(model.rows.map((r) => r.laneId)).toEqual(BOARD_LANES.lanes.map((l) => l.id))
    expect(model.rows.map((r) => r.count)).toEqual([10, 9, 5])
    expect(model.rows[0].cells[3].items).toEqual([])
  })

  it('sends a missing or unknown lane to a trailing catch-all row', () => {
    const model = modelOf('missing')
    const last = model.rows[model.rows.length - 1]
    expect(last.laneId).toBe(UNASSIGNED_LANE_ID)
    expect(last.count).toBe(5)
    expect(model.rows).toHaveLength(BOARD_MISSING.lanes.length + 1)
  })

  it('adds no catch-all row when every item has a known lane', () => {
    expect(modelOf('lanes').rows.some((r) => r.laneId === UNASSIGNED_LANE_ID)).toBe(false)
  })

  it('drops an item with an unknown column id and lists it', () => {
    const model = buildBoardModel(
      [{ id: 'x', label: 'X' }],
      [],
      [
        { id: '1', columnId: 'x', label: 'one' },
        { id: '2', columnId: 'y', label: 'two' },
      ]
    )
    expect(model.problems).toEqual([{ kind: 'unknown-column', id: '2' }])
    expect(model.keptCount).toBe(1)
  })

  it('keeps the first of a duplicated item id', () => {
    const model = buildBoardModel(
      [{ id: 'x', label: 'X' }],
      [],
      [
        { id: '1', columnId: 'x', label: 'first' },
        { id: '1', columnId: 'x', label: 'second' },
      ]
    )
    expect(model.rows[0].cells[0].items.map((i) => i.label)).toEqual(['first'])
    expect(model.problems).toEqual([{ kind: 'duplicate-item', id: '1' }])
  })

  it('ignores laneId on items when no lanes are declared', () => {
    const model = buildBoardModel([{ id: 'x', label: 'X' }], undefined, [
      { id: '1', columnId: 'x', laneId: 'l9', label: 'one' },
    ])
    expect(model.rows).toHaveLength(1)
    expect(model.rows[0].laneId).toBeNull()
  })
})

describe('limitStatus', () => {
  it.each([
    [3, 4, 'under'],
    [4, 4, 'at'],
    [5, 4, 'over'],
    [0, 4, 'under'],
  ] as const)('reads %i of %i as %s', (count, limit, expected) => {
    expect(limitStatus(count, limit)).toBe(expected)
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, 2.5, undefined])(
    'reads a limit of %s as none',
    (limit) => {
      expect(limitStatus(9, limit)).toBe('none')
    }
  )
})

describe('foldCell', () => {
  const itemOf = (id: string): BoardItem => ({ id, columnId: 'c', label: id })
  const cellArb = fc
    .uniqueArray(fc.string({ minLength: 1 }), { maxLength: 30 })
    .map((ids) => ids.map(itemOf))

  it('keeps a subsequence of at most max plus pinned that holds every pinned id', () => {
    fcAssert(
      fc.property(
        cellArb,
        fc.integer({ min: 0, max: 35 }),
        fc.array(fc.nat(29)),
        (items, max, picks) => {
          const pinned = new Set(picks.flatMap((p) => (items[p] ? [items[p].id] : [])))
          const { visible, hidden } = foldCell(items, max, pinned)
          let cursor = 0
          for (const item of visible) {
            cursor = items.indexOf(item, cursor)
            expect(cursor).toBeGreaterThanOrEqual(0)
          }
          expect(visible.length).toBeLessThanOrEqual(max + pinned.size)
          for (const id of pinned) expect(visible.some((v) => v.id === id)).toBe(true)
          expect(visible.length + hidden).toBe(items.length)
        }
      )
    )
  })

  it('shows a pinned card past the fold in its original position', () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map(itemOf)
    const { visible, hidden } = foldCell(items, 2, new Set(['d']))
    expect(visible.map((i) => i.id)).toEqual(['a', 'b', 'd'])
    expect(hidden).toBe(2)
  })

  it('folds nothing when the cap exceeds the cell', () => {
    expect(foldCell([itemOf('a')], 50, new Set()).hidden).toBe(0)
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY])('folds nothing for a cap of %s', (max) => {
    expect(foldCell([itemOf('a'), itemOf('b')], max, new Set()).hidden).toBe(0)
  })

  it('folds everything but pinned for a negative cap', () => {
    const { visible } = foldCell([itemOf('a'), itemOf('b')], -3, new Set(['b']))
    expect(visible.map((i) => i.id)).toEqual(['b'])
  })
})

describe('nextItem', () => {
  it('returns a visible id from the model for any key, model and active id', () => {
    fcAssert(
      fc.property(
        columnsArb,
        lanesArb,
        itemsArb,
        fc.constantFrom(...KEYS),
        fc.constantFrom('a', 'b', 'c', 'zz', null),
        fc.integer({ min: 0, max: 4 }),
        (columns, lanes, items, key, active, max) => {
          const model = buildBoardModel(columns, lanes, items)
          const fold = { maxItemsPerCell: max, pinnedIds: new Set<string>() }
          const next = nextItem(model, active, key, fold)
          const pinned = new Set(active === null ? [] : [active])
          const visible = new Set(
            model.rows.flatMap((row) =>
              row.cells.flatMap((cell) =>
                foldCell(cell.items, max, pinned).visible.map((i) => i.id)
              )
            )
          )
          if (next === null) expect(visible.size).toBe(0)
          else expect(visible.has(next)).toBe(true)
        }
      )
    )
  })

  // Lanes fixture, ids by cell (lane x column):
  //   news:     [0] [1 2 3] [4 5 6] []        [7 8 9]
  //   features: [10] [11 12] [13 14] [15 16]  [17 18]
  //   opinion:  [19] [20]    []      [21 22]  [23]
  const lanes = modelOf('lanes')
  const id = (n: number) => `story-${String(n).padStart(3, '0')}`

  it('enters at the first card when nothing is active', () => {
    expect(nextItem(lanes, null, 'Down', NO_FOLD)).toBe(id(0))
  })

  it('enters at the first card when the active id is unknown', () => {
    expect(nextItem(lanes, 'gone', 'End', NO_FOLD)).toBe(id(0))
  })

  it('returns null when nothing is visible', () => {
    expect(nextItem(modelOf('empty'), null, 'Down', NO_FOLD)).toBeNull()
  })

  it('moves down inside a cell', () => {
    expect(nextItem(lanes, id(1), 'Down', NO_FOLD)).toBe(id(2))
  })

  it('crosses to the first card of the next lane at the bottom of a cell', () => {
    expect(nextItem(lanes, id(3), 'Down', NO_FOLD)).toBe(id(11))
  })

  it('crosses to the last card of the previous lane going up', () => {
    expect(nextItem(lanes, id(11), 'Up', NO_FOLD)).toBe(id(3))
  })

  it('skips a lane whose cell in the column is empty when crossing', () => {
    expect(nextItem(lanes, id(14), 'Down', NO_FOLD)).toBe(id(14))
    expect(nextItem(lanes, id(5), 'Down', NO_FOLD)).toBe(id(6))
    expect(nextItem(lanes, id(6), 'Down', NO_FOLD)).toBe(id(13))
  })

  it('does not wrap at the bottom, top, left or right edge', () => {
    expect(nextItem(lanes, id(22), 'Down', NO_FOLD)).toBe(id(22))
    expect(nextItem(lanes, id(0), 'Up', NO_FOLD)).toBe(id(0))
    expect(nextItem(lanes, id(0), 'Left', NO_FOLD)).toBe(id(0))
    expect(nextItem(lanes, id(23), 'Right', NO_FOLD)).toBe(id(23))
  })

  it('skips an empty cell going right', () => {
    expect(nextItem(lanes, id(6), 'Right', NO_FOLD)).toBe(id(9))
  })

  it('skips an empty cell going left', () => {
    expect(nextItem(lanes, id(21), 'Left', NO_FOLD)).toBe(id(20))
  })

  it('clamps the index to the last card of a shorter cell', () => {
    expect(nextItem(lanes, id(2), 'Left', NO_FOLD)).toBe(id(0))
    expect(nextItem(lanes, id(15), 'Right', NO_FOLD)).toBe(id(17))
    expect(nextItem(lanes, id(16), 'Right', NO_FOLD)).toBe(id(18))
  })

  it('keeps the index when the neighbour cell is long enough', () => {
    expect(nextItem(lanes, id(1), 'Right', NO_FOLD)).toBe(id(4))
  })

  it('moves to the first and last card of the cell on Home and End', () => {
    expect(nextItem(lanes, id(2), 'Home', NO_FOLD)).toBe(id(1))
    expect(nextItem(lanes, id(2), 'End', NO_FOLD)).toBe(id(3))
  })

  it('reaches the first non-empty column and the last on Ctrl+Home and Ctrl+End', () => {
    expect(nextItem(lanes, id(8), 'CtrlHome', NO_FOLD)).toBe(id(0))
    expect(nextItem(lanes, id(8), 'CtrlEnd', NO_FOLD)).toBe(id(23))
  })

  it('pages ten cards down a column across lanes and clamps at the end', () => {
    const big = modelOf('veryLarge')
    const first = nextItem(big, null, 'Down', NO_FOLD)
    const paged = nextItem(big, first, 'PageDown', NO_FOLD)
    expect(paged).not.toBe(first)
    expect(nextItem(big, paged, 'PageUp', NO_FOLD)).toBe(first)
  })

  it('pages up to the first card of the column without wrapping', () => {
    expect(nextItem(lanes, id(2), 'PageUp', NO_FOLD)).toBe(id(1))
  })

  it('pages down to the last card of the column when fewer than ten remain', () => {
    expect(nextItem(lanes, id(1), 'PageDown', NO_FOLD)).toBe(id(20))
  })

  it('never lands on a folded card', () => {
    const fold = { maxItemsPerCell: 2, pinnedIds: new Set<string>() }
    expect(nextItem(lanes, id(2), 'Down', fold)).toBe(id(11))
    expect(nextItem(lanes, id(2), 'End', fold)).toBe(id(2))
  })

  it('treats a pinned card past the fold as navigable', () => {
    const fold = { maxItemsPerCell: 1, pinnedIds: new Set([id(3)]) }
    expect(nextItem(lanes, id(1), 'Down', fold)).toBe(id(3))
  })

  it('keeps the active card reachable when it is past the fold', () => {
    const fold = { maxItemsPerCell: 1, pinnedIds: new Set<string>() }
    expect(nextItem(lanes, id(3), 'Up', fold)).toBe(id(1))
  })
})
