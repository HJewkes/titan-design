// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'

import { Card } from '../../ui/card'
import { Pill, type PillTone } from '../../ui/pill'
import { TipTrigger } from '../../ui/tooltip'
import { useMeasuredWidth } from '../Table/column-fit'
import { Typography } from '../Typography'
import { GOAL_STATUS_LABEL, GOAL_STATUS_TONE } from './GoalLiftCard'
import { GoalMilestoneTile, type GoalMilestoneTileProps } from './GoalMilestoneTile'
import { GoalPriorityIcon, type GoalPriority } from './GoalPriorityIcon'
import {
  GoalTrajectoryChart,
  WALL_BREAKPOINT,
  trajectoryReach,
  type GoalTrajectoryChartProps,
  type GoalTrajectoryStatus,
} from './GoalTrajectoryChart'
import type { GoalReach } from './goalMilestone'
import { PrBadge } from './PrBadge'

/** Everything the chart needs except its box, its status and its metric name. */
export type PrimaryGoalChart = Omit<
  GoalTrajectoryChartProps,
  'width' | 'height' | 'status' | 'metricLabel'
>

/**
 * Where the milestone tile sits: `fill` puts it under a chart measured to the
 * card's width, `fixed` beside a chart pinned to {@link FIXED_CHART_WIDTH}.
 */
export type PrimaryGoalCardLayout = 'fill' | 'fixed'

/** The wall chart's original width, before the card started measuring its own. */
export const FIXED_CHART_WIDTH = 1200
/** Narrowest the tile reads at in the right column. */
export const TILE_MIN_WIDTH = 320
/**
 * Tip cards need a width of their own: an in-flow tip is laid out against its
 * trigger's box, so a pill-width container would wrap the basis one word a line.
 */
const TIP_WIDTH = 280

export interface PrimaryGoalCardProps extends ViewProps {
  /** The lift this goal is about, e.g. "Cable chest press". */
  title: string
  priority: GoalPriority
  status: GoalTrajectoryStatus
  /** Why the read model says what it says; opens as the status pill's tip. */
  basis?: string
  /** What the basis rests on, e.g. `rp:rp-s5-load-increment-by-exercise-type`. */
  citation?: string
  goal: PrimaryGoalChart
  milestone: GoalMilestoneTileProps
  layout?: PrimaryGoalCardLayout
  /** Pins the chart width. `fixed` defaults to 1200; `fill` measures its box. */
  chartWidth?: number
  /** Chart height. Defaults to 340 at wall width, 220 below it. */
  chartHeight?: number
  className?: string
}

interface StatusBadgeSpec {
  label: string
  tone: PillTone
}

/**
 * Pace until a reading reaches the committed target, then the result: reaching
 * it is the hit label in success green, going past it is `Beyond goal` in the
 * `ahead` blue. Same verdict, words and tones as the chart's own pill and the
 * milestone tile — all three read it off `trajectoryReach`.
 */
export function goalStatusBadge(status: GoalTrajectoryStatus, reach: GoalReach): StatusBadgeSpec {
  if (reach === 'beyond') return { label: 'Beyond goal', tone: 'info' }
  if (reach === 'met') return { label: 'Hit', tone: 'success' }
  return { label: GOAL_STATUS_LABEL[status], tone: GOAL_STATUS_TONE[status] }
}

function BasisTip({ basis, citation }: { basis: string; citation?: string }) {
  return (
    <View className="gap-stack-sm" style={{ width: TIP_WIDTH }}>
      <Typography variant="body2">{basis}</Typography>
      {citation && (
        <Typography variant="caption" color="tertiary">
          {citation}
        </Typography>
      )}
    </View>
  )
}

/** The pill carries the verdict; its tip carries the reasoning and the citation. */
function StatusBadge({
  badge,
  basis,
  citation,
}: {
  badge: StatusBadgeSpec
  basis?: string
  citation?: string
}) {
  const pill = (
    <Pill
      tone={badge.tone}
      variant="subtle"
      size="sm"
      leading="dot"
      testID="primary-goal-card-status"
    >
      {badge.label}
    </Pill>
  )
  if (!basis) return pill
  return (
    <TipTrigger
      label={`Goal status: ${badge.label}`}
      content={<BasisTip basis={basis} citation={citation} />}
      // The header sits at the top of the page, where a tip opening upwards is
      // cut off by the viewport. In flow rather than portalled: the portal
      // positions on the cardinal alone, which centres a 320px box on a pill at
      // the card's right edge and leaves it a sliver of viewport to wrap into.
      placement="bottom-end"
      usePortal={false}
      testID="primary-goal-card-status-tip"
    >
      {pill}
    </TipTrigger>
  )
}

function Header({
  title,
  priority,
  badge,
  basis,
  citation,
  isPR,
}: {
  title: string
  priority: GoalPriority
  badge: StatusBadgeSpec
  basis?: string
  citation?: string
  isPR: boolean
}) {
  return (
    <View
      // The row is raised so an open tip paints over the chart beneath it: a
      // later sibling wins on paint order whatever the tip's own z-index says.
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}
      className="gap-inline-md"
    >
      <View style={{ flexShrink: 1, minWidth: 0 }}>
        <Typography variant="h5" maxLines={2} testID="primary-goal-card-title">
          {title}
        </Typography>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
        <GoalPriorityIcon priority={priority} />
        <StatusBadge badge={badge} basis={basis} citation={citation} />
        {isPR && <PrBadge type="weight" compact animate={false} />}
      </View>
    </View>
  )
}

/** 340 across a room, 220 on a phone — the two heights the chart was drawn for. */
function chartHeightFor(width: number): number {
  return width >= WALL_BREAKPOINT ? 340 : 220
}

function Body({
  props,
  width,
  onLayout,
}: {
  props: PrimaryGoalCardProps
  width: number | null
  onLayout: (event: Parameters<NonNullable<ViewProps['onLayout']>>[0]) => void
}) {
  const { goal, milestone, status, title, layout = 'fill', chartHeight } = props
  const side = layout === 'fixed'
  return (
    <View
      style={side ? { flexDirection: 'row', alignItems: 'flex-start' } : undefined}
      className={side ? 'gap-inline-lg' : 'gap-stack-lg'}
    >
      <View onLayout={onLayout} testID="primary-goal-card-chart">
        {width !== null && (
          <GoalTrajectoryChart
            {...goal}
            status={status}
            metricLabel={title}
            width={width}
            height={chartHeight ?? chartHeightFor(width)}
          />
        )}
      </View>
      <View style={side ? { flex: 1, minWidth: TILE_MIN_WIDTH } : undefined}>
        <GoalMilestoneTile {...milestone} />
      </View>
    </View>
  )
}

/**
 * The lead priority at the top of the `#/goals` wall: the lift, its priority
 * mark and status in one row, then the trajectory and the meso target.
 *
 * Everything the old header block spelled out is now carried by something that
 * was already on screen (VW-385, human call 2026-09-17): the week comes off the
 * chart's axis, committed and stretch off its rules, the next week off its
 * hollow marker, and the status basis off the pill's tip.
 *
 * @example
 * <PrimaryGoalCard
 *   title="Cable chest press"
 *   priority="specialize"
 *   status="calibrating"
 *   basis="Calibrating: the band is the programmed execution ramp."
 *   goal={{ expected, committed: 127.5, stretch: 127.5, actuals, weeks }}
 *   milestone={{ target, weekCount: 12, currentWeek: 2, status: 'calibrating' }}
 * />
 */
export function PrimaryGoalCard(props: PrimaryGoalCardProps) {
  const { title, priority, status, basis, citation, goal, layout = 'fill', className } = props
  const pinned = props.chartWidth ?? (layout === 'fixed' ? FIXED_CHART_WIDTH : undefined)
  const measured = useMeasuredWidth(pinned)
  const badge = goalStatusBadge(
    status,
    trajectoryReach(goal.committed, goal.actuals, goal.direction)
  )
  return (
    <Card
      elevation={1}
      className={className}
      role="article"
      aria-label={`${title} goal, ${badge.label}`}
      testID="primary-goal-card"
    >
      <View className="p-inset-lg gap-stack-lg">
        <Header
          title={title}
          priority={priority}
          badge={badge}
          basis={basis}
          citation={citation}
          isPR={goal.actuals.some((actual) => actual.isPR)}
        />
        <Body props={props} width={measured.width} onLayout={measured.onLayout} />
      </View>
    </Card>
  )
}
