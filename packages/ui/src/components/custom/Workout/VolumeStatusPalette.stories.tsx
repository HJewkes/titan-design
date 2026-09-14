// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import BodyHighlighter, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter'
import { Surface, surfaceBackground } from '../../ui/surface'
import { Pill } from '../../ui/pill'
import { Typography } from '../Typography'
import { BodyMap, type BodyMapData } from './BodyMap'
import { MuscleGroupChip, type VolumeStatus as ChipStatus } from './MuscleGroupChip'
import {
  MuscleGroup,
  MUSCLE_TO_SVG_SLUGS,
  isMoreSevere,
  type VolumeStatus as LandmarkZone,
} from './muscleTaxonomy'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import {
  divergingScale,
  greyRamp,
  primitiveColors,
  primitiveRamps,
} from '../../../theme/tokens/primitives'
import { alpha } from '../../../utils/colors'
import { formatTrimmedDecimal } from '../../../utils/number-format'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/** The six rungs any candidate ladder can paint. A 5-value ladder leaves one out. */
type Rung = 'untrained' | 'behind' | 'ontrack' | 'target' | 'approaching' | 'over'

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

/** The wiring the codebase is missing: landmark zone (B) -> UI rung. */
const ZONE_TO_RUNG: Record<LandmarkZone, Rung> = {
  under: 'behind',
  maintenance: 'ontrack',
  productive: 'target',
  over: 'over',
}

const HEAT = WORKOUT_TOKENS.heatmap

/** A painted rung. `token` names a semantic token; `literal` names a raw primitive. */
interface Paint {
  token?: ColorToken
  literal?: string
  label: string
  /** No semantic token carries this value in a fill role. */
  isNew?: boolean
}

function paintValue(paint: Paint, mode: ThemeMode): string {
  return paint.token ? getSemanticColors(mode)[paint.token] : (paint.literal ?? '')
}

/** Index into `divergingScale` when the value IS one of its entries, else null. */
function dsIndex(value: string): number | null {
  const i = divergingScale.findIndex((entry) => entry.toLowerCase() === value.toLowerCase())
  return i === -1 ? null : i
}

/** Today's figure fill — `muscleTaxonomy.ts:213` via `WORKOUT_TOKENS.heatmap`. */
const TODAY_FIGURE: Partial<Record<Rung, Paint>> = {
  untrained: { literal: HEAT.none, label: 'heatmap.none (literal)' },
  behind: { literal: HEAT.under, label: 'blue-500' },
  ontrack: { literal: HEAT.maintenance, label: 'cyan-300' },
  target: { literal: HEAT.productive, label: 'green-200' },
  approaching: { literal: HEAT.approaching, label: 'amber-300' },
  over: { literal: HEAT.over, label: 'red-600' },
}

/** Today's chip dot — `MuscleGroupChip.tsx:15` via `Pill`'s `dotToneStyles`. */
const TODAY_CHIP: Partial<Record<Rung, Paint>> = {
  untrained: { token: 'text-tertiary', label: 'text-tertiary' },
  behind: { token: 'brand-secondary', label: 'brand-secondary' },
  ontrack: { token: 'status-success', label: 'status-success' },
  target: { token: 'brand-primary', label: 'brand-primary' },
  over: { token: 'status-error', label: 'status-error' },
}

interface Ladder {
  id: 'B' | 'B2' | 'B3'
  title: string
  shape: string
  paints: Partial<Record<Rung, Paint>>
}

/**
 * The three candidate ladders. B is the phase-1 proposal (five values, no
 * `approaching`); B2 and B3 are the six-value alternatives, which keep it.
 */
const LADDERS: Ladder[] = [
  {
    id: 'B',
    title: 'B — five values, orange is the target',
    shape: 'grey · blue · green · ORANGE · red',
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
    title: 'B2 — six values, yellow behind / blue on track / green met',
    shape: 'grey · YELLOW · blue · green · orange · red',
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
    title: 'B3 — six values, cold end + two greens',
    shape: 'grey · CYAN · green A · green B · orange · red',
    paints: {
      untrained: { token: 'text-tertiary', label: 'text-tertiary' },
      behind: {
        literal: primitiveRamps.cyan[300],
        label: 'cyan-300 NEW TOKEN NEEDED',
        isNew: true,
      },
      ontrack: { token: 'status-success', label: 'status-success' },
      target: { token: 'status-success-light', label: 'status-success-light' },
      approaching: { token: 'brand-primary', label: 'brand-primary' },
      over: { token: 'status-error', label: 'status-error' },
    },
  },
]

const FRONT: BodyMapData[] = [
  { muscleGroup: MuscleGroup.CHEST, intensity: 0.6, volumeStatus: 'productive', weeklySets: 12 },
  {
    muscleGroup: MuscleGroup.FRONT_DELTS,
    intensity: 0.5,
    volumeStatus: 'maintenance',
    weeklySets: 5,
  },
  { muscleGroup: MuscleGroup.BICEPS, intensity: 0.3, volumeStatus: 'under', weeklySets: 3 },
  { muscleGroup: MuscleGroup.ABS, intensity: 0.9, volumeStatus: 'productive', weeklySets: 15 },
  { muscleGroup: MuscleGroup.QUADS, intensity: 1, volumeStatus: 'over', weeklySets: 22 },
]

const BACK: BodyMapData[] = [
  { muscleGroup: MuscleGroup.LATS, intensity: 0.6, volumeStatus: 'productive', weeklySets: 11 },
  {
    muscleGroup: MuscleGroup.UPPER_BACK,
    intensity: 0.45,
    volumeStatus: 'maintenance',
    weeklySets: 8,
  },
  { muscleGroup: MuscleGroup.TRICEPS, intensity: 0.25, volumeStatus: 'under', weeklySets: 3 },
  { muscleGroup: MuscleGroup.GLUTES, intensity: 0.9, volumeStatus: 'productive', weeklySets: 14 },
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

// react-native-body-highlighter ships as a CommonJS default export; same interop
// BodyMap.tsx:29 uses, so the clone consumes the identical SVG.
const Body = ((BodyHighlighter as unknown as { default?: typeof BodyHighlighter }).default ??
  BodyHighlighter) as typeof BodyHighlighter

const BODY_SCALE = 0.8
const OUTLINE_FILL = alpha(primitiveColors.white, 0.08)
const OUTLINE_BORDER = alpha(primitiveColors.white, 0.12)
const CHECKER_STEP = 16
const SWATCH_CELL_HEIGHT = 88
const LEGEND_COLUMN_WIDTH = 120
const DOT_SIZE = 6

/**
 * Which rung a landmark zone paints under a given ladder. A five-value ladder
 * has no `approaching`, so its near-MRV muscles fold back onto `target`.
 */
function rungFor(zone: LandmarkZone, intensity: number, ladder: Ladder): Rung {
  const rung = ZONE_TO_RUNG[zone]
  const nearMrv = rung === 'target' && intensity >= 0.85
  return nearMrv && ladder.paints.approaching ? 'approaching' : rung
}

/** Build the per-slug fill list for one ladder (the `BodyMap.tsx:75` shape). */
function ladderSlugParts(data: BodyMapData[], ladder: Ladder, mode: ThemeMode): ExtendedBodyPart[] {
  const bySlug = new Map<string, BodyMapData>()
  for (const d of data) {
    for (const slug of MUSCLE_TO_SVG_SLUGS[d.muscleGroup] ?? []) {
      const existing = bySlug.get(slug)
      if (!existing || isMoreSevere(d.volumeStatus, existing.volumeStatus)) bySlug.set(slug, d)
    }
  }
  return Array.from(bySlug.entries()).map(([slug, d]) => ({
    slug: slug as Slug,
    color: paintValue(ladder.paints[rungFor(d.volumeStatus, d.intensity, ladder)] as Paint, mode),
  }))
}

/**
 * Story-local figure clone. `BodyMap` resolves its fills internally through
 * `getHeatmapColor` and takes no colour override, so a proposal row renders the
 * same `react-native-body-highlighter` SVG with the same scale, default fill and
 * border, differing only in the per-slug colour.
 */
function LadderFigure({
  data,
  view,
  ladder,
  mode,
}: {
  data: BodyMapData[]
  view: 'front' | 'back'
  ladder: Ladder
  mode: ThemeMode
}) {
  return (
    <View style={{ width: 200 * BODY_SCALE, gap: 4 }} testID={`ladder-figure-${ladder.id}-${view}`}>
      <Typography variant="caption" color="tertiary" align="center">
        {view}
      </Typography>
      <Body
        side={view}
        data={ladderSlugParts(data, ladder, mode)}
        scale={BODY_SCALE}
        gender="male"
        defaultFill={OUTLINE_FILL}
        border={OUTLINE_BORDER}
      />
    </View>
  )
}

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
      <LegendCell paint={TODAY_FIGURE[rung]} caption="figure today" mode={mode} />
      <LegendCell paint={TODAY_CHIP[rung]} caption="chip today" mode={mode} />
      {LADDERS.map((ladder) => (
        <LegendCell key={ladder.id} paint={ladder.paints[rung]} caption={ladder.id} mode={mode} />
      ))}
    </View>
  )
}

function TodayChips() {
  const chipStatus: ChipStatus[] = ['untrained', 'behind', 'ontrack', 'target', 'over']
  return (
    <View style={{ gap: 6 }}>
      {chipStatus.map((status) => (
        <MuscleGroupChip key={status} name={RUNG_LABEL[status]} volumeStatus={status} />
      ))}
    </View>
  )
}

/**
 * Ladder chips are the same `Pill` primitive `MuscleGroupChip` is a preset over.
 * The dot is passed as an explicit node rather than `dotTone`, because B2 and B3
 * paint rungs (`status-success-light`, `cyan-300`) that no `PillTone` carries —
 * B alone maps one-to-one onto the existing tones.
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

/** The numbers under a ladder: adjacent CVD ΔE, the two minima, and contrast. */
function Measurements({ ladder, mode }: { ladder: Ladder; mode: ThemeMode }) {
  const m = measure(ladder, mode)
  const passes = m.minAll >= CVD_FLOOR
  return (
    <View style={{ gap: 3, maxWidth: 520 }} testID={`measurements-${ladder.id}`}>
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

function LadderRow({
  ladder,
  selected,
  backdrop,
  mode,
}: {
  ladder: Ladder
  selected: boolean
  backdrop: DecisionArgs['backdrop']
  mode: ThemeMode
}) {
  return (
    <View style={{ gap: 8 }}>
      <Row label={ladder.title}>
        <Panel
          title={`figure ${ladder.id}`}
          note={
            selected
              ? 'same SVG, story-local fills — BodyMap takes no colour override'
              : `switch the \`proposal\` control to ${ladder.id} to paint the figure`
          }
          backdrop={backdrop}
          mode={mode}
        >
          {selected ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <LadderFigure data={FRONT} view="front" ladder={ladder} mode={mode} />
              <LadderFigure data={BACK} view="back" ladder={ladder} mode={mode} />
            </View>
          ) : (
            <Typography variant="caption" color="tertiary">
              {ladder.shape}
            </Typography>
          )}
        </Panel>
        <Panel
          title={`chips ${ladder.id}`}
          note="the same Pill primitive, explicit dot"
          backdrop={backdrop}
          mode={mode}
        >
          <LadderChips ladder={ladder} mode={mode} />
        </Panel>
      </Row>
      <Measurements ladder={ladder} mode={mode} />
    </View>
  )
}

interface DecisionArgs {
  backdrop: 'pattern' | 'surface'
  proposal: 'B' | 'B2' | 'B3'
}

function VolumeStatusPaletteDecision({
  backdrop,
  proposal,
  mode,
}: DecisionArgs & { mode: ThemeMode }) {
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
            Volume status: two palettes today, three candidate ladders
          </Typography>
          <Typography variant="body2" color="secondary">
            Same muscle, two hues. The figure keys off `VolumeStatus` in muscleTaxonomy.ts:191; the
            chip keys off its own `VolumeStatus` in MuscleGroupChip.tsx:6. `ds[n]` in row C marks a
            value that IS `divergingScale[n]` — a literal primitive, not a theme-aware token.
          </Typography>
        </View>

        <Row label="A — today">
          <Panel
            title="figure today"
            note="BodyMap, getHeatmapColor (muscleTaxonomy.ts:213)"
            backdrop={backdrop}
            mode={mode}
          >
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <BodyMap data={FRONT} view="front" mode="simple" />
              <BodyMap data={BACK} view="back" mode="simple" />
            </View>
          </Panel>
          <Panel
            title="chips today"
            note="MuscleGroupChip, dotTone map (MuscleGroupChip.tsx:15)"
            backdrop={backdrop}
            mode={mode}
          >
            <TodayChips />
          </Panel>
        </Row>

        {LADDERS.map((ladder) => (
          <LadderRow
            key={ladder.id}
            ladder={ladder}
            selected={ladder.id === proposal}
            backdrop={backdrop}
            mode={mode}
          />
        ))}

        <Row label="C — legend: today figure / today chip / B / B2 / B3">
          <Panel
            title="one rung, five palettes"
            note="`— none` means the ladder has no rung there"
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
 * # Lab / Decisions — unified volume-status palette (VW-333 phase 1, TITAN-E-01)
 *
 * A decision surface, not a component. Nothing here changes a token, a component
 * API or a baseline; it renders today's two palettes beside three candidate
 * ladders so a palette can be approved from pixels plus measured numbers.
 *
 * ## The defect
 *
 * Two unions, both named `VolumeStatus`, both reachable, overlapping only on
 * `'over'`. The same muscle renders one hue on the figure and a different hue on
 * the chip. `WorkoutCard.tsx:52` already carries a hand-written bridge between
 * them (`under -> behind`, `maintenance -> ontrack`, `productive -> target`).
 *
 * ## Current mapping — figure (taxonomy B)
 *
 * `muscleTaxonomy.ts:191` declares `under | maintenance | productive | over`;
 * `getHeatmapColor` (`muscleTaxonomy.ts:213`) resolves it through
 * `WORKOUT_TOKENS.heatmap` (`theme/workout-tokens.ts:28`), which is the
 * `divergingScale` primitive (`theme/tokens/primitives.ts:321`).
 *
 * | status | token | hex |
 * | --- | --- | --- |
 * | (no data) | `heatmap.none` — a literal, not a token | `#E0E0E0` |
 * | `under` | `divergingScale[0]` = `blue-500` | `#2196F3` |
 * | `maintenance` | `divergingScale[1]` = `cyan-300` | `#22D3EE` |
 * | `productive` | `divergingScale[2]` = `green-200` | `#58F69E` |
 * | `productive` + intensity >= 0.85 | `divergingScale[3]` = `amber-300` | `#F9B415` |
 * | `over` | `divergingScale[4]` = `red-600` | `#D14343` |
 *
 * ## Current mapping — chip (taxonomy A)
 *
 * `MuscleGroupChip.tsx:6` declares `untrained | behind | ontrack | target | over`
 * and maps each to a `PillTone` (`MuscleGroupChip.tsx:15`); `Pill` resolves the
 * tone to a semantic token (`Pill.tsx:109`). Dark-mode hexes below.
 *
 * | status | PillTone | token | hex |
 * | --- | --- | --- | --- |
 * | `untrained` | `neutral` | `text-tertiary` | `#888684` |
 * | `behind` | `brand-secondary` | `brand-secondary` = `cyan-600` | `#307B9B` |
 * | `ontrack` | `success` | `status-success` = `green-300` | `#2ED573` |
 * | `target` | `brand` | `brand-primary` = `orange-400` | `#FF7900` |
 * | `over` | `error` | `status-error` = `red-600` | `#D14343` |
 *
 * ## Is `divergingScale` theme-aware?
 *
 * **No.** It is a plain array of literal hexes in `primitives.ts`, consumed as
 * literals through `WORKOUT_TOKENS.heatmap`. It is not `var()`-backed, so the
 * figure paints identically in light and dark — which is why the light-mode
 * figure has no light-mode answer today.
 *
 * Four of its five entries have an exact SEMANTIC twin, so a ladder can quote the
 * scale and still be theme-aware: `ds[0]` = `status-info`, `ds[2]` =
 * `status-success-light`, `ds[3]` = `status-warning`, `ds[4]` = `status-error`.
 * Only `ds[1]` (`cyan-300`) has no fill-role token — its only semantic use is
 * `on-brand-secondary-subtle`, a text role. Row C prints `= ds[n]` next to every
 * value that matches, computed at render rather than asserted.
 *
 * Today every `status-*` token holds the same hex in both themes, so a ladder
 * built from them resolves identically light and dark; the one rung that really
 * moves is `untrained` (`text-tertiary`: `#888684` dark, `#A29F9D` light).
 *
 * ## The three ladders
 *
 * | rung | B (5) | B2 (6) | B3 (6) |
 * | --- | --- | --- | --- |
 * | `untrained` | `text-tertiary` | `text-tertiary` | `text-tertiary` |
 * | `behind` | `status-info` | `status-warning` = ds[3] | `cyan-300` = ds[1] **NEW TOKEN NEEDED** |
 * | `ontrack` | `status-success` | `status-info` = ds[0] | `status-success` |
 * | `target` | `brand-primary` | `status-success-light` = ds[2] | `status-success-light` = ds[2] |
 * | `approaching` | — folds into `target` | `brand-primary` | `brand-primary` |
 * | `over` | `status-error` | `status-error` = ds[4] | `status-error` = ds[4] |
 *
 * B2 needs **no new token**: four of its six rungs are `divergingScale` entries
 * quoted through their semantic twins. B3 needs one — `cyan-300` has no fill-role
 * token. `brand-primary` (orange) is not a `divergingScale` entry; the scale's
 * warm side is `amber-300`, a gold, which B2 spends on `behind`.
 *
 * ## Measured (printed live under each row)
 *
 * | ladder | min adjacent ΔE | min all-pairs ΔE | verdict vs floor 8 |
 * | --- | --- | --- | --- |
 * | B | 8.3 | 8.3 (`ontrack`/`target`) | pass |
 * | B2 | 15.3 | **8.7** (`untrained`/`over`) | pass — best of the three |
 * | B3 | 10.0 | 8.3 (`ontrack`/`approaching`) | pass |
 *
 * Two variants that were measured and rejected, both of which the brief asked
 * about directly:
 *
 * - **A truer yellow for B2.** `amber-200` (`#FFD352`) instead of `status-warning`
 *   drops the ladder to 8.4, and `amber-100` to 1.6 — the yellower it gets the
 *   closer it sits to the green. The gold is both safer and already a token.
 * - **A steel blue for B3.** `brand-secondary` (`cyan-600`) is the genuine steel
 *   blue, but it lands 7.4 against `untrained` grey — under the floor. `blue-700`
 *   clears CVD at 8.3 but contrasts 1.62:1 against the figure's outline fill, so
 *   it barely reads as a fill. `cyan-300` is the one cold value that clears both.
 * - **Two greens split by lightness.** `status-success-dark` as the second green
 *   collides with `status-error` under deuteranopia (ΔE 4.9) — a dark green and a
 *   mid red are the classic confusion. B3's two greens are the light pair.
 *
 * ## Open questions for the approver
 *
 * 1. B, B2 or B3. B2 measures best and matches the stated preference (blue for on
 *    track, green for met); B3 keeps a cold `behind` but needs one new token.
 * 2. If B wins, `approaching` has no home — fold it into `target` and lose the
 *    near-MRV warning, or move it to a non-hue channel (glow, dashed edge)?
 * 3. On the figure, `untrained` currently means "absent from `data`" and paints
 *    the outline fill. Keep that, or paint `text-tertiary` like the chip dot?
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Volume Status Palette',
  tags: ['autodocs', 'status:lab'],
  argTypes: {
    backdrop: {
      control: 'inline-radio',
      options: ['pattern', 'surface'],
      description:
        'What the panels sit on. `pattern` is the honest case — a fill and its glow over a flat plane always look fine.',
    },
    proposal: {
      control: 'inline-radio',
      options: ['B', 'B2', 'B3'],
      description: 'Which ladder paints the figure. Chips and numbers render for all three.',
    },
  },
  args: { backdrop: 'pattern', proposal: 'B2' },
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
