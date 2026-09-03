// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { resolveColor } from '../../../theme/resolve-color'
import { Indicator } from '../../ui/indicator'
import { Typography } from '../Typography'

/** How much a task hurts if left undone. Ordered worst-first by {@link SEVERITY_RANK}. */
export type TaskSeverity = 'critical' | 'high' | 'medium' | 'low'

/**
 * Sort weight per severity, worst-first. Exported so a table can rank a severity
 * column by meaning rather than alphabetically ("critical" < "high" < "low" as
 * strings puts low in the middle).
 */
export const SEVERITY_RANK: Record<TaskSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/** Severities worst-first — the canonical order for legends and pickers. */
export const SEVERITY_ORDER: TaskSeverity[] = ['critical', 'high', 'medium', 'low']

/** Rank for a possibly-absent severity; unset sorts after every real value. */
export function severityRank(severity?: TaskSeverity): number {
  return severity ? SEVERITY_RANK[severity] : SEVERITY_ORDER.length
}

/**
 * Severity to its display label and {@link Indicator} colour. Critical and high
 * both read as error; the vivid step separates "drop everything" from "serious".
 */
export const SEVERITY_META: Record<
  TaskSeverity,
  { label: string; dot: React.ComponentProps<typeof Indicator>['color'] }
> = {
  critical: { label: 'Critical', dot: 'error-vivid' },
  high: { label: 'High', dot: 'error' },
  medium: { label: 'Medium', dot: 'warning' },
  low: { label: 'Low', dot: 'info' },
}

/**
 * Severity as a fill for an area mark (a {@link SegmentedBar} segment), where
 * {@link SEVERITY_META} gives the point-mark dot colour.
 *
 * `low` diverges deliberately: as a dot among four it needs to stay legible, but
 * as a bar segment it should recede, so it takes `text-tertiary` rather than
 * `status-info`. Both live here so the severity vocabulary has one owner.
 */
export const SEVERITY_BAR_COLOR: Record<TaskSeverity, string> = {
  critical: resolveColor('status-error-vivid'),
  high: resolveColor('status-error'),
  medium: resolveColor('status-warning'),
  low: resolveColor('text-tertiary'),
}

export interface SeverityLabelProps {
  /** Omitted renders the em-dash placeholder rather than nothing, so columns stay aligned. */
  severity?: TaskSeverity
  /** Hides the text, leaving only the dot — for a legend key or a very tight column. */
  dotOnly?: boolean
  className?: string
}

/**
 * SeverityLabel — a task's severity as a coloured dot plus its label.
 *
 * Composes {@link Indicator}; never hand-roll a status dot (there are already two
 * dot primitives in the system, and this is not a third). Used by
 * {@link TaskRow} and {@link TaskTable}'s legend.
 */
export function SeverityLabel({ severity, dotOnly = false, className }: SeverityLabelProps) {
  if (!severity) {
    return (
      <Typography variant="caption" className={cn('text-text-tertiary', className)}>
        —
      </Typography>
    )
  }

  const { label, dot } = SEVERITY_META[severity]
  return (
    <View className={cn('flex-row items-center gap-1.5', className)}>
      <Indicator size="sm" color={dot} testID={`severity-dot-${severity}`} />
      {dotOnly ? null : (
        <Typography variant="caption" color="inherit" className="text-text-secondary">
          {label}
        </Typography>
      )}
    </View>
  )
}
