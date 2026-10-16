import type { DimensionValue } from 'react-native'

/** Density. `default` — the compact card/rail gauge. `wall` — the across-the-room dashboard scale. */
export type ZoneTrackSize = 'default' | 'wall'

export interface ZoneTrackSizing {
  trackHeight: number
  needleOverhang: number
  needleWidth: number
  tickLineNormal: number
  tickLineEmphasized: number
  tickLineHeightPad: number
  tickLineTopPad: number
  labelRowHeight: number
  labelMarginTop: number
  tickFont: number
  tickLetterSpacing: number
  tickCellWidth: number
}

/**
 * Per-density magnitudes. `default` reproduces the original compact values exactly;
 * `wall` scales the track, needle, tick lines and tick labels up together so the gauge
 * reads across a room. `trackHeight` / `needleOverhang` remain overridable per call.
 */
export const ZONE_SIZES: Record<ZoneTrackSize, ZoneTrackSizing> = {
  default: {
    trackHeight: 14,
    needleOverhang: 6,
    needleWidth: 4,
    tickLineNormal: 1.5,
    tickLineEmphasized: 2,
    tickLineHeightPad: 4,
    tickLineTopPad: 2,
    labelRowHeight: 16,
    labelMarginTop: 5,
    tickFont: 9,
    tickLetterSpacing: 0.5,
    tickCellWidth: 28,
  },
  wall: {
    trackHeight: 24,
    needleOverhang: 9,
    needleWidth: 7,
    tickLineNormal: 2.5,
    tickLineEmphasized: 3.5,
    tickLineHeightPad: 6,
    tickLineTopPad: 3,
    labelRowHeight: 24,
    labelMarginTop: 8,
    tickFont: 14,
    tickLetterSpacing: 0.5,
    tickCellWidth: 48,
  },
}

/** A single colour band of the zone gradient, spanning `[prev.upTo, upTo]` of the domain. */
export interface ZoneTrackZone {
  /** Upper bound of this band in domain units. The last band's `upTo` should reach `max`. */
  upTo: number
  /** Band fill colour — a literal hex (RNW-safe), sourced from a ramp/effort-scale token. */
  color: string
}

/**
 * A tick at `value`: a colored line over the track + an optional compact label
 * below, with an optional tooltip (to expand an acronym / show the raw value so
 * the label footer can stay light). Multiple ticks are supported.
 */
export interface ZoneTrackTick {
  /** Position of the tick in domain units. */
  value: number
  /** Optional compact label rendered under the tick. */
  label?: string
  /** Line + label colour. Defaults to a muted tick colour (or brand when `emphasized`). */
  color?: string
  /** Emphasize this tick (thicker line, brand colour by default) — e.g. a target landmark. */
  emphasized?: boolean
  /** Tooltip content shown on hover (web) / long-press (native) — expand the acronym, show the raw value. */
  tooltip?: string
}

/**
 * The value marker sitting on the track.
 * - `needle`: a vertical line at `value`, overhanging the track (FatigueMeter / TrainingLoadGauge).
 * - `fill`: a left-anchored fill from `min` to `value`. Omit `color` to clip-reveal the zone
 *   gradient up to `value`; supply `color` for a solid trend-coloured fill (FatigueGauge-style).
 */
export type ZoneTrackMarker =
  | { type: 'needle'; value: number; color?: string; glow?: boolean }
  | { type: 'fill'; value: number; color?: string; glow?: boolean }

/** An optional translucent range highlight (e.g. RpeCalibration's predicted CI band). */
export interface ZoneTrackBand {
  /** Range start in domain units. */
  from: number
  /** Range end in domain units. */
  to: number
  /** Highlight colour (typically a translucent token). */
  color: string
}

/** The resolved domain and vertical metrics every part of the track lays out against. */
export interface ZoneTrackLayout {
  min: number
  max: number
  sizing: ZoneTrackSizing
  trackHeight: number
  markerHeight: number
  markerFrac: number
  isNeedle: boolean
}

/** Map a domain value to a clamped 0..1 fraction of the track width. */
export function fraction(value: number, min: number, max: number): number {
  if (max <= min) return 0
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

export function pct(frac: number): DimensionValue {
  return `${frac * 100}%`
}

/** Each zone's colour and its clamped domain span, used as the band's flex weight. */
export function zoneBands(
  zones: ZoneTrackZone[],
  min: number,
  max: number
): Array<{ color: string; weight: number }> {
  return zones.map((zone, i) => {
    const prev = i === 0 ? min : zones[i - 1].upTo
    const start = Math.max(min, Math.min(max, prev))
    const end = Math.max(min, Math.min(max, zone.upTo))
    return { color: zone.color, weight: Math.max(0, end - start) }
  })
}

/** Every how-many-th tick keeps its label so each fits its fixed cell. Width 0 → 1 (show all). */
export function tickLabelStep(trackWidth: number, tickCount: number, cellWidth: number): number {
  const tickSpacing = trackWidth > 0 && tickCount > 0 ? trackWidth / tickCount : Infinity
  return tickSpacing < cellWidth ? Math.ceil(cellWidth / tickSpacing) : 1
}

/** Keep the first, last, evenly-stepped, and any emphasized ticks; drop the rest's labels. */
export function showsTickLabel(i: number, emphasized: boolean, step: number, count: number) {
  return step <= 1 || i === 0 || i === count - 1 || i % step === 0 || emphasized
}

export function zoneTrackLayout({
  min,
  max,
  marker,
  size,
  trackHeight: trackHeightProp,
  needleOverhang: needleOverhangProp,
}: {
  min: number
  max: number
  marker: ZoneTrackMarker | null
  size: ZoneTrackSize
  trackHeight?: number
  needleOverhang?: number
}): ZoneTrackLayout {
  const s = ZONE_SIZES[size]
  const trackHeight = trackHeightProp ?? s.trackHeight
  const needleOverhang = needleOverhangProp ?? s.needleOverhang
  const isNeedle = marker?.type === 'needle'
  const markerHeight = isNeedle ? trackHeight + needleOverhang * 2 : trackHeight
  const markerFrac = marker != null ? fraction(marker.value, min, max) : 0
  return { min, max, sizing: s, trackHeight, markerHeight, markerFrac, isNeedle }
}
