import { describe, expect, it } from 'vitest'
import {
  WALL_BREAKPOINT,
  axisWeeksOf,
  chartLabels,
  chartTone,
  densityFor,
  summarize,
} from './goalTrajectoryChartModel'
import { deriveTrajectoryGeometry } from './GoalTrajectoryChartGeometry'

const expected = [
  { weekIndex: 1, low: 175, high: 175 },
  { weekIndex: 2, low: 179, high: 183 },
  { weekIndex: 3, low: 183, high: 191 },
]
const actuals = [
  { weekIndex: 1, value: 175 },
  { weekIndex: 2, value: 178 },
]
const geometry = deriveTrajectoryGeometry({
  expected,
  committed: 183,
  stretch: 191,
  actuals,
  weeks: [{ index: 1 }, { index: 2 }, { index: 3 }],
  width: 360,
  height: 220,
  tickCount: 3,
})
const labelInput = {
  geometry,
  committed: 183,
  stretch: 191,
  ruleLabelText: 'numeric' as const,
  referenceLabelSide: 'left' as const,
  yAxisLabels: false,
  boxes: [],
}

describe('densityFor', () => {
  it('is phone one pixel under the wall breakpoint', () => {
    expect(densityFor(WALL_BREAKPOINT - 1).tickCount).toBe(3)
  })

  it('is wall at the wall breakpoint', () => {
    expect(densityFor(WALL_BREAKPOINT).tickCount).toBe(5)
  })
})

describe('chartTone', () => {
  it('reports a met goal as on track whatever pace the read model sent', () => {
    expect(chartTone('goal_met', 183, actuals, 'up')).toEqual({
      toneStatus: 'on_track',
      statusLabel: 'Goal met',
    })
  })

  it('keeps the status while the best reading is short of committed', () => {
    expect(chartTone('behind', 183, actuals, 'up')).toEqual({
      toneStatus: 'behind',
      statusLabel: 'Behind',
    })
  })

  it('reports a reading past committed as met even when the status says behind', () => {
    const past = [...actuals, { weekIndex: 3, value: 183 }]
    expect(chartTone('behind', 183, past, 'up')).toEqual({
      toneStatus: 'on_track',
      statusLabel: 'Goal met',
    })
  })
})

describe('chartLabels', () => {
  it('draws no grid labels when the y axis carries the values', () => {
    expect(chartLabels({ ...labelInput, yAxisLabels: true }).gridLabels).toEqual([])
  })

  it('keeps the grid labels clear of the rule values, and passes none for a none rule text', () => {
    const named = chartLabels(labelInput)
    const none = chartLabels({ ...labelInput, ruleLabelText: 'none' })
    expect(named.ruleLabels.length).toBeGreaterThan(0)
    expect(none.ruleLabels).toEqual([])
    expect(none.gridLabels.length).toBeGreaterThanOrEqual(named.gridLabels.length)
  })
})

describe('axisWeeksOf', () => {
  it('uses the planned weeks when there are any', () => {
    expect(axisWeeksOf([{ index: 4, isDeload: true }], expected)).toEqual([
      { index: 4, isDeload: true },
    ])
  })

  it('falls back to the expected week indices', () => {
    expect(axisWeeksOf([], expected)).toEqual([{ index: 1 }, { index: 2 }, { index: 3 }])
  })
})

describe('summarize', () => {
  const say = (prs: number) =>
    summarize('On track', { ...geometry, prStars: Array(prs).fill({}) }, 183, 191, 'lbs', 'Bench')

  it('says one personal record in the singular', () => {
    expect(say(1)).toContain(' 1 personal record.')
  })

  it('says several personal records in the plural', () => {
    expect(say(2)).toContain(' 2 personal records.')
  })
})
