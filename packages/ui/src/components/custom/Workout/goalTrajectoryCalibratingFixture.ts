/**
 * The exact props the voltras-mcp wall passed GoalTrajectoryChart for a calibrating
 * Cable Chest Press goal, captured 2026-09-17 from an instrumented SPA build. This is
 * the payload VW-414 renders empty on 0.17.0: every expected week has `low === high`,
 * so the band has no area, and `committed === stretch`, so the two rule labels print
 * on one baseline.
 *
 * The first actual carries only a `ts` and the weeks carry no `startDate`, so it is
 * unplaceable and dropped — the chart draws one marker, not two. That is by design
 * (see `resolveActualWeek`); it is kept here because it is what the wall sent.
 */
import type {
  GoalActualPoint,
  GoalExpectedPoint,
  GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'

/** 100 lb at week 1 rising 2.5 lb a week to the 127.5 lb target at week 12. */
export const calibratingExpected: GoalExpectedPoint[] = Array.from({ length: 12 }, (_, i) => {
  const value = 100 + i * 2.5
  return { weekIndex: i + 1, low: value, high: value }
})

export const calibratingWeeks: GoalTrajectoryWeek[] = Array.from({ length: 12 }, (_, i) => ({
  index: i + 1,
  isDeload: false,
}))

export const calibratingActuals: GoalActualPoint[] = [
  { ts: '2026-09-07', value: 100, isPR: false, matched: true },
  { ts: '2026-09-14', weekIndex: 1, value: 110, isPR: true, matched: true },
]

export const calibratingGoal = {
  expected: calibratingExpected,
  weeks: calibratingWeeks,
  actuals: calibratingActuals,
  committed: 127.5,
  stretch: 127.5,
  status: 'calibrating',
  direction: 'up',
  metricLabel: 'CABLE CHEST PRESS',
} as const
