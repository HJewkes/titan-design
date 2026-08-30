// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { Pill } from '../../ui/pill'
import { TableCell, TableRow } from '../Table'
import { Typography } from '../Typography'
import { SeverityLabel, type TaskSeverity } from './SeverityLabel'

/** One open task, as the task list renders it. */
export interface TaskListItem {
  /** Initiative slug the task belongs to. */
  slug: string
  /** Per-initiative task id, e.g. `AW-22`. */
  id: string
  title: string
  severity?: TaskSeverity
  /** Lower sorts first; unique within an initiative, not globally. */
  priority: number
  /** Rough size. Absent means unestimated, which sorts last. */
  estimate?: number
  tags?: string[]
  /** ISO date the task last changed, used for the age column. */
  updated: string
}

/**
 * Fixed column widths, shared by {@link TaskRow} and {@link TaskTable}'s header
 * so the two cannot drift. `title` is the flexible column and carries no width.
 */
export const TASK_COLUMN_WIDTHS = {
  slug: 132,
  id: 66,
  severity: 112,
  priority: 42,
  estimate: 42,
  tags: 150,
  age: 74,
} as const

/** How many tags fit before the row starts eliding them. */
const MAX_VISIBLE_TAGS = 2

export interface TaskRowProps {
  task: TaskListItem
  /** Pre-formatted age label (e.g. "3d ago"). Passed in so rows stay pure and deterministic. */
  ageLabel: string
}

/**
 * TaskRow — one task as a dense grid row: initiative, id, title, severity,
 * priority, estimate, tags and age.
 *
 * Composes {@link TableRow} / {@link TableCell} for row semantics and density,
 * {@link SeverityLabel} for the severity dot, and {@link Pill} for tags. Used by
 * {@link TaskTable}.
 */
export function TaskRow({ task, ageLabel }: TaskRowProps) {
  const hiddenTagCount = Math.max(0, (task.tags?.length ?? 0) - MAX_VISIBLE_TAGS)

  return (
    <TableRow testID="task-row">
      <TableCell width={TASK_COLUMN_WIDTHS.slug}>
        <Typography variant="mono" numberOfLines={1} className="text-xs text-text-tertiary">
          {task.slug}
        </Typography>
      </TableCell>

      <TableCell width={TASK_COLUMN_WIDTHS.id}>
        <Typography variant="mono" className="text-xs text-brand-primary">
          {task.id}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" numberOfLines={1} className="text-xs text-text-primary">
          {task.title}
        </Typography>
      </TableCell>

      <TableCell width={TASK_COLUMN_WIDTHS.severity}>
        <SeverityLabel severity={task.severity} />
      </TableCell>

      <TableCell width={TASK_COLUMN_WIDTHS.priority} align="right">
        <Typography variant="mono" className="text-xs text-text-secondary">
          {String(task.priority)}
        </Typography>
      </TableCell>

      <TableCell width={TASK_COLUMN_WIDTHS.estimate} align="right">
        <Typography variant="mono" className="text-xs text-text-secondary">
          {task.estimate === undefined ? '—' : String(task.estimate)}
        </Typography>
      </TableCell>

      <TableCell width={TASK_COLUMN_WIDTHS.tags}>
        <View className="flex-row items-center gap-1">
          {(task.tags ?? []).slice(0, MAX_VISIBLE_TAGS).map((tag) => (
            <Pill key={tag} variant="subtle" color="default" size="xs">
              {tag}
            </Pill>
          ))}
          {hiddenTagCount > 0 ? (
            <Typography variant="caption" className="text-text-tertiary">
              {`+${hiddenTagCount}`}
            </Typography>
          ) : null}
        </View>
      </TableCell>

      <TableCell width={TASK_COLUMN_WIDTHS.age} align="right">
        <Typography variant="caption" className="text-text-tertiary">
          {ageLabel}
        </Typography>
      </TableCell>
    </TableRow>
  )
}
