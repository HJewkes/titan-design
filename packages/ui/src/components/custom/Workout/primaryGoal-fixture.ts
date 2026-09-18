// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { PrimaryGoalCardProps } from './PrimaryGoalCard'
import type {
  GoalActualPoint,
  GoalExpectedPoint,
  GoalTrajectoryStatus,
  GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'
import type { GoalWeekEntry } from './goalMilestone'
import { calibratingGoalAt, type CalibratingPlacement } from './goalTrajectoryCalibratingFixture'

type Scenario = Omit<PrimaryGoalCardProps, 'layout' | 'chartWidth' | 'chartHeight'>

/** Six-week bench block: +2 lb/wk on the committed edge, the RP ramp as the stretch edge. */
const BENCH_EXPECTED: GoalExpectedPoint[] = [
  { weekIndex: 1, low: 175, high: 175 },
  { weekIndex: 2, low: 177, high: 179 },
  { weekIndex: 3, low: 179, high: 183 },
  { weekIndex: 4, low: 181, high: 187 },
  { weekIndex: 5, low: 183, high: 191 },
  { weekIndex: 6, low: 185, high: 195 },
]

const BENCH_WEEKS: GoalTrajectoryWeek[] = [
  { index: 1 },
  { index: 2 },
  { index: 3 },
  { index: 4 },
  { index: 5, isDeload: true },
  { index: 6 },
]

const BENCH_TARGET = { metric: 'top_load_at_reps', reps: 8, load: 185, unit: 'lb' } as const

/** The committed edge of the week the plan asks for next. */
function nextTargetAt(weekIndex: number) {
  const point = BENCH_EXPECTED[weekIndex - 1]
  return {
    weekIndex,
    value: point.low,
    label: `next week: ${String(point.low)} x ${String(BENCH_TARGET.reps)}`,
  }
}

function weekEntries(loads: number[], outcomes: GoalWeekEntry['outcome'][]): GoalWeekEntry[] {
  return loads.map((load, i) => ({ outcome: outcomes[i], reading: { reps: 8, load } }))
}

interface BenchInput {
  status: GoalTrajectoryStatus
  currentWeek: number
  loads: number[]
  outcomes: GoalWeekEntry['outcome'][]
  prWeek?: number
  basis: string
}

/** One bench scenario: the readings drive the chart, the tile and the verdict alike. */
function bench({ status, currentWeek, loads, outcomes, prWeek, basis }: BenchInput): Scenario {
  const actuals: GoalActualPoint[] = loads.map((value, i) => ({
    weekIndex: i + 1,
    value,
    isPR: i + 1 === prWeek,
    matched: true,
  }))
  const latest = { reps: 8, load: loads[loads.length - 1] }
  return {
    title: 'Bench press',
    priority: 'specialize',
    status,
    basis,
    citation: 'rp:rp-s5-load-increment-by-exercise-type',
    goal: {
      expected: BENCH_EXPECTED,
      committed: 185,
      stretch: 195,
      actuals,
      weeks: BENCH_WEEKS,
      direction: 'up',
      unit: 'lb',
      animate: false,
      ...(currentWeek < BENCH_EXPECTED.length ? { nextTarget: nextTargetAt(currentWeek + 1) } : {}),
    },
    milestone: {
      target: BENCH_TARGET,
      weekCount: 6,
      currentWeek,
      latest,
      status,
      weeks: weekEntries(loads, outcomes),
    },
  }
}

const CALIBRATING_OUTCOME: Record<CalibratingPlacement, GoalWeekEntry['outcome']> = {
  start: 'on_track',
  above: 'ahead',
  on: 'on_track',
  below: 'missed',
}

/**
 * The wall's calibrating goal on the calendar-week grid (VW-421), as the card
 * composes it: the start lift in week 1, one more reading in week 2 at
 * `placement` against the ramp unless `start`, and the following week's ramp
 * value as the next target.
 */
export function calibratingScenario(placement: CalibratingPlacement): Scenario {
  const goal = calibratingGoalAt(placement)
  const currentWeek = goal.actuals.length
  const best = Math.max(...goal.actuals.map((a) => a.value))
  const next = goal.expected[currentWeek]
  return {
    title: 'Cable chest press',
    priority: 'specialize',
    status: 'calibrating',
    basis:
      'Calibrating: the band is the programmed execution ramp, which is a claim about completing the work rather than about strength gained.',
    citation: 'rp:rp-s5-load-increment-by-exercise-type',
    goal: {
      expected: goal.expected,
      committed: goal.committed,
      stretch: goal.stretch,
      actuals: goal.actuals,
      weeks: goal.weeks,
      direction: 'up',
      unit: 'lb',
      animate: false,
      nextTarget: {
        weekIndex: next.weekIndex,
        value: next.low,
        label: `next week: ${String(next.low)} x 8`,
      },
    },
    milestone: {
      target: { metric: 'top_load_at_reps', reps: 8, load: 127.5, unit: 'lb' },
      weekCount: 12,
      currentWeek,
      latest: { reps: 8, load: best },
      status: 'calibrating',
      weeks: goal.actuals.map((actual, i) => ({
        outcome: i === 0 ? 'on_track' : CALIBRATING_OUTCOME[placement],
        reading: { reps: 8, load: actual.value },
      })),
    },
  }
}

const calibrating = calibratingScenario('above')

/** The states the design round compares, all on one bench block but calibrating. */
export const PRIMARY_GOAL_SCENARIOS = {
  calibrating,
  onTrack: bench({
    status: 'on_track',
    currentWeek: 4,
    loads: [175, 178, 181, 184],
    outcomes: ['on_track', 'on_track', 'ahead', 'on_track'],
    prWeek: 3,
    basis: 'On track: three of four weeks landed inside the expected band.',
  }),
  behind: bench({
    status: 'behind',
    currentWeek: 4,
    loads: [175, 176, 176, 177],
    outcomes: ['on_track', 'missed', 'missed', 'missed'],
    basis: 'Behind: the last three weeks sat under the committed edge of the band.',
  }),
  ahead: bench({
    status: 'ahead',
    currentWeek: 4,
    loads: [176, 180, 182, 184],
    outcomes: ['ahead', 'ahead', 'ahead', 'ahead'],
    prWeek: 4,
    basis: 'Ahead: every week landed on or above the stretch edge of the band.',
  }),
  hitExact: bench({
    status: 'on_track',
    currentWeek: 5,
    loads: [175, 178, 181, 184, 185],
    outcomes: ['on_track', 'on_track', 'on_track', 'on_track', 'on_track'],
    prWeek: 5,
    basis: 'The committed target was reached in week 5, one week early.',
  }),
  beyondGoal: bench({
    status: 'ahead',
    currentWeek: 5,
    loads: [177, 181, 185, 188, 192],
    outcomes: ['ahead', 'ahead', 'ahead', 'ahead', 'ahead'],
    prWeek: 5,
    basis: 'The committed target was cleared in week 3 and beaten every week since.',
  }),
} satisfies Record<string, Scenario>

export type PrimaryGoalScenario = keyof typeof PRIMARY_GOAL_SCENARIOS
