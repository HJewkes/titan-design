import { describe, expect, it } from 'vitest'
import {
  bandRect,
  extentOf,
  scaleX,
  scaleY,
  segmentBetween,
  sparklinePoints,
} from './sparklineGeometry'

describe('extentOf', () => {
  it('prefers the override over the data', () => {
    expect(extentOf([1, 9], [0, 20])).toEqual([0, 20])
  })

  it('falls back to [0, 1] for no values', () => {
    expect(extentOf([])).toEqual([0, 1])
  })

  it('spans the smallest to the largest value', () => {
    expect(extentOf([4, 1, 7])).toEqual([1, 7])
  })
})

describe('scaleX and scaleY', () => {
  it('map the domain onto the box, y growing downwards', () => {
    expect(scaleX(5, [0, 10], 80)).toBe(40)
    expect(scaleY(10, [0, 10], 30)).toBe(0)
    expect(scaleY(0, [0, 10], 30)).toBe(30)
  })

  it('treat a zero-width domain as width 1 instead of dividing by zero', () => {
    expect(scaleX(3, [3, 3], 80)).toBe(0)
    expect(scaleY(3, [3, 3], 30)).toBe(30)
  })
})

describe('sparklinePoints', () => {
  it('places points by index when no x values are given', () => {
    const { points, yDomain } = sparklinePoints([0, 10], undefined, undefined, 80, 30)
    expect(points).toEqual([
      { x: 0, y: 30 },
      { x: 80, y: 0 },
    ])
    expect(yDomain).toEqual([0, 10])
  })

  it('places points by x value inside an explicit domain', () => {
    const { points, yDomain } = sparklinePoints(
      [5, 10],
      [0, 5],
      { x: [0, 10], y: [0, 20] },
      100,
      40
    )
    expect(points).toEqual([
      { x: 0, y: 30 },
      { x: 50, y: 20 },
    ])
    expect(yDomain).toEqual([0, 20])
  })
})

describe('segmentBetween', () => {
  it('measures a 3-4-5 segment', () => {
    const { length, angle } = segmentBetween({ x: 0, y: 0 }, { x: 3, y: 4 })
    expect(length).toBe(5)
    expect(angle).toBeCloseTo(53.13, 2)
  })

  it('rotates a rising line (smaller y) by a negative angle', () => {
    expect(segmentBetween({ x: 0, y: 10 }, { x: 10, y: 0 }).angle).toBeCloseTo(-45)
  })
})

describe('bandRect', () => {
  it('gives the same rect whichever end comes first', () => {
    const forward = bandRect({ from: 2, to: 6 }, [0, 10], 30)
    expect(forward.top).toBeCloseTo(12)
    expect(forward.height).toBeCloseTo(12)
    expect(bandRect({ from: 6, to: 2 }, [0, 10], 30)).toEqual(forward)
  })
})
