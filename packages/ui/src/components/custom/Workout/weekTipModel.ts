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

/** A week's facts, for a tip to lay out however it likes. */
export interface WeekFacts {
  /** The reading, split so a layout can lead with the figure. Absent before the week is lifted. */
  reading?: { amount: string; unit: string }
  isPR: boolean
  isDeload: boolean
  /** The planned band for the week, already worded ("179 to 183 lb"). */
  plan?: string
  /** The next target's label, on its week. */
  next?: string
}

export interface WeekTip {
  week: number
  /** The hit box, clamped inside the chart. */
  box: HitBox
  /** What the tip says, first line first. The accessible name is built from these. */
  lines: string[]
  facts: WeekFacts
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

/**
 * The next target's own words, minus a "next week:" lead-in: the row that carries it is
 * already labelled "Next target" (titan-0201 round 6).
 */
function nextValue(label: string): string {
  const stripped = label.replace(/^\s*next\s+week\s*:\s*/i, '')
  return stripped === '' ? label : stripped
}

const amount = (value: number, unit: string) => `${String(roundWeight(value))} ${unit}`

function planOf(point: GoalExpectedPoint | undefined, unit: string): string | undefined {
  if (!point) return undefined
  return point.low === point.high
    ? amount(point.low, unit)
    : `${String(roundWeight(point.low))} to ${amount(point.high, unit)}`
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
    const facts: WeekFacts = {
      ...(reading ? { reading: { amount: String(roundWeight(reading.value)), unit } } : {}),
      isPR: reading?.isPR === true,
      isDeload: weeks.find((w) => w.index === week)?.isDeload === true,
      ...(planOf(plan, unit) !== undefined ? { plan: planOf(plan, unit) } : {}),
      ...(isNext && nextTarget ? { next: nextValue(nextTarget.label) } : {}),
    }
    const lines = [
      ...readingLines(reading, unit),
      facts.plan === undefined ? null : `Plan ${facts.plan}`,
      facts.isDeload ? 'Deload week' : null,
      facts.next === undefined ? null : `Next target: ${facts.next}`,
    ].filter((line): line is string => line != null)
    const y =
      reading?.y ??
      (isNext && g.nextTarget ? g.nextTarget.y : undefined) ??
      (plan ? g.toY((plan.low + plan.high) / 2) : (g.plot.top + g.plot.bottom) / 2)
    return {
      week,
      box: hitBoxAround({ x: g.toX(week), y }, size, width, height),
      lines,
      facts,
      label: `Week ${String(week)}, ${lines.join(', ')}`,
    }
  })
}
