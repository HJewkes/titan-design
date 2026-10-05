import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  columnSortState,
  nextSortDirection,
  pageRange,
  pageSlice,
  selectionState,
  sortRows,
  useTableState,
  RANGE_DEBOUNCE_MS,
  type ColumnDef,
  type SortDirection,
  type TableFilters,
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

type Finding = { id: string; severity: string; path: string; score: number }

const SEVERITIES = ['error', 'warning', 'info']

function findings(count: number): Finding[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `f${i}`,
    severity: SEVERITIES[i % 3],
    path: `src/file-${i % 7}.ts`,
    score: (i * 37) % 101,
  }))
}

const findingColumns: ColumnDef<Finding>[] = [{ key: 'severity' }, { key: 'path' }]

describe('useTableState with no new option', () => {
  it('passes rows through unfiltered in client mode and keeps every landed field', () => {
    const data = findings(12)

    const { result } = renderHook(() => useTableState<Finding>({ data, defaultPageSize: 5 }))

    expect(result.current.mode).toBe('client')
    expect(result.current.sortedData).toBe(data)
    expect(result.current.paginatedData).toEqual(data.slice(0, 5))
    expect(result.current.totalItems).toBe(12)
    expect(result.current.visibleRowCount).toBe(12)
    expect(result.current.filters).toEqual({})
    expect(result.current.activeFilterCount).toBe(0)
  })
})

describe('useTableState filters', () => {
  const data = findings(30)

  it('filters, then sorts, then pages in client mode', () => {
    const { result } = renderHook(() =>
      useTableState<Finding>({ data, columns: findingColumns, defaultPageSize: 4 })
    )

    act(() => result.current.toggleFilterValue('severity', 'error'))
    act(() => result.current.handleSort('score'))

    const expected = data.filter((r) => r.severity === 'error').sort((a, b) => a.score - b.score)
    expect(result.current.sortedData).toEqual(expected)
    expect(result.current.paginatedData).toEqual(expected.slice(0, 4))
    expect(result.current.totalItems).toBe(10)
    expect(result.current.activeFilterCount).toBe(1)
  })

  it('updates uncontrolled filters through setFilter, toggleFilterValue and clearFilters', () => {
    const { result } = renderHook(() => useTableState<Finding>({ data, columns: findingColumns }))

    act(() => result.current.setFilter('path', 'file-3'))
    act(() => result.current.toggleFilterValue('severity', 'info'))
    expect(result.current.filters).toEqual({ path: 'file-3', severity: ['info'] })

    act(() => result.current.clearFilters('path'))
    expect(result.current.filters).toEqual({ severity: ['info'] })

    act(() => result.current.setFilter('severity', undefined))
    expect(result.current.filters).toEqual({})
  })

  it('calls onFiltersChange for controlled filters and does not change itself', () => {
    const onFiltersChange = vi.fn()
    const filters = { severity: ['error'] }
    const { result } = renderHook(() =>
      useTableState<Finding>({ data, columns: findingColumns, filters, onFiltersChange })
    )

    act(() => result.current.toggleFilterValue('severity', 'info'))

    expect(onFiltersChange).toHaveBeenCalledWith({ severity: ['error', 'info'] })
    expect(result.current.filters).toBe(filters)
    expect(result.current.totalItems).toBe(10)
  })

  it('returns to the first page and the top of the window when the filters change', () => {
    const { result } = renderHook(() =>
      useTableState<Finding>({ data, columns: findingColumns, defaultPageSize: 5 })
    )
    act(() => result.current.setPage(5))
    act(() => result.current.setWindowRange({ start: 20, end: 28 }))

    act(() => result.current.toggleFilterValue('severity', 'warning'))

    expect(result.current.page).toBe(0)
    expect(result.current.windowRange).toEqual({ start: 0, end: 8 })
    expect(result.current.paginatedData).toHaveLength(5)
  })

  it('returns to the first page when a parent changes controlled filters, not when it re-renders them equal', () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useTableState<Finding>({ data, columns: findingColumns, filters }),
      { initialProps: { filters: { severity: ['error'] } as TableFilters } }
    )
    act(() => result.current.setPage(1))

    rerender({ filters: { severity: ['error'] } })
    expect(result.current.page).toBe(1)

    rerender({ filters: { severity: ['info'] } })
    expect(result.current.page).toBe(0)
  })

  it('counts facets over the unfiltered rows and keeps a selected value the rows lack', () => {
    const { result } = renderHook(() =>
      useTableState<Finding>({
        data: findings(9),
        columns: findingColumns,
        defaultFilters: { severity: ['error', 'fatal'] },
      })
    )

    expect(result.current.facetOptions('severity')).toEqual([
      { value: 'error', count: 3, isSelected: true },
      { value: 'warning', count: 3, isSelected: false },
      { value: 'info', count: 3, isSelected: false },
      { value: 'fatal', count: 0, isSelected: true },
    ])
    expect(result.current.facetOptions('severity', { error: 40 })[0]).toEqual({
      value: 'error',
      count: 40,
      isSelected: true,
    })
  })
})

describe('useTableState filter work', () => {
  it('reads each accessor at most once per row per active filter and not again on scroll', () => {
    const data = findings(200)
    const severity = vi.fn((row: Finding) => row.severity)
    const path = vi.fn((row: Finding) => row.path)
    const columns: ColumnDef<Finding>[] = [
      { key: 'severity', accessor: severity },
      { key: 'path', accessor: path },
    ]
    const defaultFilters = { severity: ['error', 'info'], path: 'file' }
    const { result } = renderHook(() => useTableState<Finding>({ data, columns, defaultFilters }))

    const calls = severity.mock.calls.length + path.mock.calls.length
    expect(calls).toBeGreaterThan(0)
    expect(calls).toBeLessThanOrEqual(data.length * 2)

    severity.mockClear()
    path.mockClear()
    for (let start = 0; start < 100; start += 10) {
      act(() => result.current.setWindowRange({ start, end: start + 20 }))
    }
    act(() => result.current.setPage(2))
    expect(severity).not.toHaveBeenCalled()
    expect(path).not.toHaveBeenCalled()
  })
})

describe('useTableState controlled sort and selection', () => {
  const data = findings(6)

  it('calls onSortChange for a controlled sort and does not change itself', () => {
    const onSortChange = vi.fn()
    const sort = { column: 'score', direction: 'asc' as const }
    const { result } = renderHook(() => useTableState<Finding>({ data, sort, onSortChange }))

    act(() => result.current.handleSort('score'))

    expect(onSortChange).toHaveBeenCalledWith({ column: 'score', direction: 'desc' })
    expect(result.current.sortColumn).toBe('score')
    expect(result.current.sortDirection).toBe('asc')
  })

  it('calls onSelectedIdsChange for controlled selection and does not change itself', () => {
    const onSelectedIdsChange = vi.fn()
    const selectedIds = ['f1']
    const { result } = renderHook(() =>
      useTableState<Finding>({ data, selectedIds, onSelectedIdsChange })
    )

    act(() => result.current.toggleRowSelected(data[2]))

    expect(onSelectedIdsChange).toHaveBeenCalledWith(['f1', 'f2'])
    expect(result.current.selectedIds).toBe(selectedIds)
    expect(result.current.isRowSelected(data[2])).toBe(false)
  })

  it('toggles every filtered row and leaves selected rows outside the filter alone', () => {
    const { result } = renderHook(() =>
      useTableState<Finding>({
        data,
        columns: findingColumns,
        defaultSelectedIds: ['f1'],
        defaultFilters: { severity: ['error'] },
        getRowId: (row) => row.id,
      })
    )
    expect(result.current.allRowsSelection).toBe('none')

    act(() => result.current.toggleAllRowsSelected())
    expect(result.current.selectedIds).toEqual(['f1', 'f0', 'f3'])
    expect(result.current.allRowsSelection).toBe('all')

    act(() => result.current.toggleAllRowsSelected())
    expect(result.current.selectedIds).toEqual(['f1'])
  })
})

describe('useTableState manual mode', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const rows = findings(1000)
  const loadedBelow = (end: number) => (index: number) => (index < end ? rows[index] : undefined)

  function renderManual(onRangeNeeded = vi.fn(), loaded = 100) {
    const hook = renderHook(() =>
      useTableState<Finding>({
        mode: 'manual',
        rowCount: 1000,
        getRow: loadedBelow(loaded),
        columns: findingColumns,
        onRangeNeeded,
      })
    )
    return { ...hook, onRangeNeeded }
  }

  it('holds state only and serves the window from getRow with holes for unloaded rows', () => {
    const { result } = renderManual()

    act(() => result.current.toggleFilterValue('severity', 'error'))
    act(() => result.current.setWindowRange({ start: 98, end: 102 }))

    expect(result.current.visibleRowCount).toBe(1000)
    expect(result.current.totalItems).toBe(1000)
    expect(result.current.sortedData).toEqual([])
    expect(result.current.rowAt(5)).toBe(rows[5])
    expect(result.current.windowRows).toEqual([rows[98], rows[99], undefined, undefined])
  })

  it('asks once per missing block, only after the window holds still for the debounce', () => {
    const { result, onRangeNeeded } = renderManual()

    act(() => result.current.setWindowRange({ start: 90, end: 160 }))
    act(() => vi.advanceTimersByTime(RANGE_DEBOUNCE_MS - 1))
    act(() => result.current.setWindowRange({ start: 150, end: 220 }))
    act(() => vi.advanceTimersByTime(RANGE_DEBOUNCE_MS - 1))
    expect(onRangeNeeded).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(onRangeNeeded.mock.calls).toEqual([
      [{ start: 100, end: 200 }],
      [{ start: 200, end: 300 }],
    ])

    act(() => result.current.setWindowRange({ start: 120, end: 190 }))
    act(() => vi.advanceTimersByTime(RANGE_DEBOUNCE_MS))
    act(() => result.current.setWindowRange({ start: 0, end: 50 }))
    act(() => vi.advanceTimersByTime(RANGE_DEBOUNCE_MS))
    expect(onRangeNeeded).toHaveBeenCalledTimes(2)
  })

  it('asks again for a block after a filter change clears the requested ranges', () => {
    const { result, onRangeNeeded } = renderManual(vi.fn(), 0)
    act(() => result.current.setWindowRange({ start: 0, end: 40 }))
    act(() => vi.advanceTimersByTime(RANGE_DEBOUNCE_MS))
    expect(onRangeNeeded).toHaveBeenCalledTimes(1)

    act(() => result.current.toggleFilterValue('severity', 'info'))
    act(() => vi.advanceTimersByTime(RANGE_DEBOUNCE_MS))

    expect(onRangeNeeded).toHaveBeenCalledTimes(2)
    expect(onRangeNeeded).toHaveBeenLastCalledWith({ start: 0, end: 100 })
  })

  it('asks again after clearRequestedRanges, for a consumer retrying a failed load', () => {
    const { result, onRangeNeeded } = renderManual(vi.fn(), 0)
    act(() => result.current.setWindowRange({ start: 0, end: 40 }))
    act(() => vi.advanceTimersByTime(RANGE_DEBOUNCE_MS))

    act(() => result.current.clearRequestedRanges())
    act(() => vi.advanceTimersByTime(RANGE_DEBOUNCE_MS))

    expect(onRangeNeeded).toHaveBeenCalledTimes(2)
  })
})
