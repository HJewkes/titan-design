import { describe, expect, it } from 'vitest'
import { buildActivityStripModel } from './activity-strip-model'
import {
  activityStripFixtures,
  defaultFixture,
  hostileFixture,
  midnightFixture,
  veryLargeFixture,
} from './fixtures'

const byName = (name: string) => {
  const fixture = activityStripFixtures.find((f) => f.name === name)
  if (!fixture) throw new Error(`missing fixture ${name}`)
  return fixture
}

describe('ActivityStrip fixtures', () => {
  it('lists every contract fixture once', () => {
    expect(activityStripFixtures.map((f) => f.name).sort()).toEqual(
      [
        'All equal',
        'Default',
        'Empty',
        'Hostile',
        'Midnight',
        'Minimap',
        'Missing values',
        'One item',
        'Only gaps',
        'Row',
        'Shared ceiling',
        'Spike',
        'Very large',
      ].sort()
    )
  })

  it('Default has 96 active one-minute buckets, counts 1 to 9, and gaps of 12 and 31 minutes', () => {
    const counts = defaultFixture.buckets.map((b) => b.count as number)
    expect(counts).toHaveLength(96)
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(1)
    expect(Math.max(...counts)).toBeLessThanOrEqual(9)
    expect(defaultFixture.gaps?.map((g) => (g.end - g.start) / 60_000)).toEqual([12, 31])
    expect(defaultFixture.cursor).not.toBeNull()
    expect(defaultFixture.window).toBeTruthy()
  })

  it('Row and Minimap restate the Default data at their own size and orientation', () => {
    const row = byName('Row')
    const minimap = byName('Minimap')
    expect(row.buckets).toBe(defaultFixture.buckets)
    expect([row.size, row.length, row.cursor]).toEqual(['md', 160, null])
    expect([minimap.size, minimap.orientation, minimap.length]).toEqual(['sm', 'vertical', 480])
  })

  it('Midnight spans the day boundary with buckets on both sides', () => {
    const boundary = Date.UTC(2026, 0, 6)
    const starts = midnightFixture.buckets.map((b) => b.start)
    expect(starts.some((s) => s < boundary)).toBe(true)
    expect(starts.some((s) => s >= boundary)).toBe(true)
  })

  it('Empty has no buckets or gaps, and Only gaps has one 45-minute gap and no buckets', () => {
    expect(byName('Empty').buckets).toEqual([])
    expect(byName('Empty').gaps).toBeUndefined()
    const onlyGaps = byName('Only gaps')
    expect(onlyGaps.buckets).toEqual([])
    expect(onlyGaps.gaps?.map((g) => (g.end - g.start) / 60_000)).toEqual([45])
  })

  it('One item, All equal and Spike have their stated shapes', () => {
    expect(byName('One item').buckets).toEqual([expect.objectContaining({ count: 3 })])
    const equal = byName('All equal').buckets
    expect(equal).toHaveLength(40)
    expect(new Set(equal.map((b) => b.count))).toEqual(new Set([3]))
    const counts = byName('Spike').buckets.map((b) => b.count)
    expect(counts.filter((c) => c === 1)).toHaveLength(59)
    expect(counts.filter((c) => c === 400)).toHaveLength(1)
  })

  it('Missing values mixes null and NaN among real counts', () => {
    const counts = byName('Missing values').buckets.map((b) => b.count)
    expect(counts).toContain(null)
    expect(counts.some((c) => Number.isNaN(c))).toBe(true)
    expect(counts.some((c) => typeof c === 'number' && c > 0)).toBe(true)
  })

  it('Shared ceiling pins maxCount 20 over strips peaking at 4 and 20', () => {
    const fixture = byName('Shared ceiling')
    expect(fixture.maxCount).toBe(20)
    expect(Math.max(...fixture.buckets.map((b) => b.count as number))).toBe(4)
    expect(Math.max(...(fixture.compare ?? []).map((b) => b.count as number))).toBe(20)
  })

  it('Very large holds 4,320 buckets at 600 px and merges them into at most 600 columns', () => {
    expect(veryLargeFixture.buckets).toHaveLength(4320)
    expect(veryLargeFixture.length).toBe(600)
    expect(buildActivityStripModel(veryLargeFixture).columns.length).toBeLessThanOrEqual(600)
  })

  it('every fixture pins a domain with fixed epoch values', () => {
    for (const fixture of activityStripFixtures) {
      expect(fixture.domain, fixture.name).toBeDefined()
      expect(fixture.domain!.start, fixture.name).toBeGreaterThan(1_700_000_000_000)
    }
  })

  it('Hostile carries bad starts, counts, gaps and a 200-character label', () => {
    const counts = hostileFixture.buckets.map((b) => b.count as number)
    expect(counts.some((c) => c < 0)).toBe(true)
    expect(hostileFixture.buckets.some((b) => Number.isNaN(b.start))).toBe(true)
    expect(hostileFixture.gaps?.some((g) => g.end < g.start)).toBe(true)
    expect(hostileFixture.gaps?.some((g) => (g.label?.length ?? 0) === 200)).toBe(true)
  })
})
