import { describe, expect, it } from 'vitest'
import {
  DEFAULT_R,
  PLOT_BOTTOM,
  PLOT_LEFT,
  PLOT_RIGHT,
  PLOT_TOP,
  domainOf,
  scatterAriaLabel,
  scatterLayout,
  tickLabel,
  ticksOf,
} from './scatterGeometry'

describe('domainOf', () => {
  it('spans the data when no override is given', () => {
    expect(domainOf([3, -2, 7])).toEqual({ min: -2, max: 7 })
  })

  it('prefers explicit bounds over the data', () => {
    expect(domainOf([3, -2, 7], 0, 10)).toEqual({ min: 0, max: 10 })
  })

  it('falls back to 0..1 with no data', () => {
    expect(domainOf([])).toEqual({ min: 0, max: 1 })
  })

  it('pads a single value by a tenth of its magnitude', () => {
    expect(domainOf([5])).toEqual({ min: 4.5, max: 5.5 })
  })

  it('pads a zero-width domain at zero by half a unit', () => {
    expect(domainOf([0, 0])).toEqual({ min: -0.5, max: 0.5 })
  })
})

describe('ticksOf', () => {
  it('spaces ticks evenly from min to max inclusive', () => {
    expect(ticksOf({ min: 0, max: 1 }, 5)).toEqual([0, 0.25, 0.5, 0.75, 1])
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
