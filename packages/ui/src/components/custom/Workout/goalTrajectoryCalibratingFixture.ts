/**
 * A calibrating Cable Chest Press goal: the planned ramp stands in for a band
 * because there is too little history to fit one. Every expected week has
 * `low === high`, so the band has no area, and `committed === stretch`, so the two
 * rule labels would print on one baseline (VW-414).
 *
 * Two shapes live here. {@link calibratingWallCapture} is the exact payload the
 * voltras-mcp wall sent on 2026-09-17, kept for the VW-414 regressions. The
 * others are the same goal on the calendar-week grid the read model has used
 * since VW-421: week 1 is the ISO week (Monday 00:00 UTC) holding the start lift,
 * and every reading arrives with its `weekIndex`.
 */
import type {
  GoalActualPoint,
  GoalExpectedPoint,
  GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'

/** The start lift: the value the ramp is anchored to. */
export const CALIBRATING_START_VALUE = 100

/** 2.5 lb a week from the start lift at week 1 to the 127.5 lb target at week 12. */
export const CALIBRATING_WEEKLY_STEP = 2.5

export const calibratingExpected: GoalExpectedPoint[] = Array.from({ length: 12 }, (_, i) => {
  const value = CALIBRATING_START_VALUE + i * CALIBRATING_WEEKLY_STEP
  return { weekIndex: i + 1, low: value, high: value }
})

const BLOCK_START = Date.parse('2026-09-07T00:00:00Z')
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** Calendar weeks from the Monday of the start lift's week. */
export const calibratingWeeks: GoalTrajectoryWeek[] = Array.from({ length: 12 }, (_, i) => ({
  index: i + 1,
  isDeload: false,
  startDate: new Date(BLOCK_START + i * WEEK_MS).toISOString().slice(0, 10),
}))

const base = {
  expected: calibratingExpected,
  committed: 127.5,
  stretch: 127.5,
  status: 'calibrating',
  direction: 'up',
  metricLabel: 'CABLE CHEST PRESS',
} as const

/**
 * What the wall sent on 2026-09-17, before VW-421: the start lift carries only a
 * `ts` and the weeks no `startDate`, so the chart drops it, and the 110 lb reading
 * from 2026-09-14 claims week 1, a week early and on top of the ramp's start.
 */
export const calibratingWallCapture = {
  ...base,
  weeks: calibratingWeeks.map(({ index, isDeload }) => ({ index, isDeload })),
  actuals: [
    { ts: '2026-09-07', value: 100, isPR: false, matched: true },
    { ts: '2026-09-14', weekIndex: 1, value: 110, isPR: true, matched: true },
  ] satisfies GoalActualPoint[],
}

/**
 * Where the week-2 reading sits against the ramp's week-2 value (102.5), or
 * `start` for a lift with only its start lift on record, which by construction
 * sits on the ramp's start.
 */
export type CalibratingPlacement = 'start' | 'above' | 'on' | 'below'

const WEEK_TWO_READING: Record<
  Exclude<CalibratingPlacement, 'start'>,
  { value: number; isPR: boolean }
> = {
  above: { value: 110, isPR: true },
  on: { value: 102.5, isPR: true },
  below: { value: 97.5, isPR: false },
}

/** The start lift on week 1 at the ramp's start, then (unless `start`) one reading in week 2. */
export function calibratingActuals(placement: CalibratingPlacement): GoalActualPoint[] {
  const start: GoalActualPoint = {
    ts: '2026-09-07',
    weekIndex: 1,
    value: CALIBRATING_START_VALUE,
    isPR: true,
    matched: true,
  }
  if (placement === 'start') return [start]
  return [
    { ...start, isPR: false },
    { ts: '2026-09-14', weekIndex: 2, ...WEEK_TWO_READING[placement], matched: true },
  ]
}

/** The same goal on the calendar-week grid, the week-2 reading at `placement`. */
export function calibratingGoalAt(placement: CalibratingPlacement) {
  return { ...base, weeks: calibratingWeeks, actuals: calibratingActuals(placement) }
}

/** The wall's own goal, re-read on the calendar-week grid: 110 lb in week 2, above the ramp. */
export const calibratingGoal = calibratingGoalAt('above')
