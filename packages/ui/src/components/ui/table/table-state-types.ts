import type { ReactNode } from 'react'
import type {
  FacetOption,
  RowRange,
  TableFilterColumn,
  TableFilters,
  TableFilterValue,
} from './table-model'

export type SortDirection = 'asc' | 'desc' | null

/**
 * An ascending comparator for one column. Returning 0 lets the caller express a
 * tie-break inside the same function; `useTable` inverts the result for `desc`
 * rather than reversing the array, so ties keep their relative order both ways.
 * Because the whole result is inverted, a blank the comparator ranks last
 * ascending ranks first descending; mark blanks with `UseTableOptions.isBlank`
 * to keep them last both ways.
 */
export type TableComparator<T> = (a: T, b: T) => number

/** True when a row has no value for one column, so the sort puts it last in both directions. */
export type TableBlankPredicate<T> = (row: T) => boolean

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
  /**
   * Per-column blank tests. A blank row sorts after every other row in both
   * directions, as a null or undefined field does under the default compare;
   * only the compare between two rows of the same blankness is inverted for
   * `desc`. Two blank rows still meet the column's comparator, so its
   * tie-break holds among them. Pass a stable object: a new one re-runs the sort.
   */
  isBlank?: Partial<Record<keyof T & string, TableBlankPredicate<T>>> &
    Record<string, TableBlankPredicate<T> | undefined>
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

export type SelectionState = 'all' | 'some' | 'none'
