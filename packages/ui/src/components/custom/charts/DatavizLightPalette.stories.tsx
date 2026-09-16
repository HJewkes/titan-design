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
import { bestTextColor } from '../../../theme/tokens/primitives'
import { formatTrimmedDecimal } from '../../../utils/number-format'
import {
  LIGHT_CANDIDATES,
  type DatavizKey,
  type DatavizPalette,
  type LightCandidate,
} from './DatavizLightPalette.candidates'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/** One column of the comparison: a theme, and the values painted under it. */
interface Column {
  id: 'dark-current' | 'light-current' | 'light-proposed'
  title: string
  note: string
  theme: ThemeMode
  /** `true` renders the real token-reading components, which can only show shipped values. */
  shipped: boolean
}

const COLUMNS: Column[] = [
  {
    id: 'dark-current',
    title: 'DARK · current',
    note: 'what ships today on dark; the reference the light column must match in meaning',
    theme: 'dark',
    shipped: true,
  },
  {
    id: 'light-current',
    title: 'LIGHT · current (phase 1)',
    note: 'same values as dark, by design of phase 1',
    theme: 'light',
    shipped: true,
  },
  {
    id: 'light-proposed',
    title: 'LIGHT · PROPOSED',
    note: 'candidate values from DatavizLightPalette.candidates.ts; not in any token file',
    theme: 'light',
    shipped: false,
  },
]

function columnValues(column: Column, palette: DatavizPalette): string[] {
  const candidates = LIGHT_CANDIDATES[palette]
  if (!column.shipped) return candidates.map((c) => c.value)
  const tokens = getSemanticColors(column.theme)
  return candidates.map((c) => tokens[c.key as ColorToken])
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
}: {
  value: string
  index: number
  candidate?: LightCandidate
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
        <Text style={{ color: bestTextColor(value), fontSize: 12, fontWeight: '600' }}>
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

function SwatchRow({
  values,
  palette,
  proposed,
}: {
  values: string[]
  palette: DatavizPalette
  proposed: boolean
}) {
  const candidates = LIGHT_CANDIDATES[palette]
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {values.map((value, i) => (
        <Swatch key={i} value={value} index={i} candidate={proposed ? candidates[i] : undefined} />
      ))}
    </View>
  )
}

/** Lightness, separation and contrast for one column, printed under its swatches. */
function Measurements({ values, palette }: { values: string[]; palette: DatavizPalette }) {
  const { plane } = usePlane()
  const ls = values.map(lightness)
  const lines = [
    `OKLCH L ${ls.map(fmt2).join(' / ')}`,
    `min adjacent CVD ΔE ${fmt1(minPairDelta(values, false))}`,
    `min contrast vs plane ${fmt2(Math.min(...values.map((v) => contrastRatio(v, plane))))}:1`,
    `min label contrast ${fmt2(Math.min(...values.map((v) => contrastRatio(v, bestTextColor(v)))))}:1`,
  ]
  if (palette === 'diverging') {
    const centreLightest = ls.every((l, i) => i === 2 || l < ls[2])
    lines.push(`min all-pairs CVD ΔE ${fmt1(minPairDelta(values, true))}`)
    lines.push(`centre is lightest: ${centreLightest ? 'yes' : 'NO'}`)
  }
  if (palette === 'sequential') {
    const monotone = ls.slice(1).every((l, i) => l < ls[i])
    lines.push(`lightness monotone light→dark: ${monotone ? 'yes' : 'NO'}`)
  }
  if (palette === 'categorical') {
    lines.push(`first-three all-pairs CVD ΔE ${fmt1(minPairDelta(values.slice(0, 3), true))}`)
  }
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
function DivergingSample({ values, shipped }: { values: string[]; shipped: boolean }) {
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
            <Text style={{ color: bestTextColor(values[i]), fontSize: 10, textAlign: 'center' }}>
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

function SequentialSample({ values }: { values: string[] }) {
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
                backgroundColor: values[step],
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
  shipped,
}: {
  palette: DatavizPalette
  values: string[]
  shipped: boolean
}) {
  if (palette === 'diverging') return <DivergingSample values={values} shipped={shipped} />
  if (palette === 'sequential') return <SequentialSample values={values} />
  return <CategoricalSample values={values} />
}

function ColumnPanel({ column, palette }: { column: Column; palette: DatavizPalette }) {
  const values = columnValues(column, palette)
  return (
    <Surface
      level="base"
      theme={column.theme}
      className="p-3"
      style={{ flex: 1, gap: 10, minWidth: 440 }}
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
      <Surface raise={1} className="p-3" style={{ gap: 10 }}>
        <SwatchRow values={values} palette={palette} proposed={!column.shipped} />
        <Sample palette={palette} values={values} shipped={column.shipped} />
        <Measurements values={values} palette={palette} />
      </Surface>
    </Surface>
  )
}

const HEADLINE: Record<DatavizPalette, { title: string; note: string }> = {
  diverging: {
    title: 'Diverging (BodyMap fill, MuscleGroupChip dot)',
    note: 'Light pulls the arms darker so every non-centre stop clears 3:1 on the panel; the green centre stays the lightest step.',
  },
  sequential: {
    title: 'Sequential effort (heatmap, velocity strip)',
    note: 'Light makes the walk strictly darker per step. Dark and phase-1 light are not monotone: amber-200 is lighter than step 0.',
  },
  categorical: {
    title: 'Categorical (Treemap, Scatter)',
    note: 'Light moves cyan, green and orange down their ramps. Treemap tile labels are fixed near-black, so darker fills lose them.',
  },
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
          Swatch captions: value, proposed ramp step, contrast vs the panel it sits on. Keys:{' '}
          {LIGHT_CANDIDATES[palette].map((c): DatavizKey => c.key).join(', ')}.
        </Typography>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {COLUMNS.map((column) => (
          <ColumnPanel key={column.id} column={column} palette={palette} />
        ))}
      </View>
    </View>
  )
}

/**
 * # Lab / Decisions — dataviz palettes on light (VW-371 phase 2)
 *
 * A decision surface, not a component. Phase 1 made the three chart palettes
 * theme-aware roles (`dataviz-diverging-*`, `dataviz-sequential-*`,
 * `dataviz-categorical-*`) with light and dark carrying the same values. This
 * story proposes the light column and shows it beside what ships.
 *
 * ## Status: PROPOSED, awaiting sign-off
 *
 * The proposals live in `DatavizLightPalette.candidates.ts`. No token file has
 * changed. Once approved, each `step` there is what goes into the light block
 * of `semantic.ts` and the other four mirrors.
 *
 * ## How the values were chosen
 *
 * Exhaustive search over `primitiveRamps` steps, keeping each palette's hue
 * order, scored with the dataviz skill's validator (Machado-2009 CVD simulation,
 * OKLab ΔE×100):
 *
 * - **Diverging**: arms ≥ 3:1 on white, `surface-elevated` and `surface-raised`;
 *   centre strictly lightest; arms symmetric in lightness; every label ≥ 4.5:1
 *   with black or white; all-pairs CVD ΔE 15.4 (floor 8).
 * - **Sequential**: strictly decreasing lightness with ΔL ≥ 0.06; lightest step
 *   ≥ 2:1 on white; adjacent CVD ΔE 6.5 (phase-1 floor 4.5). It is the only
 *   combination on the ramps that satisfies all three.
 * - **Categorical**: every slot inside the light L band, chroma ≥ 0.10, ≥ 3:1 on
 *   white; adjacent CVD ΔE 14.3 and normal-vision ΔE 17.1 (floor 15); first three
 *   all-pairs ΔE 20.5.
 *
 * ## Open questions for the reviewer
 *
 * - The diverging centre (`green[400]`) is 2.0:1 on `surface-raised`. A centre
 *   that clears 3:1 forces the arms so dark the all-pairs ΔE falls to 8.6.
 * - `dataviz-sequential-5` (`red[900]`) reads near-brown.
 * - No categorical set clears 3:1 on white AND keeps near-black labels ≥ 4.5:1.
 *   `Treemap` hard-codes `text-on-data-strong`, so adopting these values needs a
 *   per-tile label colour in `Treemap` first.
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
