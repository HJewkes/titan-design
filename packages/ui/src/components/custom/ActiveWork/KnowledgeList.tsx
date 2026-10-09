// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, type ReactNode } from 'react'
import { View } from 'react-native'
import { useControllableState } from '../../../hooks/useControllableState'
import { cn } from '../../../utils/cn'
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert'
import { Button, ButtonText } from '../../ui/button'
import { EmptyState } from '../../ui/empty-state'
import { Eyebrow } from '../../ui/eyebrow'
import { KnowledgeFilterBar } from './KnowledgeFilterBar'
import {
  EMPTY_KNOWLEDGE_FILTERS,
  countUndatedExcluded,
  filterKnowledge,
  toKnowledgeSortRows,
  uniqueKnowledge,
  type KnowledgeFilters,
  type KnowledgeItem,
  type KnowledgeProblem,
} from './knowledge-filters'
import type { KnowledgeColumnKey } from './KnowledgeRow'
import { KnowledgeTable } from './KnowledgeTable'

export type { KnowledgeColumnKey }

/** How the table pages and which columns it shows. */
export interface KnowledgeListTable {
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
}

/** Consumer parts that replace the list's built-in ones. */
export interface KnowledgeListSlots {
  /** Replaces the built-in filter row. The host then drives `filters` and `onFiltersChange`. */
  filterBar?: ReactNode
  /** No items at all. Defaults to an `EmptyState`. */
  emptyState?: ReactNode
  /** Items exist and the filters match none. Defaults to an `EmptyState` with a reset action. */
  noMatchState?: ReactNode
}

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
  table?: KnowledgeListTable
  /** Files the source could not read. Reported above the table, never dropped. */
  problems?: KnowledgeProblem[]
  /** Fills the rows with skeleton cells; the header and the filter row stay, inert. */
  isLoading?: boolean
  slots?: KnowledgeListSlots
  className?: string
}

const NO_HIDDEN_COLUMNS: KnowledgeColumnKey[] = []
const NO_PROBLEMS: KnowledgeProblem[] = []
const NO_TABLE: KnowledgeListTable = {}
const NO_SLOTS: KnowledgeListSlots = {}

/** The three controlled-or-uncontrolled triplets, with a filter change returning to page 1. */
function useKnowledgeListState(props: KnowledgeListProps, table: KnowledgeListTable) {
  const [filters, setFiltersState] = useControllableState({
    value: props.filters,
    defaultValue: props.defaultFilters ?? EMPTY_KNOWLEDGE_FILTERS,
    onChange: props.onFiltersChange,
  })
  const [page, setPage] = useControllableState({
    value: table.page,
    defaultValue: table.defaultPage ?? 1,
    onChange: table.onPageChange,
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

function countLabel(shown: number, total: number, undated: number): string {
  const noun = 'notes and sources'
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

/**
 * KnowledgeList — every note and source across initiatives in one filterable,
 * sortable, paged table. Each row's title is a link that selects it; the host
 * opens the selected item in a reader.
 *
 * Composes {@link Eyebrow} (a polite live count), {@link Alert} (unreadable
 * files), a filter row ({@link KnowledgeFilterBar}, or `slots.filterBar`),
 * {@link KnowledgeTable} and {@link EmptyState} for the two empty cases.
 */
export function KnowledgeList(props: KnowledgeListProps) {
  const { items, now, isLoading = false, className } = props
  const table = props.table ?? NO_TABLE
  const slots = props.slots ?? NO_SLOTS
  const problems = props.problems ?? NO_PROBLEMS
  const state = useKnowledgeListState(props, table)
  const unique = useMemo(() => uniqueKnowledge(items), [items])
  const filtered = useMemo(
    () => filterKnowledge(unique, state.filters, now),
    [unique, state.filters, now]
  )
  const rows = useMemo(() => toKnowledgeSortRows(filtered), [filtered])
  const undated = countUndatedExcluded(unique, state.filters, now)
  const resetFilters = () => state.setFilters(EMPTY_KNOWLEDGE_FILTERS)

  return (
    <View className={cn('gap-3', className)}>
      <View accessibilityLiveRegion="polite">
        <Eyebrow>{countLabel(rows.length, unique.length, undated)}</Eyebrow>
      </View>
      {problems.length > 0 ? <ProblemsAlert problems={problems} /> : null}
      {slots.filterBar ?? (
        <KnowledgeFilterBar
          items={unique}
          filters={state.filters}
          onFiltersChange={state.setFilters}
          isDisabled={isLoading}
        />
      )}
      {!isLoading && unique.length === 0 ? (
        (slots.emptyState ?? <EmptyState title="No notes or sources yet" />)
      ) : !isLoading && rows.length === 0 ? (
        (slots.noMatchState ?? <NoMatchState onReset={resetFilters} />)
      ) : (
        <KnowledgeTable
          rows={rows}
          page={state.page}
          pageSize={table.pageSize ?? 50}
          onPageChange={state.setPage}
          selectedId={state.selectedId}
          onSelect={state.setSelectedId}
          hideColumns={table.hideColumns ?? NO_HIDDEN_COLUMNS}
          fitWidth={table.fitWidth}
          isLoading={isLoading}
        />
      )}
    </View>
  )
}
