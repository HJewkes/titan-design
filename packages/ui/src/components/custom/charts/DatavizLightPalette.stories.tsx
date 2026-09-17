// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text, View } from 'react-native'
import {
  Surface,
  surfaceBackground,
  useOnSurfaceColor,
  useSurface,
  type OnSurfaceRole,
} from '../../ui/surface'
import { Pill } from '../../ui/pill'
import { Typography, type TypographyVariant } from '../Typography'
import { Treemap, type TreemapDatum } from '../Treemap'
import { MuscleGroupChip } from '../Workout/MuscleGroupChip'
import type { VolumeStatus } from '../Workout/muscleTaxonomy'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { bestTextColor, primitiveColors } from '../../../theme/tokens/primitives'
import { formatTrimmedDecimal } from '../../../utils/number-format'
import {
  LIGHT_CANDIDATE_SETS,
  SEQUENTIAL_HEAD_VARIANTS,
  type CandidateSet,
  type DatavizKey,
  type DatavizPalette,
  type LightCandidate,
} from './DatavizLightPalette.candidates'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/** One column of the comparison: a theme, and the values painted under it. */
interface Column {
  id: string
  title: string
  note: string
  theme: ThemeMode
  /** Absent for shipped columns, which render the real token-reading components. */
  set?: CandidateSet
}

const CURRENT_COLUMNS: Column[] = [
  {
    id: 'dark-current',
    title: 'DARK · current',
    note: 'what ships today on dark; the reference the light column must match in meaning',
    theme: 'dark',
  },
  {
    id: 'light-current',
    title: 'LIGHT · current (phase 1)',
    note: 'same values as dark, by design of phase 1',
    theme: 'light',
  },
]

function toColumns(sets: CandidateSet[]): Column[] {
  return sets.map((set) => ({
    id: `light-proposed-${set.id}`,
    title: `LIGHT · PROPOSED ${set.title}`,
    note: set.rationale,
    theme: 'light',
    set,
  }))
}

const proposedColumns = (palette: DatavizPalette) => toColumns(LIGHT_CANDIDATE_SETS[palette])

/** A forced white label wins; otherwise black or white, whichever contrasts more. */
const labelOn = (fill: string, whiteLabels?: boolean) =>
  whiteLabels ? primitiveColors.white : bestTextColor(fill)

const paletteKeys = (palette: DatavizPalette): DatavizKey[] =>
  LIGHT_CANDIDATE_SETS[palette][0].steps.map((c) => c.key)

function columnValues(column: Column, palette: DatavizPalette): string[] {
  if (column.set) return column.set.steps.map((c) => c.value)
  const tokens = getSemanticColors(column.theme)
  return paletteKeys(palette).map((key) => tokens[key as ColorToken])
}

// ---------------------------------------------------------------------------
// Measurement — the dataviz skill's metric: Machado-2009 CVD, OKLab ΔE×100
// ---------------------------------------------------------------------------

const hexToRgb = (hex: string): number[] =>
  [0, 2, 4].map((i) => parseInt(hex.replace('#', '').slice(i, i + 2), 16) / 255)
const linearise = (c: number) => (c >= 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92)
const clamp01 = (c: number) => Math.min(1, Math.max(0, c))

function toOklab([r, g, b]: number[]): number[] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

const mul = (M: number[], v: number[]) =>
  [0, 3, 6].map((row) => clamp01(M[row] * v[0] + M[row + 1] * v[1] + M[row + 2] * v[2]))
const DEUT = [
  0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881,
]
const PROT = [
  0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998,
]
const oklabDistance = (a: number[], b: number[]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100

const lightness = (hex: string) => toOklab(hexToRgb(hex).map(linearise))[0]

const chroma = (hex: string) => {
  const [, a, b] = toOklab(hexToRgb(hex).map(linearise))
  return Math.hypot(a, b)
}

/** Worst-case perceived ΔE across deuteranopia and protanopia. */
function cvdDelta(x: string, y: string): number {
  const sim = (M: number[], hex: string) => toOklab(mul(M, hexToRgb(hex).map(linearise)))
  return Math.min(...[DEUT, PROT].map((M) => oklabDistance(sim(M, x), sim(M, y))))
}

const relativeLuminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map(linearise)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((p, q) => q - p)
  return (hi + 0.05) / (lo + 0.05)
}

/** The planes a chart can sit on in `mode`; rules are checked against the worst of them. */
const chartPlanes = (mode: ThemeMode) => {
  const tokens = getSemanticColors(mode)
  return [tokens['surface-base'], tokens['surface-elevated'], tokens['surface-raised']]
}

const worstPlaneContrast = (hex: string, mode: ThemeMode) =>
  Math.min(...chartPlanes(mode).map((plane) => contrastRatio(hex, plane)))

function minPairDelta(values: string[], allPairs: boolean): number {
  let min = Infinity
  values.forEach((a, i) =>
    values.slice(i + 1).forEach((b, k) => {
      if (allPairs || k === 0) min = Math.min(min, cvdDelta(a, b))
    })
  )
  return min
}

const fmt1 = (n: number) => formatTrimmedDecimal(n, 1)
const fmt2 = (n: number) => formatTrimmedDecimal(n, 2)

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const SWATCH_WIDTH = 88
const DOT_SIZE = 6

/** The plane the nearest Surface paints, so contrast is measured against what is on screen. */
function usePlane(): { plane: string; mode: ThemeMode } {
  const { mode, level } = useSurface()
  return { plane: surfaceBackground(level, mode), mode }
}

/**
 * Text inked from the nearest Surface rather than the page theme, so a dark
 * column stays legible when the Storybook global is light, and vice versa.
 */
function Ink({
  variant,
  role,
  children,
}: {
  variant: TypographyVariant
  role: OnSurfaceRole
  children: React.ReactNode
}) {
  return (
    <Typography variant={variant} color="inherit" style={{ color: useOnSurfaceColor(role) }}>
      {children}
    </Typography>
  )
}

function Swatch({
  value,
  index,
  candidate,
  whiteLabels,
}: {
  value: string
  index: number
  candidate?: LightCandidate
  whiteLabels?: boolean
}) {
  const { plane } = usePlane()
  return (
    <View style={{ width: SWATCH_WIDTH, gap: 2 }} testID={`swatch-${index}`}>
      <View
        style={{
          height: 36,
          borderRadius: 6,
          backgroundColor: value,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: labelOn(value, whiteLabels), fontSize: 12, fontWeight: '600' }}>
          {index}
        </Text>
      </View>
      <Ink variant="mono" role="secondary">
        {value.toUpperCase()}
      </Ink>
      {candidate ? (
        <Ink variant="mono" role="tertiary">
          {candidate.step}
        </Ink>
      ) : null}
      <Ink variant="mono" role="tertiary">
        {`${fmt2(contrastRatio(value, plane))}:1`}
      </Ink>
    </View>
  )
}

function SwatchRow({ values, set }: { values: string[]; set?: CandidateSet }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {values.map((value, i) => (
        <Swatch
          key={i}
          value={value}
          index={i}
          candidate={set?.steps[i]}
          whiteLabels={set?.whiteLabels}
        />
      ))}
    </View>
  )
}

/** Smallest ΔL at which the centre reads lighter than its arms; one ramp step is ~0.08. */
const CENTRE_LEAD_MIN = 0.03

/** Palette-specific structure checks: centre, monotony, first-three separation. */
function paletteChecks(values: string[], palette: DatavizPalette): string[] {
  const ls = values.map(lightness)
  const lines: string[] = []
  if (palette === 'diverging') {
    const lead = ls[2] - Math.max(...ls.filter((_, i) => i !== 2))
    lines.push(`min all-pairs CVD ΔE ${fmt1(minPairDelta(values, true))}`)
    lines.push(
      `centre leads the arms by ΔL ${formatTrimmedDecimal(lead, 3)}: ${lead >= CENTRE_LEAD_MIN ? 'reads lightest' : 'NOT visibly lightest'}`
    )
  }
  if (palette === 'sequential') {
    const monotone = ls.slice(1).every((l, i) => l < ls[i])
    lines.push(`lightness monotone light→dark: ${monotone ? 'yes' : 'NO'}`)
  }
  if (palette === 'categorical') {
    lines.push(`first-three all-pairs CVD ΔE ${fmt1(minPairDelta(values.slice(0, 3), true))}`)
  }
  return lines
}

/** Lightness, chroma, separation and contrast for one column, printed under its swatches. */
function Measurements({
  values,
  palette,
  whiteLabels,
}: {
  values: string[]
  palette: DatavizPalette
  whiteLabels?: boolean
}) {
  const { mode } = usePlane()
  const cs = values.map(chroma)
  const labels = values.map((v) => contrastRatio(v, labelOn(v, whiteLabels)))
  const lines = [
    `OKLCH L ${values.map(lightness).map(fmt2).join(' / ')}`,
    `OKLCH C ${cs.map((c) => formatTrimmedDecimal(c, 3)).join(' / ')}`,
    `min C ${formatTrimmedDecimal(Math.min(...cs), 3)} · mean C ${formatTrimmedDecimal(cs.reduce((a, b) => a + b) / cs.length, 3)}`,
    `worst-plane contrast ${values.map((v) => fmt2(worstPlaneContrast(v, mode))).join(' / ')}`,
    whiteLabels
      ? `white label contrast ${labels.map(fmt2).join(' / ')}`
      : `min label contrast ${fmt2(Math.min(...labels))}:1`,
    `min adjacent CVD ΔE ${fmt1(minPairDelta(values, false))}`,
    ...paletteChecks(values, palette),
  ]
  return (
    <View style={{ gap: 2 }} testID="measurements">
      {lines.map((line) => (
        <Ink key={line} variant="mono" role="tertiary">
          {line}
        </Ink>
      ))}
    </View>
  )
}

const STATUS_ORDER: Exclude<VolumeStatus, 'untrained'>[] = [
  'behind',
  'ontrack',
  'target',
  'approaching',
  'over',
]

const STATUS_LABEL: Record<(typeof STATUS_ORDER)[number], string> = {
  behind: 'Behind Plan',
  ontrack: 'On Track',
  target: 'Target Met',
  approaching: 'Approaching',
  over: 'Over MRV',
}

/**
 * Proposed chips use the `Pill` primitive `MuscleGroupChip` is a preset over;
 * the real chip reads tokens, so it can only render shipped values.
 */
function DivergingSample({
  values,
  shipped,
  whiteLabels,
}: {
  values: string[]
  shipped: boolean
  whiteLabels?: boolean
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {STATUS_ORDER.map((status, i) =>
          shipped ? (
            <MuscleGroupChip key={status} name={STATUS_LABEL[status]} volumeStatus={status} />
          ) : (
            <Pill
              key={status}
              tone="neutral"
              variant="subtle"
              size="md"
              leading={
                <View
                  style={{
                    width: DOT_SIZE,
                    height: DOT_SIZE,
                    borderRadius: 9999,
                    backgroundColor: values[i],
                  }}
                />
              }
              className="gap-1.5"
              textClassName="font-sans font-medium text-text-secondary"
            >
              {STATUS_LABEL[status]}
            </Pill>
          )
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 2 }} testID="diverging-fills">
        {STATUS_ORDER.map((status, i) => (
          <View
            key={status}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 8,
              backgroundColor: values[i],
              justifyContent: 'center',
            }}
          >
            <Text
              style={{ color: labelOn(values[i], whiteLabels), fontSize: 10, textAlign: 'center' }}
            >
              {STATUS_LABEL[status]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

/** Effort index per set, per exercise: a fixed specimen, not data. */
const EFFORT_GRID = [
  [0, 1, 1, 2, 2, 3, 3, 4, 4, 5],
  [0, 0, 1, 2, 3, 3, 4, 5, 5, 5],
  [1, 1, 2, 2, 2, 3, 4, 4, 5, 5],
  [0, 1, 2, 3, 4, 5, 4, 3, 2, 1],
]

const HEATMAP_CELL = 26

/** Spreads the grid's six effort levels over however many steps a variant has. */
function SequentialSample({ values }: { values: string[] }) {
  const stepFor = (level: number) => Math.floor((level * values.length) / 6)
  return (
    <View style={{ gap: 2 }} testID="effort-heatmap">
      {EFFORT_GRID.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 2 }}>
          {row.map((step, c) => (
            <View
              key={c}
              style={{
                width: HEATMAP_CELL,
                height: HEATMAP_CELL,
                borderRadius: 4,
                backgroundColor: values[stepFor(step)],
              }}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

const SERIES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio']
const SERIES_VOLUME = [42, 36, 30, 22, 16, 10, 6]

/** The real `Treemap`, fed each tile's colour explicitly, plus a text-token legend. */
function CategoricalSample({ values }: { values: string[] }) {
  const data: TreemapDatum[] = SERIES.map((label, i) => ({
    id: label.toLowerCase(),
    label,
    value: SERIES_VOLUME[i],
    color: values[i],
  }))
  return (
    <View style={{ gap: 8 }}>
      <Treemap data={data} width={300} height={110} scale="linear" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {SERIES.map((label, i) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: values[i] }} />
            <Ink variant="caption" role="secondary">
              {label}
            </Ink>
          </View>
        ))}
      </View>
    </View>
  )
}

function Sample({
  palette,
  values,
  set,
}: {
  palette: DatavizPalette
  values: string[]
  set?: CandidateSet
}) {
  if (palette === 'diverging') {
    return <DivergingSample values={values} shipped={!set} whiteLabels={set?.whiteLabels} />
  }
  if (palette === 'sequential') return <SequentialSample values={values} />
  return <CategoricalSample values={values} />
}

function RuleList({ rules }: { rules: string[] }) {
  return (
    <View style={{ gap: 2 }} testID="rules">
      {rules.map((rule) => (
        <Ink
          key={rule}
          variant="caption"
          role={/^(RELAXED|BROKEN)/.test(rule) ? 'primary' : 'secondary'}
        >
          {`• ${rule}`}
        </Ink>
      ))}
    </View>
  )
}

function ColumnPanel({
  column,
  palette,
  minWidth,
}: {
  column: Column
  palette: DatavizPalette
  minWidth: number
}) {
  const values = columnValues(column, palette)
  return (
    <Surface
      level="base"
      theme={column.theme}
      className="p-3"
      style={{ flex: 1, gap: 10, minWidth, maxWidth: 600 }}
      testID={`column-${column.id}`}
    >
      <View style={{ gap: 2 }}>
        <Ink variant="microLabel" role="primary">
          {column.title}
        </Ink>
        <Ink variant="caption" role="tertiary">
          {column.note}
        </Ink>
      </View>
      {column.set ? <RuleList rules={column.set.rules} /> : null}
      <Surface raise={1} className="p-3" style={{ gap: 10 }}>
        <SwatchRow values={values} set={column.set} />
        <Sample palette={palette} values={values} set={column.set} />
        <Measurements values={values} palette={palette} whiteLabels={column.set?.whiteLabels} />
      </Surface>
    </Surface>
  )
}

const HEADLINE: Record<DatavizPalette, { title: string; note: string }> = {
  diverging: {
    title: 'Diverging (BodyMap fill, MuscleGroupChip dot)',
    note: 'Reviewer prefers C. D asks whether every stop can carry white text: it can, without 700-step arms, but only by giving up the light centre and CVD separation. No shipped consumer draws text on these fills.',
  },
  sequential: {
    title: 'Sequential effort (heatmap, velocity strip)',
    note: 'Neither A nor B works: amber at 400-600 reads as dirt on a light plane. The strip at the bottom settles steps 0-2 first; the tail follows once one is picked.',
  },
  categorical: {
    title: 'Categorical (Treemap, Scatter)',
    note: 'LOCKED: B with Cardio kept on the current brown amber-600. Treemap tile labels are fixed near-black.',
  },
}

function ColumnRow({
  label,
  columns,
  palette,
  minWidth = 440,
}: {
  label: string
  columns: Column[]
  palette: DatavizPalette
  minWidth?: number
}) {
  return (
    <View style={{ gap: 6 }}>
      <Typography variant="overline" color="secondary">
        {label}
      </Typography>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {columns.map((column) => (
          <ColumnPanel key={column.id} column={column} palette={palette} minWidth={minWidth} />
        ))}
      </View>
    </View>
  )
}

function PaletteDecision({ palette }: { palette: DatavizPalette }) {
  return (
    <View style={{ padding: 16, gap: 12 }} testID={`dataviz-light-${palette}`}>
      <View style={{ gap: 2 }}>
        <Typography variant="h5" color="primary">
          {HEADLINE[palette].title}
        </Typography>
        <Typography variant="body2" color="secondary">
          {HEADLINE[palette].note}
        </Typography>
        <Typography variant="caption" color="tertiary">
          Swatch captions: value, proposed ramp step, contrast vs the panel it sits on. Worst-plane
          contrast is the minimum over surface-base, -elevated and -raised. Keys:{' '}
          {paletteKeys(palette).join(', ')}.
        </Typography>
      </View>
      <ColumnRow label="Current" columns={CURRENT_COLUMNS} palette={palette} />
      <ColumnRow label="Proposed (light)" columns={proposedColumns(palette)} palette={palette} />
      {palette === 'sequential' ? (
        <ColumnRow
          label="Turn 3: steps 0-2 only, on light (tail undecided)"
          columns={toColumns(SEQUENTIAL_HEAD_VARIANTS)}
          palette={palette}
          minWidth={380}
        />
      ) : null}
    </View>
  )
}

/**
 * # Lab / Decisions — dataviz palettes on light (VW-371 phase 2)
 *
 * A decision surface, not a component. Phase 1 made the three chart palettes
 * theme-aware roles (`dataviz-diverging-*`, `dataviz-sequential-*`,
 * `dataviz-categorical-*`) with light and dark carrying the same values. This
 * story proposes light values and shows them beside what ships.
 *
 * ## Status: turn 3. Categorical LOCKED; diverging C vs D; sequential steps 0-2 open
 *
 * The proposals live in `DatavizLightPalette.candidates.ts` as named sets. No
 * token file has changed. Once one set is approved, each `step` in it is what
 * goes into the light block of `semantic.ts` and the other four mirrors.
 *
 * Turn 1 (set A) was reviewed on 2026-09-17: "the proposed palettes look very
 * muddy". A enforced 3:1 on every non-centre stop, which forced ramp steps
 * 700-900, where OKLCH chroma collapses. Turn 2 adds set B (vivid) for every
 * palette and set C (light centre) for diverging. Each column prints the rules
 * it satisfies; a rule it loosens is printed as RELAXED, one it fails as BROKEN.
 *
 * Turn 3 locked categorical B with Cardio on amber[600], added diverging D
 * (white labels on every stop) beside C, and added a steps 0-2 strip for
 * sequential. Set A is dropped from diverging and categorical.
 *
 * ## How the values were chosen
 *
 * Exhaustive search over `primitiveRamps` steps, keeping each palette's hue
 * order, scored with the dataviz skill's validator (Machado-2009 CVD simulation,
 * OKLab ΔE×100). Contrast is taken against the worst of `surface-base`,
 * `surface-elevated` and `surface-raised`. The B relaxation: fills sit inside
 * chips and tiles with their own labels, so fill-vs-panel contrast is a
 * legibility floor (3:1 for diverging ends, 2:1 elsewhere), not a text rule.
 * Label contrast stays at 4.5:1 with `bestTextColor`.
 *
 * ## Open questions for the reviewer
 *
 * - Under turn 1's sequential rules (ΔL ≥ 0.06, lightest ≥ 2:1, fixed hue per
 *   step) A is the only solution. B relaxes both floors slightly.
 * - Categorical B sits in the validator's CVD WARN band (green↔orange 6.9), which
 *   is legal only with labels or a legend. Every categorical consumer has one.
 * - `Treemap` hard-codes `text-on-data-strong`. Its worst tile label is 2.6:1 on
 *   A and 3.6:1 on B, so either set needs per-tile label colour in `Treemap`.
 */
const meta: Meta<{ palette: DatavizPalette }> = {
  title: 'Lab/Decisions/Dataviz Light Palettes',
  tags: ['autodocs', 'status:lab'],
}

export default meta
type Story = StoryObj<{ palette: DatavizPalette }>

export const Diverging: Story = { render: () => <PaletteDecision palette="diverging" /> }

export const Sequential: Story = { render: () => <PaletteDecision palette="sequential" /> }

export const Categorical: Story = { render: () => <PaletteDecision palette="categorical" /> }
