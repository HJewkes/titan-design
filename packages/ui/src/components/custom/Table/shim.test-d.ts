import { expectTypeOf, test } from 'vitest'
import type * as root from '../../../index'
import type * as moved from '../../ui/table'
import type * as legacy from '.'
import type * as legacyColumnFit from './column-fit'

test('custom/Table re-exports every type as the ui/table type', () => {
  expectTypeOf<legacy.TableProps>().toEqualTypeOf<moved.TableProps>()
  expectTypeOf<legacy.TableHeaderProps>().toEqualTypeOf<moved.TableHeaderProps>()
  expectTypeOf<legacy.TableBodyProps>().toEqualTypeOf<moved.TableBodyProps>()
  expectTypeOf<legacy.TableRowProps>().toEqualTypeOf<moved.TableRowProps>()
  expectTypeOf<legacy.TableHeaderCellProps>().toEqualTypeOf<moved.TableHeaderCellProps>()
  expectTypeOf<legacy.TableCellProps>().toEqualTypeOf<moved.TableCellProps>()
  expectTypeOf<legacy.TablePaginationProps>().toEqualTypeOf<moved.TablePaginationProps>()
  expectTypeOf<legacy.UseTableOptions<unknown>>().toEqualTypeOf<moved.UseTableOptions<unknown>>()
  expectTypeOf<legacy.UseTableReturn<unknown>>().toEqualTypeOf<moved.UseTableReturn<unknown>>()
  expectTypeOf<legacy.SortDirection>().toEqualTypeOf<moved.SortDirection>()
  expectTypeOf<legacy.TableDensity>().toEqualTypeOf<moved.TableDensity>()
  expectTypeOf<legacy.TableComparator<unknown>>().toEqualTypeOf<moved.TableComparator<unknown>>()
  expectTypeOf<legacy.TableColumnFit>().toEqualTypeOf<moved.TableColumnFit>()
  expectTypeOf<legacy.ColumnFitResult>().toEqualTypeOf<moved.ColumnFitResult>()
  expectTypeOf<legacy.UseColumnFitResult>().toEqualTypeOf<moved.UseColumnFitResult>()
  expectTypeOf<legacy.UseMeasuredWidthResult>().toEqualTypeOf<moved.UseMeasuredWidthResult>()
})

test('custom/Table/column-fit keeps its types on the deep path', () => {
  expectTypeOf<legacyColumnFit.TableColumnFit>().toEqualTypeOf<moved.TableColumnFit>()
  expectTypeOf<legacyColumnFit.ColumnFitResult>().toEqualTypeOf<moved.ColumnFitResult>()
  expectTypeOf<legacyColumnFit.UseColumnFitResult>().toEqualTypeOf<moved.UseColumnFitResult>()
  expectTypeOf<legacyColumnFit.UseMeasuredWidthResult>().toEqualTypeOf<moved.UseMeasuredWidthResult>()
})

test('the package root still exports every Table type', () => {
  expectTypeOf<root.TableProps>().toEqualTypeOf<moved.TableProps>()
  expectTypeOf<root.TableHeaderProps>().toEqualTypeOf<moved.TableHeaderProps>()
  expectTypeOf<root.TableBodyProps>().toEqualTypeOf<moved.TableBodyProps>()
  expectTypeOf<root.TableRowProps>().toEqualTypeOf<moved.TableRowProps>()
  expectTypeOf<root.TableHeaderCellProps>().toEqualTypeOf<moved.TableHeaderCellProps>()
  expectTypeOf<root.TableCellProps>().toEqualTypeOf<moved.TableCellProps>()
  expectTypeOf<root.TablePaginationProps>().toEqualTypeOf<moved.TablePaginationProps>()
  expectTypeOf<root.UseTableOptions<unknown>>().toEqualTypeOf<moved.UseTableOptions<unknown>>()
  expectTypeOf<root.UseTableReturn<unknown>>().toEqualTypeOf<moved.UseTableReturn<unknown>>()
  expectTypeOf<root.SortDirection>().toEqualTypeOf<moved.SortDirection>()
  expectTypeOf<root.TableDensity>().toEqualTypeOf<moved.TableDensity>()
  expectTypeOf<root.TableComparator<unknown>>().toEqualTypeOf<moved.TableComparator<unknown>>()
  expectTypeOf<root.TableColumnFit>().toEqualTypeOf<moved.TableColumnFit>()
  expectTypeOf<root.ColumnFitResult>().toEqualTypeOf<moved.ColumnFitResult>()
  expectTypeOf<root.UseColumnFitResult>().toEqualTypeOf<moved.UseColumnFitResult>()
  expectTypeOf<root.UseMeasuredWidthResult>().toEqualTypeOf<moved.UseMeasuredWidthResult>()
})
