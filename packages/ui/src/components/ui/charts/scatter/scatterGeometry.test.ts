import { describe, expect, it } from 'vitest'
import {
  DEFAULT_R,
  PLOT_BOTTOM,
  PLOT_LEFT,
  PLOT_RIGHT,
  PLOT_TOP,
  TICK_COUNT,
  domainOf,
  scatterAriaLabel,
  scatterLayout,
  tickLabel,
  ticksOf,
  DIAGONAL_LINE,
  referenceSegments,
} from './scatterGeometry'

describe('domainOf', () => {
  it('pads the data span so no mark sits on the plot edge', () => {
    const d = domainOf([3, -2, 7], 100)
    expect(d.min).toBeLessThan(-2)
    expect(d.max).toBeGreaterThan(7)
  })

  it('prefers explicit bounds over the data', () => {
    expect(domainOf([3, -2, 7], 100, 0, 10)).toEqual({ min: 0, max: 10 })
  })

  it('keeps one override and derives the other bound from the data', () => {
    const d = domainOf([3, 7], 100, 0)
    expect(d.min).toBe(0)
    expect(d.max).toBeGreaterThan(7)
  })

  it('keeps min below max when a lone override lies beyond the data', () => {
    const d = domainOf([1, 2], 100, 5)
    expect(d.min).toBe(5)
    expect(d.max).toBeGreaterThan(5)
  })

  it('falls back to 0..1 with no data', () => {
    expect(domainOf([], 100)).toEqual({ min: 0, max: 1 })
  })

  it('widens a single value around itself', () => {
    const d = domainOf([5], 100)
    expect(d.min).toBeLessThan(5)
    expect(d.max).toBeGreaterThan(5)
    expect((d.min + d.max) / 2).toBeCloseTo(5)
  })

  it('ignores non-finite values and overrides', () => {
    const d = domainOf([NaN, 1, Infinity, 3], 100, NaN)
    expect(d.min).toBeLessThan(1)
    expect(d.max).toBeGreaterThan(3)
    expect(d.max).toBeLessThan(4)
  })
})

describe('ticksOf', () => {
  it('places round ticks inside the domain', () => {
    expect(ticksOf({ min: 0, max: 1 }, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
  })

  it('caps the tick count at one more than asked', () => {
    expect(ticksOf({ min: 170, max: 196 }, 5).length).toBeLessThanOrEqual(6)
  })
})

describe('tickLabel', () => {
  it('keeps two decimals below one', () => {
    expect(tickLabel(0.25)).toBe('0.25')
  })

  it('keeps one decimal at one and above', () => {
    expect(tickLabel(12.345)).toBe('12.3')
  })
})

describe('scatterLayout', () => {
  const palette = ['#111111', '#222222']

  it('maps the domain corners onto the plot box', () => {
    const layout = scatterLayout([], 200, 100, { xMin: 0, xMax: 1, yMin: 0, yMax: 1 }, palette)
    const innerW = 200 - PLOT_LEFT - PLOT_RIGHT
    const innerH = 100 - PLOT_TOP - PLOT_BOTTOM
    expect(layout.innerW).toBe(innerW)
    expect(layout.innerH).toBe(innerH)
    expect(layout.toX(0)).toBe(PLOT_LEFT)
    expect(layout.toX(1)).toBe(PLOT_LEFT + innerW)
    expect(layout.toY(1)).toBe(PLOT_TOP)
    expect(layout.toY(0)).toBe(PLOT_TOP + innerH)
  })

  it('never lets the inner box collapse below one pixel', () => {
    const layout = scatterLayout([], 10, 10, {}, palette)
    expect(layout.innerW).toBe(1)
    expect(layout.innerH).toBe(1)
  })

  it('defaults radius and cycles the palette when a point omits them', () => {
    const data = [
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 1, y: 1, r: 9, color: '#abcdef' },
      { id: 'c', x: 0.5, y: 0.5 },
    ]
    const { points } = scatterLayout(data, 200, 100, {}, palette)
    expect(points.map((p) => p.radius)).toEqual([DEFAULT_R, 9, DEFAULT_R])
    expect(points.map((p) => p.color)).toEqual(['#111111', '#abcdef', '#111111'])
  })

  it('keeps both axes finite when one point is NaN', () => {
    const data = [
      { id: 'a', x: 1, y: 2 },
      { id: 'b', x: NaN, y: NaN },
      { id: 'c', x: 3, y: 4 },
    ]
    const layout = scatterLayout(data, 200, 100, {}, palette)
    const bounds = [layout.xd.min, layout.xd.max, layout.yd.min, layout.yd.max]
    expect(bounds.every(Number.isFinite)).toBe(true)
    const ticks = [...ticksOf(layout.xd, TICK_COUNT), ...ticksOf(layout.yd, TICK_COUNT)]
    expect(ticks.length).toBeGreaterThan(0)
    expect(ticks.map(layout.toX).every(Number.isFinite)).toBe(true)
    expect(ticks.map(layout.toY).every(Number.isFinite)).toBe(true)
  })
})

describe('scatterAriaLabel', () => {
  it('names both axes and pluralises the count', () => {
    expect(scatterAriaLabel({ xLabel: 'I', yLabel: 'A' }, 3)).toBe(
      'Scatter plot of I versus A, 3 points'
    )
  })

  it('falls back to x and y and uses the singular for one point', () => {
    expect(scatterAriaLabel({}, 1)).toBe('Scatter plot of x versus y, 1 point')
  })
})

describe('referenceSegments', () => {
  const layout = scatterLayout([], 100, 100, { xMin: 0, xMax: 1, yMin: 0, yMax: 1 }, ['#000'])
  const { toX, toY } = layout

  it('spans the plot width for a horizontal line', () => {
    expect(referenceSegments(layout, [{ y: 0.5 }])).toEqual([
      { id: 'reference-0', label: undefined, x1: toX(0), y1: toY(0.5), x2: toX(1), y2: toY(0.5) },
    ])
  })

  it('spans the plot height for a vertical line, including at the domain edge', () => {
    const [mid] = referenceSegments(layout, [{ x: 0.25, id: 'v', label: 'cut' }])
    expect(mid).toEqual({
      id: 'v',
      label: 'cut',
      x1: toX(0.25),
      y1: toY(0),
      x2: toX(0.25),
      y2: toY(1),
    })
    const [edge] = referenceSegments(layout, [{ x: 1 }])
    expect(edge).toMatchObject({ x1: toX(1), x2: toX(1), y1: toY(0), y2: toY(1) })
  })

  it('draws a sloped line corner to corner when it fits the box', () => {
    expect(referenceSegments(layout, [DIAGONAL_LINE])[0]).toMatchObject({
      x1: toX(0),
      y1: toY(1),
      x2: toX(1),
      y2: toY(0),
    })
  })

  it('clips a sloped line to the plot box', () => {
    const [seg] = referenceSegments(layout, [{ slope: 2, intercept: 0 }])
    expect(seg).toMatchObject({ x1: toX(0), y1: toY(0), x2: toX(0.5), y2: toY(1) })
  })

  it('yields no segment for a line fully outside the domain', () => {
    expect(
      referenceSegments(layout, [
        { y: 2 },
        { x: -0.1 },
        { slope: 1, intercept: 5 },
        { slope: 0, intercept: -1 },
      ])
    ).toEqual([])
  })

  it.each([
    ['NaN y', { y: NaN }],
    ['NaN x', { x: NaN }],
    ['infinite y', { y: Infinity }],
    ['infinite slope', { slope: Infinity, intercept: 0 }],
    ['NaN slope', { slope: NaN, intercept: 0 }],
    ['NaN intercept', { slope: 1, intercept: NaN }],
    ['infinite intercept', { slope: 1, intercept: -Infinity }],
  ])('drops a line with a non-finite value: %s', (_name, line) => {
    expect(referenceSegments(layout, [line])).toEqual([])
  })

  it('draws a flat sloped line lying on the domain edge', () => {
    expect(referenceSegments(layout, [{ slope: 0, intercept: 0 }])[0]).toMatchObject({
      x1: toX(0),
      y1: toY(0),
      x2: toX(1),
      y2: toY(0),
    })
  })

  it('clips a sloped line that enters below the domain at its lower bound', () => {
    expect(referenceSegments(layout, [{ slope: 1, intercept: -0.5 }])[0]).toMatchObject({
      x1: toX(0.5),
      y1: toY(0),
      x2: toX(1),
      y2: toY(0.5),
    })
  })

  it('does not widen the layout domain', () => {
    const l = scatterLayout(
      [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 1, y: 1 },
      ],
      100,
      100,
      {},
      ['#000']
    )
    expect(referenceSegments(l, [{ y: 9 }])).toEqual([])
    expect(l.yd.max).toBeLessThan(2)
  })
})

describe('scatterAriaLabel with reference lines', () => {
  it('appends only the labelled segments', () => {
    const seg = { x1: 0, y1: 0, x2: 1, y2: 1 }
    expect(
      scatterAriaLabel({}, 2, [
        { id: 'a', label: 'Target', ...seg },
        { id: 'b', ...seg },
      ])
    ).toBe('Scatter plot of x versus y, 2 points, reference lines: Target')
  })
})
