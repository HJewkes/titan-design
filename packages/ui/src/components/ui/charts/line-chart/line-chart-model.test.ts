import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

import { fcAssert } from '../../../../test/property'
import { CATEGORICAL_CVD_SAFE_MAX } from '../../../../theme/tokens/primitives'
import { byName, lineFixtures } from './fixtures'
import {
  cleanSeries,
  facetSeries,
  nearestPoint,
  nextPoint,
  projectSeries,
} from './line-chart-model'
import type { LineGeometry, LinePoint, LineSeries } from './types'

const PLOT = { width: 360, height: 180 }

const nonFinite = fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY)

const hostileNumber = fc.oneof(fc.double({ min: -1e9, max: 1e9, noNaN: true }), nonFinite)

// x at millisecond resolution, as timestamps are: the kit's timeDomain has no relative-spread
// guard, so two subnormal x values a few ulps apart lose the padding to rounding.
const hostileX = fc.oneof(
  fc.double({ min: -1e9, max: 1e9, noNaN: true }).map((x) => Math.round(x * 1000) / 1000),
  nonFinite
)

const pointArb: fc.Arbitrary<LinePoint> = fc.record({
  x: hostileX,
  y: fc.option(hostileNumber, { nil: null }),
  segmentKey: fc.option(fc.constantFrom('a', 'b'), { nil: undefined }),
})

const seriesArb: fc.Arbitrary<LineSeries[]> = fc
  .array(fc.array(pointArb, { maxLength: 60 }), { maxLength: 4 })
  .map((all) => all.map((points, i) => ({ id: `s${i}`, label: `S${i}`, points })))

const plotArb = fc.record({
  width: fc.integer({ min: 0, max: 1200 }),
  height: fc.integer({ min: 0, max: 600 }),
  xScale: fc.constantFrom('time' as const, 'linear' as const),
  includeZero: fc.boolean(),
  referenceLines: fc.array(fc.record({ y: hostileNumber, label: fc.constant('Ref') }), {
    maxLength: 2,
  }),
  boundaries: fc.array(fc.record({ x: hostileX }), { maxLength: 2 }),
})

/** Every number in the geometry a painter would draw: point centres, path commands, ticks, rules. */
function coordinates(geometry: LineGeometry): { x: number[]; y: number[] } {
  const pathPairs = geometry.series.flatMap((s) =>
    s.paths.flatMap((d) => (d.match(/-?[\d.]+(?:e[-+]?\d+)?/g) ?? []).map(Number))
  )
  const evens = pathPairs.filter((_, i) => i % 2 === 0)
  const odds = pathPairs.filter((_, i) => i % 2 === 1)
  const points = geometry.series.flatMap((s) => s.points)
  return {
    x: [...points.map((p) => p.x), ...evens, ...geometry.xTicks.map((t) => t.position)].concat(
      geometry.boundaries.map((b) => b.position)
    ),
    y: [
      ...points.flatMap((p) => (p.y === null ? [] : [p.y])),
      ...odds,
      ...geometry.yTicks.map((t) => t.position),
      ...geometry.referenceLines.map((r) => r.position),
    ],
  }
}

const inside = (values: number[], extent: number) =>
  values.every((v) => Number.isFinite(v) && v >= 0 && v <= extent)

const project = (series: LineSeries[], options = {}) =>
  projectSeries(series.map(cleanSeries), { ...PLOT, ...options })

describe('cleanSeries', () => {
  it('drops and counts every non-finite x and y, keeps gaps, and sorts stably by x', () => {
    const clean = cleanSeries(byName('Hostile').series[0] as LineSeries)
    expect(clean.dropped).toBe(3)
    expect(clean.points.map((p) => p.id)).toEqual(['a@2', 'a@0', 'a@5', 'a@6'])
    expect(clean.gaps).toBe(1)
  })

  it('drops points whose x is not finite, so decimation never sees them', () => {
    const series: LineSeries = {
      id: 's',
      label: 'S',
      points: [
        { x: Number.NaN, y: 1 },
        { x: new Date(Number.NaN), y: 2 },
        { x: 1, y: 3 },
      ],
    }
    expect(cleanSeries(series).points.map((p) => p.y)).toEqual([3])
  })

  it('leaves only finite numbers or null in any input', () => {
    fcAssert(
      fc.property(seriesArb, (all) =>
        all
          .map(cleanSeries)
          .every((clean) =>
            clean.points.every(
              (p, i) =>
                Number.isFinite(p.x) &&
                (p.y === null || Number.isFinite(p.y)) &&
                (i === 0 || (clean.points[i - 1]?.x as number) <= p.x)
            )
          )
      )
    )
  })

  it('splits at a gap and at a segmentKey change', () => {
    const clean = cleanSeries(byName('Index change').series[0] as LineSeries)
    expect(clean.segments.map((s) => s.length)).toEqual([8, 9])
    expect(clean.indexChanges).toBe(1)
    const gaps = cleanSeries(byName('Gaps').series[0] as LineSeries)
    expect(gaps.segments.map((s) => s.length)).toEqual([3, 3])
  })

  it('never lets a segment bridge a null or a segmentKey change', () => {
    fcAssert(
      fc.property(seriesArb, (all) =>
        all.map(cleanSeries).every((clean) => {
          const bridges = clean.segments.some((segment) =>
            segment.some((p, i) => {
              if (i === 0) return false
              const prev = segment[i - 1]
              const between = clean.points.slice(
                clean.points.indexOf(prev as (typeof clean.points)[number]) + 1,
                clean.points.indexOf(p)
              )
              return prev?.point.segmentKey !== p.point.segmentKey || between.length > 0
            })
          )
          const covered = clean.segments.flat().length
          return !bridges && covered === clean.points.length - clean.gaps
        })
      )
    )
  })
})

describe('projectSeries', () => {
  it('emits only finite coordinates inside the plot for any input', () => {
    fcAssert(
      fc.property(seriesArb, plotArb, (all, plot) => {
        const { x, y } = coordinates(project(all, plot))
        return inside(x, plot.width) && inside(y, plot.height)
      })
    )
  })

  it('keeps every fixture, the Hostile one included, finite and inside the plot', () => {
    for (const fixture of lineFixtures) {
      const geometry = project(fixture.series, fixture)
      const { x, y } = coordinates(geometry)
      expect(inside(x, PLOT.width), fixture.name).toBe(true)
      expect(inside(y, PLOT.height), fixture.name).toBe(true)
    }
  })

  it('draws one path per segment and none for a lone point', () => {
    expect(project(byName('Index change').series).series[0]?.paths).toHaveLength(2)
    expect(project(byName('One point').series).series[0]?.paths).toHaveLength(0)
  })

  it('decimates a series wider than the plot but keeps every point for the keyboard', () => {
    const geometry = project(byName('Very large').series, { xScale: 'linear' })
    const series = geometry.series[0]
    const commands = (series?.paths[0]?.match(/[MLC]/g) ?? []).length
    expect(series?.points).toHaveLength(2000)
    expect(commands).toBeLessThanOrEqual(2 * PLOT.width + 2)
  })

  it('places reference lines and boundaries inside the domains', () => {
    const geometry = project(byName('Default').series, {
      referenceLines: [{ y: 10000, label: 'B' }],
    })
    expect(geometry.domains.y.max).toBeGreaterThan(10000)
    expect(geometry.referenceLines[0]?.position).toBeGreaterThan(0)
  })
})

describe('facetSeries', () => {
  it('never puts more than six series in a facet and keeps order and count', () => {
    fcAssert(
      fc.property(fc.array(fc.nat(), { maxLength: 60 }), (ids) => {
        const facets = facetSeries(ids)
        return (
          facets.every((f) => f.length > 0 && f.length <= CATEGORICAL_CVD_SAFE_MAX) &&
          facets.flat().every((id, i) => id === ids[i]) &&
          facets.flat().length === ids.length
        )
      })
    )
  })

  it('folds 18 series into three facets of six and leaves six in one', () => {
    expect(facetSeries(byName('Many series').series).map((f) => f.length)).toEqual([6, 6, 6])
    expect(facetSeries([1, 2, 3, 4, 5, 6])).toEqual([[1, 2, 3, 4, 5, 6]])
  })
})

describe('nearestPoint', () => {
  it('finds the nearest point in x, then in y, and can land on a gap', () => {
    const geometry = project(
      [
        {
          id: 'a',
          label: 'A',
          points: [
            { id: 'a0', x: 0, y: 0 },
            { id: 'a1', x: 10, y: null },
          ],
        },
        { id: 'b', label: 'B', points: [{ id: 'b0', x: 0, y: 10 }] },
      ],
      { xScale: 'linear' }
    )
    const [a0, a1] = geometry.series[0]?.points ?? []
    const b0 = geometry.series[1]?.points[0]
    expect(nearestPoint(geometry.series, { x: a1?.x ?? 0, y: 0 })?.id).toBe('a1')
    expect(nearestPoint(geometry.series, { x: 0, y: b0?.y ?? 0 })?.id).toBe('b0')
    expect(nearestPoint(geometry.series, { x: 0, y: a0?.y ?? 0 })?.id).toBe('a0')
    expect(nearestPoint([], { x: 0, y: 0 })).toBeNull()
  })
})

describe('nextPoint', () => {
  const series = [
    {
      points: [
        { id: 'a0', x: 0 },
        { id: 'a1', x: 10 },
        { id: 'a2', x: 20 },
      ],
    },
    { points: [] },
    {
      points: [
        { id: 'c0', x: 0 },
        { id: 'c1', x: 19 },
      ],
    },
  ]

  it('stays put on Left at the first point and Right at the last', () => {
    expect(nextPoint(series, 'a0', 'ArrowLeft')).toBe('a0')
    expect(nextPoint(series, 'a2', 'ArrowRight')).toBe('a2')
    expect(nextPoint(series, 'a0', 'ArrowRight')).toBe('a1')
  })

  it('stays on Up in the first series and Down in the last, skipping empty ones', () => {
    expect(nextPoint(series, 'a1', 'ArrowUp')).toBe('a1')
    expect(nextPoint(series, 'c1', 'ArrowDown')).toBe('c1')
    expect(nextPoint(series, 'a2', 'ArrowDown')).toBe('c1')
    expect(nextPoint(series, 'c0', 'ArrowUp')).toBe('a0')
  })

  it('jumps to the ends with Home and End, clears on Escape and enters when nothing is active', () => {
    expect(nextPoint(series, 'a1', 'Home')).toBe('a0')
    expect(nextPoint(series, 'a1', 'End')).toBe('a2')
    expect(nextPoint(series, 'a1', 'Escape')).toBeNull()
    expect(nextPoint(series, null, 'ArrowRight')).toBe('a0')
    expect(nextPoint(series, null, 'End')).toBe('a2')
    expect(nextPoint(series, 'a1', 'Tab')).toBe('a1')
  })

  it('reaches a null point instead of skipping it', () => {
    const gaps = projectSeries([cleanSeries(byName('Gaps').series[0] as LineSeries)], PLOT)
    const ids: (string | null)[] = []
    let id: string | null = null
    for (let step = 0; step < 17; step++) {
      id = nextPoint(gaps.series, id, 'ArrowRight')
      ids.push(id)
    }
    expect(new Set(ids).size).toBe(17)
    expect(ids).toContain('package-b@14')
  })
})
