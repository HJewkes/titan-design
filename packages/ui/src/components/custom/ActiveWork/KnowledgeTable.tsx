// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo } from 'react'
import { View } from 'react-native'
import { Skeleton } from '../../ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TablePagination,
  TableRow,
  useColumnFit,
  useMeasuredWidth,
  useTable,
  type TableColumnFit,
} from '../../ui/table'
import { KNOWLEDGE_COMPARATORS, type KnowledgeSortRow } from './knowledge-filters'
import { KNOWLEDGE_COLUMN_WIDTHS, KnowledgeRow, type KnowledgeColumnKey } from './KnowledgeRow'

interface KnowledgeColumn extends TableColumnFit {
  key: KnowledgeColumnKey | 'title'
  label: string
  width?: number
  align?: 'left' | 'right'
  isSortable: boolean
}

/** What leaves first when the table cannot fit everything; the title never drops. */
const KNOWLEDGE_DROP_ORDER = { tags: 1, kind: 2, record: 3, date: 4, initiative: 5 } as const

const fixed = (key: KnowledgeColumnKey) => ({
  key,
  width: KNOWLEDGE_COLUMN_WIDTHS[key],
  minWidth: KNOWLEDGE_COLUMN_WIDTHS[key],
  dropPriority: KNOWLEDGE_DROP_ORDER[key],
})

const ALL_COLUMNS: KnowledgeColumn[] = [
  { ...fixed('initiative'), label: 'Initiative', isSortable: true },
  { key: 'title', label: 'Title', minWidth: KNOWLEDGE_COLUMN_WIDTHS.titleMin, isSortable: true },
  { ...fixed('record'), label: 'Record', isSortable: true },
  { ...fixed('kind'), label: 'Kind', isSortable: true },
  { ...fixed('date'), label: 'Date', align: 'right', isSortable: true },
  { ...fixed('tags'), label: 'Tags', isSortable: false },
]

/** The hairline frame the grid sits inside, which the measured width includes but the columns cannot use. */
const GRID_FRAME_INSET = 2

function useFittedColumns(hidden: KnowledgeColumnKey[], fitWidth: number | undefined) {
  const { width, onLayout } = useMeasuredWidth(fitWidth)
  const candidates = useMemo(
    () => ALL_COLUMNS.filter((col) => col.key === 'title' || !hidden.includes(col.key)),
    [hidden]
  )
  const fit = useColumnFit(candidates, width === null ? null : width - GRID_FRAME_INSET)
  const columns = useMemo(() => candidates.filter((c) => fit.isVisible(c.key)), [candidates, fit])
  // Rows take the same list the header dropped, so the two halves of a row cannot come apart.
  const rowHidden = useMemo(
    () => [...hidden, ...candidates.filter((c) => !fit.isVisible(c.key)).map((c) => c.key)],
    [hidden, candidates, fit]
  ) as KnowledgeColumnKey[]
  return { columns, rowHidden, onLayout, contentMinWidth: fit.contentMinWidth }
}

const SKELETON_ROWS = [0, 1, 2, 3, 4]

/**
 * Loading rows under the real header. `Table`'s own `isLoading` skeleton draws
 * rows with no cells, which axe reports (`aria-required-children`), so the list
 * keeps its labelled header and fills the body with skeleton cells instead.
 */
function SkeletonRows({ columns }: { columns: KnowledgeColumn[] }) {
  return (
    <>
      {SKELETON_ROWS.map((row) => (
        <TableRow key={row} isHoverable={false} testID="knowledge-skeleton-row">
          {columns.map((col, index) => (
            <TableCell key={col.key} width={col.width} align={col.align}>
              <Skeleton width={`${50 + ((row * 7 + index * 13) % 5) * 10}%`} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export interface KnowledgeTableProps {
  rows: KnowledgeSortRow[]
  /** 1-based; clamped to the last page that has rows. */
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  selectedId: string | undefined
  onSelect: (id: string) => void
  hideColumns: KnowledgeColumnKey[]
  fitWidth: number | undefined
  isLoading: boolean
}

/**
 * KnowledgeTable — the knowledge list's sortable, paged grid, newest first.
 *
 * Composes {@link Table} at `density="dense"`, sorted by {@link useTable} and
 * narrowed by {@link useColumnFit}; rows are {@link KnowledgeRow}, paged by
 * {@link TablePagination}. Used by {@link KnowledgeList}.
 */
export function KnowledgeTable(props: KnowledgeTableProps) {
  const { rows, page, pageSize, onPageChange, selectedId, onSelect, isLoading } = props
  const fitted = useFittedColumns(props.hideColumns, props.fitWidth)
  const { sortedData, sortColumn, sortDirection, handleSort } = useTable<KnowledgeSortRow>({
    data: rows,
    // The list pages itself, so the page is a prop the host can hold.
    defaultPageSize: Number.MAX_SAFE_INTEGER,
    defaultSortColumn: 'date',
    defaultSortDirection: 'desc',
    comparators: KNOWLEDGE_COMPARATORS,
  })
  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const current = Math.min(Math.max(1, page), pageCount)
  const pageRows = sortedData.slice((current - 1) * pageSize, current * pageSize)
  const sort = { sortColumn, sortDirection, onSort: handleSort }

  return (
    // A table frame is a hairline rule, not a plane: it paints no background and casts no lift.
    <View className="overflow-hidden rounded-lg border border-hairline" onLayout={fitted.onLayout}>
      <Table density="dense" contentMinWidth={fitted.contentMinWidth} {...sort}>
        <TableHeader>
          <TableRow isHoverable={false}>
            {fitted.columns.map((col) => (
              <TableHeaderCell
                key={col.key}
                sortKey={col.isSortable ? col.key : undefined}
                width={col.width}
                align={col.align}
              >
                {col.label}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonRows columns={fitted.columns} />
          ) : (
            pageRows.map((row) => (
              <KnowledgeRow
                key={row.id}
                row={row}
                isSelected={row.id === selectedId}
                onSelect={onSelect}
                hideColumns={fitted.rowHidden}
              />
            ))
          )}
        </TableBody>
      </Table>
      {!isLoading && sortedData.length > pageSize ? (
        <TablePagination
          page={current - 1}
          pageSize={pageSize}
          pageSizeOptions={[pageSize]}
          totalItems={sortedData.length}
          onPageChange={(zeroBased) => onPageChange(zeroBased + 1)}
        />
      ) : null}
    </View>
  )
}
