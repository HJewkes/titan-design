// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, type ReactNode } from 'react'
import { View } from 'react-native'
import { useControllableState } from '../../../hooks/useControllableState'
import { cn } from '../../../utils/cn'
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert'
import { Button, ButtonText } from '../../ui/button'
import { EmptyState } from '../../ui/empty-state'
import { Eyebrow } from '../../ui/eyebrow'
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
import { KnowledgeFilterBar } from './KnowledgeFilterBar'
import {
  EMPTY_KNOWLEDGE_FILTERS,
  KNOWLEDGE_COMPARATORS,
  countUndatedExcluded,
  filterKnowledge,
  toKnowledgeSortRows,
  uniqueKnowledge,
  type KnowledgeFilters,
  type KnowledgeItem,
  type KnowledgeProblem,
  type KnowledgeSortRow,
} from './knowledge-filters'
import { KNOWLEDGE_COLUMN_WIDTHS, KnowledgeRow, type KnowledgeColumnKey } from './KnowledgeRow'

export type { KnowledgeColumnKey }

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

const NO_HIDDEN_COLUMNS: KnowledgeColumnKey[] = []
const NO_PROBLEMS: KnowledgeProblem[] = []
/** The hairline frame the grid sits inside, which the measured width includes but the columns cannot use. */
const GRID_FRAME_INSET = 2

export interface KnowledgeListProps {
  items: KnowledgeItem[]
  /** Reference time for the date range. Injected so stories and tests never read the clock. */
  now: number
  filters?: KnowledgeFilters
  defaultFilters?: KnowledgeFilters
  onFiltersChange?: (filters: KnowledgeFilters) => void
  /** The open item, marked `aria-current`. */
  selectedId?: string
  defaultSelectedId?: string
  /** Called when a title is pressed. */
  onSelectedIdChange?: (id: string | undefined) => void
  /** 1-based. A filter change returns to page 1. */
  page?: number
  defaultPage?: number
  onPageChange?: (page: number) => void
  /** Rows per page. Defaults to 50. */
  pageSize?: number
  /** Columns to leave out, for an embedded list that already knows its context. */
  hideColumns?: KnowledgeColumnKey[]
  /** Pins the width the column fit runs against instead of measuring it. */
  fitWidth?: number
  /** Files the source could not read. Reported above the table, never dropped. */
  problems?: KnowledgeProblem[]
  /** Swaps the rows for the table's skeleton; the filter row stays mounted and inert. */
  isLoading?: boolean
  /** Replaces the built-in filter row. The host then drives `filters` and `onFiltersChange`. */
  filterBar?: ReactNode
  /** No items at all. Defaults to an `EmptyState`. */
  emptyState?: ReactNode
  /** Items exist and the filters match none. Defaults to an `EmptyState` with a reset action. */
  noMatchState?: ReactNode
  /** Eyebrow noun. Defaults to `notes and sources`. */
  label?: string
  className?: string
}

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

/** The three controlled-or-uncontrolled triplets, with a filter change returning to page 1. */
function useKnowledgeListState(props: KnowledgeListProps) {
  const [filters, setFiltersState] = useControllableState({
    value: props.filters,
    defaultValue: props.defaultFilters ?? EMPTY_KNOWLEDGE_FILTERS,
    onChange: props.onFiltersChange,
  })
  const [page, setPage] = useControllableState({
    value: props.page,
    defaultValue: props.defaultPage ?? 1,
    onChange: props.onPageChange,
  })
  const [selectedId, setSelectedId] = useControllableState<string | undefined>({
    value: props.selectedId,
    defaultValue: props.defaultSelectedId,
    onChange: props.onSelectedIdChange,
  })
  const setFilters = (next: KnowledgeFilters) => {
    setFiltersState(next)
    setPage(1)
  }
  return { filters, setFilters, page, setPage, selectedId, setSelectedId }
}

function countLabel(shown: number, total: number, undated: number, noun: string): string {
  const count = shown === total ? `${total} ${noun}` : `${shown} of ${total} ${noun}`
  return undated > 0 ? `${count} · ${undated} undated not in range` : count
}

function ProblemsAlert({ problems }: { problems: KnowledgeProblem[] }) {
  const noun = problems.length === 1 ? 'file' : 'files'
  return (
    <Alert status="warning" testID="knowledge-problems">
      <AlertTitle>{`${problems.length} ${noun} could not be read`}</AlertTitle>
      <AlertDescription>
        {problems.map((p) => `${p.initiative}/${p.filename}: ${p.error}`).join('\n')}
      </AlertDescription>
    </Alert>
  )
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

interface KnowledgeTableProps {
  rows: KnowledgeSortRow[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  selectedId: string | undefined
  onSelect: (id: string) => void
  hideColumns: KnowledgeColumnKey[]
  fitWidth: number | undefined
  isLoading: boolean
}

function KnowledgeTable(props: KnowledgeTableProps) {
  const { rows, page, pageSize, onPageChange, selectedId, onSelect, isLoading } = props
  const { columns, rowHidden, onLayout, contentMinWidth } = useFittedColumns(
    props.hideColumns,
    props.fitWidth
  )
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

  return (
    // A table frame is a hairline rule, not a plane: it paints no background and casts no lift.
    <View className="overflow-hidden rounded-lg border border-hairline" onLayout={onLayout}>
      <Table
        density="dense"
        contentMinWidth={contentMinWidth}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      >
        <TableHeader>
          <TableRow isHoverable={false}>
            {columns.map((col) => (
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
            <SkeletonRows columns={columns} />
          ) : (
            pageRows.map((row) => (
              <KnowledgeRow
                key={row.id}
                row={row}
                isSelected={row.id === selectedId}
                onSelect={onSelect}
                hideColumns={rowHidden}
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

/**
 * KnowledgeList — every note and source across initiatives in one filterable,
 * sortable, paged table. Each row's title is a link that selects it; the host
 * opens the selected item in a reader.
 *
 * Composes {@link Eyebrow} (a polite live count), {@link Alert} (unreadable
 * files), a filter row ({@link KnowledgeFilterBar}, or the `filterBar` slot),
 * {@link Table} at `density="dense"` with {@link useTable} sorting and
 * {@link useColumnFit} dropping columns, {@link KnowledgeRow}, {@link TablePagination}
 * and {@link EmptyState} for the two empty cases.
 */
export function KnowledgeList(props: KnowledgeListProps) {
  const { items, now, pageSize = 50, isLoading = false, className } = props
  const problems = props.problems ?? NO_PROBLEMS
  const state = useKnowledgeListState(props)
  const unique = useMemo(() => uniqueKnowledge(items), [items])
  const filtered = useMemo(
    () => filterKnowledge(unique, state.filters, now),
    [unique, state.filters, now]
  )
  const rows = useMemo(() => toKnowledgeSortRows(filtered), [filtered])
  const undated = countUndatedExcluded(unique, state.filters, now)
  const noun = props.label ?? 'notes and sources'
  const resetFilters = () => state.setFilters(EMPTY_KNOWLEDGE_FILTERS)

  return (
    <View className={cn('gap-3', className)}>
      <View accessibilityLiveRegion="polite">
        <Eyebrow>{countLabel(rows.length, unique.length, undated, noun)}</Eyebrow>
      </View>
      {problems.length > 0 ? <ProblemsAlert problems={problems} /> : null}
      {props.filterBar ?? (
        <KnowledgeFilterBar
          items={unique}
          filters={state.filters}
          onFiltersChange={state.setFilters}
          isDisabled={isLoading}
        />
      )}
      {!isLoading && unique.length === 0 ? (
        (props.emptyState ?? <EmptyState title="No notes or sources yet" />)
      ) : !isLoading && rows.length === 0 ? (
        (props.noMatchState ?? <NoMatchState onReset={resetFilters} />)
      ) : (
        <KnowledgeTable
          rows={rows}
          page={state.page}
          pageSize={pageSize}
          onPageChange={state.setPage}
          selectedId={state.selectedId}
          onSelect={state.setSelectedId}
          hideColumns={props.hideColumns ?? NO_HIDDEN_COLUMNS}
          fitWidth={props.fitWidth}
          isLoading={isLoading}
        />
      )}
    </View>
  )
}

function NoMatchState({ onReset }: { onReset: () => void }) {
  return (
    <EmptyState
      title="Nothing matches these filters"
      action={
        <Button variant="outline" size="sm" onPress={onReset}>
          <ButtonText>Clear filters</ButtonText>
        </Button>
      }
    />
  )
}
