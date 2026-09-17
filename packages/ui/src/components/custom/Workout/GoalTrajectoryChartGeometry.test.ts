import { describe, it, expect } from 'vitest'
import {
  deriveTrajectoryGeometry,
  flattenDeloadWeeks,
  paddedFloor,
  PLANE_OVERHANG,
  resolveActualWeek,
  WEEK_INSET,
  LABEL_CLEARANCE,
  MARKER_CLEARANCE,
  ruleLabelTop,
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

const PATH_PRECISION = 0.001

/** The end point of every command in an SVG path d3 emitted (M, L and C). */
function pathVertices(d: string): Array<{ x: number; y: number }> {
  return (d.match(/[MLC][^MLCZ]*/g) ?? []).map((command) => {
    const numbers = command.slice(1).split(/[ ,]+/).filter(Boolean).map(Number)
    return { x: numbers[numbers.length - 2], y: numbers[numbers.length - 1] }
  })
}

describe('deriveTrajectoryGeometry', () => {
  describe('band ordering', () => {
    it('draws a gain goal band as one closed path through every polygon vertex', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
      })
      expect(g.bandPath).toMatch(/Z$/)
      expect(pathVertices(g.bandPath)).toHaveLength(g.bandPolygon.length)
      pathVertices(g.bandPath).forEach((v, i) => {
        expect(v.x).toBeCloseTo(g.bandPolygon[i].x)
        expect(v.y).toBeCloseTo(g.bandPolygon[i].y)
      })
    })

    it('draws a loss goal band the same way, with low numerically above high', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: lossExpected,
        committed: 191,
        stretch: 186,
      })
      expect(g.hasBand).toBe(true)
      expect(pathVertices(g.bandPath)).toHaveLength(lossExpected.length * 2)
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
      expect(g.bandPath).toBe('')
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
      const xs = pathVertices(g.linePath).map((v) => v.x)
      expect(xs).toHaveLength(3)
      xs.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(xs[i]))
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
      expect(g.boundaries[0].x).toBeCloseTo(g.plot.left + WEEK_INSET)
      expect(g.boundaries[2].x).toBeCloseTo(g.plot.right - WEEK_INSET)
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

  describe('actual line', () => {
    const noisy = [
      { weekIndex: 1, value: 175 },
      { weekIndex: 2, value: 179 },
      { weekIndex: 3, value: 177 },
      { weekIndex: 4, value: 184, isPR: true },
      { weekIndex: 5, value: 182 },
    ]

    it('passes through the centre of every dot', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
        actuals: noisy,
      })
      const vertices = pathVertices(g.linePath)
      expect(vertices).toHaveLength(g.actuals.length)
      g.actuals.forEach((dot, i) => {
        // d3-shape writes path coordinates to 3 decimals.
        expect(Math.abs(vertices[i].x - dot.x)).toBeLessThanOrEqual(PATH_PRECISION)
        expect(Math.abs(vertices[i].y - dot.y)).toBeLessThanOrEqual(PATH_PRECISION)
      })
    })

    it('never overshoots between points, so a dip stays a dip', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
        actuals: noisy,
      })
      const controls = (g.linePath.match(/C[^C]*/g) ?? []).map((c) =>
        c.slice(1).split(',').map(Number)
      )
      controls.forEach((numbers, i) => {
        const [a, b] = [g.actuals[i].y, g.actuals[i + 1].y]
        ;[numbers[1], numbers[3]].forEach((y) => {
          expect(y).toBeGreaterThanOrEqual(Math.min(a, b) - PATH_PRECISION)
          expect(y).toBeLessThanOrEqual(Math.max(a, b) + PATH_PRECISION)
        })
      })
    })

    it('is empty with no actuals', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
      })
      expect(g.linePath).toBe('')
    })
  })

  describe('y domain and gridlines', () => {
    it.each([
      [175, 170],
      [176, 175],
      [179.5, 175],
      [180, 175],
    ])('floors a lowest value of %d to %d, strictly below it', (lowest, floor) => {
      expect(paddedFloor(lowest)).toBe(floor)
    })

    it('puts the padded floor on the plot bottom for a gain goal', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
      })
      expect(g.domain.min).toBe(170)
      expect(g.toY(170)).toBeCloseTo(g.plot.bottom)
    })

    it('pads below a loss goal’s lowest value, the stretch target', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: lossExpected,
        committed: 191,
        stretch: 186,
      })
      expect(g.domain.min).toBe(185)
    })

    it('puts gridlines on round values inside the plot', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
      })
      expect(g.yTicks.map((t) => t.value)).toEqual([170, 175, 180, 185, 190, 195])
      g.yTicks.forEach((t) => {
        expect(t.y).toBeGreaterThanOrEqual(g.plot.top)
        expect(t.y).toBeLessThanOrEqual(g.plot.bottom)
      })
    })

    it('draws fewer gridlines when asked for fewer', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
        tickCount: 3,
      })
      expect(g.yTicks.map((t) => t.value)).toEqual([170, 180, 190])
    })
  })

  describe('plane', () => {
    it('spans the plot width and rises above the plot top', () => {
      const g = deriveTrajectoryGeometry({
        ...base,
        expected: gainExpected,
        committed: 185,
        stretch: 195,
      })
      expect(g.plane.x).toBe(g.plot.left)
      expect(g.plane.width).toBe(g.plot.right - g.plot.left)
      expect(g.plane.y).toBe(g.plot.top - PLANE_OVERHANG)
      expect(g.plane.y + g.plane.height).toBe(g.plot.bottom)
    })
  })

  it('keeps the first and last week clear of the plane edge', () => {
    const g = deriveTrajectoryGeometry({
      ...base,
      expected: gainExpected,
      committed: 185,
      stretch: 195,
    })
    expect(g.toX(1) - g.plane.x).toBeGreaterThanOrEqual(WEEK_INSET)
    expect(g.plane.x + g.plane.width - g.toX(6)).toBeGreaterThanOrEqual(WEEK_INSET)
  })

  describe('label clearance', () => {
    /** The LossGoalBodyweight story: stretch is the LOWEST rule. */
    const bodyweight = {
      committed: 193,
      stretch: 188,
      expected: [
        { weekIndex: 1, low: 198, high: 198 },
        { weekIndex: 2, low: 197, high: 195.5 },
        { weekIndex: 3, low: 196, high: 193 },
        { weekIndex: 4, low: 195, high: 190.5 },
        { weekIndex: 5, low: 194, high: 189 },
        { weekIndex: 6, low: 193, high: 188 },
      ],
      actuals: [
        { weekIndex: 1, value: 198 },
        { weekIndex: 2, value: 196.5 },
        { weekIndex: 3, value: 195 },
        { weekIndex: 4, value: 194.5 },
      ],
    }
    const bench = { expected: gainExpected, committed: 185, stretch: 195, actuals: [] }
    /** Committed above everything else, so its label is the one at risk. */
    const committedOnTop = { expected: gainExpected, committed: 200, stretch: 195, actuals: [] }
    const presets = [
      ['wall', { width: 1200, height: 340 }],
      ['phone', { width: 360, height: 220 }],
    ] as const
    const cases = [
      ['a gain goal', bench],
      ['a loss goal', bodyweight],
      ['committed as the highest rule', committedOnTop],
    ] as const

    describe.each(presets)('at %s size', (_, size) => {
      it.each(cases)('keeps both rule labels inside the plane for %s', (__, goal) => {
        const g = deriveTrajectoryGeometry({ ...base, ...goal, ...size })
        ;[g.committedY, g.stretchY].forEach((ruleY) => {
          expect(ruleLabelTop(ruleY)).toBeGreaterThanOrEqual(g.plane.y + LABEL_CLEARANCE - 1e-9)
        })
      })

      it.each(cases)('keeps every rule and marker clear of the bottom edge for %s', (__, goal) => {
        const g = deriveTrajectoryGeometry({ ...base, ...goal, ...size })
        const ys = [g.committedY, g.stretchY, ...g.actuals.map((a) => a.y)]
        ys.forEach((y) => expect(y).toBeLessThanOrEqual(g.plot.bottom - MARKER_CLEARANCE + 1e-9))
      })

      it.each(cases)('keeps every marker clear of the top edge for %s', (__, goal) => {
        const g = deriveTrajectoryGeometry({ ...base, ...goal, ...size })
        g.actuals.forEach((a) => {
          expect(a.y).toBeGreaterThanOrEqual(g.plot.top + MARKER_CLEARANCE - 1e-9)
        })
      })

      it.each(cases)(
        'keeps the floor a multiple of 5 below the lowest value for %s',
        (__, goal) => {
          const g = deriveTrajectoryGeometry({ ...base, ...goal, ...size })
          const lowest = Math.min(goal.committed, goal.stretch, ...goal.expected.map((p) => p.high))
          expect(g.domain.min % 5).toBe(0)
          expect(g.domain.min).toBeLessThan(lowest)
        }
      )
    })

    it('pads more value range on a short plot than on a tall one', () => {
      const tall = deriveTrajectoryGeometry({ ...base, ...bench, width: 1200, height: 340 })
      const short = deriveTrajectoryGeometry({ ...base, ...bench, width: 360, height: 220 })
      expect(short.domain.max).toBeGreaterThan(tall.domain.max)
    })

    it('pads more for a larger label font', () => {
      const small = deriveTrajectoryGeometry({ ...base, ...bench, labelFont: 11 })
      const large = deriveTrajectoryGeometry({ ...base, ...bench, labelFont: 16 })
      expect(large.domain.max).toBeGreaterThan(small.domain.max)
      expect(ruleLabelTop(large.stretchY, 16)).toBeGreaterThanOrEqual(
        large.plane.y + LABEL_CLEARANCE - 1e-9
      )
    })
  })
})
