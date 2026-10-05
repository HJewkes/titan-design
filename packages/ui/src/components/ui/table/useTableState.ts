import { useMemo } from 'react'
import { useControllableState } from '../../../hooks/useControllableState'
import { filterRows } from './table-model'
import type {
  ColumnDef,
  SelectionState,
  SortDirection,
  TableSort,
  UseTableOptions,
  UseTableReturn,
} from './table-state-types'
import { useFacetOptions, useFilterSlice, type PipelineInput } from './useTableFilters'
import {
  useRangeRequests,
  useRestartOnChange,
  useRowAccess,
  useViewState,
  type ViewState,
} from './useTableWindow'

// The pure filter, facet and range functions live in `table-model.ts` (mutation-tested); this
// module composes them and re-exports them beside its own.
export * from './table-model'
export type * from './table-state-types'
export { RANGE_DEBOUNCE_MS } from './useTableWindow'

const isBlank = (v: unknown): boolean => v === null || v === undefined

function compareField<T extends object>(column: string, sign: 1 | -1) {
  return (a: T, b: T): number => {
    // Raw fields compare in JavaScript's relational order, whatever their type.
    const aVal = (a as Record<string, unknown>)[column] as string | number
    const bVal = (b as Record<string, unknown>)[column] as string | number

    // Blanks rank last in BOTH directions — outside the sign, so a missing
    // value never masquerades as the smallest one when the column flips.
    const blanks = isBlank(aVal) ? (isBlank(bVal) ? 0 : 1) : isBlank(bVal) ? -1 : 0
    if (blanks !== 0) return blanks

    if (aVal === bVal) return 0
    return sign * (aVal < bVal ? -1 : 1)
  }
}

/** Rows ordered by one column; `data` itself while unsorted, otherwise a stable sorted copy. */
export function sortRows<T extends object>(
  data: T[],
  column: string | undefined,
  direction: SortDirection,
  comparators?: UseTableOptions<T>['comparators']
): T[] {
  if (!column || !direction) return data

  // Invert rather than reverse: reversing an already-sorted array also flips
  // tied rows, so equal values would shuffle every time direction changed.
  const sign = direction === 'asc' ? 1 : -1
  const custom = comparators?.[column]
  const compare = custom ? (a: T, b: T) => sign * custom(a, b) : compareField<T>(column, sign)
  return [...data].sort(compare)
}

/** The header sort cycle on one column: asc, desc, then unsorted. */
export function nextSortDirection(current: SortDirection): SortDirection {
  if (current === 'asc') return 'desc'
  if (current === 'desc') return null
  return 'asc'
}

export function pageSlice<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = page * pageSize
  return rows.slice(start, start + pageSize)
}

export interface PageRange {
  /** 1-based index of the first row on the page */
  startItem: number
  /** 1-based index of the last row on the page */
  endItem: number
  canGoPrevious: boolean
  canGoNext: boolean
}

export function pageRange(page: number, pageSize: number, totalItems: number): PageRange {
  const totalPages = Math.ceil(totalItems / pageSize)
  return {
    startItem: page * pageSize + 1,
    endItem: Math.min((page + 1) * pageSize, totalItems),
    canGoPrevious: page > 0,
    canGoNext: page < totalPages - 1,
  }
}

/** How much of `rowIds` is selected. An empty table is never `all`. */
export function selectionState(rowIds: string[], selected: Set<string>): SelectionState {
  if (rowIds.length > 0 && rowIds.every((id) => selected.has(id))) return 'all'
  return rowIds.some((id) => selected.has(id)) ? 'some' : 'none'
}

export interface ColumnSortState {
  isSorted: boolean
  isSortable: boolean
  ariaSort: 'ascending' | 'descending' | 'none'
  glyph: '↑' | '↓' | '↕'
}

/** What one header shows for the table's current sort. */
export function columnSortState(
  sortKey: string | undefined,
  sortColumn: string | undefined,
  sortDirection: SortDirection,
  canSort: boolean
): ColumnSortState {
  // The sort cycle ends at direction null with the column still set; that is unsorted, not "still descending".
  const isSorted = !!sortKey && sortColumn === sortKey && sortDirection != null
  if (!isSorted) return { isSorted, isSortable: !!sortKey && canSort, ariaSort: 'none', glyph: '↕' }
  const asc = sortDirection === 'asc'
  return {
    isSorted,
    isSortable: canSort,
    ariaSort: asc ? 'ascending' : 'descending',
    glyph: asc ? '↑' : '↓',
  }
}

const NO_ROWS: never[] = []
const NO_COLUMNS: readonly ColumnDef<never>[] = []
const NO_IDS: readonly string[] = []

const defaultRowId = (row: object): string => String((row as { id?: unknown }).id)

function useSortSlice<T>(options: UseTableOptions<T>) {
  const { sort, onSortChange, defaultSortColumn, defaultSortDirection = null } = options
  const [current, setSort] = useControllableState<TableSort>({
    value: sort,
    defaultValue: { column: defaultSortColumn, direction: defaultSortDirection },
    onChange: onSortChange,
  })
  const handleSort = (column: string) =>
    setSort(
      current.column === column
        ? { column, direction: nextSortDirection(current.direction) }
        : { column, direction: 'asc' }
    )
  return { sort: current, handleSort }
}

/** `filterRows` then `sortRows`, each memoised on its own inputs so a scroll or page change re-runs neither. */
function useSortedRows<T extends object>(input: PipelineInput<T>): T[] {
  const { isManual, data, filters, columns, sort, comparators } = input
  const filtered = useMemo(
    // filterRows hands back `data` itself or a fresh array, so the cast exposes nothing shared.
    () => (isManual ? data : (filterRows(data, filters, columns) as T[])),
    [isManual, data, filters, columns]
  )
  const { column, direction } = sort
  return useMemo(
    () => (isManual ? filtered : sortRows(filtered, column, direction, comparators)),
    [isManual, filtered, column, direction, comparators]
  )
}

function useSelectionSlice<T>(
  options: UseTableOptions<T>,
  rows: readonly (T | undefined)[],
  getRowId: (row: T) => string
) {
  const [ids, setIds] = useControllableState<readonly string[]>({
    value: options.selectedIds,
    defaultValue: options.defaultSelectedIds ?? NO_IDS,
    onChange: options.onSelectedIdsChange,
  })
  const idSet = useMemo(() => new Set(ids), [ids])
  const rowIds = useMemo(
    () => rows.flatMap((row) => (row === undefined ? [] : [getRowId(row)])),
    [rows, getRowId]
  )
  const allRowsSelection = selectionState(rowIds, idSet)
  const toggleRowSelected = (row: T) => {
    const id = getRowId(row)
    setIds(idSet.has(id) ? ids.filter((other) => other !== id) : [...ids, id])
  }
  const toggleAllRowsSelected = () => {
    const shown = new Set(rowIds)
    const others = ids.filter((id) => !shown.has(id))
    setIds(allRowsSelection === 'all' ? others : [...others, ...rowIds])
  }
  const isRowSelected = (row: T) => idSet.has(getRowId(row))
  const selection = { isRowSelected, toggleRowSelected, toggleAllRowsSelected, allRowsSelection }
  return { selectedIds: ids, setSelectedIds: setIds, ...selection }
}

/** Every stage after filter and sort: the page, the window, facets and range requests. */
function useRowStages<T extends object>(
  options: UseTableOptions<T>,
  input: PipelineInput<T>,
  view: ViewState
) {
  const sortedData = useSortedRows(input)
  const facetOptions = useFacetOptions(input)
  const { page, pageSize, windowRange, requestEpoch } = view
  const paginatedData = useMemo(
    () => pageSlice(sortedData, page, pageSize),
    [sortedData, page, pageSize]
  )
  const { isManual } = input
  const { rowCount, getRow, onRangeNeeded } = options
  const access = useRowAccess({ isManual, sortedData, rowCount, getRow, windowRange })
  const { visibleRowCount } = access
  const requests = { windowRange, rowCount: visibleRowCount, getRow, onRangeNeeded, requestEpoch }
  useRangeRequests({ ...requests, isEnabled: isManual })
  return { sortedData, paginatedData, facetOptions, ...access, totalItems: visibleRowCount }
}

/**
 * Hook for managing table sorting, filtering, selection and pagination state. Exported publicly as
 * `useTable`. In `client` mode (the default) rows run `filterRows`, `sortRows`, then `pageSlice`, or
 * `windowSlice` for a windowed body. In `manual` mode the hook only holds state and emits changes;
 * the consumer refetches and serves rows through `getRow`. A filter or sort change returns to the
 * first page, scrolls the window to the top and forgets the ranges already requested.
 *
 * @example
 * const {
 *   paginatedData,
 *   page, pageSize, totalItems,
 *   sortColumn, sortDirection,
 *   setPage, setPageSize, handleSort
 * } = useTable({
 *   data: users,
 *   defaultPageSize: 10,
 * })
 */
export function useTableState<T extends object>(options: UseTableOptions<T>): UseTableReturn<T> {
  const { mode = 'client', data = NO_ROWS, comparators, getRowId = defaultRowId } = options
  const columns = (options.columns ?? NO_COLUMNS) as readonly ColumnDef<T>[]
  const isManual = mode === 'manual'
  const { restart, ...view } = useViewState(options.defaultPageSize ?? 10)
  const { sort, handleSort } = useSortSlice(options)
  const filterSlice = useFilterSlice(options, columns)
  useRestartOnChange(filterSlice.filters, sort, restart)

  const input = { isManual, data, filters: filterSlice.filters, columns, sort, comparators }
  const rows = useRowStages(options, input, view)
  const selectable = isManual ? rows.windowRows : rows.sortedData
  const selection = useSelectionSlice(options, selectable, getRowId)

  const { requestEpoch: _epoch, ...viewFields } = view
  const sortFields = { sortColumn: sort.column, sortDirection: sort.direction, handleSort }
  return { ...viewFields, ...sortFields, ...filterSlice, ...rows, ...selection, mode }
}
