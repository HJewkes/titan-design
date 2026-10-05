import { roundWeight } from '../../../utils/workout-format'
import { valueReach, type GoalReach } from './goalMilestone'
import type {
  GoalActualPoint,
  GoalDirection,
  GoalTrajectoryGeometry,
  GoalTrajectoryStatus,
  GoalTrajectoryWeek,
  GoalExpectedPoint,
} from './GoalTrajectoryChartGeometry'
import { CURRENT_WEEK_NO_READING, type ReferenceLabelSide } from './GoalTrajectoryPlot'
import { gridLabelSpecs, ruleLabelSpecs, type RuleLabelText } from './goalTrajectoryRuleLabels'
import type { HitBox } from './goalTrajectoryTargets'

export const STATUS_LABEL: Record<GoalTrajectoryStatus, string> = {
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
 * Once a reading reaches the committed target the pill stops reporting pace and
 * reports the result: reaching the goal is success green, going past it is the
 * `ahead` blue. Both tones and both words are shared with `GoalMilestoneTile`,
 * which derives the same verdict from the same helper.
 */
export const REACH_STATUS = { met: 'on_track', beyond: 'ahead' } as const satisfies Record<
  Exclude<GoalReach, 'short'>,
  GoalTrajectoryStatus
>

const REACH_LABEL = { met: 'Goal met', beyond: 'Beyond goal' } as const

/**
 * The read model's own outcome words. When it sends one, the UI prints it rather
 * than re-deriving the same verdict from the numbers — its committed value and
 * ours can differ, and the read model is the one that knows.
 */
const OUTCOME_REACH = { goal_met: 'met', beyond_goal: 'beyond' } as const

/** The reach a status already states, or null when it only states pace. */
export function outcomeReach(status: GoalTrajectoryStatus): GoalReach | null {
  return status === 'goal_met' || status === 'beyond_goal' ? OUTCOME_REACH[status] : null
}

/** The best reading in the goal's direction, judged against the committed target. */
export function trajectoryReach(
  committed: number,
  actuals: GoalActualPoint[],
  direction: GoalDirection = 'up'
): GoalReach {
  const values = actuals.map((a) => a.value).filter((v) => Number.isFinite(v))
  if (values.length === 0) return 'short'
  const best = direction === 'down' ? Math.min(...values) : Math.max(...values)
  return valueReach(committed, best, direction)
}

/** Above this width the chart renders at wall density (across-the-room scale). */
export const WALL_BREAKPOINT = 720

export interface Density {
  stroke: number
  star: number
  tickCount: number
  showYLabels: boolean
  maxWeekLabels: number
}

// Phone drops to three gridlines; its y labels stay because the plot has the gutter.
const DENSITY: Record<'phone' | 'wall', Density> = {
  // `star` is an icon size, the same the card's PR badge takes at that width (markSizeFor).
  phone: { stroke: 2, star: 14, tickCount: 3, showYLabels: true, maxWeekLabels: 6 },
  wall: { stroke: 3, star: 20, tickCount: 5, showYLabels: true, maxWeekLabels: 12 },
}

/**
 * A calibrating chart (VW-433): readings are plain dots, because a first reading
 * is not an achievement, and the next target is its hollow dot with no dashed run.
 */
export function withoutRecords(actuals: GoalActualPoint[]): GoalActualPoint[] {
  return actuals.map((actual) => ({ ...actual, isPR: false }))
}

export function withoutLead(geometry: GoalTrajectoryGeometry): GoalTrajectoryGeometry {
  const next = geometry.nextTarget
  return next
    ? { ...geometry, nextTarget: { ...next, leadPath: '' }, currentWeekPoint: null }
    : geometry
}

export function summarize(
  statusLabel: string,
  geometry: GoalTrajectoryGeometry,
  committed: number,
  stretch: number,
  unit: string,
  metricLabel: string
): string {
  const latest = geometry.actuals[geometry.actuals.length - 1]
  const current = latest
    ? `Latest ${String(roundWeight(latest.value))} ${unit} at week ${String(Math.round(latest.weekIndex))}.`
    : 'No measured values yet.'
  const now = geometry.currentWeekPoint
    ? ` ${CURRENT_WEEK_NO_READING} (week ${String(geometry.currentWeekPoint.weekIndex)}).`
    : ''
  const prs = geometry.prStars.length
  return (
    `${metricLabel} trajectory chart. Status: ${statusLabel}. ` +
    `Committed ${String(roundWeight(committed))} ${unit}, stretch ${String(roundWeight(stretch))} ${unit}. ` +
    `${current}${now} ${String(prs)} personal record${prs === 1 ? '' : 's'}.`
  )
}

/** What the hatch and the dashed ramp say to a sighted reader: the whole note, and what the line is. */
export function calibratingSummary(note: string): string {
  const sentence = /[.!?]$/.test(note) ? note : `${note}.`
  return ` ${sentence} The line is the planned ramp from the start lift, not an expected band.`
}

export function densityFor(width: number): Density {
  return width >= WALL_BREAKPOINT ? DENSITY.wall : DENSITY.phone
}

/** The pill's tone and words: the reach once a reading meets the target, the read model's status before. */
export function chartTone(
  status: GoalTrajectoryStatus,
  committed: number,
  actuals: GoalActualPoint[],
  direction: GoalDirection
): { toneStatus: GoalTrajectoryStatus; statusLabel: string } {
  const reach = outcomeReach(status) ?? trajectoryReach(committed, actuals, direction)
  return {
    toneStatus: reach === 'short' ? status : REACH_STATUS[reach],
    statusLabel: reach === 'short' ? STATUS_LABEL[status] : REACH_LABEL[reach],
  }
}

interface ChartLabelInput {
  geometry: GoalTrajectoryGeometry
  committed: number
  stretch: number
  ruleLabelText: RuleLabelText
  referenceLabelSide: ReferenceLabelSide
  yAxisLabels: boolean
  boxes: HitBox[]
}

export function chartLabels(input: ChartLabelInput) {
  const { geometry, committed, stretch, ruleLabelText, boxes } = input
  const ruleLabels = ruleLabelSpecs({
    geometry,
    committed,
    stretch,
    text: ruleLabelText,
    side: input.referenceLabelSide,
    boxes,
  })
  const gridLabels = input.yAxisLabels
    ? []
    : gridLabelSpecs({
        geometry,
        ruleLabels,
        ruleValues: ruleLabelText === 'none' ? [] : [committed, stretch],
        boxes,
      })
  return { ruleLabels, gridLabels }
}

/** The planned weeks, or one per expected point when the read model sent none. */
export function axisWeeksOf(
  weeks: GoalTrajectoryWeek[],
  expected: GoalExpectedPoint[]
): GoalTrajectoryWeek[] {
  return weeks.length > 0 ? weeks : expected.map((p) => ({ index: p.weekIndex }))
}
