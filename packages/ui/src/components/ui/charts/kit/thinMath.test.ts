import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

import { fcAssert } from '../../../../test/property'

import { decimateMinMax, thinLabels } from './thinMath'

interface Point {
  i: number
  x: number
  y: number
}

const accessors = { x: (p: Point) => p.x, y: (p: Point) => p.y }

const series = fc
  .array(fc.double({ min: -1e6, max: 1e6, noNaN: true }), { minLength: 1, maxLength: 400 })
  .map((ys) => ys.map((y, i) => ({ i, x: i, y })))
const columns = fc.integer({ min: 1, max: 60 })

const positions = fc
  .array(fc.double({ min: 0, max: 2000, noNaN: true }), { minLength: 1, maxLength: 80 })
  .map((ps) => [...ps].sort((a, b) => a - b))
const gap = fc.double({ min: 0.5, max: 200, noNaN: true })

describe('thinLabels', () => {
  it('keeps the first and last, and no two kept labels closer than the gap', () => {
    fcAssert(
      fc.property(positions, gap, (ps, minGap) => {
        const kept = thinLabels(ps, (p) => p, minGap)
        const spaced = kept.every((p, i) => i === 0 || p - (kept[i - 1] as number) >= minGap)
        const span = (ps[ps.length - 1] as number) - (ps[0] as number)
        const ends = kept[0] === ps[0] && (span < minGap || kept.at(-1) === ps.at(-1))
        return spaced && ends
      })
    )
  })

  it('drops the labels that would overprint', () => {
    expect(thinLabels([0, 10, 20, 40, 45, 60], (p) => p, 20)).toEqual([0, 20, 40, 60])
  })

  it('drops a label crowding the last one rather than the last itself', () => {
    expect(thinLabels([0, 50, 90, 100], (p) => p, 20)).toEqual([0, 50, 100])
  })

  it('keeps only the first when the ends themselves are too close', () => {
    expect(thinLabels([0, 5, 10], (p) => p, 20)).toEqual([0])
  })

  it('returns no labels for none', () => {
    expect(thinLabels([], (p: number) => p, 20)).toEqual([])
  })
})

describe('decimateMinMax', () => {
  it('keeps the global min and max, the first and the last', () => {
    fcAssert(
      fc.property(series, columns, (points, n) => {
        const kept = decimateMinMax(points, { ...accessors, columns: n })
        const ys = points.map((p) => p.y)
        const keptYs = kept.map((p) => p.y)
        return (
          kept[0] === points[0] &&
          kept.at(-1) === points.at(-1) &&
          keptYs.includes(Math.min(...ys)) &&
          keptYs.includes(Math.max(...ys))
        )
      })
    )
  })

  it('returns at most 2 * columns + 2 points, in their original order', () => {
    fcAssert(
      fc.property(series, columns, (points, n) => {
        const kept = decimateMinMax(points, { ...accessors, columns: n })
        const ordered = kept.every((p, i) => i === 0 || p.i > (kept[i - 1] as Point).i)
        return kept.length <= 2 * n + 2 && ordered
      })
    )
  })

  it('keeps a one-point spike that averaging would flatten', () => {
    const flat = Array.from({ length: 1000 }, (_, i) => ({ i, x: i, y: i === 500 ? 99 : 1 }))
    const kept = decimateMinMax(flat, { ...accessors, columns: 10 })
    expect(kept.map((p) => p.y)).toContain(99)
  })

  it('keeps every column’s own min and max', () => {
    const points = [0, 5, -3, 2, 8, 1, 4, -1, 6, 0].map((y, i) => ({ i, x: i, y }))
    const kept = decimateMinMax(points, { ...accessors, columns: 2 })
    expect(kept.map((p) => p.y)).toEqual([0, -3, 8, -1, 6, 0])
  })

  it('returns a short series whole', () => {
    const points = [3, 1, 2].map((y, i) => ({ i, x: i, y }))
    expect(decimateMinMax(points, { ...accessors, columns: 4 })).toEqual(points)
  })
})
