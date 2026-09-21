import { BAR_MAX_WIDTH, GAP_RATIO, computeBarLayout } from '../charts/SetBarChart'
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
  /** Where the label sits so two close lines do not print over each other. */
  labelSide: 'above' | 'below'
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
}

/** `SetBarChart`'s minimum drawn bar height, so a near-zero rep still reads as a rep. */
const MIN_BAR_HEIGHT = 4
/** Two line labels closer than this (px) would overlap, so the lower one moves under its line. */
export const LINE_LABEL_CLEARANCE = 14
const MAX_GUARDS = 2

/** How many columns the chart needs: every performed rep, and empty places up to the zone's top. */
export function bandSlotCount(scale: VelocityBandScale | undefined, performed: number): number {
  const goal = scale?.markers.goal
  const zoneTop = goal?.axis === 'rep' ? Math.max(goal.repsLow, goal.repsHigh) : 0
  return Math.max(performed, zoneTop)
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

function yFor(velocity: number, layout: BandBarLayout): { y: number; clamped: boolean } {
  const raw = layout.scaleDenom > 0 ? (velocity / layout.scaleDenom) * layout.plotHeight : 0
  const y = Math.min(layout.plotHeight, Math.max(0, raw))
  return { y, clamped: y !== raw }
}

export interface BandBarTone {
  band: VelocityBandIndex | null
  lowConfidence: boolean
  suspended: boolean
}

/** How one performed rep (0-based) is toned. A rep at or after a setting change has no band. */
export function barTone(scale: VelocityBandScale, repIndex: number): BandBarTone {
  const from = scale.settingChangedAtRep
  const suspended = from != null && repIndex + 1 >= from
  const band = suspended ? null : (scale.repBands[repIndex] ?? null)
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
  if (slots.length === 0) return null
  const clampRep = (rep: number) => Math.min(slots.length, Math.max(1, Math.round(rep)))
  const repsLow = clampRep(Math.min(marker.repsLow, marker.repsHigh))
  const repsHigh = clampRep(Math.max(marker.repsLow, marker.repsHigh))
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
  if (meaning === 'velocity_loss') return null
  if (marker.role === 'guard' && marker.condition === 'velocity_loss') return null
  return marker.band
}

function lineGeometry(
  marker: VelocityBandLineMarker,
  key: string,
  meaning: VelocityBandScale['meaning'],
  layout: BandBarLayout
): BandLineGeometry | null {
  if (marker.velocityMps == null || !Number.isFinite(marker.velocityMps)) return null
  const { y, clamped } = yFor(marker.velocityMps, layout)
  return {
    key,
    role: marker.role,
    condition: marker.condition,
    y,
    clamped,
    band: lineBand(marker, meaning),
    label: marker.label,
    labelSide: 'above',
    reached: marker.reached,
    firedCue: marker.firedCue ?? false,
  }
}

/** Top line keeps its label above; each next line within the clearance flips its label below. */
function separateLabels(lines: BandLineGeometry[]): BandLineGeometry[] {
  const sorted = [...lines].sort((a, b) => b.y - a.y)
  return sorted.map((line, i) => {
    const prev = sorted[i - 1]
    const crowded = prev != null && prev.y - line.y < LINE_LABEL_CLEARANCE
    return crowded ? { ...line, labelSide: 'below' as const } : line
  })
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
  return separateLabels(lines.filter((l): l is BandLineGeometry => l != null))
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

/** Turn a band scale and a bar layout into everything the overlay paints. Pure; no colour. */
export function velocityBandGeometry(
  scale: VelocityBandScale,
  layout: BandBarLayout
): VelocityBandGeometry {
  const { slots, gap } = bandSlots(layout)
  const bars = barGeometry(scale, layout, slots)
  const goal = scale.markers.goal
  return {
    slots,
    bars,
    zone: goal?.axis === 'rep' ? zoneGeometry(goal, slots, gap, layout.plotWidth) : null,
    lines: slots.length === 0 ? [] : allLines(scale, layout),
    edges: slots.length === 0 ? [] : edgeGeometry(scale, layout),
    pastCue: pastCueGeometry(scale, bars),
    suspension: suspensionGeometry(scale, bars, gap),
  }
}
