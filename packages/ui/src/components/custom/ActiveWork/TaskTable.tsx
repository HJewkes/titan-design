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
  useTable,
  type TableComparator,
} from '../Table'
import { Typography } from '../Typography'
import { Eyebrow } from './Eyebrow'
import { SeverityLabel, SEVERITY_ORDER, severityRank, type TaskSeverity } from './SeverityLabel'
import { TaskRow, TASK_COLUMN_WIDTHS, type TaskListItem } from './TaskRow'

/**
 * A compact age label for a dense column: `today`, `4d ago`, `3mo ago`.
 *
 * Deliberately not `DateTime format="relative"` — that renders Intl prose ("4
 * days ago"), which is too long for a 74px column, and it reads `Date.now()`
 * internally so a story or a visual baseline could never be deterministic. `now`
 * is injected here for exactly that reason.
 */
export function formatTaskAge(iso: string | null | undefined, now: number): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'

  const days = Math.floor((now - then) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

type TaskSortKey = 'slug' | 'id' | 'title' | 'severity' | 'priority' | 'estimate' | 'updated'

interface TaskColumn {
  key: TaskSortKey | 'tags'
  label: string
  width?: number
  align?: 'left' | 'right'
  sortable: boolean
}

const COLUMNS: TaskColumn[] = [
  { key: 'slug', label: 'Initiative', width: TASK_COLUMN_WIDTHS.slug, sortable: true },
  { key: 'id', label: 'ID', width: TASK_COLUMN_WIDTHS.id, sortable: true },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'severity', label: 'Severity', width: TASK_COLUMN_WIDTHS.severity, sortable: true },
  {
    key: 'priority',
    label: 'Pri',
    width: TASK_COLUMN_WIDTHS.priority,
    align: 'right',
    sortable: true,
  },
  {
    key: 'estimate',
    label: 'Est',
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
  className?: string
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
  className,
}: TaskTableProps) {
  const { sortedData, sortColumn, sortDirection, handleSort } = useTable<TaskListItem>({
    data: tasks,
    // One page: this grid is meant to be scanned and scrolled, not paged.
    defaultPageSize: Number.MAX_SAFE_INTEGER,
    defaultSortColumn: defaultSortKey,
    defaultSortDirection: 'asc',
    comparators: TASK_COMPARATORS,
  })

  return (
    <View className={cn('gap-3', className)}>
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
              {COLUMNS.map((col) => (
                <TableHeaderCell
                  key={col.key}
                  sortKey={col.sortable ? col.key : undefined}
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
              />
            ))}
          </TableBody>
        </Table>
      </View>
    </View>
  )
}
