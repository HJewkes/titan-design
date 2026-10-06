import type { TableBlankPredicate, TableComparator } from '../../ui/table'
import { SEVERITY_ORDER } from './SeverityLabel'
import type { TaskListItem } from './TaskRow'
import { compareTaskSeverity, compareTaskUpdated } from './task-flow'

/**
 * The columns whose order is not their raw field order. Everything else falls
 * through to `useTable`'s default compare.
 */
export const TASK_COMPARATORS: Record<string, TableComparator<TaskListItem>> = {
  // Rank, not alphabet: "critical" < "high" < "low" as strings buries low in the middle.
  severity: compareTaskSeverity,
  // Newest first when ascending: for an age column, "most recent" is the useful top.
  updated: compareTaskUpdated,
  id: (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }),
  slug: (a, b) => a.slug.localeCompare(b.slug) || a.priority - b.priority,
}

/**
 * Rows the comparators above rank last ascending. `useTable` keeps them last
 * descending too; without this they would flip to the top with the sign.
 */
export const TASK_BLANKS: Record<string, TableBlankPredicate<TaskListItem>> = {
  // An unknown severity ranks as unset, as in `compareTaskSeverity`.
  severity: (t) => t.severity === undefined || !SEVERITY_ORDER.includes(t.severity),
  updated: (t) => Number.isNaN(Date.parse(t.updated)),
}
