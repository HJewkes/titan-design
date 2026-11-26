// Synthetic, labelled fixtures for ActivityStrip. Every time is a fixed epoch value, so no test
// reads the clock. Not exported from any barrel.
import { seededRandom } from '../kit/seededRandom'
import type { ActivityBucket, ActivityGap, ActivityScale, TimeRange } from './activity-strip-model'

export interface ActivityStripFixture {
  name: string
  buckets: ActivityBucket[]
  gaps?: ActivityGap[]
  domain?: TimeRange
  bucketMs?: number
  maxCount?: number
  scale?: ActivityScale
  length: number
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md'
  cursor?: number | null
  window?: TimeRange | null
  /** A second strip drawn against the same ceiling. */
  compare?: ActivityBucket[]
}

const MINUTE = 60_000
/** 2026-01-05 09:00 UTC. */
const START = Date.UTC(2026, 0, 5, 9, 0, 0)
/** 2026-01-05 23:40 UTC. */
const LATE = Date.UTC(2026, 0, 5, 23, 40, 0)

const at = (base: number, minute: number) => base + minute * MINUTE
const run = (base: number, counts: (number | null)[]): ActivityBucket[] =>
  counts.map((count, i) => ({ start: at(base, i), count }))

const SESSION_MINUTES = 160
const defaultDomain: TimeRange = { start: START, end: at(START, SESSION_MINUTES) }
const defaultGaps: ActivityGap[] = [
  { start: at(START, 40), end: at(START, 52), label: '12 minutes idle' },
  { start: at(START, 100), end: at(START, 131), label: '31 minutes idle' },
]

function sessionBuckets(): ActivityBucket[] {
  const random = seededRandom(849)
  const open = [...Array(SESSION_MINUTES).keys()].filter(
    (m) => !defaultGaps.some((g) => at(START, m) >= g.start && at(START, m) < g.end)
  )
  let needed = 96
  const picked: ActivityBucket[] = []
  open.forEach((minute, i) => {
    if (random() * (open.length - i) < needed) {
      needed -= 1
      picked.push({ start: at(START, minute), count: 1 + Math.floor(random() * 9) })
    }
  })
  return picked
}

const sessionWindow: TimeRange = { start: at(START, 20), end: at(START, 60) }

export const defaultFixture: ActivityStripFixture = {
  name: 'Default',
  buckets: sessionBuckets(),
  gaps: defaultGaps,
  domain: defaultDomain,
  length: 320,
  cursor: at(START, 75),
  window: sessionWindow,
}

const row: ActivityStripFixture = {
  ...defaultFixture,
  name: 'Row',
  size: 'md',
  length: 160,
  cursor: null,
}

const minimap: ActivityStripFixture = {
  ...defaultFixture,
  name: 'Minimap',
  size: 'sm',
  orientation: 'vertical',
  length: 480,
}

export const midnightFixture: ActivityStripFixture = {
  name: 'Midnight',
  buckets: run(
    LATE,
    Array.from({ length: 45 }, (_, i) => 1 + (i % 4))
  ),
  domain: { start: LATE, end: at(LATE, 45) },
  length: 180,
}

const empty: ActivityStripFixture = {
  name: 'Empty',
  buckets: [],
  domain: defaultDomain,
  length: 160,
}

const oneItem: ActivityStripFixture = {
  name: 'One item',
  buckets: [{ start: at(START, 30), count: 3 }],
  domain: { start: START, end: at(START, 60) },
  length: 160,
}

const allEqual: ActivityStripFixture = {
  name: 'All equal',
  buckets: run(START, Array(40).fill(3)),
  domain: { start: START, end: at(START, 40) },
  length: 160,
}

const spike: ActivityStripFixture = {
  name: 'Spike',
  buckets: run(START, [...Array(30).fill(1), 400, ...Array(29).fill(1)]),
  domain: { start: START, end: at(START, 60) },
  length: 30,
}

const missingValues: ActivityStripFixture = {
  name: 'Missing values',
  buckets: run(START, [2, null, 5, Number.NaN, 0, 7, null, 1]),
  domain: { start: START, end: at(START, 8) },
  length: 80,
}

const sharedCeiling: ActivityStripFixture = {
  name: 'Shared ceiling',
  buckets: run(START, [1, 2, 4, 3, 2, 1]),
  compare: run(START, [2, 8, 20, 12, 6, 3]),
  domain: { start: START, end: at(START, 6) },
  maxCount: 20,
  length: 120,
}

const THREE_DAYS = 4320
export const veryLargeFixture: ActivityStripFixture = (() => {
  const random = seededRandom(4320)
  return {
    name: 'Very large',
    buckets: run(
      START,
      Array.from({ length: THREE_DAYS }, () => Math.floor(random() * 10))
    ),
    domain: { start: START, end: at(START, THREE_DAYS) },
    length: 600,
  }
})()

const onlyGaps: ActivityStripFixture = {
  name: 'Only gaps',
  buckets: [],
  gaps: [{ start: at(START, 10), end: at(START, 55), label: '45 minutes idle' }],
  domain: { start: START, end: at(START, 60) },
  length: 160,
}

/** Option sets that the hostile data must survive, each with its own bucketMs, domain and length. */
export const hostileOptionSets: Pick<
  ActivityStripFixture,
  'bucketMs' | 'domain' | 'length' | 'cursor'
>[] = [
  { bucketMs: 0, length: 100 },
  { bucketMs: -MINUTE, length: 100 },
  { bucketMs: Number.NaN, length: 100 },
  { domain: { start: at(START, 10), end: at(START, 10) }, length: 100 },
  { domain: { start: at(START, 10), end: at(START, 5) }, length: 100 },
  { length: 0 },
  { length: Number.NaN },
  { length: -50 },
  { length: 100, cursor: at(START, 9_999) },
]

export const hostileFixture: ActivityStripFixture = {
  name: 'Hostile',
  buckets: [
    { start: at(START, 9), count: 4 },
    { start: at(START, 3), count: 2 },
    { start: at(START, 3), count: 5 },
    { start: at(START, 4), count: -7 },
    { start: at(START, 5), count: Number.POSITIVE_INFINITY },
    { start: Number.NaN, count: 3 },
    { start: at(START, -500), count: 9 },
    { start: at(START, 9_000), count: 9 },
  ],
  gaps: [
    { start: at(START, 20), end: at(START, 10), label: 'inverted' },
    { start: at(START, 12), end: at(START, 18) },
    { start: at(START, 15), end: at(START, 25) },
    { start: at(START, -50), end: at(START, 2) },
    { start: at(START, 5), end: at(START, 6), label: 'x'.repeat(200) },
  ],
  domain: { start: START, end: at(START, 30) },
  length: 100,
  cursor: at(START, 9_999),
}

export const activityStripFixtures: ActivityStripFixture[] = [
  defaultFixture,
  row,
  minimap,
  midnightFixture,
  empty,
  oneItem,
  allEqual,
  spike,
  missingValues,
  sharedCeiling,
  veryLargeFixture,
  onlyGaps,
  hostileFixture,
]
