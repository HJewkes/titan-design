import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../../test/property'
import {
  binCount,
  bucketAt,
  buildActivityStripModel,
  cleanBuckets,
  cleanGaps,
  columnMax,
  offsetOfTime,
  resolveDomain,
  resolveMaxCount,
  stepCursor,
  summarizeActivity,
  timeAtOffset,
  type ActivityBucket,
  type ActivityScale,
  type TimeRange,
} from './activity-strip-model'
import {
  activityStripFixtures,
  defaultFixture,
  hostileFixture,
  hostileOptionSets,
  midnightFixture,
} from './fixtures'

const MIN = 60_000
const domain: TimeRange = { start: 1_000_000, end: 1_000_000 + 100 * MIN }
const byName = (name: string) => activityStripFixtures.find((f) => f.name === name)!
const modelOf = (name: string) => buildActivityStripModel(byName(name))

const countArb = fc.oneof(
  fc.integer({ min: -5, max: 50 }),
  fc.constant(null),
  fc.constant(Number.NaN),
  fc.constant(Number.POSITIVE_INFINITY)
)
const bucketArb = fc.record({
  start: fc.oneof(
    fc.integer({ min: -1_000, max: 10_000 }).map((m) => m * MIN),
    fc.constant(Number.NaN)
  ),
  count: countArb,
})
const gapArb = fc.record({
  start: fc.integer({ min: -1_000, max: 10_000 }).map((m) => m * MIN),
  end: fc.integer({ min: -1_000, max: 10_000 }).map((m) => m * MIN),
})
const lengthArb = fc.oneof(
  fc.integer({ min: -5, max: 800 }),
  fc.constant(Number.NaN),
  fc.double({ min: 0, max: 800 })
)

describe('binCount', () => {
  it('is monotonic in count', () => {
    fcAssert(
      fc.property(
        fc.double({ min: 0, max: 1_000, noNaN: true }),
        fc.double({ min: 0, max: 1_000, noNaN: true }),
        fc.double({ min: 0.1, max: 1_000, noNaN: true }),
        fc.constantFrom<ActivityScale>('linear', 'sqrt', 'log'),
        (a, b, max, scale) => {
          const [low, high] = a <= b ? [a, b] : [b, a]
          expect(binCount(low, max, scale)).toBeLessThanOrEqual(binCount(high, max, scale))
        }
      )
    )
  })

  it('never bins a positive count to zero, while 0, null and NaN draw nothing', () => {
    for (const scale of ['linear', 'sqrt', 'log'] as const) {
      expect(binCount(0.001, 1_000_000, scale)).toBeGreaterThanOrEqual(1)
      expect(binCount(1, 400, scale)).toBeGreaterThanOrEqual(1)
      expect([0, null, Number.NaN, -3].map((c) => binCount(c, 10, scale))).toEqual([0, 0, 0, 0])
    }
  })

  it('puts all-equal counts in one step without dividing by zero', () => {
    const { buckets } = cleanBuckets(byName('All equal').buckets)
    const max = resolveMaxCount(buckets)
    expect(new Set(buckets.map((b) => binCount(b.count, max))).size).toBe(1)
    expect(binCount(3, 0)).toBeGreaterThanOrEqual(1)
    expect(resolveMaxCount([{ start: 0, count: 0 }])).toBe(1)
  })

  it('lets maxCount override the data maximum and clamps counts above it', () => {
    const { buckets } = cleanBuckets([{ start: 0, count: 4 }])
    expect(resolveMaxCount(buckets)).toBe(4)
    expect(resolveMaxCount(buckets, 20)).toBe(20)
    expect(binCount(4, 20, 'linear')).toBe(1)
    expect(binCount(4, 4, 'linear')).toBe(4)
    expect(binCount(500, 20)).toBe(4)
    expect(resolveMaxCount(buckets, 0)).toBe(4)
  })
})

describe('columnMax', () => {
  it('keeps the Spike at 30 px', () => {
    const model = modelOf('Spike')
    expect(Math.max(...model.columns.map((c) => c.count))).toBe(400)
    expect(model.columns.filter((c) => c.count === 400)).toHaveLength(1)
    expect(model.columns.find((c) => c.count === 400)?.step).toBe(4)
    expect(model.columns.filter((c) => c.count === 1)[0].step).toBeGreaterThanOrEqual(1)
  })

  it('returns at most length columns, each inside 0..length', () => {
    fcAssert(
      fc.property(fc.array(bucketArb, { maxLength: 60 }), lengthArb, (raw, length) => {
        const { buckets } = cleanBuckets(raw)
        const columns = columnMax(buckets, domain, length, MIN)
        const cols = Number.isFinite(length) && length > 0 ? Math.floor(length) : 0
        expect(columns.length).toBeLessThanOrEqual(cols)
        for (const { column } of columns) {
          expect(column).toBeGreaterThanOrEqual(0)
          expect(column).toBeLessThan(Math.max(cols, 1))
        }
      })
    )
  })

  it('merges Very large into at most length columns', () => {
    expect(modelOf('Very large').columns.length).toBeLessThanOrEqual(600)
  })
})

describe('time mapping', () => {
  it('returns to within one bucket for any time in the domain', () => {
    fcAssert(
      fc.property(
        fc.integer({ min: 0, max: 100 * MIN }),
        fc.integer({ min: 1, max: 2_000 }),
        (delta, length) => {
          const t = domain.start + delta
          const back = timeAtOffset(offsetOfTime(t, domain, length), domain, length)
          expect(Math.abs(back - t)).toBeLessThanOrEqual(MIN)
        }
      )
    )
  })

  it('clamps outside the domain and survives a zero length', () => {
    expect(offsetOfTime(domain.start - MIN, domain, 100)).toBe(0)
    expect(offsetOfTime(domain.end + MIN, domain, 100)).toBe(100)
    expect(timeAtOffset(-5, domain, 100)).toBe(domain.start)
    expect(timeAtOffset(500, domain, 100)).toBe(domain.end)
    expect(offsetOfTime(domain.start + MIN, domain, 0)).toBe(0)
    expect(timeAtOffset(10, domain, Number.NaN)).toBe(domain.start)
  })
})

describe('cleaning', () => {
  it('keeps Midnight buckets on both sides of 00:00 apart', () => {
    const model = buildActivityStripModel(midnightFixture)
    const boundary = Date.UTC(2026, 0, 6)
    expect(model.buckets).toHaveLength(45)
    expect(model.buckets.filter((b) => b.start < boundary)).toHaveLength(20)
    expect(model.buckets.filter((b) => b.start >= boundary)).toHaveLength(25)
  })

  it('sums duplicate starts and gives the same model whatever the order', () => {
    expect(
      cleanBuckets([
        { start: 5, count: 2 },
        { start: 5, count: 3 },
      ]).buckets
    ).toEqual([{ start: 5, count: 5 }])
    fcAssert(
      fc.property(
        fc
          .array(bucketArb, { maxLength: 30 })
          .chain((items) =>
            fc.tuple(
              fc.constant(items),
              fc.shuffledSubarray(items, { minLength: items.length, maxLength: items.length })
            )
          ),
        ([items, shuffled]: [ActivityBucket[], ActivityBucket[]]) => {
          expect(cleanBuckets(shuffled)).toEqual(cleanBuckets(items))
        }
      )
    )
  })

  it('counts null, NaN and negative counts as unknown and draws nothing for them', () => {
    const model = modelOf('Missing values')
    expect(model.unknownCount).toBe(3)
    expect(model.totalCount).toBe(15)
    expect(cleanBuckets([{ start: 0, count: -1 }]).buckets).toEqual([])
  })

  it('drops inverted gaps, merges overlapping ones and clips to the domain', () => {
    const gaps = cleanGaps(
      [
        { start: 30 * MIN + domain.start, end: 20 * MIN + domain.start },
        { start: 10 * MIN + domain.start, end: 20 * MIN + domain.start },
        { start: 15 * MIN + domain.start, end: 25 * MIN + domain.start },
        { start: domain.start - 50 * MIN, end: domain.start + 2 * MIN },
        { start: domain.end - MIN, end: domain.end + 50 * MIN },
        { start: domain.end + MIN, end: domain.end + 5 * MIN },
      ],
      domain
    )
    expect(gaps.map((g) => [g.start - domain.start, g.end - domain.start])).toEqual([
      [0, 2 * MIN],
      [10 * MIN, 25 * MIN],
      [99 * MIN, 100 * MIN],
    ])
  })
})

describe('stepCursor', () => {
  const at = (minute: number) => domain.start + minute * MIN
  it('moves one bucket, ten buckets, to the ends, and clamps without wrapping', () => {
    expect(stepCursor(at(50), 'ArrowRight', domain, MIN)).toBe(at(51))
    expect(stepCursor(at(50), 'ArrowDown', domain, MIN)).toBe(at(51))
    expect(stepCursor(at(50), 'ArrowLeft', domain, MIN)).toBe(at(49))
    expect(stepCursor(at(50), 'ArrowUp', domain, MIN)).toBe(at(49))
    expect(stepCursor(at(50), 'PageDown', domain, MIN)).toBe(at(60))
    expect(stepCursor(at(50), 'PageUp', domain, MIN)).toBe(at(40))
    expect(stepCursor(at(50), 'Home', domain, MIN)).toBe(domain.start)
    expect(stepCursor(at(50), 'End', domain, MIN)).toBe(domain.end)
    expect(stepCursor(domain.end, 'ArrowRight', domain, MIN)).toBe(domain.end)
    expect(stepCursor(domain.start, 'PageUp', domain, MIN)).toBe(domain.start)
  })

  it('starts at the domain start from a null cursor', () => {
    expect(stepCursor(null, 'ArrowRight', domain, MIN)).toBe(domain.start)
    expect(stepCursor(null, 'ArrowLeft', domain, MIN)).toBe(domain.start)
    expect(stepCursor(null, 'End', domain, MIN)).toBe(domain.end)
  })
})

describe('degenerate input', () => {
  it('resolves a bad domain, bucketMs or length to a safe non-empty domain', () => {
    const flat = resolveDomain([], [], MIN, { start: 5, end: 5 })
    expect(flat.end).toBeGreaterThan(flat.start)
    const inverted = resolveDomain([{ start: 10 * MIN, count: 1 }], [], MIN, { start: 9, end: 2 })
    expect(inverted).toEqual({ start: 10 * MIN, end: 11 * MIN })
    for (const bucketMs of [0, -MIN, Number.NaN]) {
      const model = buildActivityStripModel({
        buckets: [{ start: 0, count: 1 }],
        bucketMs,
        length: 50,
      })
      expect(model.bucketMs).toBe(MIN)
      expect(model.domain.end).toBeGreaterThan(model.domain.start)
    }
    for (const length of [0, -4, Number.NaN]) {
      expect(buildActivityStripModel({ ...defaultFixture, length }).columns).toEqual([])
    }
  })

  it('never throws on Hostile with any option set, and every mark lies inside the strip', () => {
    for (const options of [{}, ...hostileOptionSets]) {
      const model = buildActivityStripModel({ ...hostileFixture, ...options })
      expect(model.domain.end).toBeGreaterThan(model.domain.start)
      for (const { column } of model.columns) expect(column).toBeLessThan(Math.max(model.length, 1))
      for (const gap of model.gapMarks) {
        expect(gap.offset).toBeGreaterThanOrEqual(0)
        expect(gap.size).toBeGreaterThanOrEqual(0)
        expect(gap.offset + gap.size).toBeLessThanOrEqual(model.length)
      }
    }
  })

  it('never throws and keeps every mark inside the strip, for any buckets, gaps, domain and length', () => {
    fcAssert(
      fc.property(
        fc.array(bucketArb, { maxLength: 40 }),
        fc.array(gapArb, { maxLength: 10 }),
        fc.option(gapArb, { nil: undefined }),
        lengthArb,
        fc.oneof(fc.constant(0), fc.constant(Number.NaN), fc.integer({ min: 1, max: 10 * MIN })),
        (buckets, gaps, domainArg, length, bucketMs) => {
          const model = buildActivityStripModel({
            buckets,
            gaps,
            domain: domainArg,
            length,
            bucketMs,
          })
          expect(model.domain.end).toBeGreaterThan(model.domain.start)
          for (const { column } of model.columns) {
            expect(column).toBeGreaterThanOrEqual(0)
            expect(column).toBeLessThan(Math.max(model.length, 1))
          }
          for (const gap of model.gapMarks) {
            expect(gap.offset).toBeGreaterThanOrEqual(0)
            expect(gap.offset + gap.size).toBeLessThanOrEqual(model.length)
          }
        }
      )
    )
  })
})

describe('bucketAt', () => {
  it('finds the bucket holding a time and null elsewhere', () => {
    const { buckets } = cleanBuckets([{ start: 10 * MIN, count: 3 }])
    expect(bucketAt(buckets, 10 * MIN + 30_000, MIN)).toEqual({ start: 10 * MIN, count: 3 })
    expect(bucketAt(buckets, 11 * MIN, MIN)).toBeNull()
    expect(bucketAt(buckets, Number.NaN, MIN)).toBeNull()
  })
})

describe('summarizeActivity', () => {
  it('gives the span, event total, active buckets, busiest bucket, gap count and longest gap', () => {
    expect(summarizeActivity(buildActivityStripModel(defaultFixture))).toMatch(
      /^Activity over 2h 40m: \d+ events in 96 active buckets, busiest bucket \d events, 2 gaps, longest 31m\.$/
    )
  })

  it('claims no busiest bucket for One item', () => {
    expect(summarizeActivity(modelOf('One item'))).toBe(
      'Activity over 1h: 3 events in 1 active bucket.'
    )
  })

  it('counts unknowns for Missing values', () => {
    expect(summarizeActivity(modelOf('Missing values'))).toBe(
      'Activity over 8m: 15 events in 4 active buckets, busiest bucket 7 events, 3 buckets with no count.'
    )
  })

  it('gives the empty sentence for Empty and a gap sentence for Only gaps', () => {
    expect(summarizeActivity(modelOf('Empty'))).toBe('No activity.')
    expect(summarizeActivity(modelOf('Only gaps'))).toBe('No activity, 1 gap of 45m.')
  })
})
