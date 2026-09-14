// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface, surfaceBackground } from '../../ui/surface'
import { Pill } from '../../ui/pill'
import { Typography } from '../Typography'
import { BodyMap, type BodyMapData } from './BodyMap'
import { MuscleGroupChip } from './MuscleGroupChip'
import {
  MuscleGroup,
  VOLUME_STATUS_DATAVIZ_TOKEN,
  getHeatmapColor,
  type VolumeStatus,
} from './muscleTaxonomy'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { divergingScale, greyRamp, primitiveRamps } from '../../../theme/tokens/primitives'
import { formatTrimmedDecimal } from '../../../utils/number-format'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/** The six rungs of the shipped status. A rejected 5-value ladder leaves one out. */
type Rung = VolumeStatus

const RUNG_ORDER: Rung[] = ['untrained', 'behind', 'ontrack', 'target', 'approaching', 'over']

const RUNG_LABEL: Record<Rung, string> = {
  untrained: 'Untrained',
  behind: 'Behind Plan',
  ontrack: 'On Track',
  target: 'Target Met',
  approaching: 'Approaching',
  over: 'Over MRV',
}

const RUNG_ZONE: Record<Rung, string> = {
  untrained: '0 sets logged',
  behind: 'below MEV',
  ontrack: 'MEV - MAV',
  target: 'MAV - MRV',
  approaching: 'upper MAV-MRV',
  over: 'above MRV',
}

/** A painted rung. `token` names a semantic token; `literal` names a raw primitive. */
interface Paint {
  token?: ColorToken
  literal?: string
  label: string
}

function paintValue(paint: Paint, mode: ThemeMode): string {
  return paint.token ? getSemanticColors(mode)[paint.token] : (paint.literal ?? '')
}

/** Index into `divergingScale` when the value IS one of its entries, else null. */
function dsIndex(value: string): number | null {
  const i = divergingScale.findIndex((entry) => entry.toLowerCase() === value.toLowerCase())
  return i === -1 ? null : i
}

/**
 * What the figure paints — unchanged by VW-333 and pinned byte-identical by
 * `volume-status-palette.test.tsx`. Read through `getHeatmapColor` rather than
 * restated, so this row cannot drift from what `BodyMap` actually renders.
 */
const FIGURE: Record<Rung, Paint> = {
  untrained: { literal: getHeatmapColor('untrained', 'dark'), label: 'no-data fill' },
  behind: { token: 'dataviz-diverging-0', label: 'dataviz-diverging-0' },
  ontrack: { token: 'dataviz-diverging-1', label: 'dataviz-diverging-1' },
  target: { token: 'dataviz-diverging-2', label: 'dataviz-diverging-2' },
  approaching: { token: 'dataviz-diverging-3', label: 'dataviz-diverging-3' },
  over: { token: 'dataviz-diverging-4', label: 'dataviz-diverging-4' },
}

/**
 * The chip's palette BEFORE VW-333 — history, restated here because the code no
 * longer holds it. This is the defect the ticket closed: the same muscle painted
 * one hue on the figure and another on the chip.
 */
const CHIP_BEFORE: Partial<Record<Rung, Paint>> = {
  untrained: { token: 'text-tertiary', label: 'text-tertiary' },
  behind: { token: 'brand-secondary', label: 'brand-secondary' },
  ontrack: { token: 'status-success', label: 'status-success' },
  target: { token: 'brand-primary', label: 'brand-primary' },
  over: { token: 'status-error', label: 'status-error' },
}

/** What the chip paints now — the figure's scale, via the one shared map. */
const SHIPPED: Record<Rung, Paint> = {
  untrained: { token: 'text-tertiary', label: 'text-tertiary' },
  behind: { token: VOLUME_STATUS_DATAVIZ_TOKEN.behind, label: VOLUME_STATUS_DATAVIZ_TOKEN.behind },
  ontrack: {
    token: VOLUME_STATUS_DATAVIZ_TOKEN.ontrack,
    label: VOLUME_STATUS_DATAVIZ_TOKEN.ontrack,
  },
  target: { token: VOLUME_STATUS_DATAVIZ_TOKEN.target, label: VOLUME_STATUS_DATAVIZ_TOKEN.target },
  approaching: {
    token: VOLUME_STATUS_DATAVIZ_TOKEN.approaching,
    label: VOLUME_STATUS_DATAVIZ_TOKEN.approaching,
  },
  over: { token: VOLUME_STATUS_DATAVIZ_TOKEN.over, label: VOLUME_STATUS_DATAVIZ_TOKEN.over },
}

interface Ladder {
  id: string
  title: string
  paints: Partial<Record<Rung, Paint>>
}

/** The shipped ladder, measured beside the three that were weighed and rejected. */
const DECIDED: Ladder = {
  id: 'shipped',
  title: 'shipped — the figure\u2019s diverging scale, now on both surfaces',
  paints: SHIPPED,
}

/**
 * The three candidate ladders, ALL REJECTED on 2026-09-13. Kept rendered as the
 * record of what was weighed; see `VolumeStatusPalette.decision.md`.
 */
const REJECTED: Ladder[] = [
  {
    id: 'B',
    title: 'B (rejected) — five values, orange is the target',
    paints: {
      untrained: { token: 'text-tertiary', label: 'text-tertiary' },
      behind: { token: 'status-info', label: 'status-info' },
      ontrack: { token: 'status-success', label: 'status-success' },
      target: { token: 'brand-primary', label: 'brand-primary' },
      over: { token: 'status-error', label: 'status-error' },
    },
  },
  {
    id: 'B2',
    title: 'B2 (rejected) — yellow behind / blue on track / green met',
    paints: {
      untrained: { token: 'text-tertiary', label: 'text-tertiary' },
      behind: { token: 'status-warning', label: 'status-warning' },
      ontrack: { token: 'status-info', label: 'status-info' },
      target: { token: 'status-success-light', label: 'status-success-light' },
      approaching: { token: 'brand-primary', label: 'brand-primary' },
      over: { token: 'status-error', label: 'status-error' },
    },
  },
  {
    id: 'B3',
    title: 'B3 (rejected) — cold end + two greens',
    paints: {
      untrained: { token: 'text-tertiary', label: 'text-tertiary' },
      behind: { literal: primitiveRamps.cyan[300], label: 'cyan-300 NEW TOKEN NEEDED' },
      ontrack: { token: 'status-success', label: 'status-success' },
      target: { token: 'status-success-light', label: 'status-success-light' },
      approaching: { token: 'brand-primary', label: 'brand-primary' },
      over: { token: 'status-error', label: 'status-error' },
    },
  },
]

const FRONT: BodyMapData[] = [
  { muscleGroup: MuscleGroup.CHEST, intensity: 0.6, volumeStatus: 'target', weeklySets: 12 },
  {
    muscleGroup: MuscleGroup.FRONT_DELTS,
    intensity: 0.5,
    volumeStatus: 'ontrack',
    weeklySets: 5,
  },
  { muscleGroup: MuscleGroup.BICEPS, intensity: 0.3, volumeStatus: 'behind', weeklySets: 3 },
  { muscleGroup: MuscleGroup.ABS, intensity: 0.9, volumeStatus: 'approaching', weeklySets: 15 },
  { muscleGroup: MuscleGroup.QUADS, intensity: 1, volumeStatus: 'over', weeklySets: 22 },
]

const BACK: BodyMapData[] = [
  { muscleGroup: MuscleGroup.LATS, intensity: 0.6, volumeStatus: 'target', weeklySets: 11 },
  {
    muscleGroup: MuscleGroup.UPPER_BACK,
    intensity: 0.45,
    volumeStatus: 'ontrack',
    weeklySets: 8,
  },
  { muscleGroup: MuscleGroup.TRICEPS, intensity: 0.25, volumeStatus: 'behind', weeklySets: 3 },
  { muscleGroup: MuscleGroup.GLUTES, intensity: 0.9, volumeStatus: 'approaching', weeklySets: 14 },
  { muscleGroup: MuscleGroup.HAMSTRINGS, intensity: 1, volumeStatus: 'over', weeklySets: 18 },
]

// ---------------------------------------------------------------------------
// Measurement — the same Machado-2009 + OKLab metric as primitives.test.ts:44
// ---------------------------------------------------------------------------

const hexToRgb = (hex: string): number[] =>
  [0, 2, 4].map((i) => parseInt(hex.replace('#', '').slice(i, i + 2), 16) / 255)
const linearise = (c: number) => (c >= 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92)

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

const mul = (M: number[], v: number[]) => [
  M[0] * v[0] + M[1] * v[1] + M[2] * v[2],
  M[3] * v[0] + M[4] * v[1] + M[5] * v[2],
  M[6] * v[0] + M[7] * v[1] + M[8] * v[2],
]
const DEUT = [
  0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881,
]
const PROT = [
  0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998,
]
const oklabDistance = (a: number[], b: number[]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100

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

/**
 * The figure's untrained fill as it actually paints — `alpha(white, 0.08)`
 * composited over the plane a `raise={1}` panel sits on. Returned as hex because
 * that is what `contrastRatio` parses.
 */
function outlineFillOnPanel(mode: ThemeMode): string {
  const base = hexToRgb(surfaceBackground('elevated', mode))
  const channels = base.map((c) =>
    Math.round((0.08 + 0.92 * c) * 255)
      .toString(16)
      .padStart(2, '0')
  )
  return '#' + channels.join('')
}

const CVD_FLOOR = 8

interface Measurement {
  adjacent: Array<{ pair: string; delta: number }>
  minAdjacent: number
  minAll: number
  minAllPair: string
  contrast: Array<{ rung: Rung; ratio: number }>
}

function measure(ladder: Ladder, mode: ThemeMode): Measurement {
  const rungs = RUNG_ORDER.filter((r) => ladder.paints[r]).map(
    (r) => [r, paintValue(ladder.paints[r] as Paint, mode)] as const
  )
  const adjacent = rungs.slice(0, -1).map(([rung, value], i) => ({
    pair: `${rung}→${rungs[i + 1][0]}`,
    delta: cvdDelta(value, rungs[i + 1][1]),
  }))
  let minAll = Infinity
  let minAllPair = ''
  for (let i = 0; i < rungs.length; i++) {
    for (let j = i + 1; j < rungs.length; j++) {
      const d = cvdDelta(rungs[i][1], rungs[j][1])
      if (d < minAll) [minAll, minAllPair] = [d, `${rungs[i][0]}/${rungs[j][0]}`]
    }
  }
  const outline = outlineFillOnPanel(mode)
  return {
    adjacent,
    minAdjacent: Math.min(...adjacent.map((a) => a.delta)),
    minAll,
    minAllPair,
    contrast: rungs.map(([rung, value]) => ({ rung, ratio: contrastRatio(value, outline) })),
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const CHECKER_STEP = 16
const SWATCH_CELL_HEIGHT = 88
const LEGEND_COLUMN_WIDTH = 120
const DOT_SIZE = 6

/** A deliberately hostile backdrop, so a fill is judged against tonal range. */
function Checkerboard({ rows, columns, mode }: { rows: number; columns: number; mode: ThemeMode }) {
  const [light, dark] =
    mode === 'light' ? [greyRamp[100], greyRamp[400]] : [greyRamp[700], greyRamp[950]]
  return (
    <View
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' }}
    >
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {Array.from({ length: columns }, (_, column) => (
            <View
              key={column}
              style={{
                width: CHECKER_STEP,
                height: CHECKER_STEP,
                backgroundColor: (row + column) % 2 === 0 ? light : dark,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

/**
 * A specimen panel. The patterned backdrop is scoped to the specimen area, so
 * the paint is judged against tonal range while the prose keeps a plane it
 * reads on.
 */
function Panel({
  title,
  note,
  backdrop,
  mode,
  children,
}: {
  title: string
  note: string
  backdrop: DecisionArgs['backdrop']
  mode: ThemeMode
  children: React.ReactNode
}) {
  return (
    <Surface raise={1} className="p-3" style={{ gap: 8, minWidth: 220 }}>
      <Typography variant="microLabel" color="secondary">
        {title}
      </Typography>
      <Typography variant="caption" color="tertiary">
        {note}
      </Typography>
      <View style={{ padding: 10, borderRadius: 10, overflow: 'hidden' }}>
        {backdrop === 'pattern' ? <Checkerboard rows={70} columns={70} mode={mode} /> : null}
        {children}
      </View>
    </Surface>
  )
}

function Swatch({ color, caption, token }: { color: string; caption: string; token: string }) {
  return (
    <View style={{ gap: 3, width: LEGEND_COLUMN_WIDTH, height: SWATCH_CELL_HEIGHT }}>
      <View
        style={{ height: 28, borderRadius: 6, backgroundColor: color }}
        testID={`swatch-${caption}-${token}`}
      />
      <Typography variant="caption" color="tertiary">
        {caption}
      </Typography>
      <Typography variant="mono" color="secondary">
        {token}
      </Typography>
    </View>
  )
}

/** One legend cell: a paint, or an explicit "this ladder has no rung here". */
function LegendCell({ paint, caption, mode }: { paint?: Paint; caption: string; mode: ThemeMode }) {
  if (!paint) return <Swatch color="transparent" caption={caption} token="— none" />
  const value = paintValue(paint, mode)
  const ds = dsIndex(value)
  return (
    <Swatch
      color={value}
      caption={caption}
      token={ds === null ? paint.label : `${paint.label} = ds[${ds}]`}
    />
  )
}

function LegendColumn({ rung, mode }: { rung: Rung; mode: ThemeMode }) {
  return (
    <View style={{ gap: 8, width: LEGEND_COLUMN_WIDTH }}>
      <View style={{ minHeight: 46 }}>
        <Typography variant="boldLabel" color="primary">
          {RUNG_LABEL[rung]}
        </Typography>
        <Typography variant="caption" color="tertiary">
          {RUNG_ZONE[rung]}
        </Typography>
      </View>
      <LegendCell paint={FIGURE[rung]} caption="figure (unchanged)" mode={mode} />
      <LegendCell paint={CHIP_BEFORE[rung]} caption="chip before" mode={mode} />
      <LegendCell paint={SHIPPED[rung]} caption="chip now" mode={mode} />
      {REJECTED.map((ladder) => (
        <LegendCell key={ladder.id} paint={ladder.paints[rung]} caption={ladder.id} mode={mode} />
      ))}
    </View>
  )
}

/**
 * Chips for a palette that is not the shipped one — the same `Pill` primitive
 * `MuscleGroupChip` is a preset over, with the dot passed explicitly. The
 * shipped row renders the REAL `MuscleGroupChip` instead, so what it shows is
 * what the component does.
 */
function LadderChips({ ladder, mode }: { ladder: Ladder; mode: ThemeMode }) {
  return (
    <View style={{ gap: 6 }}>
      {RUNG_ORDER.filter((rung) => ladder.paints[rung]).map((rung) => (
        <Pill
          key={rung}
          tone="neutral"
          variant="subtle"
          size="md"
          leading={
            <View
              style={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: 9999,
                backgroundColor: paintValue(ladder.paints[rung] as Paint, mode),
              }}
            />
          }
          className="gap-1.5"
          textClassName="font-sans font-medium text-text-secondary"
        >
          {RUNG_LABEL[rung]}
        </Pill>
      ))}
    </View>
  )
}

/** The shipped chips, rendered by the real component. */
function ShippedChips() {
  return (
    <View style={{ gap: 6 }}>
      {RUNG_ORDER.map((rung) => (
        <MuscleGroupChip key={rung} name={RUNG_LABEL[rung]} volumeStatus={rung} />
      ))}
    </View>
  )
}

/** The numbers under a ladder: adjacent CVD ΔE, the two minima, and contrast. */
function Measurements({ ladder, mode }: { ladder: Ladder; mode: ThemeMode }) {
  const m = measure(ladder, mode)
  const passes = m.minAll >= CVD_FLOOR
  return (
    <View style={{ gap: 3, maxWidth: 560 }} testID={`measurements-${ladder.id}`}>
      <Typography variant="mono" color="tertiary">
        adjacent ΔE —{' '}
        {m.adjacent.map((a) => `${a.pair} ${formatTrimmedDecimal(a.delta, 1)}`).join(' · ')}
      </Typography>
      <Typography variant="mono" color={passes ? 'success' : 'error'}>
        min adjacent {formatTrimmedDecimal(m.minAdjacent, 1)} · min all-pairs{' '}
        {formatTrimmedDecimal(m.minAll, 1)} ({m.minAllPair}) · floor {CVD_FLOOR}{' '}
        {passes ? 'PASS' : 'FAIL'}
      </Typography>
      <Typography variant="mono" color="tertiary">
        contrast vs figure outline fill ({mode}) —{' '}
        {m.contrast.map((c) => `${c.rung} ${formatTrimmedDecimal(c.ratio, 2)}`).join(' · ')}
      </Typography>
    </View>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Typography variant="h6" color="primary">
        {label}
      </Typography>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{children}</View>
    </View>
  )
}

interface DecisionArgs {
  backdrop: 'pattern' | 'surface'
}

function Figures({
  backdrop,
  mode,
  title,
  note,
}: DecisionArgs & { mode: ThemeMode } & {
  title: string
  note: string
}) {
  return (
    <Panel title={title} note={note} backdrop={backdrop} mode={mode}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <BodyMap data={FRONT} view="front" mode="simple" />
        <BodyMap data={BACK} view="back" mode="simple" />
      </View>
    </Panel>
  )
}

function VolumeStatusPaletteDecision({ backdrop, mode }: DecisionArgs & { mode: ThemeMode }) {
  return (
    <View style={{ padding: 16 }}>
      <Surface
        level="base"
        theme={mode}
        className="p-4"
        style={{ gap: 20 }}
        testID="volume-status-palette"
      >
        <View style={{ gap: 4 }}>
          <Typography variant="h5" color="primary">
            Volume status: one scale, both surfaces
          </Typography>
          <Typography variant="body2" color="secondary">
            VW-333 shipped. `ds[n]` marks a value that IS `divergingScale[n]`, computed at render
            rather than asserted. The figure did not move — `volume-status-palette.test.tsx` pins
            every fill byte-identical; the chip did, onto the figure&apos;s scale.
          </Typography>
        </View>

        <Row label="A — the defect (chip palette before VW-333)">
          <Figures
            backdrop={backdrop}
            mode={mode}
            title="figure"
            note="BodyMap, getHeatmapColor — this is what the chip now matches"
          />
          <Panel
            title="chips BEFORE"
            note="restated history: the code no longer holds these values"
            backdrop={backdrop}
            mode={mode}
          >
            <LadderChips ladder={{ id: 'before', title: '', paints: CHIP_BEFORE }} mode={mode} />
          </Panel>
        </Row>

        <Row label="B — shipped: MuscleGroupChip on the figure’s scale">
          <Panel
            title="chips NOW"
            note="the real MuscleGroupChip, dot on dataviz-diverging-*"
            backdrop={backdrop}
            mode={mode}
          >
            <ShippedChips />
          </Panel>
          <View style={{ gap: 8 }}>
            <Measurements ladder={DECIDED} mode={mode} />
          </View>
        </Row>

        {REJECTED.map((ladder) => (
          <View key={ladder.id} style={{ gap: 8 }}>
            <Row label={ladder.title}>
              <Panel
                title={`chips ${ladder.id}`}
                note="kept as the record of what was weighed"
                backdrop={backdrop}
                mode={mode}
              >
                <LadderChips ladder={ladder} mode={mode} />
              </Panel>
            </Row>
            <Measurements ladder={ladder} mode={mode} />
          </View>
        ))}

        <Row label="C — legend: figure / chip before / chip now / B / B2 / B3">
          <Panel
            title="one rung, six palettes"
            note="`— none` means that ladder has no rung there"
            // Never patterned: every legend swatch is an opaque fill, so a
            // backdrop adds nothing here and costs the token names their contrast.
            backdrop="surface"
            mode={mode}
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {RUNG_ORDER.map((rung) => (
                <LegendColumn key={rung} rung={rung} mode={mode} />
              ))}
            </View>
          </Panel>
        </Row>
      </Surface>
    </View>
  )
}

/**
 * # Lab / Decisions — unified volume-status palette (VW-333, TITAN-E-01)
 *
 * A decision surface, not a component. It is the record the palette was approved
 * from, kept after the fact so the reasoning outlives the ticket.
 *
 * ## DECIDED 2026-09-13, SHIPPED in phase 2
 *
 * The diverging scale as the figure already painted it IS the palette. B, B2 and
 * B3 were all rejected; they stay rendered below with their numbers. So the fix
 * inverted: the CHIP moved onto the figure\u2019s scale and the figure did not
 * move at all. `over` stays `dataviz-diverging-4`, unlifted.
 *
 * ## The defect this closed
 *
 * Two unions, both named `VolumeStatus`, overlapping only on `'over'`: the
 * figure keyed off the landmark zone (`under | maintenance | productive | over`)
 * and the chip off five names of its own. One muscle rendered two hues, and
 * `WorkoutCard` hand-wrote the bridge between them.
 *
 * Now there is one `VolumeStatus` —
 * `untrained | behind | ontrack | target | approaching | over` — shared by
 * `muscleTaxonomy`, the `BodyMap` fill and `MuscleGroupChip`. The old four-value
 * union is `VolumeLandmarkZone`, an internal physiological class, and
 * `landmarkZoneToStatus` is the one place the near-MRV split is decided.
 *
 * ## The shipped palette
 *
 * | status | landmark zone | token |
 * | --- | --- | --- |
 * | `untrained` | 0 sets logged | `text-tertiary` (not a stop on the scale) |
 * | `behind` | below MEV | `dataviz-diverging-0` |
 * | `ontrack` | MEV - MAV | `dataviz-diverging-1` |
 * | `target` | MAV - MRV | `dataviz-diverging-2` |
 * | `approaching` | upper MAV-MRV | `dataviz-diverging-3` |
 * | `over` | above MRV | `dataviz-diverging-4` |
 *
 * `VOLUME_STATUS_DATAVIZ_TOKEN` holds that map, and both surfaces read it, which
 * is what makes a muscle one colour everywhere. The figure resolves it through
 * `getHeatmapColor`; `volume-status-palette.test.tsx` pins each fill to the exact
 * hex it painted before the unification.
 *
 * ## Measured (printed live under each row)
 *
 * | ladder | min adjacent ΔE | min all-pairs ΔE | vs floor 8 |
 * | --- | --- | --- | --- |
 * | **shipped** | **10.9** | **8.7** (`untrained`/`over`) | pass — best measured |
 * | B (rejected) | 8.3 | 8.3 (`ontrack`/`target`) | pass |
 * | B2 (rejected) | 15.3 | 8.7 (`untrained`/`over`) | pass |
 * | B3 (rejected) | 10.0 | 8.3 (`ontrack`/`approaching`) | pass |
 *
 * The shipped ladder ties B2 on the all-pairs floor and beats all three on
 * adjacent separation. Its one substitution against what the figure paints today
 * is `untrained`: `text-tertiary` rather than the `#E0E0E0` no-data literal,
 * which is what lifts the floor from 7.5 to 8.7. The figure never paints that
 * rung — an untrained muscle is simply absent from `data` and keeps the outline
 * fill — so the substitution costs the figure nothing.
 *
 * Variants measured and rejected on the way: a truer yellow for B2 (`amber-200`
 * 8.4, `amber-100` 1.6), a steel blue for B3 (`brand-secondary` 7.4 under the
 * floor; `blue-700` clears CVD at 8.3 but contrasts 1.62:1 against the outline
 * fill), and two greens split by lightness (`status-success-dark` collides with
 * `status-error` at ΔE 4.9 — the classic dark-green/mid-red deuteranopia pair).
 *
 * Full record, including the tables the decision was taken from, in
 * `VolumeStatusPalette.decision.md`.
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Volume Status Palette',
  tags: ['autodocs', 'status:lab'],
  argTypes: {
    backdrop: {
      control: 'inline-radio',
      options: ['pattern', 'surface'],
      description:
        'What the specimens sit on. `pattern` is the honest case — a fill and its glow over a flat plane always look fine.',
    },
  },
  args: { backdrop: 'pattern' },
}

export default meta
type Story = StoryObj<DecisionArgs>

export const Compare: Story = {
  render: (args, context) => (
    <VolumeStatusPaletteDecision
      {...args}
      mode={context?.globals?.theme === 'light' ? 'light' : 'dark'}
    />
  ),
}
