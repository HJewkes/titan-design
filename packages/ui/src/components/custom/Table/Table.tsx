import React, { createContext, useContext, useState, useMemo } from 'react'
import { View, Text, Pressable, ScrollView, type ViewProps, type PressableProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type SortDirection = 'asc' | 'desc' | null

/**
 * Row height / cell padding axis. `comfortable` is the default reading density;
 * `dense` is the scannable-grid density for tables whose job is to fit many rows
 * on screen at once (a backlog, a log, an audit list).
 */
export type TableDensity = 'comfortable' | 'dense'

/** Cell padding per density, shared by header cells and data cells so a row's two halves cannot drift. */
const CELL_PADDING: Record<TableDensity, string> = {
  comfortable: 'px-4 py-3',
  dense: 'px-2 py-1',
}

interface TableContextType {
  sortColumn?: string
  sortDirection: SortDirection
  onSort?: (column: string) => void
  selectedRows: Set<string>
  onSelectRow?: (id: string, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  selectable: boolean
  allRowIds: string[]
  density: TableDensity
}

const TableContext = createContext<TableContextType>({
  sortDirection: null,
  selectedRows: new Set(),
  selectable: false,
  allRowIds: [],
  density: 'comfortable',
})

export interface TableProps extends ViewProps {
  /** Currently sorted column */
  sortColumn?: string
  /** Sort direction */
  sortDirection?: SortDirection
  /** Callback when sort changes */
  onSort?: (column: string) => void
  /** Selected row IDs (controlled) */
  selectedRows?: Set<string>
  /** Callback when row selection changes */
  onSelectRow?: (id: string, selected: boolean) => void
  /** Callback when select all changes */
  onSelectAll?: (selected: boolean) => void
  /** Enable row selection */
  selectable?: boolean
  /** All row IDs for select all functionality */
  rowIds?: string[]
  /** Whether the table is loading */
  isLoading?: boolean
  /** Number of skeleton rows to show when loading */
  loadingRowCount?: number
  /** Row height / cell padding. Defaults to `comfortable`. */
  density?: TableDensity
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Table component with sorting support.
 *
 * @example
 * <Table sortColumn={sortCol} sortDirection={sortDir} onSort={handleSort}>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHeaderCell sortKey="name">Name</TableHeaderCell>
 *       <TableHeaderCell sortKey="email">Email</TableHeaderCell>
 *       <TableHeaderCell sortKey="status">Status</TableHeaderCell>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     {data.map(row => (
 *       <TableRow key={row.id}>
 *         <TableCell>{row.name}</TableCell>
 *         <TableCell>{row.email}</TableCell>
 *         <TableCell>{row.status}</TableCell>
 *       </TableRow>
 *     ))}
 *   </TableBody>
 * </Table>
 */
export function Table({
  sortColumn,
  sortDirection = null,
  onSort,
  selectedRows = new Set(),
  onSelectRow,
  onSelectAll,
  selectable = false,
  rowIds = [],
  isLoading = false,
  loadingRowCount = 5,
  density = 'comfortable',
  className,
  children,
  ...props
}: TableProps) {
  return (
    <TableContext.Provider
      value={{
        sortColumn,
        sortDirection,
        onSort,
        selectedRows,
        onSelectRow,
        onSelectAll,
        selectable,
        allRowIds: rowIds,
        density,
      }}
    >
      <View className={cn('w-full', className)} {...props}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View role="table" className="w-full min-w-full">
            {isLoading ? (
              <TableLoadingSkeleton rowCount={loadingRowCount} />
            ) : (
              children
            )}
          </View>
        </ScrollView>
      </View>
    </TableContext.Provider>
  )
}

export interface TableHeaderProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Table header container.
 */
export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <View
      role="rowgroup"
      className={cn('bg-background-subtle rounded-t-lg', className)}
    >
      {children}
    </View>
  )
}

export interface TableBodyProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Table body container.
 */
export function TableBody({ children, className }: TableBodyProps) {
  return (
    <View role="rowgroup" className={className}>
      {children}
    </View>
  )
}

export interface TableRowProps extends ViewProps {
  /** Whether the row is selected */
  isSelected?: boolean
  /** Whether the row is hoverable */
  isHoverable?: boolean
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Table row.
 */
export function TableRow({
  isSelected = false,
  isHoverable = true,
  className,
  children,
  ...props
}: TableRowProps) {
  return (
    <View
      role="row"
      className={cn(
        'flex-row border-b border-divider',
        isHoverable && 'web:hover:bg-interactive-hover',
        isSelected && 'bg-interactive-selected',
        className
      )}
      {...props}
    >
      {children}
    </View>
  )
}

export interface TableHeaderCellProps extends Omit<PressableProps, 'children'> {
  /** Sort key for this column */
  sortKey?: string
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Cell width in pixels */
  width?: number
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Table header cell with optional sorting.
 */
export function TableHeaderCell({
  sortKey,
  align = 'left',
  width,
  className,
  children,
  onPress,
  ...props
}: TableHeaderCellProps) {
  const { sortColumn, sortDirection, onSort, density } = useContext(TableContext)
  const isSorted = sortKey && sortColumn === sortKey
  const isSortable = !!sortKey && !!onSort
  const ariaSort = isSorted
    ? sortDirection === 'asc'
      ? 'ascending'
      : sortDirection === 'desc'
        ? 'descending'
        : 'none'
    : 'none'

  const handlePress = (e: any) => {
    if (isSortable && sortKey) {
      onSort(sortKey)
    }
    onPress?.(e)
  }

  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }

  const content = (
    <>
      <Text
        className={cn(
          'text-xs font-semibold uppercase tracking-wider text-text-secondary',
          isSorted && 'text-text-primary'
        )}
      >
        {children}
      </Text>
      {isSortable && (
        <Text className={cn('ml-1 text-xs', isSorted ? 'text-text-primary' : 'text-text-tertiary')}>
          {isSorted ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
        </Text>
      )}
    </>
  )

  if (isSortable) {
    // columnheader cell wraps the sort button so it carries proper table
    // semantics (role + aria-sort) while the inner control keeps its button role.
    return (
      <View
        role="columnheader"
        aria-sort={ariaSort}
        style={width ? { width } : { flex: 1 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${children}`}
          onPress={handlePress}
          className={cn(
            'flex-row items-center',
            CELL_PADDING[density],
            alignStyles[align],
            'web:hover:bg-interactive-hover active:bg-interactive-active',
            className
          )}
          {...props}
        >
          {content}
        </Pressable>
      </View>
    )
  }

  return (
    <View
      role="columnheader"
      style={width ? { width } : { flex: 1 }}
      className={cn('flex-row items-center', CELL_PADDING[density], alignStyles[align], className)}
    >
      {content}
    </View>
  )
}

export interface TableCellProps extends ViewProps {
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Cell width in pixels */
  width?: number
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Table data cell.
 */
export function TableCell({
  align = 'left',
  width,
  className,
  children,
  ...props
}: TableCellProps) {
  const { density } = useContext(TableContext)
  const alignStyles = {
    left: 'items-start',
    center: 'items-center',
    right: 'items-end',
  }

  return (
    <View
      role="cell"
      style={width ? { width } : { flex: 1 }}
      className={cn('justify-center', CELL_PADDING[density], alignStyles[align], className)}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text className={cn(density === 'dense' ? 'text-xs' : 'text-sm', 'text-text-primary')}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  )
}

// Pagination component

export interface TablePaginationProps {
  /** Current page (0-indexed) */
  page: number
  /** Items per page */
  pageSize: number
  /** Total number of items */
  totalItems: number
  /** Available page size options */
  pageSizeOptions?: number[]
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void
  /** Additional className */
  className?: string
}

/**
 * Pagination controls for table.
 *
 * @example
 * <TablePagination
 *   page={page}
 *   pageSize={pageSize}
 *   totalItems={100}
 *   onPageChange={setPage}
 *   onPageSizeChange={setPageSize}
 * />
 */
export function TablePagination({
  page,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  className,
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  const startItem = page * pageSize + 1
  const endItem = Math.min((page + 1) * pageSize, totalItems)

  const canGoPrevious = page > 0
  const canGoNext = page < totalPages - 1

  return (
    <View
      className={cn(
        'flex-row items-center justify-between px-4 py-3 border-t border-divider',
        className
      )}
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-text-secondary">
          Rows per page:
        </Text>
        <View className="flex-row gap-1">
          {pageSizeOptions.map((size) => (
            <Pressable
              key={size}
              onPress={() => onPageSizeChange?.(size)}
              className={cn(
                'px-2 py-1 rounded',
                pageSize === size
                  ? 'bg-brand-primary-subtle text-brand-primary'
                  : 'text-text-secondary web:hover:bg-interactive-hover'
              )}
            >
              <Text
                className={cn(
                  'text-sm font-medium',
                  pageSize === size ? 'text-brand-primary' : 'text-text-secondary'
                )}
              >
                {size}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="flex-row items-center gap-4">
        <Text className="text-sm text-text-secondary">
          {startItem}-{endItem} of {totalItems}
        </Text>

        <View className="flex-row gap-1">
          <Pressable
            disabled={!canGoPrevious}
            onPress={() => onPageChange(page - 1)}
            accessibilityLabel="Previous page"
            className={cn(
              'p-2 rounded',
              canGoPrevious
                ? 'web:hover:bg-interactive-hover active:bg-interactive-active'
                : 'opacity-50'
            )}
          >
            <Text className="text-text-secondary">←</Text>
          </Pressable>

          <Pressable
            disabled={!canGoNext}
            onPress={() => onPageChange(page + 1)}
            accessibilityLabel="Next page"
            className={cn(
              'p-2 rounded',
              canGoNext
                ? 'web:hover:bg-interactive-hover active:bg-interactive-active'
                : 'opacity-50'
            )}
          >
            <Text className="text-text-secondary">→</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

// Helper hook for managing table state

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
      setSortDirection((prev) =>
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      )
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

// Selection components

export interface TableSelectAllCellProps {
  className?: string
}

/**
 * Checkbox cell for selecting all rows in header.
 */
export function TableSelectAllCell({ className }: TableSelectAllCellProps) {
  const { selectedRows, onSelectAll, allRowIds, selectable } = useContext(TableContext)

  if (!selectable) return null

  const allSelected = allRowIds.length > 0 && allRowIds.every((id) => selectedRows.has(id))
  const someSelected = allRowIds.some((id) => selectedRows.has(id)) && !allSelected

  return (
    <View className={cn('w-12 px-4 py-3 items-center justify-center', className)}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: allSelected ? true : someSelected ? 'mixed' : false }}
        onPress={() => onSelectAll?.(!allSelected)}
        className={cn(
          'w-5 h-5 rounded border-2 items-center justify-center',
          allSelected
            ? 'bg-brand-primary border-brand-primary'
            : someSelected
            ? 'bg-brand-primary-subtle border-brand-primary'
            : 'border-hairline-strong bg-transparent'
        )}
      >
        {(allSelected || someSelected) && (
          <Text className="text-white text-xs font-bold">
            {allSelected ? '✓' : '−'}
          </Text>
        )}
      </Pressable>
    </View>
  )
}

export interface TableSelectCellProps {
  /** Row ID for selection */
  rowId: string
  className?: string
}

/**
 * Checkbox cell for selecting individual rows.
 */
export function TableSelectCell({ rowId, className }: TableSelectCellProps) {
  const { selectedRows, onSelectRow, selectable } = useContext(TableContext)

  if (!selectable) return null

  const isSelected = selectedRows.has(rowId)

  return (
    <View className={cn('w-12 px-4 py-3.5 items-center justify-center', className)}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        onPress={() => onSelectRow?.(rowId, !isSelected)}
        className={cn(
          'w-5 h-5 rounded border-2 items-center justify-center',
          isSelected
            ? 'bg-brand-primary border-brand-primary'
            : 'border-hairline-strong bg-transparent web:hover:border-brand-primary'
        )}
      >
        {isSelected && (
          <Text className="text-white text-xs font-bold">✓</Text>
        )}
      </Pressable>
    </View>
  )
}

// Loading skeleton

interface TableLoadingSkeletonProps {
  rowCount: number
}

function TableLoadingSkeleton({ rowCount }: TableLoadingSkeletonProps) {
  return (
    <>
      <TableHeader>
        <TableRow isHoverable={false}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="flex-1 px-4 py-3">
              <View className="h-4 w-20 bg-interactive-disabled rounded animate-pulse" />
            </View>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <TableRow key={rowIndex} isHoverable={false}>
            {[1, 2, 3, 4].map((colIndex) => (
              <View key={colIndex} className="flex-1 px-4 py-3.5">
                <View
                  className="h-4 bg-interactive-disabled rounded animate-pulse"
                  style={{ width: `${50 + Math.random() * 40}%` }}
                />
              </View>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </>
  )
}

// Empty state

export interface TableEmptyStateProps {
  /** Title for empty state */
  title?: string
  /** Description for empty state */
  description?: string
  /** Action button/element */
  action?: React.ReactNode
  /** Custom icon */
  icon?: React.ReactNode
  /** Additional className */
  className?: string
}

/**
 * Empty state component for tables with no data.
 */
export function TableEmptyState({
  title = 'No data',
  description = 'There are no items to display.',
  action,
  icon,
  className,
}: TableEmptyStateProps) {
  return (
    <View className={cn('items-center justify-center py-12 px-4', className)}>
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-lg font-semibold text-text-primary mb-1">{title}</Text>
      <Text className="text-sm text-text-secondary text-center mb-4">{description}</Text>
      {action}
    </View>
  )
}
