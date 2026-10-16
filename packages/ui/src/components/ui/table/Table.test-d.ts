import type { ReactNode } from 'react'
import { expectTypeOf, test } from 'vitest'
import {
  useTableState,
  type ColumnDef,
  type TableRowRenderer,
  type UseTableReturn,
} from './useTableState'

interface Row {
  id: string
  severity: 'error' | 'info'
  score: number
}

test('ColumnDef<Row> hands its accessor a Row', () => {
  const column: ColumnDef<Row> = {
    key: 'severity',
    accessor: (row) => {
      expectTypeOf(row).toEqualTypeOf<Row>()
      return row.severity
    },
  }
  expectTypeOf(column.accessor).parameter(0).toEqualTypeOf<Row>()

  // @ts-expect-error -- `owner` is not a field of Row
  const wrong: ColumnDef<Row> = { key: 'owner', accessor: (row) => row.owner }
  expectTypeOf(wrong).toEqualTypeOf<ColumnDef<Row>>()
})

test('renderRow receives a Row and its index', () => {
  const renderRow: TableRowRenderer<Row> = (row, index) => {
    expectTypeOf(row).toEqualTypeOf<Row>()
    expectTypeOf(index).toEqualTypeOf<number>()
    return row.id
  }
  expectTypeOf(renderRow).returns.toEqualTypeOf<ReactNode>()

  // @ts-expect-error -- `owner` is not a field of Row
  const wrong: TableRowRenderer<Row> = (row) => row.owner
  expectTypeOf(wrong).toEqualTypeOf<TableRowRenderer<Row>>()
})

test('useTable carries Row from data and columns through every row it returns', () => {
  const table = useTableState({ data: [] as Row[], columns: [{ key: 'score' }] })
  expectTypeOf(table).toEqualTypeOf<UseTableReturn<Row>>()
  expectTypeOf(table.rowAt).returns.toEqualTypeOf<Row | undefined>()
  expectTypeOf(table.windowRows).toEqualTypeOf<(Row | undefined)[]>()
  expectTypeOf(table.toggleRowSelected).parameter(0).toEqualTypeOf<Row>()

  useTableState<Row>({
    data: [],
    // @ts-expect-error -- `owner` is not a field of Row
    columns: [{ key: 'owner', accessor: (row) => row.owner }],
  })
})
