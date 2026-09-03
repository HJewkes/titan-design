// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import { cn } from '../../../utils/cn'
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableRow,
  useTable,
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

interface TaskColumn {
  key: TaskSortKey | 'tags'
  label: string
  /** Full name behind an abbreviated label, shown on hover. */
  tooltip?: string
  width?: number
  align?: 'left' | 'right'
  sortable: boolean
}

/** How the severity column renders: `auto` collapses to the dot below {@link COMPACT_SEVERITY_BELOW}. */
export type SeverityDisplay = 'auto' | 'full' | 'dot'

/**
 * Table width under which severity collapses to its dot. Below this the fixed
 * columns leave the flexible title under ~220px, which is where titles stop
 * being scannable; the dot gives 68px back.
 */
export const COMPACT_SEVERITY_BELOW = 840

const SEVERITY_COLUMN: Record<'full' | 'dot', TaskColumn> = {
  full: { key: 'severity', label: 'Severity', width: TASK_COLUMN_WIDTHS.severity, sortable: true },
  dot: {
    key: 'severity',
    label: 'Sev',
    tooltip: 'Severity',
    width: TASK_COLUMN_WIDTHS.severityCompact,
    sortable: true,
  },
}

const taskColumns = (dotOnly: boolean): TaskColumn[] => [
  { key: 'slug', label: 'Initiative', width: TASK_COLUMN_WIDTHS.slug, sortable: true },
  { key: 'id', label: 'ID', width: TASK_COLUMN_WIDTHS.id, sortable: true },
  { key: 'title', label: 'Title', sortable: true },
  SEVERITY_COLUMN[dotOnly ? 'dot' : 'full'],
  {
    key: 'priority',
    label: 'Pri',
    tooltip: 'Priority',
    width: TASK_COLUMN_WIDTHS.priority,
    align: 'right',
    sortable: true,
  },
  {
    key: 'estimate',
    label: 'Est',
    tooltip: 'Estimate',
    width: TASK_COLUMN_WIDTHS.estimate,
    align: 'right',
    sortable: true,
  },
  { key: 'tags', label: 'Tags', width: TASK_COLUMN_WIDTHS.tags, sortable: false },
  { key: 'updated', label: 'Age', width: TASK_COLUMN_WIDTHS.age, align: 'right', sortable: true },
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
  className?: string
}

function useSeverityDotOnly(display: SeverityDisplay) {
  const [width, setWidth] = useState<number | null>(null)
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)
  const dotOnly =
    display === 'dot' || (display === 'auto' && width !== null && width < COMPACT_SEVERITY_BELOW)
  return { dotOnly, onLayout }
}

/**
 * TaskTable — every open task across initiatives in one dense, sortable grid.
 *
 * Composes {@link Table} at `density="dense"` and drives it with
 * {@link useTable}, passing per-column comparators so severity ranks by meaning
 * and age reads newest-first. Rows are {@link TaskRow}; the legend tallies
 * {@link SeverityLabel}.
 */
export function TaskTable({
  tasks,
  now,
  defaultSortKey = 'priority',
  hideLegend = false,
  severityDisplay = 'auto',
  className,
}: TaskTableProps) {
  const { dotOnly, onLayout } = useSeverityDotOnly(severityDisplay)
  const columns = useMemo(() => taskColumns(dotOnly), [dotOnly])
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
        <Eyebrow>{`${tasks.length} open · all initiatives`}</Eyebrow>
        {hideLegend ? null : <SeverityLegend tasks={tasks} />}
      </View>

      <View className="overflow-hidden rounded-lg border border-hairline">
        <Table
          density="dense"
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
              />
            ))}
          </TableBody>
        </Table>
      </View>
    </View>
  )
}
