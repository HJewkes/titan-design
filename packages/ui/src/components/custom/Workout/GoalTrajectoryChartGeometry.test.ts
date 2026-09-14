import { describe, it, expect } from 'vitest'
import {
  deriveTrajectoryGeometry,
  flattenDeloadWeeks,
  resolveActualWeek,
  type GoalExpectedPoint,
  type GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'

const weeks: GoalTrajectoryWeek[] = [
  { index: 1 },
  { index: 2 },
  { index: 3 },
  { index: 4 },
  { index: 5, isDeload: true },
  { index: 6 },
]

/** A gain goal: committed edge below the stretch edge. */
const gainExpected: GoalExpectedPoint[] = [
  { weekIndex: 1, low: 175, high: 175 },
  { weekIndex: 2, low: 177, high: 179 },
  { weekIndex: 3, low: 179, high: 183 },
  { weekIndex: 4, low: 181, high: 187 },
  { weekIndex: 5, low: 183, high: 191 },
  { weekIndex: 6, low: 185, high: 195 },
]

/** A loss goal (bodyweight, fat-loss phase): `low` is numerically GREATER than `high`. */
const lossExpected: GoalExpectedPoint[] = [
  { weekIndex: 1, low: 196, high: 196 },
  { weekIndex: 2, low: 195, high: 194 },
  { weekIndex: 3, low: 194, high: 192 },
  { weekIndex: 4, low: 193, high: 190 },
  { weekIndex: 5, low: 192, high: 188 },
  { weekIndex: 6, low: 191, high: 186 },
]

const base = { actuals: [], weeks, width: 600, height: 300 }

describe('deriveTrajectoryGeometry', () => {
  describe('band ordering', () => {
    it('draws a gain goal band with every column top above its bottom', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
      })
      expect(g.bandColumns.length).toBeGreaterThan(0)
      g.bandColumns.forEach((c) => expect(c.height).toBeGreaterThanOrEqual(0))
    })

    it('draws a loss goal band the same way, with low numerically above high', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: lossExpected,
        committed: 191,
        stretch: 186,
      })
      expect(g.bandColumns.length).toBeGreaterThan(0)
      g.bandColumns.forEach((c) => expect(c.height).toBeGreaterThanOrEqual(0))
    })

    it('keeps every polygon top vertex above its paired bottom vertex for a loss goal', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: lossExpected,
        committed: 191,
        stretch: 186,
      })
      const half = g.bandPolygon.length / 2
      const top = g.bandPolygon.slice(0, half)
      const bottom = g.bandPolygon.slice(half).reverse()
      top.forEach((point, i) => {
        expect(point.x).toBeCloseTo(bottom[i].x)
        expect(point.y).toBeLessThanOrEqual(bottom[i].y)
      })
    })

    it('closes the polygon as top left-to-right then bottom right-to-left', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
      })
      expect(g.bandPolygon).toHaveLength(gainExpected.length * 2)
      expect(g.bandPolygon[0].x).toBeLessThan(g.bandPolygon[1].x)
      const secondHalf = g.bandPolygon.slice(gainExpected.length)
      expect(secondHalf[0].x).toBeGreaterThan(secondHalf[1].x)
    })

    it('reports no band for fewer than two expected points', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: [{ weekIndex: 1, low: 175, high: 175 }],
        committed: 185,
        stretch: 195,
      })
      expect(g.hasBand).toBe(false)
      expect(g.bandPolygon).toEqual([])
      expect(g.bandColumns).toEqual([])
    })
  })

  describe('deload weeks', () => {
    it('holds the band flat across a deload week', () => {
      const flattened = flattenDeloadWeeks(gainExpected, weeks)
      const week4 = flattened.find((p) => p.weekIndex === 4)
      const week5 = flattened.find((p) => p.weekIndex === 5)
      expect(week5).toEqual({ weekIndex: 5, low: week4?.low, high: week4?.high })
    })

    it('leaves non-deload weeks untouched', () => {
      const flattened = flattenDeloadWeeks(gainExpected, weeks)
      expect(flattened.filter((p) => p.weekIndex !== 5)).toEqual(
        gainExpected.filter((p) => p.weekIndex !== 5)
      )
    })

    it('flattens a leading deload week to itself when nothing precedes it', () => {
      const leadingDeload: GoalTrajectoryWeek[] = [{ index: 1, isDeload: true }, { index: 2 }]
      const flattened = flattenDeloadWeeks(gainExpected.slice(0, 2), leadingDeload)
      expect(flattened[0]).toEqual(gainExpected[0])
    })

    it('emits one shading rect per deload week, inside the plot', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
      })
      expect(g.deloadRects).toHaveLength(1)
      const [rect] = g.deloadRects
      expect(rect.weekIndex).toBe(5)
      expect(rect.x).toBeGreaterThanOrEqual(g.plot.left)
      expect(rect.x + rect.width).toBeLessThanOrEqual(g.plot.right + 0.001)
    })
  })

  describe('actuals and PR stars', () => {
    it('places a star at every isPR point and nowhere else', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
        actuals: [
          { weekIndex: 1, value: 175 },
          { weekIndex: 3, value: 182, isPR: true },
          { weekIndex: 6, value: 190, isPR: true },
        ],
      })
      expect(g.prStars).toHaveLength(2)
      expect(g.prStars.map((s) => s.weekIndex)).toEqual([3, 6])
      g.prStars.forEach((star) => {
        const coord = g.actuals.find((a) => a.weekIndex === star.weekIndex)
        expect(star.x).toBe(coord?.x)
        expect(star.y).toBe(coord?.y)
      })
    })

    it('defaults an actual to matched and honours an explicit false', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
        actuals: [
          { weekIndex: 1, value: 175 },
          { weekIndex: 2, value: 178, matched: false },
        ],
      })
      expect(g.actuals.map((a) => a.matched)).toEqual([true, false])
    })

    it('sorts actuals by week so the line never doubles back', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
        actuals: [
          { weekIndex: 4, value: 186 },
          { weekIndex: 1, value: 175 },
          { weekIndex: 2, value: 178 },
        ],
      })
      expect(g.actuals.map((a) => a.weekIndex)).toEqual([1, 2, 4])
      expect(g.actualSegments).toHaveLength(2)
      g.actualSegments.forEach((s) => expect(s.length).toBeGreaterThan(0))
    })
  })

  describe('rules', () => {
    it('puts a meso boundary at the x of its week index', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
        mesoBoundaries: [1, 4, 6],
      })
      expect(g.boundaries.map((b) => b.weekIndex)).toEqual([1, 4, 6])
      g.boundaries.forEach((b) => expect(b.x).toBeCloseTo(g.toX(b.weekIndex)))
      expect(g.boundaries[0].x).toBeCloseTo(g.plot.left)
      expect(g.boundaries[2].x).toBeCloseTo(g.plot.right)
    })

    it('puts the committed rule below the stretch rule for a gain goal', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
      })
      expect(g.committedY).toBeGreaterThan(g.stretchY)
    })

    it('puts the committed rule above the stretch rule for a loss goal', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: lossExpected,
        committed: 191,
        stretch: 186,
      })
      expect(g.committedY).toBeLessThan(g.stretchY)
    })
  })

  describe('resolveActualWeek', () => {
    const dated: GoalTrajectoryWeek[] = [
      { index: 1, startDate: '2026-09-07' },
      { index: 2, startDate: '2026-09-14' },
      { index: 3, startDate: '2026-09-21' },
    ]

    it('prefers an explicit weekIndex', () => {
      expect(resolveActualWeek({ weekIndex: 2, value: 1, ts: '2026-09-21' }, dated)).toBe(2)
    })

    it('interpolates a ts between two week starts', () => {
      expect(resolveActualWeek({ ts: '2026-09-17', value: 1 }, dated)).toBeCloseTo(2 + 3 / 7)
    })

    it('clamps a ts outside the plan to the first or last week', () => {
      expect(resolveActualWeek({ ts: '2026-08-01', value: 1 }, dated)).toBe(1)
      expect(resolveActualWeek({ ts: '2026-12-01', value: 1 }, dated)).toBe(3)
    })

    it('returns undefined when the point cannot be placed', () => {
      expect(resolveActualWeek({ value: 1 }, dated)).toBeUndefined()
      expect(resolveActualWeek({ ts: '2026-09-17', value: 1 }, weeks)).toBeUndefined()
    })
  })

  it('drops unplaceable actuals rather than stacking them at zero', () => {
    const g = deriveTrajectoryGeometry({
      ...base,
      expected: gainExpected,
      committed: 185,
      stretch: 195,
      actuals: [{ weekIndex: 1, value: 175 }, { value: 999 }],
    })
    expect(g.actuals).toHaveLength(1)
    expect(g.actuals[0].value).toBe(175)
  })

  it('places every value inside the padded plot area', () => {
    const g = deriveTrajectoryGeometry({
      ...base,
      expected: gainExpected,
      committed: 185,
      stretch: 195,
      actuals: [
        { weekIndex: 1, value: 175 },
        { weekIndex: 6, value: 198 },
      ],
    })
    ;[...g.actuals.map((a) => a.y), g.committedY, g.stretchY].forEach((y) => {
      expect(y).toBeGreaterThan(g.plot.top)
      expect(y).toBeLessThan(g.plot.bottom)
    })
  })
})
