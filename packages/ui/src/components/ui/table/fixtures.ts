// Fixtures for the Table family (TD-33). Real rows are the 60 check findings recorded from titan-design
// at 028e30b1 (public, on main): only the row fields are kept, compacted to [rule, path, value,
// threshold] and expanded by `realRow`. Every other row is synthetic and its fixture says so in `label`.
// Not exported from any barrel.
import { seededRandom } from '../charts/kit/seededRandom'

export type Severity = 'error' | 'warning' | 'info'
export type FindingStatus = 'new' | 'carryover' | 'worsened' | 'improved' | 'resolved'

export interface FindingRow {
  id: string
  rule: string
  tool: string
  severity: Severity
  node: { id: string; kind: 'file' | 'function'; name: string; path: string }
  destination?: string
  excess: number | null
  message: string
  provenance: { kind: 'derived'; source: string }
  metric?: string
  value?: number
  threshold?: number
  status?: FindingStatus
}

/** Field, then value, then the number of rows over the whole source (not only the loaded rows). */
export type Facets = Record<string, Record<string, number>>

export interface TableFixture {
  name: string
  label: string
  source: 'real' | 'synthetic' | 'mixed'
  hostile: boolean
  /** Rows in the unfiltered source. Larger than `rows.length` only when `loaded` is a window. */
  total: number
  rows: FindingRow[]
  facets: Facets
  loaded?: { start: number; end: number }
  filters?: Record<string, readonly string[]>
  /** A filter field the source cannot answer, with the reason the filter bar shows. */
  unavailable?: Record<string, string>
  /** Successive `rowCount` values, for a count that changes under the table. */
  rowCountSequence?: number[]
}

const FILE_LOC = 'max-file-loc'
const CYCLOMATIC = 'max-cyclomatic-per-function'
const NESTING = 'max-nesting-depth'
const LAYERS = 'package-layers'

const L = FILE_LOC
const C = CYCLOMATIC

const METRIC: Record<string, string> = {
  [FILE_LOC]: 'loc',
  [CYCLOMATIC]: 'cyclomatic_max',
  [NESTING]: 'nesting_max',
}

type RealTuple = readonly [rule: string, path: string, value: number, threshold: number]

const realTuples: readonly RealTuple[] = [
  [L, 'packages/ui/src/lab/active-work/data/session-signals.ts', 22651, 350],
  [L, 'packages/ui/src/lab/active-work/data/file-metrics.ts', 3954, 350],
  [L, 'packages/ui/src/lab/active-work/data/aw-data.ts', 3259, 350],
  [L, 'packages/ui/src/lab/archive/RepBreakdown.exploration.stories.tsx', 1817, 350],
  [L, 'packages/ui/src/components/custom/Workout/VelocityStrip.tsx', 1503, 350],
  [L, 'packages/ui/src/lab/north-star/fatigue-lab-shared.tsx', 1362, 350],
  [L, 'packages/ui/src/lab/archive/CurvesSetLevel.exploration.stories.tsx', 1266, 350],
  [L, 'packages/ui/specimen/comparison.tsx', 1216, 350],
  [L, 'packages/ui/src/lab/surface/surface-lab-shared.tsx', 1039, 350],
  [L, 'packages/ui/src/lab/archive/CurvesPerRep.exploration.stories.tsx', 988, 350],
  [L, 'packages/ui/src/theme/ColorPalettes.stories.tsx', 938, 350],
  [L, 'packages/ui/src/arch/Architecture.stories.tsx', 840, 350],
  [L, 'packages/ui/src/lab/north-star/HeroTempo.exploration.stories.tsx', 826, 350],
  [L, 'packages/ui/src/components/custom/Workout/GoalTrajectoryChartGeometry.ts', 744, 350],
  [L, 'packages/ui/src/lab/specimens/SessionRailSpecimen.stories.tsx', 724, 350],
  [L, 'packages/ui/src/lab/north-star/VelocityDiverging.exploration.stories.tsx', 703, 350],
  [L, 'packages/ui/src/theme/tokens/semantic.ts', 672, 350],
  [L, 'packages/ui/src/components/custom/charts/SetBarChart.tsx', 663, 350],
  [L, 'packages/ui/src/lab/archive/GrindingLine.exploration.stories.tsx', 642, 350],
  [L, 'packages/ui/src/components/custom/Workout/VolumeStatusPalette.stories.tsx', 641, 350],
  [L, 'packages/ui/src/stories/Spacing.stories.tsx', 634, 350],
  [L, 'packages/ui/src/components/custom/charts/DatavizLightPalette.stories.tsx', 633, 350],
  [L, 'packages/ui/src/components/custom/Workout/GoalCard.tsx', 631, 350],
  [L, 'packages/ui/src/theme/DepthCalibration.stories.tsx', 626, 350],
  [C, 'packages/ui/src/components/custom/Workout/VelocityStrip.tsx', 53, 30],
  [L, 'packages/ui/src/components/custom/Workout/BodyMapDetailPanel.tsx', 603, 350],
  [L, 'packages/ui/src/components/custom/Workout/ExerciseDetailPage.tsx', 603, 350],
  [L, 'packages/ui/src/components/custom/Workout/GoalTrajectoryPlot.tsx', 598, 350],
  [L, 'packages/ui/src/theme/tokens/primitives.ts', 596, 350],
  [L, 'packages/ui/src/components/custom/Workout/StrengthTrendChart.tsx', 592, 350],
  [L, 'packages/ui/src/components/custom/Table/Table.stories.tsx', 533, 350],
  [L, 'packages/ui/src/components/custom/Workout/CapacityBandChart.tsx', 486, 350],
  [L, 'packages/ui/src/stories/PresetShowcase.stories.tsx', 472, 350],
  [L, 'packages/ui/src/lab/north-star/DualGhostLine.exploration.stories.tsx', 463, 350],
  [L, 'packages/ui/src/components/shell/workout/PinnedLiveStrip.tsx', 453, 350],
  [L, 'packages/ui/src/components/custom/Workout/MesoStatusCard.tsx', 450, 350],
  [C, 'packages/ui/src/components/ui/autocomplete/Autocomplete.tsx', 38, 30],
  [L, 'packages/ui/src/components/custom/Workout/TempoDisplay.tsx', 429, 350],
  [L, 'packages/ui/src/theme/config.ts', 416, 350],
  [L, 'packages/ui/src/components/custom/Workout/ActiveWorkoutPage.tsx', 412, 350],
  [L, 'packages/ui/src/components/ui/toolbar-button/ToolbarButton.stories.tsx', 412, 350],
  [L, 'packages/ui/src/components/ui/card/Card.stories.tsx', 410, 350],
  [C, 'packages/ui/src/components/custom/charts/SetBarChart.tsx', 35, 30],
  [L, 'packages/ui/src/lab/north-star/SessionRailLockup.exploration.stories.tsx', 404, 350],
  [L, 'packages/ui/src/components/custom/Workout/velocity-story-kit.tsx', 402, 350],
  [L, 'packages/ui/src/lab/audits/RowInventory.stories.tsx', 395, 350],
  [L, 'packages/ui/src/components/custom/Workout/ProgramPlanningPage.tsx', 388, 350],
  [L, 'packages/ui/src/lab/north-star/LiveView.tsx', 385, 350],
  [L, 'packages/ui/src/theme/ProposedTokensVW82.stories.tsx', 381, 350],
  [L, 'packages/ui/src/components/custom/Workout/GoalTrajectoryChart.stories.tsx', 378, 350],
  [L, 'packages/ui/src/components/custom/Workout/GoalTrajectoryChart.tsx', 372, 350],
  [L, 'packages/ui/src/components/custom/charts/DatavizLightPalette.candidates.ts', 370, 350],
  [L, 'packages/ui/src/components/ui/surface/Surface.stories.tsx', 370, 350],
  [L, 'packages/ui/src/components/custom/Workout/ZoneTrack.tsx', 369, 350],
  [L, 'packages/ui/specimen/htmlGroundTruth.tsx', 368, 350],
  [L, 'packages/ui/src/components/custom/Workout/BodyMap.tsx', 360, 350],
  [L, 'packages/ui/src/theme/Depth.stories.tsx', 360, 350],
  [L, 'packages/ui/src/components/custom/Workout/GoalMilestoneSummary.tsx', 358, 350],
  [L, 'packages/ui/src/components/custom/Workout/setHeadingKit.tsx', 352, 350],
  [L, 'packages/ui/src/components/ui/progress/Progress.tsx', 351, 350],
]

const basename = (path: string): string => path.slice(path.lastIndexOf('/') + 1)

function measuredRow(
  rule: string,
  node: FindingRow['node'],
  value: number,
  threshold: number,
  severity: Severity = 'error'
): FindingRow {
  const metric = METRIC[rule]
  return {
    id: `${rule}|${node.id}`,
    rule,
    tool: 'check',
    severity,
    node,
    excess: value / threshold,
    message: `${metric}=${value} > ${threshold}`,
    provenance: { kind: 'derived', source: `check/${rule}` },
    metric,
    value,
    threshold,
  }
}

const fileNode = (path: string): FindingRow['node'] => ({
  id: path,
  kind: 'file',
  name: basename(path),
  path,
})

const realRow = ([rule, path, value, threshold]: RealTuple): FindingRow =>
  measuredRow(rule, fileNode(path), value, threshold)

const realRows: FindingRow[] = realTuples.map(realRow)
const realPaths: string[] = [...new Set(realTuples.map(([, path]) => path))]

function layersRow(node: FindingRow['node'], destination: string, severity: Severity): FindingRow {
  return {
    id: `${LAYERS}|${node.id}|${destination}`,
    rule: LAYERS,
    tool: 'check',
    severity,
    node,
    destination,
    excess: null,
    message: `imports ${destination} from a lower layer`,
    provenance: { kind: 'derived', source: `check/${LAYERS}` },
  }
}

const topSegment = (path: string): string => `${path.slice(0, path.indexOf('/'))}/`

const FACET_FIELDS: Record<string, (row: FindingRow) => string | undefined> = {
  rule: (row) => row.rule,
  severity: (row) => row.severity,
  tool: (row) => row.tool,
  provenance: (row) => row.provenance.kind,
  kind: (row) => row.node.kind,
  child: (row) => topSegment(row.node.path),
  status: (row) => row.status,
}

/** Counts every facet field over `rows`; a field no row carries is left out. */
export function countFacets(rows: readonly FindingRow[]): Facets {
  const facets: Facets = {}
  for (const row of rows) {
    for (const [field, read] of Object.entries(FACET_FIELDS)) {
      const value = read(row)
      if (value === undefined) continue
      const counts = (facets[field] ??= {})
      counts[value] = (counts[value] ?? 0) + 1
    }
  }
  return facets
}

const SYNTHETIC_RULES = [FILE_LOC, CYCLOMATIC, NESTING, LAYERS] as const
const SEVERITIES: readonly Severity[] = ['error', 'warning', 'info']
const THRESHOLD: Record<string, number> = { [FILE_LOC]: 350, [CYCLOMATIC]: 30, [NESTING]: 4 }

const pick = <T>(items: readonly T[], random: () => number): T =>
  items[Math.floor(random() * items.length)]

/** Synthetic findings on real paths: row `i` is symbol `i / n` of distinct path `i % n`, so ids never repeat. */
export function buildSyntheticFindings(count: number, seed = 33): FindingRow[] {
  const random = seededRandom(seed)
  return Array.from({ length: count }, (_, i) => {
    const path = realPaths[i % realPaths.length]
    const name = `sym-${Math.floor(i / realPaths.length)}`
    const node: FindingRow['node'] = { id: `${path}#${name}`, kind: 'function', name, path }
    const rule = pick(SYNTHETIC_RULES, random)
    const severity = pick(SEVERITIES, random)
    if (rule === LAYERS) return layersRow(node, realPaths[(i + 7) % realPaths.length], severity)
    const threshold = THRESHOLD[rule]
    const value = threshold + 1 + Math.floor(random() * threshold * 3)
    return measuredRow(rule, node, value, threshold, severity)
  })
}

const REAL_LABEL = 'titan-design @ 028e30b1, 60 check findings (real)'

function fixtureOf(
  name: string,
  label: string,
  source: TableFixture['source'],
  rows: FindingRow[],
  extra: Partial<TableFixture> = {}
): TableFixture {
  return {
    name,
    label,
    source,
    hostile: false,
    total: rows.length,
    rows,
    facets: countFacets(rows),
    ...extra,
  }
}

/** The 60 real rows. Facets are the recorded facet answer, copied literally rather than recounted. */
export const defaultFixture: TableFixture = fixtureOf('Default', REAL_LABEL, 'real', realRows, {
  facets: {
    rule: { [C]: 3, [L]: 57 },
    severity: { error: 60 },
    tool: { check: 60 },
    provenance: { derived: 60 },
    kind: { file: 60 },
    child: { 'packages/': 60 },
  },
})

const STATUSES: readonly FindingStatus[] = ['new', 'carryover', 'worsened', 'improved', 'resolved']
const baselineRows: FindingRow[] = realRows
  .slice(0, 10)
  .map((row, i) => ({ ...row, status: STATUSES[i % STATUSES.length] }))

const nullCellRows: FindingRow[] = [
  realRows[0],
  realRows[1],
  layersRow(
    {
      id: `${realPaths[4]}#VelocityStrip`,
      kind: 'function',
      name: 'VelocityStrip',
      path: realPaths[4],
    },
    realPaths[2],
    'warning'
  ),
]

const longContentPath = 'packages/ui/src/components/custom/charts/DatavizLightPalette.candidates.ts'
const longMessage =
  'loc=370 > 350. Synthetic long message: this text exists to exercise truncation in a single-line cell ' +
  'and in the tooltip that reveals it, so it runs well past any column width a table would give to it.'

const veryLarge: TableFixture = fixtureOf(
  'Very large',
  '10,000 synthetic findings on real titan-design paths (synthetic)',
  'synthetic',
  buildSyntheticFindings(10000)
)

const hostileRows: FindingRow[] = [
  realRows[0],
  { ...realRows[1], id: realRows[0].id },
  { ...realRows[2], excess: Number.NaN },
  { ...realRows[3], excess: Number.POSITIVE_INFINITY },
]

/** Malformed input a consumer can send; the Table must render it without throwing. */
export const hostileFixture: TableFixture = {
  name: 'Hostile',
  label: 'Duplicate ids, impossible facets and non-finite excess (synthetic)',
  source: 'synthetic',
  hostile: true,
  total: hostileRows.length,
  rows: hostileRows,
  facets: {
    rule: { [L]: 4, [NESTING]: 0, 'rule-with-no-rows': 2 },
    severity: { error: 4 },
  },
  filters: { severity: ['severity-not-in-facets'] },
  rowCountSequence: [10000, 120],
}

export const tableFixtures: TableFixture[] = [
  defaultFixture,
  fixtureOf('One item', 'titan-design @ 028e30b1, one file in scope (real)', 'real', [realRows[0]]),
  fixtureOf('Empty', 'A repository with no findings (real)', 'real', []),
  fixtureOf('Filtered empty', `${REAL_LABEL}, filtered to severity info`, 'real', realRows, {
    facets: defaultFixture.facets,
    filters: { severity: ['info'] },
  }),
  fixtureOf(
    'Null cells',
    'Two real rows and a synthetic layer finding with no measure',
    'mixed',
    nullCellRows
  ),
  fixtureOf('Missing baseline', `${REAL_LABEL}, no baseline to compare`, 'real', realRows, {
    facets: defaultFixture.facets,
    unavailable: { status: 'Needs a recorded baseline snapshot' },
  }),
  fixtureOf('Baseline', 'Ten real rows with synthetic baseline statuses', 'mixed', baselineRows),
  veryLarge,
  {
    ...veryLarge,
    name: 'Sparse window',
    label: 'Rows 0 to 499 of the 10,000 synthetic findings, the rest not yet loaded (synthetic)',
    rows: veryLarge.rows.slice(0, 500),
    loaded: { start: 0, end: 500 },
  },
  fixtureOf(
    'Long content',
    'A real 74-character path with a synthetic 200-character message',
    'mixed',
    realRows
      .filter((row) => row.node.path === longContentPath)
      .map((row) => ({ ...row, message: longMessage }))
  ),
  hostileFixture,
]
