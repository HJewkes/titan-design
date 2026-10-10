// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Card } from '../../ui/card'
import { Pill } from '../../ui/pill'
import { StatusDot, type StatusDotVariant } from '../Workout/StatusDot'
import { SegmentedBar, type SegmentedBarSegment } from '../Workout/SegmentedBar'
import { Typography } from '../../ui/typography'
import { SEVERITY_BAR_COLOR, SEVERITY_ORDER, type TaskSeverity } from './SeverityLabel'

export type InitiativeState = 'focused' | 'backburner' | 'paused' | 'done'

/** Initiative state → label + {@link StatusDot} variant. One owner; the initiative header reads it too. */
export const INITIATIVE_STATE_META: Record<
  InitiativeState,
  { label: string; dot: StatusDotVariant }
> = {
  focused: { label: 'Focused', dot: 'on-track' },
  backburner: { label: 'Backburner', dot: 'future' },
  paused: { label: 'Paused', dot: 'deviation' },
  done: { label: 'Done', dot: 'success' },
}

const STATE_META = INITIATIVE_STATE_META

export interface InitiativeCardTopTask {
  id: string
  title: string
}

export interface InitiativeCardProps extends ViewProps {
  /** Initiative title, e.g. "planner — durable project state". */
  title: string
  /** Short slug shown under the title, e.g. "planner". */
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
  /** Consumer vocabulary under the top task: counts, newest activity, a badge. */
  meta?: ReactNode
  /** Makes the whole card one link. Fires on Enter or Space (web) and on tap. */
  onPress?: () => void
  /** Makes the whole card one link to this URL. Combine with `onPress` for client routing. */
  href?: string
  className?: string
}

/**
 * react-native-web leaves Enter on a `role="link"` to a native click, which only
 * an anchor produces; without `href` the card is a div, so Enter is handled here.
 */
function pressOnEnter(onPress: (() => void) | undefined) {
  return (event: { key?: string }) => {
    if (event.key === 'Enter') onPress?.()
  }
}

/**
 * InitiativeCard — an at-a-glance summary of one active-work initiative: state,
 * rank, open-task count, a severity-mix bar, and its top-priority open task.
 * Composes Card / Pill / StatusDot / SegmentedBar / Typography — never
 * hand-rolled. Used by {@link PortfolioOverview}.
 *
 * With `onPress` or `href` the whole card is one link: one tab stop, named by
 * the title. Keep `meta` free of pressables, which would add a second tab stop.
 *
 * Sits on the card plane above the page like every other content card; the
 * `accent` stripe is reserved for the focused state, where it carries meaning.
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
  meta,
  onPress,
  href,
  className,
  ...props
}: InitiativeCardProps) {
  const stateMeta = STATE_META[state]
  const segments: SegmentedBarSegment[] = SEVERITY_ORDER.filter((k) => severityCounts[k] > 0).map(
    (k) => ({ weight: severityCounts[k], color: SEVERITY_BAR_COLOR[k] })
  )

  const isLink = onPress !== undefined || href !== undefined
  const linkProps = isLink
    ? {
        onPress,
        href,
        accessibilityRole: 'link' as const,
        accessibilityLabel: title,
        ...(href === undefined && { onKeyDown: pressOnEnter(onPress) }),
      }
    : {}

  return (
    <Card
      variant={state === 'focused' ? 'accent' : 'elevated'}
      accentColor={state === 'focused' ? 'var(--color-brand-primary)' : undefined}
      className={cn('w-[326px] gap-2.5 p-4', className)}
      testID="initiative-card"
      isInteractive={isLink}
      {...linkProps}
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
        <StatusDot variant={stateMeta.dot} size="sm" label={stateMeta.label} />
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

      {meta ? <View className="flex-row flex-wrap items-center gap-2">{meta}</View> : null}
    </Card>
  )
}
