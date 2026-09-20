/**
 * One tip per week of a goal chart (titan-0201 round 4, human: "Can we add hover support
 * for the chart for all week indicators (not just next week)"). Pure: what each week's
 * target says and where it sits, so the layer only renders it.
 */
import { roundWeight } from '../../../utils/workout-format'
import type {
  GoalExpectedPoint,
  GoalNextTarget,
  GoalTrajectoryGeometry,
  GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'
import { hitBoxAround, type HitBox } from './goalTrajectoryTargets'

export interface WeekTip {
  week: number
  /** The hit box, clamped inside the chart. */
  box: HitBox
  /** What the tip says, first line first. */
  lines: string[]
  /** The target's accessible name, which carries the same facts for a screen reader. */
  label: string
}

export interface WeekTipInput {
  geometry: GoalTrajectoryGeometry
  weeks: readonly GoalTrajectoryWeek[]
  expected: readonly GoalExpectedPoint[]
  nextTarget?: GoalNextTarget
  unit: string
  width: number
  height: number
  size: number
}

const amount = (value: number, unit: string) => `${String(roundWeight(value))} ${unit}`

function planLine(point: GoalExpectedPoint | undefined, unit: string): string | null {
  if (!point) return null
  return point.low === point.high
    ? `Plan ${amount(point.low, unit)}`
    : `Plan ${String(roundWeight(point.low))} to ${amount(point.high, unit)}`
}

function readingLines(
  reading: GoalTrajectoryGeometry['actuals'][number] | undefined,
  unit: string
): string[] {
  if (!reading) return ['No reading yet']
  return [amount(reading.value, unit), ...(reading.isPR ? ['Personal record'] : [])]
}

/** Every week's tip: what it says, and the hit box it opens from. */
export function weekTips(input: WeekTipInput): WeekTip[] {
  const { geometry: g, weeks, expected, nextTarget, unit, width, height, size } = input
  const axis = weeks.length > 0 ? weeks.map((w) => w.index) : expected.map((p) => p.weekIndex)
  return axis.map((week) => {
    const reading = g.actuals.find((a) => Math.round(a.weekIndex) === week)
    const plan = expected.find((p) => p.weekIndex === week)
    const isNext = nextTarget?.weekIndex === week
    const lines = [
      ...readingLines(reading, unit),
      planLine(plan, unit),
      weeks.find((w) => w.index === week)?.isDeload === true ? 'Deload week' : null,
      isNext && nextTarget ? `Next target: ${nextTarget.label}` : null,
    ].filter((line): line is string => line != null)
    const y =
      reading?.y ??
      (isNext && g.nextTarget ? g.nextTarget.y : undefined) ??
      (plan ? g.toY((plan.low + plan.high) / 2) : (g.plot.top + g.plot.bottom) / 2)
    return {
      week,
      box: hitBoxAround({ x: g.toX(week), y }, size, width, height),
      lines,
      label: `Week ${String(week)}, ${lines.join(', ')}`,
    }
  })
}
