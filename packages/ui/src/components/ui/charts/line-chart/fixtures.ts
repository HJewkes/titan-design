// Fixtures for LineChart (TD-34). Real values come from a public 17-snapshot code-metric history:
// three nodes, 51 answers per metric, 10 of them gaps. Only the numbers and timestamps are kept; the
// nodes are relabelled Total, Package A and Package B. Every other fixture is synthetic or derived and
// says so in `note`. Not exported from any barrel.
import { seededRandom } from '../kit/seededRandom'

export interface FixturePoint {
  id: string
  x: number | Date
  y: number | null
  missing?: string
  segmentKey?: string
}

export interface FixtureSeries {
  id: string
  label: string
  points: FixturePoint[]
  stroke?: 'solid' | 'dashed'
}

export interface LineFixture {
  name: string
  provenance: 'real' | 'derived' | 'synthetic'
  note: string
  hostile: boolean
  xScale: 'time' | 'linear'
  series: FixtureSeries[]
  metricLabel: string
  unit?: string
  includeZero?: boolean
  referenceLines?: { y: number; label: string }[]
  boundaries?: { x: number | Date; label?: string }[]
}

type Run = readonly [value: number | null, count: number]
type RealMetric = 'loc' | 'cognitive_sum' | 'function_count'

const expand = (runs: readonly Run[]): (number | null)[] =>
  runs.flatMap(([value, count]) => Array<number | null>(count).fill(value))

/** Snapshot instants 1 to 17. Several snapshots share an instant; that is real, not hostile. */
const snapshotTimes: Date[] = expand([
  [Date.parse('2026-09-08T10:40:56-07:00'), 3],
  [Date.parse('2026-09-08T19:35:23-07:00'), 1],
  [Date.parse('2026-09-10T08:44:58-07:00'), 1],
  [Date.parse('2026-09-11T05:12:17-06:00'), 3],
  [Date.parse('2026-09-12T14:56:48-06:00'), 2],
  [Date.parse('2026-09-18T10:57:53-06:00'), 1],
  [Date.parse('2026-09-18T17:17:38-06:00'), 5],
  [Date.parse('2026-09-19T05:21:29-06:00'), 1],
]).map((ms) => new Date(ms as number))

const NOT_IN_SNAPSHOT = 'not-in-snapshot'

const realValues: Record<
  RealMetric,
  Record<'total' | 'package-a' | 'package-b', readonly Run[]>
> = {
  loc: {
    total: [
      [14551, 3],
      [15405, 1],
      [17707, 1],
      [18103, 3],
      [28602, 2],
      [34371, 1],
      [53661, 5],
      [60490, 1],
    ],
    'package-a': [
      [4522, 11],
      [11663, 5],
      [12312, 1],
    ],
    'package-b': [
      [null, 10],
      [2382, 1],
      [2699, 6],
    ],
  },
  cognitive_sum: {
    total: [
      [1698, 3],
      [1768, 1],
      [1912, 1],
      [1944, 3],
      [3311, 2],
      [3791, 1],
      [5511, 5],
      [6214, 1],
    ],
    'package-a': [
      [745, 11],
      [1452, 5],
      [1466, 1],
    ],
    'package-b': [
      [null, 10],
      [126, 1],
      [138, 6],
    ],
  },
  function_count: {
    total: [
      [770, 3],
      [822, 1],
      [938, 1],
      [953, 3],
      [1530, 2],
      [1749, 1],
      [2482, 5],
      [2835, 1],
    ],
    'package-a': [
      [247, 11],
      [488, 5],
      [508, 1],
    ],
    'package-b': [
      [null, 10],
      [86, 1],
      [102, 6],
    ],
  },
}

const realLabels = { total: 'Total', 'package-a': 'Package A', 'package-b': 'Package B' } as const

const metricLabels: Record<RealMetric, string> = {
  loc: 'Lines of code',
  cognitive_sum: 'Cognitive complexity (sum)',
  function_count: 'Function count',
}

/** Points on the real snapshot instants, ids `${seriesId}@${snapshot}` with snapshots from 1. */
function onSnapshots(seriesId: string, values: (number | null)[]): FixturePoint[] {
  return values.map((y, i) => ({
    id: `${seriesId}@${i + 1}`,
    x: snapshotTimes[i],
    y,
    ...(y === null ? { missing: NOT_IN_SNAPSHOT } : {}),
  }))
}

function realSeries(metric: RealMetric, node: keyof typeof realLabels): FixtureSeries {
  return {
    id: node,
    label: realLabels[node],
    points: onSnapshots(node, expand(realValues[metric][node])),
  }
}

/** Keeps the points of snapshots `first` to `last`, inclusive and counted from 1. */
const snapshotsOf = (series: FixtureSeries, first: number, last: number): FixtureSeries => ({
  ...series,
  points: series.points.slice(first - 1, last),
})

function realTimeline(metric: RealMetric): LineFixture {
  return {
    name: 'Real history',
    provenance: 'real',
    note: 'Real values for three relabelled nodes; the first 10 Package B snapshots predate it.',
    hostile: false,
    xScale: 'time',
    metricLabel: metricLabels[metric],
    series: [
      realSeries(metric, 'total'),
      realSeries(metric, 'package-a'),
      realSeries(metric, 'package-b'),
    ],
  }
}

export const realTimelines: Record<RealMetric, LineFixture> = {
  loc: realTimeline('loc'),
  cognitive_sum: realTimeline('cognitive_sum'),
  function_count: realTimeline('function_count'),
}

const totalLoc = realSeries('loc', 'total')
const packageALoc = realSeries('loc', 'package-a')

const base = { hostile: false, xScale: 'time', metricLabel: metricLabels.loc } as const

/** A bounded random walk from `start`, rounded to integers. */
function walk(length: number, seed: number, start: number, step: number): number[] {
  const random = seededRandom(seed)
  let value = start
  return Array.from({ length }, () => {
    value = Math.max(0, Math.round(value + (random() - 0.5) * step))
    return value
  })
}

const pad = (n: number): string => String(n).padStart(2, '0')

function manySeries(): FixtureSeries[] {
  return Array.from({ length: 18 }, (_, i) => {
    const id = `pkg-${pad(i + 1)}`
    return { id, label: id, points: onSnapshots(id, walk(17, 101 + i, 400 + i * 150, 120)) }
  })
}

const SPIKE_X = 1234

function veryLargeSeries(): FixtureSeries {
  const values = walk(2000, 7, 500, 40)
  values[SPIKE_X] = Math.max(...values) + 250
  return {
    id: 'signal',
    label: 'Signal',
    points: values.map((y, x) => ({ id: `signal@${x}`, x, y })),
  }
}

function indexChangeSeries(): FixtureSeries {
  return {
    ...totalLoc,
    points: totalLoc.points.map((p, i) => ({ ...p, segmentKey: i < 8 ? '0.14.0' : '0.15.0' })),
  }
}

function gapsSeries(): FixtureSeries {
  const series = realSeries('loc', 'package-b')
  return {
    ...series,
    points: series.points.map((p, i) =>
      i === 13 ? { ...p, y: null, missing: 'not-measured' } : p
    ),
  }
}

const hostileSeries: FixtureSeries[] = [
  {
    id: 'a',
    label: 'Unsorted',
    points: [
      { id: 'a@0', x: 5, y: 12 },
      { id: 'a@1', x: 2, y: Number.NaN },
      { id: 'a@2', x: 2, y: -40 },
      { id: 'a@3', x: 9, y: Number.POSITIVE_INFINITY },
      { id: 'a@4', x: 1, y: Number.NEGATIVE_INFINITY },
      { id: 'a@5', x: 5, y: null },
      { id: 'a@6', x: 7, y: -3 },
    ],
  },
  { id: 'b', label: 'No points', points: [] },
  {
    id: 'c',
    label: 'A series label that runs on to forty chars',
    points: [
      { id: 'c@0', x: 1, y: 3 },
      { id: 'c@1', x: 4, y: 8 },
    ],
  },
]

const nanSeries: FixtureSeries[] = [
  {
    id: 'a',
    label: 'One NaN',
    points: [4, 6, Number.NaN, 5, 7].map((y, x) => ({ id: `a@${x}`, x, y })),
  },
  {
    id: 'b',
    label: 'All NaN',
    points: [0, 1, 2].map((x) => ({ id: `b@${x}`, x, y: Number.NaN })),
  },
]

export const lineFixtures: LineFixture[] = [
  { ...base, name: 'Empty', provenance: 'synthetic', note: 'No series.', series: [] },
  {
    ...base,
    name: 'One point',
    provenance: 'real',
    note: 'Total, last snapshot only.',
    series: [snapshotsOf(totalLoc, 17, 17)],
  },
  {
    ...base,
    name: 'Two points',
    provenance: 'real',
    note: 'Total, last two snapshots.',
    series: [snapshotsOf(totalLoc, 16, 17)],
  },
  {
    ...base,
    name: 'Flat',
    provenance: 'real',
    note: 'Package A maximum cognitive complexity, constant over snapshots 1 to 11.',
    metricLabel: 'Cognitive complexity (max)',
    series: [
      {
        id: 'package-a',
        label: realLabels['package-a'],
        points: onSnapshots('package-a', expand([[40, 11]])),
      },
    ],
  },
  {
    ...base,
    name: 'All-equal',
    provenance: 'synthetic',
    note: 'Three series of zeros on the real instants: the flat case a percentage pad cannot widen.',
    series: ['x', 'y', 'z'].map((id) => ({
      id,
      label: `Series ${id}`,
      points: onSnapshots(id, expand([[0, 17]])),
    })),
  },
  {
    ...base,
    name: 'Default',
    provenance: 'derived',
    note: 'Real Package A values; the Budget reference line at 10,000 is synthetic.',
    series: [packageALoc],
    referenceLines: [{ y: 10000, label: 'Budget' }],
  },
  {
    ...base,
    name: 'Missing baseline',
    provenance: 'real',
    note: 'Default without the reference line.',
    series: [packageALoc],
  },
  {
    ...base,
    name: 'Clustered time',
    provenance: 'real',
    note: '17 snapshots on 8 distinct instants.',
    series: [totalLoc],
  },
  {
    ...base,
    name: 'Gaps',
    provenance: 'derived',
    note: 'Real Package B values with 10 leading gaps; the inner gap at snapshot 14 is synthetic.',
    series: [gapsSeries()],
  },
  {
    ...base,
    name: 'Index change',
    provenance: 'synthetic',
    note: 'Real Total values with an invented index change at snapshot 9.',
    series: [indexChangeSeries()],
    boundaries: [{ x: snapshotTimes[8], label: 'Index 0.15.0' }],
  },
  {
    ...base,
    name: 'Many series',
    provenance: 'synthetic',
    note: '18 seeded walks with invented names.',
    series: manySeries(),
  },
  {
    ...base,
    name: 'Very large',
    provenance: 'synthetic',
    note: 'One seeded walk of 2,000 points with a single spike at x 1,234.',
    xScale: 'linear',
    metricLabel: 'Signal',
    series: [veryLargeSeries()],
  },
  {
    name: 'Hostile',
    provenance: 'synthetic',
    note: 'Unsorted and duplicate x, non-finite and negative y, an empty series and a long label.',
    hostile: true,
    xScale: 'linear',
    metricLabel: 'Hostile',
    includeZero: true,
    series: hostileSeries,
  },
  {
    name: 'NaN',
    provenance: 'synthetic',
    note: 'One NaN inside a finite series, and a series that is all NaN.',
    hostile: true,
    xScale: 'linear',
    metricLabel: 'NaN',
    series: nanSeries,
  },
  realTimelines.loc,
]

export function byName(name: string): LineFixture {
  const fixture = lineFixtures.find((f) => f.name === name)
  if (!fixture) throw new Error(`missing fixture ${name}`)
  return fixture
}
