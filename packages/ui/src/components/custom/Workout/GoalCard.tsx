// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { Platform, View, type TextStyle, type ViewProps } from 'react-native'

import { cn } from '../../../utils/cn'
import { Card } from '../../ui/card'
import { Indicator, type IndicatorColor } from '../../ui/indicator'
import { Pill, type PillTone } from '../../ui/pill'
import { TipTrigger } from '../../ui/tooltip'
import { useMeasuredWidth as useMeasuredBox } from '../Table/column-fit'
import { Typography } from '../../ui/typography'
import { GoalMilestoneSummary, type GoalMilestoneSummaryProps } from './GoalMilestoneSummary'
import type { GoalMilestoneWeekAxis } from './GoalMilestoneWeekStrip'
import { GoalPriorityIcon, type GoalPriority } from './GoalPriorityIcon'
import {
  GoalTrajectoryChart,
  WALL_BREAKPOINT,
  outcomeReach,
  trajectoryReach,
  type GoalNextTarget,
  type GoalTrajectoryChartProps,
} from './GoalTrajectoryChart'
import { trajectoryWeekScale } from './GoalTrajectoryChartGeometry'
import {
  milestoneReach,
  type GoalMilestoneReading,
  type GoalReach,
  type GoalWeekEntry,
} from './goalMilestone'
import { PrBadge } from './PrBadge'
import { GoalWeekColumnsChart } from './GoalWeekColumnsChart'

/**
 * The seven words the goals read model may say about a target. Mirrors
 * `GoalProgressStatus` in voltras-mcp's `read-models/goal-progress.ts`.
 */
export type GoalLiftStatus =
  | 'on_track'
  | 'ahead'
  | 'behind'
  | 'tolerated'
  | 'deload_week'
  | 'calibrating'
  | 'stalled'
  | 'goal_met'
  | 'beyond_goal'

/** One reading placed on the meso's week axis. */
export interface GoalLiftActual {
  /** 1-based meso week. The consumer drops readings that fall outside the meso. */
  weekIndex: number
  value: number
}

/**
 * The next waypoint, structured. Mirrors `GoalMilestone`'s `reps` / `load` /
 * `unit` / `goalWeek` (voltras-mcp #433) — the card never parses the `label`.
 */
export interface GoalLiftMilestone {
  reps: number
  load: number
  unit: 'lb' | 'kg'
  /** The week this milestone is due; also the chart's right edge. */
  goalWeek: number
}

export type GoalLiftCardDensity = 'comfortable' | 'compact'

/** What the compact card draws instead of a trajectory chart. */
export interface GoalCardTrend {
  /** The target's own fixed numbers, never the band's recomputed edges. */
  committed: number
  stretch: number
  /** Readings oldest first; they occupy only the elapsed part of the chart. */
  actuals: GoalLiftActual[]
  /** The week the target is due; also the chart's right edge. */
  goalWeek: number
  unit: string
  /** The next planned waypoint, drawn as the hollow marker. */
  nextTarget?: GoalNextTarget
}

/** Everything the trajectory chart needs except its box, status and metric name. */
export type GoalCardChart = Omit<
  GoalTrajectoryChartProps,
  'width' | 'height' | 'status' | 'metricLabel'
>

/** The meso target's content, as a card composes it: no plane, no frame. */
export type GoalCardMilestone = Omit<GoalMilestoneSummaryProps, 'axis' | 'className'>

/**
 * How much room the goal gets. `full` is the wall's lead card — the summary
 * folded over a trajectory chart; `compact` is a cell in the per-lift grid, the
 * same summary over a sparkline.
 */
export type GoalCardSize = 'full' | 'compact'

export interface GoalCardProps extends ViewProps {
  /** Exercise or goal label. Wraps rather than truncating. */
  title: string
  status: GoalLiftStatus
  size?: GoalCardSize
  /** The block's ask of this lift. Omitted, no priority mark is drawn. */
  priority?: GoalPriority
  /** Why the read model says what it says; opens as the status pill's tip. */
  basis?: string
  /** What the basis rests on, e.g. `rp:rp-s5-load-increment-by-exercise-type`. */
  citation?: string
  /** Whether any reading in this target is a personal record. */
  isPR?: boolean
  milestone: GoalCardMilestone
  /** `full` only: the trajectory chart's payload. */
  goal?: GoalCardChart
  /** `compact` only: the sparkline's payload. */
  trend?: GoalCardTrend
  /**
   * Pins the measured content width, which `onLayout` cannot supply under jsdom.
   * It is what the card has to spend — the chart's width, with nothing to subtract.
   */
  chartWidth?: number
  /** Chart height. Defaults to 340 at wall width, 220 below it. */
  chartHeight?: number
  density?: GoalLiftCardDensity
  /**
   * Force the status affordance's form. Defaults to width-driven: a pill above
   * `STATUS_COLLAPSE_WIDTH`, its light below. Tests set it explicitly because
   * `onLayout` never fires under jsdom.
   */
  statusForm?: 'pill' | 'dot'
  className?: string
}

/**
 * The compact preset's own props, kept as they were so voltras-mcp's `#/goals`
 * needs no change. {@link GoalCardProps} is the shape everything else takes.
 */
export interface GoalLiftCardProps extends ViewProps {
  /** Exercise label, e.g. "BENCH PRESS". Wraps rather than truncating. */
  name: string
  status: GoalLiftStatus
  milestone: GoalLiftMilestone
  committed: number
  stretch: number
  actuals: GoalLiftActual[]
  isPR?: boolean
  /**
   * One entry per week of the block, aligned to week 1 — the outcome cells under
   * the hero. Omitted, every week reads as one with no matched set.
   */
  weeks?: readonly GoalWeekEntry[]
  /** 1-based. Defaults to the last reading's week. */
  currentWeek?: number
  /**
   * The best matched set. Defaults to the last reading's value at the target's
   * own reps, which is what `top_load_at_reps` measures.
   */
  latest?: GoalMilestoneReading
  density?: GoalLiftCardDensity
  statusForm?: 'pill' | 'dot'
  className?: string
}

/** Shared with `GoalMuscleCard` so one vocabulary covers both cards. */
export const GOAL_STATUS_LABEL: Record<GoalLiftStatus, string> = {
  on_track: 'On track',
  ahead: 'Ahead',
  behind: 'Behind',
  tolerated: 'Tolerated',
  deload_week: 'Deload week',
  calibrating: 'Calibrating',
  stalled: 'Stalled',
  goal_met: 'Goal met',
  beyond_goal: 'Beyond goal',
}

/**
 * `ahead` is info, never warning-amber — that hue is reserved for the pacing
 * tone itself (REJECTED.md, "Amber holds").
 */
export const GOAL_STATUS_TONE: Record<GoalLiftStatus, PillTone & IndicatorColor> = {
  on_track: 'success',
  ahead: 'info',
  tolerated: 'info',
  calibrating: 'info',
  deload_week: 'info',
  behind: 'warning',
  stalled: 'warning',
  goal_met: 'success',
  beyond_goal: 'info',
}

/**
 * Below this content width the status pill collapses to its light, whatever
 * the density. Driving the collapse off density alone left a narrow
 * comfortable cell rendering a full pill, which shoved the title into a wrap.
 * The mark is never absent; only its form changes.
 */
export const STATUS_COLLAPSE_WIDTH = 320

// The compact card's name and its hero read as one header: stack-md between them, not the full card's stack-lg.
const DENSITY = {
  comfortable: { pad: 'p-inset-lg', gap: 'gap-stack-md', chartHeight: 56 },
  compact: { pad: 'p-inset-md', gap: 'gap-stack-md', chartHeight: 42 },
} as const

export function goalLiftStatusLabel(status: GoalLiftStatus): string {
  return GOAL_STATUS_LABEL[status]
}

/**
 * The card's own props as the milestone block reads them: the target is the
 * milestone, the block runs to its due week, and the best set is the last
 * reading at the target's reps — `top_load_at_reps` is a load AT those reps, so
 * the pair is the reading, not an assumption. A caller with the real set passes
 * `latest`.
 */
export function milestoneBlock({
  milestone,
  actuals,
  status,
  weeks,
  currentWeek,
  latest,
}: Pick<
  GoalLiftCardProps,
  'milestone' | 'actuals' | 'status' | 'weeks' | 'currentWeek' | 'latest'
>): GoalCardMilestone {
  const last = actuals[actuals.length - 1]
  const reading = latest ?? (last ? { reps: milestone.reps, load: last.value } : undefined)
  return {
    target: {
      metric: 'top_load_at_reps',
      reps: milestone.reps,
      load: milestone.load,
      unit: milestone.unit,
    },
    weekCount: milestone.goalWeek,
    status,
    ...((currentWeek ?? last?.weekIndex) ? { currentWeek: currentWeek ?? last.weekIndex } : {}),
    ...(reading ? { latest: reading } : {}),
    ...(weeks ? { weeks } : {}),
  }
}

/** The title row's marks, in one order for every size: priority, PR, status. */
interface StatusBadgeSpec {
  label: string
  /** One tone for both forms: the capsule and the light it collapses to. */
  tone: PillTone & IndicatorColor
}

/**
 * Tip cards need a width of their own: an in-flow tip is laid out against its
 * trigger's box, so a pill-width container would wrap the basis one word a line.
 */
const TIP_WIDTH = 280

/**
 * Pace until a reading reaches the committed target, then the result: reaching
 * it is the hit label in success green, going past it is `Beyond goal` in the
 * `ahead` blue. Same verdict, words and tones as the milestone summary's hero —
 * both read it off `trajectoryReach`.
 */
export function goalStatusBadge(status: GoalLiftStatus, reach: GoalReach): StatusBadgeSpec {
  if (reach === 'beyond') return { label: GOAL_STATUS_LABEL.beyond_goal, tone: 'info' }
  if (reach === 'met') return { label: GOAL_STATUS_LABEL.goal_met, tone: 'success' }
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
function weekAxisFor(goal: GoalCardChart, width: number): GoalMilestoneWeekAxis {
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

/**
 * The verdict, furthest right in the title row. It is a pill with its reasoning
 * one hover away, or — below `STATUS_COLLAPSE_WIDTH` — its light alone. The mark
 * is never absent; only its form changes.
 */
function StatusAffordance({
  badge,
  collapsed,
  basis,
  citation,
}: {
  badge: StatusBadgeSpec
  collapsed: boolean
  basis?: string
  citation?: string
}) {
  if (collapsed) {
    return (
      <Indicator
        color={badge.tone}
        size="md"
        // RNW drops `aria-label` on a View with no role, and axe then flags the
        // bare attribute as prohibited (gotcha #3). The dot IS the status here,
        // so it needs the name, so it needs a role.
        accessibilityRole="image"
        accessibilityLabel={badge.label}
        // Not `-status-dot`: Pill names its own leading dot `${testID}-dot`, and
        // the collapsed light would collide with the pill's.
        testID="goal-card-status-light"
      />
    )
  }
  const pill = (
    <Pill tone={badge.tone} variant="subtle" size="sm" leading="dot" testID="goal-card-status">
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
      testID="goal-card-status-tip"
    >
      {pill}
    </TipTrigger>
  )
}

/**
 * Guards against pasted garbage, which no real exercise name reaches: one unbroken token breaks
 * inside the card instead of pushing past its edge (native Text already does), and a four-line
 * clamp stops a runaway string growing the card without end.
 */
const GOAL_CARD_TITLE_MAX_LINES = 4

const TITLE_GUARD = {
  maxLines: GOAL_CARD_TITLE_MAX_LINES,
  style: Platform.select<TextStyle>({
    web: { overflowWrap: 'anywhere' } as TextStyle,
    default: {},
  }),
}

/**
 * One title row for both sizes (VW-385 round 5, human: "make the title
 * consistent between the primary goal card and goal card"): the lift on the
 * left, then priority, PR and the status badge furthest right.
 *
 * At phone width the marks never cost the name its letters (VW-432): when the
 * name and the marks do not fit one row, the row wraps and the marks drop to a
 * left-aligned line under the name; only a name wider than the whole card
 * breaks onto a second line. It is pure flex wrap, so web and native agree.
 */
function TitleRow({
  title,
  size,
  priority,
  badge,
  collapsed,
  basis,
  citation,
  isPR,
  markSize,
}: {
  title: string
  size: GoalCardSize
  priority?: GoalPriority
  badge: StatusBadgeSpec
  collapsed: boolean
  basis?: string
  citation?: string
  isPR: boolean
  markSize: number
}) {
  return (
    <View
      // The row is raised so an open tip paints over the body beneath it: a
      // later sibling wins on paint order whatever the tip's own z-index says.
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
      }}
      className="gap-x-inline-md gap-y-stack-sm"
      testID="goal-card-title-row"
    >
      <View style={{ flexShrink: 1, minWidth: 0 }}>
        {size === 'full' ? (
          <Typography variant="h5" testID="goal-card-title" {...TITLE_GUARD}>
            {title}
          </Typography>
        ) : (
          <Typography variant="overline" color="tertiary" testID="goal-card-title" {...TITLE_GUARD}>
            {title}
          </Typography>
        )}
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}
        className="gap-inline-sm"
        testID="goal-card-marks"
      >
        {priority && <GoalPriorityIcon priority={priority} size={markSize} />}
        {isPR && <PrBadge type="weight" compact animate={false} iconSize={markSize} />}
        <StatusAffordance badge={badge} collapsed={collapsed} basis={basis} citation={citation} />
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
function FullBody({ props, width }: { props: GoalCardProps; width: number }) {
  const { goal, status, title, chartHeight } = props
  if (!goal) return null
  return (
    <View className="gap-stack-sm" testID="goal-card-fold">
      <GoalMilestoneSummary {...statedMilestone(props)} axis={weekAxisFor(goal, width)} />
      <GoalTrajectoryChart
        {...goal}
        status={status}
        metricLabel={title}
        width={width}
        height={chartHeight ?? chartHeightFor(width)}
        // The week cells directly above the plot stand on these very columns, so
        // the axis would print each week a second time, a row lower.
        showWeekLabels={goal.showWeekLabels ?? false}
      />
    </View>
  )
}

/**
 * The grid cell's body: the summary WITHOUT its own week cells, over the compact
 * chart — which carries that one cells row itself, standing on its plane's top
 * edge so each cell heads the column its point sits in (D1, VW-385 ideation
 * round 2). Two rows of the same cells is what the fold already refused upstairs.
 */
function CompactBody({
  props,
  height,
  width,
}: {
  props: GoalCardProps
  height: number
  width: number | null
}) {
  const { trend, milestone, status } = props
  return (
    <View className="gap-stack-md">
      <GoalMilestoneSummary {...statedMilestone(props)} scale="phone" showWeeks={false} />
      <View style={{ minHeight: height }} testID="goal-card-trend">
        {trend && width !== null && (
          <GoalWeekColumnsChart
            actuals={trend.actuals}
            committed={trend.committed}
            goalWeek={trend.goalWeek}
            unit={trend.unit}
            status={status}
            width={width}
            height={height}
            {...(milestone.currentWeek !== undefined ? { currentWeek: milestone.currentWeek } : {})}
            {...(milestone.weeks ? { weeks: milestone.weeks } : {})}
            {...(trend.nextTarget ? { nextTarget: trend.nextTarget } : {})}
          />
        )}
      </View>
    </View>
  )
}

/**
 * The summary, told what the read model already knows. Without this the hero
 * reads "5 lb to goal" under a badge reading "Goal met" whenever the numbers we
 * hold trail the outcome the read model has ruled on — the card contradicting
 * itself, which is the thing the shared verdict exists to prevent.
 */
function statedMilestone(props: GoalCardProps): GoalCardMilestone {
  const { milestone } = props
  const stated = outcomeReach(props.status)
  return stated && !milestone.reach ? { ...milestone, reach: stated } : milestone
}

/**
 * The verdict the badge carries. An outcome status states it outright, so the
 * read model wins; otherwise it is the MILESTONE's, which is the one the
 * summary's hero shows — a badge reading "Hit" over a hero reading "2.5 lb to
 * goal" is the card disagreeing with itself, and it can, because a band's
 * committed edge and the block's target are different numbers. The chart's own
 * committed value is the fallback for a card whose milestone has no reading yet.
 */
function cardReach(props: GoalCardProps): GoalReach {
  const stated = outcomeReach(props.status)
  if (stated) return stated
  const { target, latest, direction } = props.milestone
  if (latest) return milestoneReach(target, latest, direction) ?? 'short'
  if (props.goal) {
    return trajectoryReach(props.goal.committed, props.goal.actuals, props.goal.direction)
  }
  if (props.trend) return trajectoryReach(props.trend.committed, props.trend.actuals)
  return 'short'
}

function hasRecord(props: GoalCardProps): boolean {
  if (props.isPR !== undefined) return props.isPR
  return props.goal?.actuals.some((actual) => actual.isPR) ?? false
}

/**
 * A goal at card scale, in one of two sizes.
 *
 * `full` is the wall's lead card: the title row, the meso target's summary, and
 * the trajectory chart with the block's weeks as cells standing on its own week
 * columns. `compact` is a cell in the per-lift grid: the same title row and the
 * same summary, over a sparkline against the committed/stretch band.
 *
 * It replaced two cards that said the same things in two vocabularies (VW-385
 * round 5). Everything the `#/goals` header block used to spell out is carried
 * by something that was already on screen: the week comes off the chart's axis
 * and the summary's facts line, committed and stretch off the chart's rules, the
 * next week off its hollow marker, and the status basis off the pill's tip.
 *
 * @example
 * <GoalCard
 *   title="Cable chest press"
 *   priority="specialize"
 *   status="calibrating"
 *   goal={{ expected, committed: 127.5, stretch: 127.5, actuals, weeks }}
 *   milestone={{ target, weekCount: 12, currentWeek: 2, status: 'calibrating' }}
 * />
 */
export function GoalCard(props: GoalCardProps) {
  const {
    title,
    status,
    size = 'full',
    priority,
    basis,
    citation,
    density = 'comfortable',
    statusForm,
    className,
    ...rest
  } = props
  const d = DENSITY[density]
  const measured = useMeasuredBox(props.chartWidth)
  const badge = goalStatusBadge(status, cardReach(props))
  const collapsed =
    statusForm !== undefined
      ? statusForm === 'dot'
      : size === 'compact' &&
        (density === 'compact' ||
          (measured.width !== null && measured.width < STATUS_COLLAPSE_WIDTH))
  const { goal, trend, milestone, chartWidth, chartHeight, isPR, ...viewProps } = rest
  void goal
  void trend
  void milestone
  void chartWidth
  void chartHeight
  void isPR
  return (
    <Card
      elevation={1}
      // The inset lives on the card, so the measured box below it is exactly the
      // width its content has to spend — the chart's width, with nothing to subtract.
      className={cn(size === 'full' ? 'p-inset-lg' : d.pad, className)}
      role="article"
      aria-label={`${title} goal, ${badge.label}`}
      testID="goal-card"
      {...viewProps}
    >
      <View
        className={size === 'full' ? 'gap-stack-lg' : d.gap}
        onLayout={measured.onLayout}
        testID="goal-card-content"
      >
        <TitleRow
          title={title}
          size={size}
          priority={priority}
          badge={badge}
          collapsed={collapsed}
          basis={basis}
          citation={citation}
          isPR={hasRecord(props)}
          markSize={markSizeFor(measured.width)}
        />
        {size === 'compact' ? (
          <CompactBody props={props} height={d.chartHeight} width={measured.width} />
        ) : (
          measured.width !== null && <FullBody props={props} width={measured.width} />
        )}
      </View>
    </Card>
  )
}

/**
 * `GoalCard size="compact"` under the name the per-lift grid already calls it by
 * (voltras-mcp's `#/goals` imports it). It maps the lift-shaped props onto the
 * merged card and adds nothing of its own; retire it once the SPA moves.
 */
export function GoalLiftCard({
  name,
  status,
  milestone,
  committed,
  stretch,
  actuals,
  isPR = false,
  weeks,
  currentWeek,
  latest,
  density = 'comfortable',
  statusForm,
  className,
  ...props
}: GoalLiftCardProps) {
  return (
    <GoalCard
      title={name}
      status={status}
      size="compact"
      isPR={isPR}
      milestone={milestoneBlock({ milestone, actuals, status, weeks, currentWeek, latest })}
      trend={{
        committed,
        stretch,
        actuals,
        goalWeek: milestone.goalWeek,
        unit: milestone.unit,
      }}
      density={density}
      {...(statusForm ? { statusForm } : {})}
      className={className}
      testID="goal-lift-card"
      {...props}
    />
  )
}
