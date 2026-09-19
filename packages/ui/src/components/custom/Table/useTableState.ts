import { useState, useMemo } from 'react'

export type SortDirection = 'asc' | 'desc' | null

/**
 * An ascending comparator for one column. Returning 0 lets the caller express a
 * tie-break inside the same function; `useTable` inverts the result for `desc`
 * rather than reversing the array, so ties keep their relative order both ways.
 */
export type TableComparator<T> = (a: T, b: T) => number

const isBlank = (v: unknown): boolean => v === null || v === undefined

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

/**
 * Hook for managing table sorting and pagination state.
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
export function useTable<T extends Record<string, any>>({
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

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data

    const custom = comparators?.[sortColumn]
    // Invert rather than reverse: reversing an already-sorted array also flips
    // tied rows, so equal values would shuffle every time direction changed.
    const sign = sortDirection === 'asc' ? 1 : -1

    if (custom) return [...data].sort((a, b) => sign * custom(a, b))

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      // Blanks rank last in BOTH directions — outside the sign, so a missing
      // value never masquerades as the smallest one when the column flips.
      const blanks = isBlank(aVal) ? (isBlank(bVal) ? 0 : 1) : isBlank(bVal) ? -1 : 0
      if (blanks !== 0) return blanks

      if (aVal === bVal) return 0
      return sign * (aVal < bVal ? -1 : 1)
    })
  }, [data, sortColumn, sortDirection, comparators])

  const paginatedData = useMemo(() => {
    const start = page * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, page, pageSize])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Cycle: asc -> desc -> null
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setPage(0) // Reset to first page on sort change
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0) // Reset to first page on page size change
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
