// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableRow,
  useColumnFit,
  useMeasuredWidth,
  useTable,
  type TableColumnFit,
  type TableComparator,
} from '../Table'
import { Typography } from '../Typography'
import { Eyebrow } from './Eyebrow'
import { SeverityLabel, SEVERITY_ORDER, severityRank, type TaskSeverity } from './SeverityLabel'
import { TaskRow, TASK_COLUMN_WIDTHS, type TaskListItem } from './TaskRow'

import { formatTaskAge } from './format-time'

// Kept on this module's surface: the session reader shares the helper now, but callers imported it from here first.
export { formatTaskAge }

type TaskSortKey = 'slug' | 'id' | 'title' | 'severity' | 'priority' | 'estimate' | 'updated'

/** Any column the table can leave out; `title` is the one column that always renders. */
export type TaskColumnKey = Exclude<TaskSortKey, 'title'> | 'tags'

interface TaskColumn extends TableColumnFit {
  key: TaskSortKey | 'tags'
  label: string
  /** Full name behind an abbreviated label, shown on hover. */
  tooltip?: string
  width?: number
  align?: 'left' | 'right'
  sortable: boolean
}

const NO_HIDDEN_COLUMNS: TaskColumnKey[] = []

/**
 * What leaves first when the table cannot fit everything. Metadata goes before
 * anything that names the task: a row with no title is not a shorter row, it is
 * a useless one, so `title` and `id` carry no priority and never drop. `slug`
 * goes last of the droppable columns because the backlog reads across
 * initiatives, so losing it costs more than losing the age.
 */
const TASK_DROP_ORDER = {
  severity: 1,
  priority: 2,
  estimate: 3,
  tags: 4,
  updated: 5,
  slug: 6,
} as const

/** The hairline frame the grid sits inside, which the measured width includes but the columns cannot use. */
const GRID_FRAME_INSET = 2

/** How the severity column renders: `auto` collapses to the dot below {@link COMPACT_SEVERITY_BELOW}. */
export type SeverityDisplay = 'auto' | 'full' | 'dot'

/**
 * Table width under which severity collapses to its dot. Below this the fixed
 * columns leave the flexible title under ~220px, which is where titles stop
 * being scannable; the dot gives 68px back.
 */
export const COMPACT_SEVERITY_BELOW = 840

const SEVERITY_COLUMN: Record<'full' | 'dot', TaskColumn> = {
  full: {
    key: 'severity',
    label: 'Severity',
    width: TASK_COLUMN_WIDTHS.severity,
    minWidth: TASK_COLUMN_WIDTHS.severity,
    dropPriority: TASK_DROP_ORDER.severity,
    sortable: true,
  },
  dot: {
    key: 'severity',
    label: 'Sev',
    tooltip: 'Severity',
    width: TASK_COLUMN_WIDTHS.severityCompact,
    minWidth: TASK_COLUMN_WIDTHS.severityCompact,
    dropPriority: TASK_DROP_ORDER.severity,
    sortable: true,
  },
}

const taskColumns = (dotOnly: boolean, hidden: TaskColumnKey[]): TaskColumn[] =>
  allTaskColumns(dotOnly).filter((col) => !hidden.includes(col.key as TaskColumnKey))

const allTaskColumns = (dotOnly: boolean): TaskColumn[] => [
  {
    key: 'slug',
    label: 'Initiative',
    width: TASK_COLUMN_WIDTHS.slug,
    minWidth: TASK_COLUMN_WIDTHS.slug,
    dropPriority: TASK_DROP_ORDER.slug,
    sortable: true,
  },
  {
    key: 'id',
    label: 'ID',
    width: TASK_COLUMN_WIDTHS.id,
    minWidth: TASK_COLUMN_WIDTHS.id,
    sortable: true,
  },
  { key: 'title', label: 'Title', minWidth: TASK_COLUMN_WIDTHS.titleMin, sortable: true },
  SEVERITY_COLUMN[dotOnly ? 'dot' : 'full'],
  {
    key: 'priority',
    label: 'Pri',
    tooltip: 'Priority',
    width: TASK_COLUMN_WIDTHS.priority,
    minWidth: TASK_COLUMN_WIDTHS.priority,
    dropPriority: TASK_DROP_ORDER.priority,
    align: 'right',
    sortable: true,
  },
  {
    key: 'estimate',
    label: 'Est',
    tooltip: 'Estimate',
    width: TASK_COLUMN_WIDTHS.estimate,
    minWidth: TASK_COLUMN_WIDTHS.estimate,
    dropPriority: TASK_DROP_ORDER.estimate,
    align: 'right',
    sortable: true,
  },
  {
    key: 'tags',
    label: 'Tags',
    width: TASK_COLUMN_WIDTHS.tags,
    minWidth: TASK_COLUMN_WIDTHS.tags,
    dropPriority: TASK_DROP_ORDER.tags,
    sortable: false,
  },
  {
    key: 'updated',
    label: 'Age',
    width: TASK_COLUMN_WIDTHS.age,
    minWidth: TASK_COLUMN_WIDTHS.age,
    dropPriority: TASK_DROP_ORDER.updated,
    align: 'right',
    sortable: true,
  },
]

/**
 * The columns whose order is not their raw field order. Everything else falls
 * through to `useTable`'s default compare.
 */
const TASK_COMPARATORS: Record<string, TableComparator<TaskListItem>> = {
  // Rank, not alphabet: "critical" < "high" < "low" as strings buries low in the middle.
  severity: (a, b) =>
    severityRank(a.severity) - severityRank(b.severity) || a.priority - b.priority,
  // Newest first when ascending: for an age column, "most recent" is the useful top.
  updated: (a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0),
  id: (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }),
  slug: (a, b) => a.slug.localeCompare(b.slug) || a.priority - b.priority,
}

function SeverityLegend({ tasks }: { tasks: TaskListItem[] }) {
  const counts = useMemo(() => {
    const c: Record<TaskSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    for (const t of tasks) if (t.severity) c[t.severity]++
    return c
  }, [tasks])

  return (
    <View className="flex-row items-center gap-3">
      {SEVERITY_ORDER.map((severity) => (
        <View key={severity} className="flex-row items-center gap-1.5">
          <SeverityLabel severity={severity} />
          <Typography variant="mono" className="text-xs text-text-tertiary">
            {String(counts[severity])}
          </Typography>
        </View>
      ))}
    </View>
  )
}

export interface TaskTableProps {
  tasks: TaskListItem[]
  /**
   * Reference timestamp for the age column. Injected rather than read from the
   * clock so stories, tests and visual baselines render identically forever.
   */
  now: number
  /** Column sorted on first render. Defaults to `priority`. */
  defaultSortKey?: TaskSortKey
  /** Hides the severity legend above the grid. */
  hideLegend?: boolean
  /** Severity column mode. Defaults to `auto`, driven by the table's measured width. */
  severityDisplay?: SeverityDisplay
  /** Columns to leave out, for an embedded table that already knows its context. */
  hideColumns?: TaskColumnKey[]
  /**
   * Pins the width the column fit runs against instead of measuring it. For
   * stories and tests that need to hold one step of the drop order still.
   */
  fitWidth?: number
  /** Eyebrow over the grid. Defaults to the backlog wording, `N open · all initiatives`. */
  label?: string
  className?: string
}

/**
 * One measurement drives both adaptations, in the order they should happen:
 * severity collapses to its dot first, and only then do whole columns drop.
 */
function useFittedColumns(
  display: SeverityDisplay,
  hidden: TaskColumnKey[],
  fitWidth: number | undefined
) {
  const { width, onLayout } = useMeasuredWidth(fitWidth)
  const dotOnly =
    display === 'dot' || (display === 'auto' && width !== null && width < COMPACT_SEVERITY_BELOW)
  const candidates = useMemo(() => taskColumns(dotOnly, hidden), [dotOnly, hidden])
  const fit = useColumnFit(candidates, width === null ? null : width - GRID_FRAME_INSET)

  const columns = useMemo(() => candidates.filter((c) => fit.isVisible(c.key)), [candidates, fit])
  // Rows take the same list the header dropped, so the two halves of a row cannot come apart.
  const rowHidden = useMemo(
    () => [...hidden, ...candidates.filter((c) => !fit.isVisible(c.key)).map((c) => c.key)],
    [hidden, candidates, fit]
  ) as TaskColumnKey[]

  return { columns, dotOnly, rowHidden, onLayout, contentMinWidth: fit.contentMinWidth }
}

/**
 * TaskTable — every open task across initiatives in one dense, sortable grid.
 *
 * Composes {@link Table} at `density="dense"` and drives it with
 * {@link useTable}, passing per-column comparators so severity ranks by meaning
 * and age reads newest-first. Rows are {@link TaskRow}; the legend tallies
 * {@link SeverityLabel}.
 *
 * Narrow it and it adapts twice, in order: severity collapses to its dot, then
 * whole columns drop along {@link TASK_DROP_ORDER}. `title` and `id` are not in
 * that order and never drop; under them the table scrolls horizontally.
 */
export function TaskTable({
  tasks,
  now,
  defaultSortKey = 'priority',
  hideLegend = false,
  severityDisplay = 'auto',
  hideColumns = NO_HIDDEN_COLUMNS,
  fitWidth,
  label,
  className,
}: TaskTableProps) {
  const { columns, dotOnly, rowHidden, onLayout, contentMinWidth } = useFittedColumns(
    severityDisplay,
    hideColumns,
    fitWidth
  )
  const { sortedData, sortColumn, sortDirection, handleSort } = useTable<TaskListItem>({
    data: tasks,
    // One page: this grid is meant to be scanned and scrolled, not paged.
    defaultPageSize: Number.MAX_SAFE_INTEGER,
    defaultSortColumn: defaultSortKey,
    defaultSortDirection: 'asc',
    comparators: TASK_COMPARATORS,
  })

  return (
    <View className={cn('gap-3', className)} onLayout={onLayout}>
      <View className="flex-row items-center justify-between">
        <Eyebrow>{label ?? `${tasks.length} open · all initiatives`}</Eyebrow>
        {hideLegend ? null : <SeverityLegend tasks={tasks} />}
      </View>

      {/* A table frame is a hairline RULE, not a plane: it paints no background and casts no lift. */}
      <View className="overflow-hidden rounded-lg border border-hairline" testID="task-grid">
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
                  sortKey={col.sortable ? col.key : undefined}
                  tooltip={col.tooltip}
                  width={col.width}
                  align={col.align}
                >
                  {col.label}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((task) => (
              <TaskRow
                key={`${task.slug}:${task.id}`}
                task={task}
                ageLabel={formatTaskAge(task.updated, now)}
                severityDotOnly={dotOnly}
                hideColumns={rowHidden}
              />
            ))}
          </TableBody>
        </Table>
      </View>
    </View>
  )
}
