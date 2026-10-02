import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

import { fcAssert } from '../../../../test/property'

import { hostileFixture, matrixFixtures } from './fixtures'
import {
  binValue,
  cellKey,
  cellLabel,
  FOLD_ITEM_ID,
  foldItems,
  groupBands,
  indexCells,
  mutualPairs,
  nextCell,
  positionOf,
  refAt,
} from './matrix-model'
import type { MatrixCell, MatrixItem, MatrixScale } from './types'

const byName = (name: string) => {
  const fixture = matrixFixtures.find((f) => f.name === name)
  if (!fixture) throw new Error(`missing fixture ${name}`)
  return fixture
}

const itemsOf = (count: number): MatrixItem[] =>
  Array.from({ length: count }, (_, i) => ({ id: `item-${i}`, label: `item ${i}` }))

const itemIds = (count: number): Set<string> => new Set(itemsOf(count).map((item) => item.id))

const totalWeight = (cells: MatrixCell[]): number =>
  cells.reduce((sum, cell) => sum + (cell.value ?? 0), 0)

const SIZE = { rows: 5, cols: 5 }
const move = (key: string, row: number, col: number, ctrlKey = false, pageRows = 2) =>
  nextCell({ key, ctrlKey, position: { row, col }, size: SIZE, pageRows })

describe('indexCells', () => {
  it('drops unknown ids, merges duplicates and separates the diagonal on the hostile fixture', () => {
    const index = indexCells(hostileFixture.items, hostileFixture.cells)

    expect(index.items.map((item) => item.id)).toEqual(['module-00', 'module-01'])
    expect(index.dropped).toBe(1)
    expect(index.diagonal.get('module-00')?.value).toBe(2)
    expect(index.cells.get(cellKey('module-00', 'module-01'))?.value).toBe(5)
    expect(index.cells.get(cellKey('module-01', 'module-00'))?.value).toBeNull()
    expect(index.cells.size).toBe(2)
  })

  it('keeps a known weight when a duplicate of it is unknown', () => {
    const items = itemsOf(2)
    const index = indexCells(items, [
      { from: 'item-0', to: 'item-1', value: null },
      { from: 'item-0', to: 'item-1', value: 3, flag: 'cycle' },
    ])

    expect(index.cells.get(cellKey('item-0', 'item-1'))).toEqual({
      from: 'item-0',
      to: 'item-1',
      value: 3,
      flag: 'cycle',
    })
  })
})

describe('foldItems', () => {
  it('folds the tail of Very large into "+376 more" at maxItems 10', () => {
    const { items, cells } = byName('Very large')
    const folded = foldItems(items, cells, 10)

    expect(folded.items).toHaveLength(11)
    expect(folded.items[10]).toEqual({ id: FOLD_ITEM_ID, label: '+376 more' })
    expect(totalWeight(folded.cells)).toBe(totalWeight(cells))
  })

  it('leaves a list at the limit untouched', () => {
    const items = itemsOf(3)
    const cells = [{ from: 'item-0', to: 'item-2', value: 1 }]

    expect(foldItems(items, cells, 3)).toEqual({ items, cells })
  })

  it('preserves the weight of every cell naming known items, for any list and limit', () => {
    const arbitrary = fc.integer({ min: 0, max: 30 }).chain((count) =>
      fc.tuple(
        fc.constant(count),
        fc.array(
          fc.record({
            from: fc.nat({ max: count + 2 }),
            to: fc.nat({ max: count + 2 }),
            value: fc.option(fc.integer({ min: 0, max: 1000 })),
          }),
          { maxLength: 60 }
        ),
        fc.integer({ min: -2, max: 35 })
      )
    )
    fcAssert(
      fc.property(arbitrary, ([count, raw, maxItems]) => {
        const items = itemsOf(count)
        const cells = raw.map((c) => ({
          from: `item-${c.from}`,
          to: `item-${c.to}`,
          value: c.value,
        }))
        const folded = foldItems(items, cells, maxItems)
        const known = cells.filter((c) => itemIds(count).has(c.from) && itemIds(count).has(c.to))
        expect(totalWeight(folded.cells)).toBe(totalWeight(known))
        expect(folded.items.length).toBeLessThanOrEqual(Math.max(maxItems, 0) + 1)
      })
    )
  })
})

describe('binValue', () => {
  it('puts an unknown weight on step 1 and marks it', () => {
    expect(binValue(null, 10)).toEqual({ step: 1, isUnknown: true })
  })

  it('spreads weights over four steps up to the maximum', () => {
    const steps = [1, 4, 9, 16].map((value) => binValue(value, 16, 'sqrt').step)

    expect(steps).toEqual([1, 2, 3, 4])
  })

  it('never lowers the step as the weight grows, on every scale', () => {
    const weight = fc.double({ min: 0, max: 1e6, noNaN: true })
    fcAssert(
      fc.property(
        weight,
        weight,
        weight,
        fc.constantFrom<MatrixScale>('linear', 'sqrt', 'log'),
        (a, b, max, scale) => {
          const [low, high] = a <= b ? [a, b] : [b, a]
          expect(binValue(low, max, scale).step).toBeLessThanOrEqual(
            binValue(high, max, scale).step
          )
        }
      )
    )
  })

  it('never throws and always answers a step on hostile numbers', () => {
    fcAssert(
      fc.property(fc.option(fc.double()), fc.double(), (value, max) => {
        const { step } = binValue(value, max, 'log')
        expect([1, 2, 3, 4]).toContain(step)
      })
    )
  })
})

describe('mutualPairs', () => {
  it('finds the Cycle fixture pair once', () => {
    expect(mutualPairs(byName('Cycle').cells)).toEqual([['module-12', 'module-13']])
  })

  it('ignores one-way edges and self-references', () => {
    const cells = [
      { from: 'a', to: 'b', value: 1 },
      { from: 'c', to: 'c', value: 1 },
    ]

    expect(mutualPairs(cells)).toEqual([])
  })
})

describe('groupBands', () => {
  it('bands the Package level fixture into libraries and apps', () => {
    expect(groupBands(byName('Package level').items)).toEqual([
      { group: 'libraries', start: 0, end: 18 },
      { group: 'apps', start: 18, end: 20 },
    ])
  })

  it('starts a new band when a group returns after a gap', () => {
    const items = [
      { id: 'a', label: 'a', group: 'x' },
      { id: 'b', label: 'b' },
      { id: 'c', label: 'c', group: 'x' },
    ]

    expect(groupBands(items)).toEqual([
      { group: 'x', start: 0, end: 1 },
      { group: 'x', start: 2, end: 3 },
    ])
  })
})

describe('nextCell', () => {
  it('stays put on ArrowRight in the last column and ArrowDown in the last row', () => {
    expect(move('ArrowRight', 2, 4)).toEqual({ row: 2, col: 4 })
    expect(move('ArrowDown', 4, 1)).toEqual({ row: 4, col: 1 })
    expect(move('ArrowLeft', 2, 0)).toEqual({ row: 2, col: 0 })
  })

  it('moves Home and End within the row', () => {
    expect(move('Home', 3, 2)).toEqual({ row: 3, col: 0 })
    expect(move('End', 3, 2)).toEqual({ row: 3, col: 4 })
  })

  it('reaches the corners with Control+Home and Control+End', () => {
    expect(move('Home', 3, 2, true)).toEqual({ row: 0, col: 0 })
    expect(move('End', 1, 2, true)).toEqual({ row: 4, col: 4 })
  })

  it('moves by page rows and clamps at the edges', () => {
    expect(move('PageDown', 1, 3)).toEqual({ row: 3, col: 3 })
    expect(move('PageDown', 3, 3)).toEqual({ row: 4, col: 3 })
    expect(move('PageUp', 1, 3)).toEqual({ row: 0, col: 3 })
  })

  it('answers null for a key the grid does not handle', () => {
    expect(move('a', 1, 1)).toBeNull()
  })

  it('never leaves the matrix for any key sequence', () => {
    const key = fc.constantFrom(
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown'
    )
    fcAssert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        fc.array(fc.tuple(key, fc.boolean()), { maxLength: 40 }),
        fc.integer({ min: -3, max: 60 }),
        (rows, cols, keys, pageRows) => {
          let position = { row: 0, col: 0 }
          for (const [k, ctrlKey] of keys) {
            position =
              nextCell({ key: k, ctrlKey, position, size: { rows, cols }, pageRows }) ?? position
            expect(position.row).toBeGreaterThanOrEqual(0)
            expect(position.row).toBeLessThan(rows)
            expect(position.col).toBeGreaterThanOrEqual(0)
            expect(position.col).toBeLessThan(cols)
          }
        }
      )
    )
  })

  it('clamps a hostile starting position into the matrix', () => {
    const position = { row: Number.NaN, col: 99 }

    expect(nextCell({ key: 'ArrowUp', position, size: SIZE, pageRows: 2 })).toEqual({
      row: 0,
      col: 4,
    })
  })
})

describe('refAt and positionOf', () => {
  const items = itemsOf(3)

  it('reads rows as from under row-depends-on-column and as to otherwise', () => {
    const position = { row: 0, col: 2 }

    expect(refAt(items, position, 'row-depends-on-column')).toEqual({
      from: 'item-0',
      to: 'item-2',
    })
    expect(refAt(items, position, 'column-depends-on-row')).toEqual({
      from: 'item-2',
      to: 'item-0',
    })
  })

  it('round-trips a reference through its position in both directions', () => {
    const ref = { from: 'item-1', to: 'item-2' }
    for (const direction of ['row-depends-on-column', 'column-depends-on-row'] as const) {
      const position = positionOf(items, ref, direction)
      expect(position && refAt(items, position, direction)).toEqual(ref)
    }
  })
})

describe('cellLabel', () => {
  const [a, b] = [
    { id: 'a', label: 'alpha' },
    { id: 'b', label: 'beta' },
  ]
  const cell: MatrixCell = { from: 'a', to: 'b', value: 3 }

  it('names the dependent first under row-depends-on-column', () => {
    expect(cellLabel(a, b, cell, 'row-depends-on-column')).toBe(
      'alpha depends on beta, 3 references'
    )
  })

  it('names the dependency first under column-depends-on-row', () => {
    expect(cellLabel(a, b, cell, 'column-depends-on-row')).toBe(
      'beta is a dependency of alpha, 3 references'
    )
  })

  it('reads an empty cell as no dependency in both directions', () => {
    expect(cellLabel(a, b, undefined, 'row-depends-on-column')).toBe(
      'alpha has no dependency on beta'
    )
    expect(cellLabel(a, b, undefined, 'column-depends-on-row')).toBe(
      'beta is not a dependency of alpha'
    )
  })

  it('reads an unknown weight, a single reference and a cycle in words', () => {
    expect(cellLabel(a, b, { ...cell, value: null }, 'row-depends-on-column')).toBe(
      'alpha depends on beta, weight unknown'
    )
    expect(cellLabel(a, b, { ...cell, value: 1, flag: 'cycle' }, 'row-depends-on-column')).toBe(
      'alpha depends on beta, 1 reference, cycle'
    )
  })
})

describe('hostile input', () => {
  it('never throws and leaves only finite, non-negative or unknown weights', () => {
    const value = fc.oneof(fc.double(), fc.constant(null), fc.integer())
    const id = fc.constantFrom('a', 'b', 'c', 'missing', '')
    const rawCell = fc.record({ from: id, to: id, value })
    const rawItem = fc.record({
      id,
      label: fc.string(),
      group: fc.option(fc.string(), { nil: undefined }),
    })
    fcAssert(
      fc.property(fc.array(rawItem), fc.array(rawCell), fc.double(), (items, cells, maxItems) => {
        const index = indexCells(items, cells)
        const folded = foldItems(index.items, [...index.cells.values()], maxItems)
        mutualPairs(folded.cells)
        groupBands(folded.items)
        for (const c of folded.cells) {
          binValue(c.value, maxItems)
          expect(c.value === null || (Number.isFinite(c.value) && c.value >= 0)).toBe(true)
        }
        for (const c of index.diagonal.values()) {
          expect(c.value === null || (Number.isFinite(c.value) && c.value >= 0)).toBe(true)
        }
      })
    )
  })
})
