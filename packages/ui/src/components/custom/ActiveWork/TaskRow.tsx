// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { Tooltip } from '../../ui/tooltip'
import { formatDateTime } from '../../ui/date-time'
import { TableCell, TableRow } from '../../ui/table'
import { Typography } from '../../ui/typography'
import { SEVERITY_META, SeverityLabel, type TaskSeverity } from './SeverityLabel'
import type { TaskColumnKey } from './task-columns'
import { TagPills } from './TagPills'

/** One open task, as the task list renders it. */
export interface TaskListItem {
  /** Initiative slug the task belongs to. */
  slug: string
  /** Per-initiative task id, e.g. `PL-22`. */
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
 * so the two cannot drift. `title` is the flexible column: it renders with no
 * width and only declares the floor it may be squeezed to.
 *
 * Every fixed width holds its own header — the uppercase label, the 4px gap and
 * the sort glyph, inside the dense cell's 16px of padding. A column narrower
 * than its own header is what let `SEV` and `PRI` paint over each other.
 */
export const TASK_COLUMN_WIDTHS = {
  slug: 132,
  id: 66,
  /** The narrowest the flexible title column may be squeezed before a column drops instead. */
  titleMin: 160,
  severity: 112,
  /** The severity column once it has collapsed to its dot. */
  severityCompact: 56,
  priority: 56,
  estimate: 56,
  tags: 150,
  age: 74,
} as const

export interface TaskRowProps {
  task: TaskListItem
  /** Pre-formatted age label (e.g. "3d ago"). Passed in so rows stay pure and deterministic. */
  ageLabel: string
  /** Collapse severity to its dot (word on hover); the table decides this from its width. */
  severityDotOnly?: boolean
  /** Columns the table left out; the row skips their cells so header and body stay aligned. */
  hideColumns?: TaskColumnKey[]
}

/**
 * TaskRow — one task as a dense grid row: initiative, id, title, severity,
 * priority, estimate, tags and age.
 *
 * Composes {@link TableRow} / {@link TableCell} for row semantics and density,
 * {@link SeverityLabel} for the severity dot, and {@link TagPills} for tags. Used by
 * {@link TaskTable}.
 */
export function TaskRow({ task, ageLabel, severityDotOnly = false, hideColumns }: TaskRowProps) {
  const show = (column: TaskColumnKey) => !hideColumns?.includes(column)
  const severityWidth = severityDotOnly
    ? TASK_COLUMN_WIDTHS.severityCompact
    : TASK_COLUMN_WIDTHS.severity

  return (
    <TableRow testID="task-row">
      {show('slug') ? (
        <TableCell width={TASK_COLUMN_WIDTHS.slug}>
          <Typography variant="mono" numberOfLines={1} className="text-xs text-text-tertiary">
            {task.slug}
          </Typography>
        </TableCell>
      ) : null}

      {show('id') ? (
        <TableCell width={TASK_COLUMN_WIDTHS.id}>
          <Typography variant="mono" className="text-xs text-brand-primary">
            {task.id}
          </Typography>
        </TableCell>
      ) : null}

      <TableCell>
        <Typography variant="body2" numberOfLines={1} className="text-xs text-text-primary">
          {task.title}
        </Typography>
      </TableCell>

      {show('severity') ? (
        <TableCell width={severityWidth}>
          {severityDotOnly && task.severity ? (
            <Tooltip usePortal label={SEVERITY_META[task.severity].label}>
              <SeverityLabel severity={task.severity} dotOnly />
            </Tooltip>
          ) : (
            <SeverityLabel severity={task.severity} />
          )}
        </TableCell>
      ) : null}

      {show('priority') ? (
        <TableCell width={TASK_COLUMN_WIDTHS.priority} align="right">
          <Typography variant="mono" className="text-xs text-text-secondary">
            {String(task.priority)}
          </Typography>
        </TableCell>
      ) : null}

      {show('estimate') ? (
        <TableCell width={TASK_COLUMN_WIDTHS.estimate} align="right">
          <Typography variant="mono" className="text-xs text-text-secondary">
            {task.estimate === undefined ? '—' : String(task.estimate)}
          </Typography>
        </TableCell>
      ) : null}

      {show('tags') ? (
        <TableCell width={TASK_COLUMN_WIDTHS.tags}>
          <TagPills tags={task.tags} />
        </TableCell>
      ) : null}

      {show('updated') ? (
        <TableCell width={TASK_COLUMN_WIDTHS.age} align="right">
          <Tooltip usePortal label={formatDateTime(task.updated, 'medium', true)}>
            <Typography variant="caption" className="text-text-tertiary">
              {ageLabel}
            </Typography>
          </Tooltip>
        </TableCell>
      ) : null}
    </TableRow>
  )
}
