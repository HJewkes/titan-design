// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { Card } from '../../ui/card'
import { Pill } from '../../ui/pill'
import { StatusDot, type StatusDotVariant } from '../Workout/StatusDot'
import { SegmentedBar, type SegmentedBarSegment } from '../Workout/SegmentedBar'
import { Typography } from '../Typography'
import { resolveColor } from '../../../theme/resolve-color'

export type InitiativeState = 'focused' | 'backburner' | 'paused' | 'done'
export type TaskSeverity = 'critical' | 'high' | 'medium' | 'low'

/** Initiative state → label + {@link StatusDot} variant. */
const STATE_META: Record<InitiativeState, { label: string; dot: StatusDotVariant }> = {
  focused: { label: 'Focused', dot: 'on-track' },
  backburner: { label: 'Backburner', dot: 'future' },
  paused: { label: 'Paused', dot: 'deviation' },
  done: { label: 'Done', dot: 'success' },
}

/** Task severity → {@link SegmentedBar} segment fill color, most-to-least severe. */
const SEVERITY_ORDER: TaskSeverity[] = ['critical', 'high', 'medium', 'low']
const SEVERITY_COLOR: Record<TaskSeverity, string> = {
  critical: resolveColor('status-error-vivid'),
  high: resolveColor('status-error'),
  medium: resolveColor('status-warning'),
  // `text-tertiary` is greyRamp[500] in dark — identical to the original literal,
  // and it adapts in light instead of freezing. See TOKENS.md §3.
  low: resolveColor('text-tertiary'),
}

export interface InitiativeCardTopTask {
  id: string
  title: string
}

export interface InitiativeCardProps extends ViewProps {
  /** Initiative title, e.g. "active-work — durable workspace state". */
  title: string
  /** Short slug shown under the title, e.g. "active-work". */
  slug: string
  /** Lifecycle state — drives the status dot and card accent. */
  state: InitiativeState
  /** Focused rank (1-based). Omit for non-ranked states. */
  rank?: number
  /** Ship-target label, e.g. "2026-Q3". */
  shipTarget?: string
  /** Count of open tasks for this initiative. */
  openCount: number
  /** Open-task counts by severity, driving the segmented mix bar. Bar is omitted when all-zero. */
  severityCounts: Record<TaskSeverity, number>
  /** The highest-priority open task, if any. Renders "no open tasks" when omitted. */
  topTask?: InitiativeCardTopTask
  className?: string
}

/**
 * InitiativeCard — an at-a-glance summary of one active-work initiative: state,
 * rank, open-task count, a severity-mix bar, and its top-priority open task.
 * Composes Card / Pill / StatusDot / SegmentedBar / Typography — never
 * hand-rolled. Used by {@link PortfolioOverview}.
 */
export function InitiativeCard({
  title,
  slug,
  state,
  rank,
  shipTarget,
  openCount,
  severityCounts,
  topTask,
  className,
  ...props
}: InitiativeCardProps) {
  const meta = STATE_META[state]
  const segments: SegmentedBarSegment[] = SEVERITY_ORDER.filter((k) => severityCounts[k] > 0).map(
    (k) => ({ weight: severityCounts[k], color: SEVERITY_COLOR[k] })
  )

  return (
    <Card
      variant={state === 'focused' ? 'accent' : 'outline'}
      accentColor={state === 'focused' ? 'var(--color-brand-primary)' : undefined}
      className={`w-[326px] gap-2.5 p-4 ${className ?? ''}`}
      {...props}
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Typography variant="subtitle2" className="text-sm font-bold text-text-primary">
            {title}
          </Typography>
          <Typography variant="caption" className="text-xs text-text-tertiary">
            {slug}
          </Typography>
        </View>
        {rank ? (
          <Pill variant="subtle" color="primary" size="xs">
            {`#${rank}`}
          </Pill>
        ) : null}
      </View>

      <View className="flex-row items-center gap-3">
        <StatusDot variant={meta.dot} size="sm" label={meta.label} />
        <Typography variant="mono" className="text-xs text-text-secondary">
          {openCount} open
        </Typography>
        {shipTarget ? (
          <Typography variant="caption" className="text-xs text-text-tertiary">
            {`ship ${shipTarget}`}
          </Typography>
        ) : null}
      </View>

      {segments.length > 0 ? (
        <SegmentedBar segments={segments} height={5} gap={0} radius={9999} />
      ) : null}

      {topTask ? (
        <View className="flex-row items-center gap-2">
          <Typography variant="mono" className="text-xs text-brand-primary">
            {topTask.id}
          </Typography>
          <Typography
            variant="body2"
            numberOfLines={1}
            className="flex-1 text-xs text-text-secondary"
          >
            {topTask.title}
          </Typography>
        </View>
      ) : (
        <Typography variant="caption" className="text-xs text-text-tertiary">
          no open tasks
        </Typography>
      )}
    </Card>
  )
}
