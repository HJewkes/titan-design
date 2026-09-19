import React from 'react'
import { View, ScrollView, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { TableContext, type TableDensity } from './TableContext'
import type { SortDirection } from './useTableState'

export type { TableDensity } from './TableContext'
export { TableHeaderCell, type TableHeaderCellProps } from './TableHeaderCell'
export { TableCell, type TableCellProps } from './TableCell'
export { TablePagination, type TablePaginationProps } from './TablePagination'
export {
  TableSelectAllCell,
  TableSelectCell,
  type TableSelectAllCellProps,
  type TableSelectCellProps,
} from './TableSelection'
export { TableEmptyState, type TableEmptyStateProps } from './TableEmptyState'
export {
  useTable,
  type SortDirection,
  type TableComparator,
  type UseTableOptions,
  type UseTableReturn,
} from './useTableState'

// A horizontal ScrollView sizes its content to max-content; a definite width makes the table fill the viewport and flexible cells shrink.
const SCROLL_CONTENT = { width: '100%' } as const

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
  /**
   * Width the columns need, below which the table scrolls horizontally instead
   * of squeezing them into overlap. Pair with {@link useColumnFit}, which drops
   * columns first and reports what the survivors need.
   */
  contentMinWidth?: number
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
  contentMinWidth,
  className,
  children,
  ...props
}: TableProps) {
  // width 100% + a minWidth floor resolves to max(container, floor): the table fills its
  // container, and once the columns need more than that it overflows and scrolls.
  const contentStyle =
    contentMinWidth === undefined
      ? SCROLL_CONTENT
      : { ...SCROLL_CONTENT, minWidth: contentMinWidth }

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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={contentMinWidth !== undefined}
          contentContainerStyle={contentStyle}
        >
          <View role="table" className="w-full min-w-full">
            {isLoading ? <TableLoadingSkeleton rowCount={loadingRowCount} /> : children}
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
    <View role="rowgroup" className={cn('bg-background-subtle rounded-t-lg', className)}>
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
