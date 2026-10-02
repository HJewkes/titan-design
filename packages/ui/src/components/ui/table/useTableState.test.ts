import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  columnSortState,
  nextSortDirection,
  pageRange,
  pageSlice,
  selectionState,
  sortRows,
  useTableState,
  type SortDirection,
} from './useTableState'

type Row = { id: number; group?: number }

// Deterministic generator: a fixed seed per case keeps every failure reproducible.
function rowsFromSeed(seed: number, count: number): Row[] {
  let state = seed
  const next = () => {
    state = (state * 1103515245 + 12345) % 2 ** 31
    return state
  }
  return Array.from({ length: count }, (_, id) => {
    const roll = next() % 5
    return roll === 4 ? { id } : { id, group: roll }
  })
}

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1)
const DIRECTIONS: Exclude<SortDirection, null>[] = ['asc', 'desc']

describe('sortRows', () => {
  it('returns the input array itself while no column or direction is set', () => {
    const rows = rowsFromSeed(1, 5)
    expect(sortRows(rows, undefined, 'asc')).toBe(rows)
    expect(sortRows(rows, 'group', null)).toBe(rows)
  })

  it('keeps tied rows in input order in both directions', () => {
    for (const seed of SEEDS) {
      for (const direction of DIRECTIONS) {
        const sorted = sortRows(rowsFromSeed(seed, 40), 'group', direction)
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].group === sorted[i - 1].group) {
            expect(sorted[i].id, `seed ${seed} ${direction}`).toBeGreaterThan(sorted[i - 1].id)
          }
        }
      }
    }
  })

  it('keeps tied rows in input order when a custom comparator is inverted for desc', () => {
    const byGroup = (a: Row, b: Row) => (a.group ?? -1) - (b.group ?? -1)
    for (const seed of SEEDS) {
      const sorted = sortRows(rowsFromSeed(seed, 40), 'group', 'desc', { group: byGroup })
      for (let i = 1; i < sorted.length; i++) {
        const tied = byGroup(sorted[i], sorted[i - 1]) === 0
        if (tied) expect(sorted[i].id, `seed ${seed}`).toBeGreaterThan(sorted[i - 1].id)
      }
    }
  })

  it('orders present values by direction and puts every blank after them', () => {
    for (const seed of SEEDS) {
      for (const direction of DIRECTIONS) {
        const groups = sortRows(rowsFromSeed(seed, 40), 'group', direction).map((r) => r.group)
        const firstBlank = groups.indexOf(undefined)
        const present = firstBlank === -1 ? groups : groups.slice(0, firstBlank)
        expect(groups.slice(present.length).every((g) => g === undefined)).toBe(true)
        const expected = [...present].sort((a, b) => (direction === 'asc' ? a! - b! : b! - a!))
        expect(present).toEqual(expected)
      }
    }
  })

  it('keeps every row exactly once and leaves the input untouched', () => {
    const rows = rowsFromSeed(7, 30)
    const before = rows.map((r) => r.id)
    const sorted = sortRows(rows, 'group', 'desc')
    expect(rows.map((r) => r.id)).toEqual(before)
    expect(sorted.map((r) => r.id).sort((a, b) => a - b)).toEqual(before)
  })
})

describe('nextSortDirection', () => {
  it('cycles asc, desc, unsorted, and back to asc', () => {
    expect(nextSortDirection('asc')).toBe('desc')
    expect(nextSortDirection('desc')).toBeNull()
    expect(nextSortDirection(null)).toBe('asc')
  })
})

describe('pageSlice and pageRange', () => {
  it('covers every row exactly once across all pages', () => {
    const rows = Array.from({ length: 23 }, (_, i) => i)
    for (const pageSize of [1, 5, 10, 23, 50]) {
      const pages = Math.ceil(rows.length / pageSize)
      const joined = Array.from({ length: pages }, (_, p) => pageSlice(rows, p, pageSize)).flat()
      expect(joined, `pageSize ${pageSize}`).toEqual(rows)
    }
  })

  it('reports the visible range and which steps are available', () => {
    expect(pageRange(0, 10, 23)).toEqual({
      startItem: 1,
      endItem: 10,
      canGoPrevious: false,
      canGoNext: true,
    })
    expect(pageRange(2, 10, 23)).toEqual({
      startItem: 21,
      endItem: 23,
      canGoPrevious: true,
      canGoNext: false,
    })
  })
})

describe('selectionState', () => {
  const rowIds = ['a', 'b', 'c', 'd']

  it('is all, some or none exactly as the selected subset says, for every subset', () => {
    for (let mask = 0; mask < 2 ** rowIds.length; mask++) {
      const picked = rowIds.filter((_, i) => mask & (1 << i))
      // An id outside the table must never change the answer.
      const state = selectionState(rowIds, new Set([...picked, 'not-a-row']))
      const expected =
        picked.length === rowIds.length ? 'all' : picked.length === 0 ? 'none' : 'some'
      expect(state, `selected ${picked.join(',')}`).toBe(expected)
    }
  })

  it('never reports an empty table as all selected', () => {
    expect(selectionState([], new Set(['a']))).toBe('none')
  })
})

describe('columnSortState', () => {
  it('reads the active column as sorted with its direction and arrow', () => {
    expect(columnSortState('name', 'name', 'asc', true)).toEqual({
      isSorted: true,
      isSortable: true,
      ariaSort: 'ascending',
      glyph: '↑',
    })
    expect(columnSortState('name', 'name', 'desc', true)).toMatchObject({
      ariaSort: 'descending',
      glyph: '↓',
    })
  })

  it('treats the end of the sort cycle as unsorted even with the column still set', () => {
    expect(columnSortState('name', 'name', null, true)).toEqual({
      isSorted: false,
      isSortable: true,
      ariaSort: 'none',
      glyph: '↕',
    })
  })

  it('is sortable only with both a sort key and a sort handler', () => {
    expect(columnSortState(undefined, 'name', 'asc', true).isSortable).toBe(false)
    expect(columnSortState('name', 'name', 'asc', false).isSortable).toBe(false)
    expect(columnSortState('email', 'name', 'asc', true).isSortable).toBe(true)
  })
})

describe('useTableState', () => {
  const data: Row[] = rowsFromSeed(3, 25)

  it('starts a newly sorted column ascending and returns to the first page', () => {
    const { result } = renderHook(() =>
      useTableState<Row>({ data, defaultPageSize: 10, defaultSortColumn: 'group' })
    )
    act(() => result.current.setPage(2))
    act(() => result.current.handleSort('id'))
    expect(result.current.sortColumn).toBe('id')
    expect(result.current.sortDirection).toBe('asc')
    expect(result.current.page).toBe(0)
  })

  it('walks one column through the full sort cycle', () => {
    const { result } = renderHook(() => useTableState<Row>({ data }))
    const seen: SortDirection[] = []
    for (let i = 0; i < 4; i++) {
      act(() => result.current.handleSort('group'))
      seen.push(result.current.sortDirection)
    }
    expect(seen).toEqual(['asc', 'desc', null, 'asc'])
  })

  it('returns to the first page when the page size changes', () => {
    const { result } = renderHook(() => useTableState<Row>({ data, defaultPageSize: 5 }))
    act(() => result.current.setPage(3))
    act(() => result.current.setPageSize(10))
    expect(result.current.page).toBe(0)
    expect(result.current.paginatedData).toHaveLength(10)
    expect(result.current.totalItems).toBe(25)
  })
})
