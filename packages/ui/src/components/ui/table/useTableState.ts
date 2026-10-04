import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useControllableState } from '../../../hooks/useControllableState'
import {
  activeFilterCount as countActiveFilters,
  clearFilters as withoutFilters,
  facetCounts,
  facetOptions as mergeFacetOptions,
  filterRows,
  missingRanges,
  toggleSetFilter,
  windowSlice,
  type FacetOption,
  type RowRange,
  type TableFilterColumn,
  type TableFilters,
  type TableFilterValue,
} from './table-model'

export {
  activeFilterCount,
  alignRange,
  clearFilters,
  facetCounts,
  facetOptions,
  filterRows,
  missingRanges,
  toggleSetFilter,
  windowSlice,
  DEFAULT_BLOCK_ROWS,
  MAX_BLOCK_ROWS,
  type FacetOption,
  type RowRange,
  type TableFilterColumn,
  type TableFilters,
  type TableFilterValue,
} from './table-model'

export type SortDirection = 'asc' | 'desc' | null

/**
 * An ascending comparator for one column. Returning 0 lets the caller express a
 * tie-break inside the same function; `useTable` inverts the result for `desc`
 * rather than reversing the array, so ties keep their relative order both ways.
 */
export type TableComparator<T> = (a: T, b: T) => number

/** `client` filters, sorts and pages `data` in the hook; `manual` holds state and reads rows from `getRow`. */
export type TableMode = 'client' | 'manual'

/** A column the hook filters and facets on. `accessor` reads the value from a `Row`. */
export type ColumnDef<T> = TableFilterColumn<T>

/** Renders one row of a windowed body; `index` is the row's position after filter and sort. */
export type TableRowRenderer<T> = (row: T, index: number) => ReactNode

export interface TableSort {
  column?: string
  direction: SortDirection
}

export interface UseTableOptions<T> {
  /** The rows in `client` mode. `manual` mode ignores it and reads `getRow`. */
  data?: T[]
  defaultPageSize?: number
  defaultSortColumn?: string
  defaultSortDirection?: SortDirection
  /**
   * Per-column ascending comparators, for columns whose order is not their raw
   * field order — a severity ranked critical→low rather than alphabetically, a
   * numeric field that should sort blanks last, a date read newest-first.
   * Columns absent from the map fall back to the default field compare.
   */
  comparators?: Partial<Record<keyof T & string, TableComparator<T>>> &
    Record<string, TableComparator<T> | undefined>
  /** Defaults to `client`. */
  mode?: TableMode
  /** The filterable columns. Pass a stable array: a new one re-runs the filter. */
  columns?: readonly ColumnDef<T>[]
  /** Identifies a row for selection; defaults to `String(row.id)`. Pass a stable function. */
  getRowId?: (row: T) => string
  /** `manual` mode: the row count after the server's filters. */
  rowCount?: number
  /** `manual` mode: the loaded row at `index`, or `undefined` while it is not loaded. */
  getRow?: (index: number) => T | undefined
  /** `manual` mode: asks for one aligned block of unloaded rows, once per block, after the window settles. */
  onRangeNeeded?: (range: RowRange) => void
  filters?: TableFilters
  defaultFilters?: TableFilters
  onFiltersChange?: (filters: TableFilters) => void
  selectedIds?: readonly string[]
  defaultSelectedIds?: readonly string[]
  onSelectedIdsChange?: (ids: readonly string[]) => void
  /** Controlled sort; `defaultSortColumn` and `defaultSortDirection` seed the uncontrolled one. */
  sort?: TableSort
  onSortChange?: (sort: TableSort) => void
}

export interface UseTableReturn<T> {
  /** `client`: the filtered and sorted rows. `manual`: `data` as given. */
  sortedData: T[]
  paginatedData: T[]
  page: number
  pageSize: number
  /** The row count after filtering: `sortedData.length` in `client` mode, `rowCount` in `manual`. */
  totalItems: number
  sortColumn?: string
  sortDirection: SortDirection
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  handleSort: (column: string) => void
  mode: TableMode
  filters: TableFilters
  /** Sets one field's filter; `undefined` clears it. */
  setFilter: (field: string, value: TableFilterValue | undefined) => void
  toggleFilterValue: (field: string, value: string) => void
  /** Clears every filter, or only `field`'s. */
  clearFilters: (field?: string) => void
  activeFilterCount: number
  /** A facet's options. `client` mode counts `data` when `counts` is omitted. */
  facetOptions: (field: string, counts?: Readonly<Record<string, number>>) => FacetOption[]
  visibleRowCount: number
  rowAt: (index: number) => T | undefined
  /** The rows a windowed body shows; a slot is `undefined` while its row is not loaded. */
  windowRange: RowRange
  setWindowRange: (range: RowRange) => void
  windowRows: (T | undefined)[]
  /** Lets `onRangeNeeded` ask again for blocks it already asked for, e.g. after a failed load. */
  clearRequestedRanges: () => void
  selectedIds: readonly string[]
  setSelectedIds: (ids: readonly string[]) => void
  isRowSelected: (row: T) => boolean
  toggleRowSelected: (row: T) => void
  /** Selects every selectable row, or deselects them all when all are selected. */
  toggleAllRowsSelected: () => void
  /** How much of the selectable rows is selected: filtered rows in `client` mode, loaded window rows in `manual`. */
  allRowsSelection: SelectionState
}

const isBlank = (v: unknown): boolean => v === null || v === undefined

function compareField<T extends Record<string, unknown>>(column: string, sign: 1 | -1) {
  return (a: T, b: T): number => {
    // Raw fields compare in JavaScript's relational order, whatever their type.
    const aVal = a[column] as string | number
    const bVal = b[column] as string | number

    // Blanks rank last in BOTH directions — outside the sign, so a missing
    // value never masquerades as the smallest one when the column flips.
    const blanks = isBlank(aVal) ? (isBlank(bVal) ? 0 : 1) : isBlank(bVal) ? -1 : 0
    if (blanks !== 0) return blanks

    if (aVal === bVal) return 0
    return sign * (aVal < bVal ? -1 : 1)
  }
}

/** Rows ordered by one column; `data` itself while unsorted, otherwise a stable sorted copy. */
export function sortRows<T extends Record<string, unknown>>(
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

export type SelectionState = 'all' | 'some' | 'none'

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

/** How long the window must stay put before `onRangeNeeded` asks for its unloaded blocks. */
export const RANGE_DEBOUNCE_MS = 150

const NO_ROWS: never[] = []
const NO_COLUMNS: readonly ColumnDef<never>[] = []
const NO_FILTERS: TableFilters = {}
const NO_IDS: readonly string[] = []
const EMPTY_RANGE: RowRange = { start: 0, end: 0 }

const defaultRowId = (row: Record<string, unknown>): string => String(row.id)

const toRowCount = (count: number | undefined): number =>
  count !== undefined && Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0

const sameRange = (a: RowRange, b: RowRange): boolean => a.start === b.start && a.end === b.end

/** Page, page size and window, which every filter or sort change sends back to the top. */
function useViewState(defaultPageSize: number) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSizeState] = useState(defaultPageSize)
  const [windowRange, setWindowRangeState] = useState<RowRange>(EMPTY_RANGE)
  // Bumped to forget which blocks `onRangeNeeded` already asked for.
  const [requestEpoch, setRequestEpoch] = useState(0)

  const setPageSize = (size: number) => {
    setPageSizeState(size)
    setPage(0)
  }
  const setWindowRange = useCallback((next: RowRange) => {
    setWindowRangeState((current) => (sameRange(current, next) ? current : next))
  }, [])
  const clearRequestedRanges = useCallback(() => setRequestEpoch((epoch) => epoch + 1), [])
  const restart = () => {
    setPage(0)
    setWindowRangeState((range) => ({ start: 0, end: range.end - range.start }))
    clearRequestedRanges()
  }
  const view = { page, setPage, pageSize, setPageSize, windowRange, setWindowRange }
  return { ...view, requestEpoch, clearRequestedRanges, restart }
}

/** Calls `restart` on the render where `key` first differs from the one seen before. */
function useRestartOnChange(key: string, restart: () => void) {
  const [seen, setSeen] = useState(key)
  if (seen !== key) {
    setSeen(key)
    restart()
  }
}

// By content, so a parent passing an equal controlled object each render does not reset the page.
const viewKey = (filters: TableFilters, sort: TableSort): string =>
  JSON.stringify([
    Object.keys(filters)
      .sort()
      .map((field) => [field, filters[field]]),
    sort.column ?? null,
    sort.direction,
  ])

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

function useFilterSlice<T>(options: UseTableOptions<T>, columns: readonly ColumnDef<T>[]) {
  const [filters, setFilters] = useControllableState<TableFilters>({
    value: options.filters,
    defaultValue: options.defaultFilters ?? NO_FILTERS,
    onChange: options.onFiltersChange,
  })
  const setFilter = (field: string, value: TableFilterValue | undefined) =>
    setFilters(
      value === undefined ? withoutFilters(filters, field) : { ...filters, [field]: value }
    )
  return {
    filters,
    setFilter,
    toggleFilterValue: (field: string, value: string) =>
      setFilters(toggleSetFilter(filters, field, value)),
    clearFilters: (field?: string) => setFilters(withoutFilters(filters, field)),
    activeFilterCount: countActiveFilters(filters, columns),
  }
}

interface PipelineInput<T> {
  isManual: boolean
  data: T[]
  filters: TableFilters
  columns: readonly ColumnDef<T>[]
  sort: TableSort
  comparators: UseTableOptions<T>['comparators']
}

/** `filterRows` then `sortRows`, each memoised on its own inputs so a scroll or page change re-runs neither. */
function useSortedRows<T extends Record<string, unknown>>(input: PipelineInput<T>): T[] {
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

/** Each field's facet counts over `rows`, counted on first ask and kept for these rows and columns. */
function facetCountsByField<T>(rows: readonly T[], columns: readonly ColumnDef<T>[]) {
  const cache = new Map<string, Record<string, number>>()
  return (field: string): Record<string, number> => {
    const cached = cache.get(field)
    if (cached) return cached
    const counts = facetCounts(rows, columns.find((c) => c.key === field) ?? { key: field })
    cache.set(field, counts)
    return counts
  }
}

function useFacetOptions<T>(input: PipelineInput<T>) {
  const { isManual, data, filters, columns } = input
  const countsFor = useMemo(() => facetCountsByField(data, columns), [data, columns])
  return (field: string, counts?: Readonly<Record<string, number>>): FacetOption[] => {
    const value = filters[field]
    const selected = Array.isArray(value) ? (value as readonly string[]) : NO_IDS
    return mergeFacetOptions(counts ?? (isManual ? undefined : countsFor(field)), selected)
  }
}

interface RangeRequestInput<T> {
  isEnabled: boolean
  windowRange: RowRange
  rowCount: number
  getRow?: (index: number) => T | undefined
  onRangeNeeded?: (range: RowRange) => void
  requestEpoch: number
}

/** Asks once per unloaded block of the window, after the window has held still for the debounce. */
function useRangeRequests<T>(input: RangeRequestInput<T>) {
  const { isEnabled, windowRange, rowCount, getRow, onRangeNeeded, requestEpoch } = input
  const latest = useRef({ getRow, onRangeNeeded })
  const requested = useRef({ epoch: requestEpoch, starts: new Set<number>() })
  useEffect(() => {
    latest.current = { getRow, onRangeNeeded }
  })
  const { start, end } = windowRange
  useEffect(() => {
    if (!isEnabled) return
    const timer = setTimeout(() => {
      if (requested.current.epoch !== requestEpoch) {
        requested.current = { epoch: requestEpoch, starts: new Set() }
      }
      const { starts } = requested.current
      const isLoaded = (index: number) => latest.current.getRow?.(index) !== undefined
      for (const block of missingRanges({ start, end }, rowCount, isLoaded)) {
        if (starts.has(block.start)) continue
        starts.add(block.start)
        latest.current.onRangeNeeded?.(block)
      }
    }, RANGE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [isEnabled, start, end, rowCount, requestEpoch])
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

interface RowAccessInput<T> {
  isManual: boolean
  sortedData: T[]
  rowCount?: number
  getRow?: (index: number) => T | undefined
  windowRange: RowRange
}

/** The pipeline's last stage for a windowed body: `windowSlice` over the sorted rows or `getRow`. */
function useRowAccess<T>({
  isManual,
  sortedData,
  rowCount,
  getRow,
  windowRange,
}: RowAccessInput<T>) {
  const visibleRowCount = isManual ? toRowCount(rowCount) : sortedData.length
  const rowAt = useCallback(
    (index: number) => (isManual ? getRow?.(index) : sortedData[index]),
    [isManual, getRow, sortedData]
  )
  const windowRows = useMemo(
    () => windowSlice(rowAt, windowRange, visibleRowCount),
    [rowAt, windowRange, visibleRowCount]
  )
  return { visibleRowCount, rowAt, windowRows }
}

type ViewState = Omit<ReturnType<typeof useViewState>, 'restart'>

/** Every stage after filter and sort: the page, the window, facets and range requests. */
function useRowStages<T extends Record<string, unknown>>(
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
export function useTableState<T extends Record<string, any>>(
  options: UseTableOptions<T>
): UseTableReturn<T> {
  const { mode = 'client', data = NO_ROWS, comparators, getRowId = defaultRowId } = options
  const columns = (options.columns ?? NO_COLUMNS) as readonly ColumnDef<T>[]
  const isManual = mode === 'manual'
  const { restart, ...view } = useViewState(options.defaultPageSize ?? 10)
  const { sort, handleSort } = useSortSlice(options)
  const filterSlice = useFilterSlice(options, columns)
  useRestartOnChange(viewKey(filterSlice.filters, sort), restart)

  const input = { isManual, data, filters: filterSlice.filters, columns, sort, comparators }
  const rows = useRowStages(options, input, view)
  const selectable = isManual ? rows.windowRows : rows.sortedData
  const selection = useSelectionSlice(options, selectable, getRowId)

  const { requestEpoch: _epoch, ...viewFields } = view
  const sortFields = { sortColumn: sort.column, sortDirection: sort.direction, handleSort }
  return { ...viewFields, ...sortFields, ...filterSlice, ...rows, ...selection, mode }
}
