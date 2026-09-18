// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'

import { cn } from '../../../utils/cn'
import { Card } from '../../ui/card'
import { Pill, type PillTone } from '../../ui/pill'
import { TipTrigger } from '../../ui/tooltip'
import { useMeasuredWidth } from '../Table/column-fit'
import { Typography } from '../Typography'
import { GOAL_STATUS_LABEL, GOAL_STATUS_TONE } from './GoalLiftCard'
import { GoalMilestoneSummary, type GoalMilestoneSummaryProps } from './GoalMilestoneSummary'
import { GoalPriorityIcon, type GoalPriority } from './GoalPriorityIcon'
import {
  GoalTrajectoryChart,
  WALL_BREAKPOINT,
  trajectoryReach,
  type GoalTrajectoryChartProps,
  type GoalTrajectoryStatus,
} from './GoalTrajectoryChart'
import { trajectoryWeekScale } from './GoalTrajectoryChartGeometry'
import type { GoalMilestoneWeekAxis } from './GoalMilestoneWeekStrip'
import type { GoalReach } from './goalMilestone'
import { PrBadge } from './PrBadge'

/** Everything the chart needs except its box, its status and its metric name. */
export type PrimaryGoalChart = Omit<
  GoalTrajectoryChartProps,
  'width' | 'height' | 'status' | 'metricLabel'
>

/** The meso target's content, as the fold composes it: no plane, no frame. */
export type PrimaryGoalMilestone = Omit<GoalMilestoneSummaryProps, 'axis' | 'className'>

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
  milestone: PrimaryGoalMilestone
  /**
   * Pins the measured content width, which `onLayout` cannot supply under jsdom.
   * Unset, the card takes whatever its container gives it.
   */
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
 * Tip cards need a width of their own: an in-flow tip is laid out against its
 * trigger's box, so a pill-width container would wrap the basis one word a line.
 */
const TIP_WIDTH = 280

/**
 * Pace until a reading reaches the committed target, then the result: reaching
 * it is the hit label in success green, going past it is `Beyond goal` in the
 * `ahead` blue. Same verdict, words and tones as the chart's own pill and the
 * milestone summary — all three read it off `trajectoryReach`.
 */
export function goalStatusBadge(status: GoalTrajectoryStatus, reach: GoalReach): StatusBadgeSpec {
  if (reach === 'beyond') return { label: 'Beyond goal', tone: 'info' }
  if (reach === 'met') return { label: 'Hit', tone: 'success' }
  return { label: GOAL_STATUS_LABEL[status], tone: GOAL_STATUS_TONE[status] }
}

/**
 * The header marks take the chart's own density flag: a 14px star reads as a
 * speck across a room beside a wall-scale title, and a 20px one crowds a phone.
 */
export function markSizeFor(width: number | null): number {
  return width !== null && width >= WALL_BREAKPOINT ? 20 : 14
}

/** 340 across a room, 220 on a phone — the two heights the chart was drawn for. */
function chartHeightFor(width: number): number {
  return width >= WALL_BREAKPOINT ? 340 : 220
}

/** The week columns the cells must sit over, read off the chart's own scale. */
function weekAxisFor(goal: PrimaryGoalChart, width: number): GoalMilestoneWeekAxis {
  const scale = trajectoryWeekScale({
    expected: goal.expected,
    weeks: goal.weeks,
    actuals: goal.actuals,
    ...(goal.nextTarget ? { nextTarget: goal.nextTarget } : {}),
    width,
  })
  return { x: scale.toX, span: scale.span, left: scale.plot.left, right: scale.plot.right }
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
  markSize,
}: {
  title: string
  priority: GoalPriority
  badge: StatusBadgeSpec
  basis?: string
  citation?: string
  isPR: boolean
  markSize: number
}) {
  return (
    <View
      // The row is raised so an open tip paints over the fold beneath it: a
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
        <GoalPriorityIcon priority={priority} size={markSize} />
        <StatusBadge badge={badge} basis={basis} citation={citation} />
        {isPR && <PrBadge type="weight" compact animate={false} iconSize={markSize} />}
      </View>
    </View>
  )
}

/**
 * The summary over the plot: hero, facts, then the week cells sitting directly
 * on the chart's columns. The gap between the cells and the plane is the tight
 * one on purpose — a cell is the header of its week's column, not a strip that
 * happens to be above a chart.
 */
function Fold({ props, width }: { props: PrimaryGoalCardProps; width: number }) {
  const { goal, milestone, status, title, chartHeight } = props
  return (
    <View className="gap-stack-sm" testID="primary-goal-card-fold">
      <GoalMilestoneSummary {...milestone} axis={weekAxisFor(goal, width)} />
      <GoalTrajectoryChart
        {...goal}
        status={status}
        metricLabel={title}
        width={width}
        height={chartHeight ?? chartHeightFor(width)}
      />
    </View>
  )
}

/**
 * The lead priority at the top of the `#/goals` wall, as ONE card: the lift, its
 * priority mark and its verdict in the title row, the meso target folded in
 * above the chart, and the block's weeks as cells standing on the chart's own
 * week columns.
 *
 * Everything the old header block spelled out is carried by something that was
 * already on screen (VW-385, human calls 2026-09-17): the week comes off the
 * chart's axis and the summary's facts line, committed and stretch off the
 * chart's rules, next week off its hollow marker, and the status basis off the
 * pill's tip. The milestone tile's own inset plane went with the fold — the
 * chart's plane is the only inset the card has.
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
  const { title, priority, status, basis, citation, goal, className } = props
  const measured = useMeasuredWidth(props.chartWidth)
  const badge = goalStatusBadge(
    status,
    trajectoryReach(goal.committed, goal.actuals, goal.direction)
  )
  return (
    <Card
      elevation={1}
      // The inset lives on the card, so the measured box below it is exactly the
      // width its content has to spend — the chart's width, with nothing to subtract.
      className={cn('p-inset-lg', className)}
      role="article"
      aria-label={`${title} goal, ${badge.label}`}
      testID="primary-goal-card"
    >
      <View
        className="gap-stack-lg"
        onLayout={measured.onLayout}
        testID="primary-goal-card-content"
      >
        <Header
          title={title}
          priority={priority}
          badge={badge}
          basis={basis}
          citation={citation}
          isPR={goal.actuals.some((actual) => actual.isPR)}
          markSize={markSizeFor(measured.width)}
        />
        {measured.width !== null && <Fold props={props} width={measured.width} />}
      </View>
    </Card>
  )
}
