/**
 * VW-433: the calibrating fixtures sit on the calendar-week grid the read model
 * uses since VW-421, so the start lift lands on week 1 at the ramp's start and the
 * next reading lands on week 2, not on top of the ramp's start.
 */
import { describe, expect, it } from 'vitest'
import { deriveTrajectoryGeometry } from './GoalTrajectoryChartGeometry'
import {
  CALIBRATING_START_VALUE,
  calibratingGoalAt,
  calibratingWallCapture,
  type CalibratingPlacement,
} from './goalTrajectoryCalibratingFixture'
import { calibratingScenario } from './primaryGoal-fixture'

const WALL = { width: 1200, height: 340 }

function geometryOf(goal: ReturnType<typeof calibratingGoalAt>) {
  return deriveTrajectoryGeometry({ ...goal, ...WALL })
}

describe('calibrating fixtures on the calendar-week grid', () => {
  it('puts the start lift on week 1 at the start of the ramp', () => {
    const g = geometryOf(calibratingGoalAt('above'))
    const [start] = g.actuals
    expect(start.weekIndex).toBe(1)
    expect(start.x).toBeCloseTo(g.toX(1), 5)
    expect(start.value).toBe(calibratingGoalAt('above').expected[0].low)
    expect(start.value).toBe(CALIBRATING_START_VALUE)
  })

  it.each<[CalibratingPlacement, (reading: number, ramp: number) => boolean]>([
    ['above', (reading, ramp) => reading > ramp],
    ['on', (reading, ramp) => reading === ramp],
    ['below', (reading, ramp) => reading < ramp],
  ])('puts the week-2 reading %s the ramp', (placement, holds) => {
    const goal = calibratingGoalAt(placement)
    const [, reading] = deriveTrajectoryGeometry({ ...goal, ...WALL }).actuals
    expect(reading.weekIndex).toBe(2)
    expect(holds(reading.value, goal.expected[1].low)).toBe(true)
  })

  it('dates each week from the Monday of the start lift', () => {
    const { weeks, actuals } = calibratingGoalAt('on')
    expect(weeks[0].startDate).toBe('2026-09-07')
    expect(weeks[1].startDate).toBe('2026-09-14')
    expect(new Date(`${String(weeks[0].startDate)}T00:00:00Z`).getUTCDay()).toBe(1)
    expect(actuals.map((a) => a.ts)).toEqual(['2026-09-07', '2026-09-14'])
  })

  it('keeps the pre-VW-421 wall capture, whose 110 reading claims week 1', () => {
    const g = deriveTrajectoryGeometry({ ...calibratingWallCapture, ...WALL })
    expect(g.actuals).toHaveLength(1)
    expect(g.actuals[0].weekIndex).toBe(1)
  })

  it('gives the card one week cell per elapsed week, the reading in week 2', () => {
    const { milestone } = calibratingScenario('above')
    expect(milestone.currentWeek).toBe(2)
    expect(milestone.weeks?.map((w) => w.reading)).toEqual([
      { reps: 8, load: 100 },
      { reps: 8, load: 110 },
    ])
  })
})
