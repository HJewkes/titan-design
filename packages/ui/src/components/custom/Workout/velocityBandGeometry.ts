import { BAR_MAX_WIDTH, GAP_RATIO, computeBarLayout } from '../charts/SetBarChart'
import {
  BAND_LABEL_METRICS,
  placeBandLabels,
  type BandLabel,
  type BandLabelMetrics,
  type BandLabelRequest,
} from './velocityBandLabels'
import type {
  VelocityBandCondition,
  VelocityBandIndex,
  VelocityBandLineMarker,
  VelocityBandMarker,
  VelocityBandRepMarker,
  VelocityBandScale,
} from './VelocityBandScale'

/** The bar chart the overlay sits on, in the terms `SetBarChart` lays out its columns. */
export interface BandBarLayout {
  plotWidth: number
  plotHeight: number
  /** Columns drawn: performed reps, then empty places up to the goal's top rep. */
  slotCount: number
  /** Measured mean velocity per performed rep (m/s). Bar height; never snapped to a band edge. */
  velocities: readonly number[]
  /** A value `v` sits `v / scaleDenom * plotHeight` px above the baseline (`SetBarGeometry`). */
  scaleDenom: number
  gapRatio?: number
}

export interface BandSlotGeometry {
  x: number
  width: number
}

export interface BandBarGeometry extends BandSlotGeometry {
  repNumber: number
  /** px above the baseline. */
  height: number
  band: VelocityBandIndex | null
  lowConfidence: boolean
  suspended: boolean
}

export interface BandZoneGeometry {
  /** Left edge of the `repsLow` slot and right edge of the `repsHigh` slot. */
  x0: number
  x1: number
  /** The light tick before `repsLow` and the full line after `repsHigh`, centred in the gaps. */
  tickX: number
  endX: number
  repsLow: number
  repsHigh: number
  label: string
  reached: boolean
  firedCue: boolean
}

export interface BandLineGeometry {
  key: string
  role: 'goal' | 'guard'
  condition: VelocityBandCondition
  /** px above the baseline, clamped into the plot. */
  y: number
  clamped: boolean
  band: VelocityBandIndex | null
  label: string
  reached: boolean
  firedCue: boolean
}

export interface BandPastCueGeometry {
  x0: number
  x1: number
  /** Height of the tallest bar past the cue, so a mark can sit just over the bars it counts. */
  top: number
  count: number
  label: string
}

export interface BandSuspensionGeometry {
  x: number
  fromRep: number
  label: string | null
}

export interface VelocityBandGeometry {
  slots: BandSlotGeometry[]
  bars: BandBarGeometry[]
  zone: BandZoneGeometry | null
  lines: BandLineGeometry[]
  edges: { band: 1 | 2 | 3; y: number }[]
  pastCue: BandPastCueGeometry | null
  suspension: BandSuspensionGeometry | null
  /** Every label, placed so none overlaps another or leaves the plot. */
  labels: BandLabel[]
}

/** `SetBarChart`'s minimum drawn bar height, so a near-zero rep still reads as a rep. */
const MIN_BAR_HEIGHT = 4
const MAX_GUARDS = 2
/** A bad plan cannot pad the chart with more empty places than this past the performed reps. */
export const MAX_EMPTY_PLACES = 20

/** A rep bound the zone can use: finite, rounded, and at least rep 1. */
function repBound(rep: number): number | null {
  return Number.isFinite(rep) && Math.round(rep) >= 1 ? Math.round(rep) : null
}

/** How many columns the chart needs: every performed rep, and empty places up to the zone's top. */
export function bandSlotCount(scale: VelocityBandScale | undefined, performed: number): number {
  const goal = scale?.markers.goal
  const high = goal?.axis === 'rep' ? repBound(Math.max(goal.repsLow, goal.repsHigh)) : null
  return Math.max(performed, Math.min(high ?? 0, performed + MAX_EMPTY_PLACES))
}

/** Column positions exactly as `SetBarChart`'s flex row places them (left-aligned, width-capped). */
export function bandSlots(layout: BandBarLayout): { slots: BandSlotGeometry[]; gap: number } {
  const { plotWidth, slotCount } = layout
  if (plotWidth <= 0 || slotCount <= 0) return { slots: [], gap: 0 }
  const { gap } = computeBarLayout(plotWidth, slotCount, layout.gapRatio ?? GAP_RATIO)
  const width = Math.min(BAR_MAX_WIDTH, (plotWidth - (slotCount - 1) * gap) / slotCount)
  const slots = Array.from({ length: slotCount }, (_, i) => ({ x: i * (width + gap), width }))
  return { slots, gap }
}

/** A non-finite or empty height scale means the chart cannot say where any velocity sits. */
function scaleIsValid(layout: BandBarLayout): boolean {
  return Number.isFinite(layout.scaleDenom) && layout.scaleDenom > 0
}

function yFor(velocity: number, layout: BandBarLayout): { y: number; clamped: boolean } {
  const raw = scaleIsValid(layout) ? (velocity / layout.scaleDenom) * layout.plotHeight : 0
  const y = Math.min(layout.plotHeight, Math.max(0, raw))
  return { y, clamped: y !== raw }
}

export interface BandBarTone {
  band: VelocityBandIndex | null
  lowConfidence: boolean
  suspended: boolean
}

function validBand(band: unknown): VelocityBandIndex | null {
  return band === 0 || band === 1 || band === 2 || band === 3 ? band : null
}

/**
 * How one performed rep (0-based) is toned. A rep at or after a setting change has no band, nor
 * does any rep when the scale means `none`. A band outside 0 to 3 is dropped, not drawn.
 */
export function barTone(scale: VelocityBandScale, repIndex: number): BandBarTone {
  const from = scale.settingChangedAtRep
  const suspended = from != null && from >= 1 && repIndex + 1 >= from
  const band = suspended || scale.meaning === 'none' ? null : validBand(scale.repBands[repIndex])
  return {
    band,
    lowConfidence: band != null && scale.repConfidence?.[repIndex] === 'low',
    suspended,
  }
}

function barGeometry(
  scale: VelocityBandScale,
  layout: BandBarLayout,
  slots: BandSlotGeometry[]
): BandBarGeometry[] {
  return layout.velocities.slice(0, slots.length).map((velocity, i) => ({
    ...slots[i],
    ...barTone(scale, i),
    repNumber: i + 1,
    height: Math.max(MIN_BAR_HEIGHT, yFor(velocity, layout).y),
  }))
}

function zoneGeometry(
  marker: VelocityBandRepMarker,
  slots: BandSlotGeometry[],
  gap: number,
  plotWidth: number
): BandZoneGeometry | null {
  const low = repBound(Math.min(marker.repsLow, marker.repsHigh))
  const high = repBound(Math.max(marker.repsLow, marker.repsHigh))
  if (low == null || high == null || high > slots.length) return null
  const repsLow = low
  const repsHigh = high
  const first = slots[repsLow - 1]
  const last = slots[repsHigh - 1]
  return {
    x0: first.x,
    x1: last.x + last.width,
    tickX: Math.max(0, first.x - gap / 2),
    endX: Math.min(plotWidth, last.x + last.width + gap / 2),
    repsLow,
    repsHigh,
    label: marker.label,
    reached: marker.reached,
    firedCue: marker.firedCue ?? false,
  }
}

/**
 * The colour a line may carry. Tier a claims no effort, so every line is neutral there; a loss
 * guard is neutral in every tier. Only an effort line or a loss goal in tier b keeps its band.
 */
export function lineBand(
  marker: VelocityBandLineMarker,
  meaning: VelocityBandScale['meaning']
): VelocityBandIndex | null {
  if (meaning !== 'effort') return null
  if (marker.role === 'guard' && marker.condition === 'velocity_loss') return null
  return marker.band
}

function lineGeometry(
  marker: VelocityBandLineMarker,
  key: string,
  meaning: VelocityBandScale['meaning'],
  layout: BandBarLayout
): BandLineGeometry | null {
  const mps = marker.velocityMps
  if (mps == null || !Number.isFinite(mps) || mps <= 0) return null
  const { y, clamped } = yFor(mps, layout)
  return {
    key,
    role: marker.role,
    condition: marker.condition,
    y,
    clamped,
    band: lineBand(marker, meaning),
    label: marker.label,
    reached: marker.reached,
    firedCue: marker.firedCue ?? false,
  }
}

function allLines(scale: VelocityBandScale, layout: BandBarLayout): BandLineGeometry[] {
  const { goal, guards } = scale.markers
  const entries: [VelocityBandMarker | null, string][] = [
    [goal, 'goal'],
    ...guards.slice(0, MAX_GUARDS).map((g, i): [VelocityBandMarker, string] => [g, `guard-${i}`]),
  ]
  const lines = entries.flatMap(([marker, key]) =>
    marker?.axis === 'velocity' ? [lineGeometry(marker, key, scale.meaning, layout)] : []
  )
  return lines.filter((l): l is BandLineGeometry => l != null).sort((a, b) => b.y - a.y)
}

function edgeGeometry(scale: VelocityBandScale, layout: BandBarLayout) {
  const edges = scale.edgesMps ?? [null, null, null]
  return edges.flatMap((mps, i) =>
    mps == null || !Number.isFinite(mps)
      ? []
      : [{ band: (i + 1) as 1 | 2 | 3, y: yFor(mps, layout).y }]
  )
}

function pastCueGeometry(
  scale: VelocityBandScale,
  bars: BandBarGeometry[]
): BandPastCueGeometry | null {
  const cue = scale.cue
  if (cue?.atRep == null || cue.repsPast <= 0) return null
  const past = bars.filter(
    (b) => b.repNumber > cue.atRep! && b.repNumber <= cue.atRep! + cue.repsPast
  )
  if (past.length === 0) return null
  const last = past[past.length - 1]
  return {
    x0: past[0].x,
    x1: last.x + last.width,
    top: Math.max(...past.map((b) => b.height)),
    count: cue.repsPast,
    label: cue.pastLabel ?? `+${cue.repsPast}`,
  }
}

function suspensionGeometry(
  scale: VelocityBandScale,
  bars: BandBarGeometry[],
  gap: number
): BandSuspensionGeometry | null {
  const first = bars.find((b) => b.suspended)
  if (first == null) return null
  return {
    x: Math.max(0, first.x - gap / 2),
    fromRep: first.repNumber,
    label: scale.settingChangedLabel ?? null,
  }
}

type Spot = BandLabelRequest['candidates'][number]

function zoneLabel(zone: BandZoneGeometry, m: BandLabelMetrics, top: number): BandLabelRequest {
  const right = zone.endX - m.inset
  const candidates: Spot[] = [top, top - m.height].flatMap((y) => [
    { x: right, y, align: 'right' as const },
    { x: zone.x0 + m.inset, y, align: 'left' as const },
  ])
  return { key: 'zone', text: zone.label, ink: 'ink', candidates }
}

function lineLabel(
  line: BandLineGeometry,
  plotWidth: number,
  m: BandLabelMetrics
): BandLabelRequest {
  const above = line.y + 2
  const below = line.y - m.height - 2
  const candidates: Spot[] = [above, below, above + m.height, below - m.height].flatMap((y) => [
    { x: plotWidth, y, align: 'right' as const },
    { x: 0, y, align: 'left' as const },
  ])
  return { key: `line-${line.key}`, text: line.label, ink: line.band ?? 'ink', candidates }
}

function suspensionLabel(
  mark: BandSuspensionGeometry,
  m: BandLabelMetrics,
  top: number
): BandLabelRequest | null {
  if (mark.label == null) return null
  const candidates: Spot[] = [top, top - m.height, top - 2 * m.height].flatMap((y) => [
    { x: mark.x + m.inset, y, align: 'left' as const },
    { x: mark.x - m.inset, y, align: 'right' as const },
  ])
  return { key: 'suspension', text: mark.label, ink: 'ink', candidates }
}

function pastCueLabel(past: BandPastCueGeometry, m: BandLabelMetrics): BandLabelRequest {
  const centre = (past.x0 + past.x1) / 2
  const lifts = [0, 1, 2, 3, 4].map((step) => past.top + 6 + step * m.height)
  const candidates: Spot[] = lifts.map((y) => ({ x: centre, y, align: 'center' as const }))
  return { key: 'past-cue', text: past.label, ink: 'ink', candidates }
}

/** Every label, most important first: the zone, the lines top to bottom, the change, the count. */
function labelRequests(
  parts: Omit<VelocityBandGeometry, 'labels'>,
  layout: BandBarLayout,
  m: BandLabelMetrics
): BandLabelRequest[] {
  const top = layout.plotHeight - m.height
  return [
    parts.zone ? zoneLabel(parts.zone, m, top) : null,
    ...parts.lines.map((line) => lineLabel(line, layout.plotWidth, m)),
    parts.suspension ? suspensionLabel(parts.suspension, m, top) : null,
    parts.pastCue ? pastCueLabel(parts.pastCue, m) : null,
  ].filter((r): r is BandLabelRequest => r != null)
}

/** Turn a band scale and a bar layout into everything the overlay paints. Pure; no colour. */
export function velocityBandGeometry(
  scale: VelocityBandScale,
  layout: BandBarLayout,
  metrics: BandLabelMetrics = BAND_LABEL_METRICS
): VelocityBandGeometry {
  const { slots, gap } = bandSlots(layout)
  const bars = barGeometry(scale, layout, slots)
  const goal = scale.markers.goal
  const measurable = slots.length > 0 && scaleIsValid(layout)
  const parts = {
    slots,
    bars,
    zone:
      goal?.axis === 'rep' && slots.length > 0
        ? zoneGeometry(goal, slots, gap, layout.plotWidth)
        : null,
    lines: measurable ? allLines(scale, layout) : [],
    edges: measurable ? edgeGeometry(scale, layout) : [],
    pastCue: pastCueGeometry(scale, bars),
    suspension: suspensionGeometry(scale, bars, gap),
  }
  const plot = { width: layout.plotWidth, height: layout.plotHeight }
  return { ...parts, labels: placeBandLabels(labelRequests(parts, layout, metrics), plot, metrics) }
}
