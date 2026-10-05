// Shim for migration M4. The family lives in `ui/table` now; this file keeps the
// old import path alive for one release. The re-exports below import the bindings
// first and export them with no `from` clause on purpose:
// `eslint-rules/deprecated-export-registry.js` unifies a re-export identity only
// when the statement carries a source, so `export { X } from '…'` would mark the
// NEW definition deprecated too (lesson from migration M1, #276).
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TablePagination,
  useTable,
  fitColumns,
  useColumnFit,
  useMeasuredWidth,
} from '../../ui/table'
import type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableRowProps,
  TableHeaderCellProps,
  TableCellProps,
  TablePaginationProps,
  UseTableOptions,
  UseTableReturn,
  SortDirection,
  TableDensity,
  TableComparator,
  TableColumnFit,
  ColumnFitResult,
  UseColumnFitResult,
  UseMeasuredWidthResult,
} from '../../ui/table'

/**
 * @deprecated Moved to `ui/table` (migration M4). Import from `@titan-design/react-ui`
 * as before, or from `@/components/ui/table` by path. This re-export is removed in 0.23.0.
 */
export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TablePagination,
  useTable,
  fitColumns,
  useColumnFit,
  useMeasuredWidth,
}

/**
 * @deprecated Moved to `ui/table` (migration M4). Import these types from
 * `@titan-design/react-ui` as before, or from `@/components/ui/table` by path.
 * This re-export is removed in 0.23.0.
 */
export type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableRowProps,
  TableHeaderCellProps,
  TableCellProps,
  TablePaginationProps,
  UseTableOptions,
  UseTableReturn,
  SortDirection,
  TableDensity,
  TableComparator,
  TableColumnFit,
  ColumnFitResult,
  UseColumnFitResult,
  UseMeasuredWidthResult,
}
