import { useState, useMemo } from 'react'

export type SortDirection = 'asc' | 'desc' | null

/**
 * An ascending comparator for one column. Returning 0 lets the caller express a
 * tie-break inside the same function; `useTable` inverts the result for `desc`
 * rather than reversing the array, so ties keep their relative order both ways.
 */
export type TableComparator<T> = (a: T, b: T) => number

export interface UseTableOptions<T> {
  data: T[]
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
}

export interface UseTableReturn<T> {
  sortedData: T[]
  paginatedData: T[]
  page: number
  pageSize: number
  totalItems: number
  sortColumn?: string
  sortDirection: SortDirection
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  handleSort: (column: string) => void
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

/**
 * Hook for managing table sorting and pagination state. Exported publicly as `useTable`.
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
export function useTableState<T extends Record<string, any>>({
  data,
  defaultPageSize = 10,
  defaultSortColumn,
  defaultSortDirection = null,
  comparators,
}: UseTableOptions<T>): UseTableReturn<T> {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [sortColumn, setSortColumn] = useState<string | undefined>(defaultSortColumn)
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection)

  const sortedData = useMemo(
    () => sortRows(data, sortColumn, sortDirection, comparators),
    [data, sortColumn, sortDirection, comparators]
  )
  const paginatedData = useMemo(
    () => pageSlice(sortedData, page, pageSize),
    [sortedData, page, pageSize]
  )

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(nextSortDirection)
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setPage(0)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  return {
    sortedData,
    paginatedData,
    page,
    pageSize,
    totalItems: data.length,
    sortColumn,
    sortDirection,
    setPage,
    setPageSize: handlePageSizeChange,
    handleSort,
  }
}
