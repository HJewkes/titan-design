import { describe, expect, it } from 'vitest'
import { CATEGORICAL_CVD_SAFE_MAX } from '../../../../theme/tokens/primitives'
import {
  byName,
  lineFixtures,
  realTimelines,
  type FixtureSeries,
  type LineFixture,
} from './fixtures'

const xValue = (x: number | Date): number => (x instanceof Date ? x.getTime() : x)
const ys = (series: FixtureSeries): (number | null)[] => series.points.map((p) => p.y)
const allPoints = (fixture: LineFixture) => fixture.series.flatMap((s) => s.points)
const nonHostile = lineFixtures.filter((f) => !f.hostile).map((f) => [f.name, f] as const)

describe('LineChart fixtures', () => {
  it('lists every contract fixture once', () => {
    expect(lineFixtures.map((f) => f.name).sort()).toEqual(
      [
        'All-equal',
        'Clustered time',
        'Default',
        'Empty',
        'Flat',
        'Gaps',
        'Hostile',
        'Index change',
        'Many series',
        'Missing baseline',
        'NaN',
        'One point',
        'Real history',
        'Two points',
        'Very large',
      ].sort()
    )
  })

  it('marks only Hostile and NaN as hostile', () => {
    expect(lineFixtures.filter((f) => f.hostile).map((f) => f.name)).toEqual(['Hostile', 'NaN'])
  })

  it.each(nonHostile)('%s has only finite or null y', (_name, fixture) => {
    for (const point of allPoints(fixture)) {
      expect(point.y === null || Number.isFinite(point.y), point.id).toBe(true)
    }
  })

  it.each(nonHostile)('%s has unique point ids', (_name, fixture) => {
    const ids = allPoints(fixture).map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(nonHostile)('%s has every series sorted by x', (_name, fixture) => {
    for (const series of fixture.series) {
      const xs = series.points.map((p) => xValue(p.x))
      expect(xs).toEqual([...xs].sort((a, b) => a - b))
    }
  })

  it('gives every fixture that is not purely real a note', () => {
    for (const fixture of lineFixtures.filter((f) => f.provenance !== 'real')) {
      expect(fixture.note.length, fixture.name).toBeGreaterThan(0)
    }
  })

  it('makes Very large one series of 2,000 points with a unique maximum', () => {
    const { series } = byName('Very large')
    expect(series).toHaveLength(1)
    expect(series[0].points).toHaveLength(2000)
    const values = ys(series[0]) as number[]
    const max = Math.max(...values)
    expect(values.filter((y) => y === max)).toHaveLength(1)
  })

  it('makes Many series 18 series, enough for three facets', () => {
    const { series } = byName('Many series')
    expect(series).toHaveLength(18)
    expect(new Set(series.map((s) => s.id)).size).toBe(18)
    expect(series.length).toBeGreaterThan(2 * CATEGORICAL_CVD_SAFE_MAX)
  })
})

describe('real timelines', () => {
  const timelines = [
    ['Real history', byName('Real history')],
    ...Object.entries(realTimelines),
  ] as const

  it.each(timelines)(
    '%s has 3 series, 51 points and 10 gaps on Package B 1 to 10',
    (_name, fixture) => {
      expect(fixture.series).toHaveLength(3)
      const points = allPoints(fixture)
      expect(points).toHaveLength(51)
      const gaps = points.filter((p) => p.y === null)
      expect(gaps.map((p) => p.id)).toEqual(
        Array.from({ length: 10 }, (_, i) => `package-b@${i + 1}`)
      )
      expect(gaps.every((p) => p.missing === 'not-in-snapshot')).toBe(true)
      for (const series of fixture.series)
        expect(new Set(series.points.map((p) => p.id)).size).toBe(17)
    }
  )

  it('anchors the transcription to the source values', () => {
    const [total, packageA] = realTimelines.loc.series
    expect(total.points.at(-1)?.y).toBe(60490)
    expect(packageA.points[0].y).toBe(4522)
  })

  it('keeps Clustered time at 17 points on 8 distinct instants', () => {
    const points = allPoints(byName('Clustered time'))
    expect(points).toHaveLength(17)
    expect(new Set(points.map((p) => xValue(p.x))).size).toBe(8)
  })
})

describe('edge-case fixtures', () => {
  it('opens Gaps with a null and holds one inner null between finite values', () => {
    const values = ys(byName('Gaps').series[0])
    expect(values[0]).toBeNull()
    const inner = values.findIndex(
      (y, i) => y === null && i > 0 && values[i - 1] !== null && values[i + 1] != null
    )
    expect(inner).toBeGreaterThan(0)
    expect(byName('Gaps').series[0].points[inner].missing).toBe('not-measured')
  })

  it('puts the Index change boundary at the first 0.15.0 point', () => {
    const fixture = byName('Index change')
    const points = fixture.series[0].points
    expect(new Set(points.map((p) => p.segmentKey))).toEqual(new Set(['0.14.0', '0.15.0']))
    const first = points.find((p) => p.segmentKey === '0.15.0')
    expect(fixture.boundaries).toEqual([{ x: first?.x, label: 'Index 0.15.0' }])
  })

  it('keeps the degenerate fixtures degenerate', () => {
    expect(byName('Empty').series).toEqual([])
    expect(allPoints(byName('One point'))).toHaveLength(1)
    expect(allPoints(byName('Two points'))).toHaveLength(2)
    expect(new Set(ys(byName('Flat').series[0]))).toEqual(new Set([40]))
    const allEqual = byName('All-equal')
    expect(allEqual.series).toHaveLength(3)
    expect(new Set(allPoints(allEqual).map((p) => p.y))).toEqual(new Set([0]))
  })

  it('separates Default from Missing baseline', () => {
    expect(byName('Default').referenceLines).toEqual([{ y: 10000, label: 'Budget' }])
    const missing = byName('Missing baseline')
    expect(missing.referenceLines).toBeUndefined()
    expect(missing.includeZero).toBeUndefined()
  })

  it('keeps every hostile ingredient in Hostile', () => {
    const fixture = byName('Hostile')
    const values = allPoints(fixture).map((p) => p.y)
    expect(values.some((y) => Number.isNaN(y))).toBe(true)
    expect(values).toContain(Number.POSITIVE_INFINITY)
    expect(values).toContain(Number.NEGATIVE_INFINITY)
    expect(values.some((y) => y !== null && y < 0)).toBe(true)
    expect(fixture.includeZero).toBe(true)
    const xs = fixture.series[0].points.map((p) => xValue(p.x))
    expect(xs).not.toEqual([...xs].sort((a, b) => a - b))
    expect(new Set(xs).size).toBeLessThan(xs.length)
    expect(fixture.series.some((s) => s.points.length === 0)).toBe(true)
    expect(Math.max(...fixture.series.map((s) => s.label.length))).toBeGreaterThanOrEqual(40)
  })

  it('makes NaN one series with an inner NaN and one that is all NaN', () => {
    const [some, all] = byName('NaN').series
    expect(ys(some).filter((y) => Number.isNaN(y))).toHaveLength(1)
    expect(ys(all).every((y) => Number.isNaN(y))).toBe(true)
  })
})
