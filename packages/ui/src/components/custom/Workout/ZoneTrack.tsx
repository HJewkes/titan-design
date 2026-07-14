// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps, type DimensionValue } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { alpha } from '../../../utils/colors'
import { Tooltip } from '../../ui/tooltip/Tooltip'

const t = getSemanticColors('dark')

/** Soft two-stop glow in `color`, for a marker's optional `glow`. */
function glowShadow(color: string): string {
  return `0 0 5px 1px ${alpha(color, 0.3)}, 0 0 10px 3px ${alpha(color, 0.12)}`
}

/** Muted, un-reached track colour — a charcoal step, matches the IntensityBar track family. */
const DEFAULT_TRACK_COLOR = primitiveColors.charcoal[200]
/** Default needle / fill-marker colour. */
const DEFAULT_MARKER_COLOR = primitiveColors.white
/** Tick mark + tick label colour. */
const TICK_COLOR = t['text-tertiary']

/** Density. `default` — the compact card/rail gauge. `wall` — the across-the-room dashboard scale. */
export type ZoneTrackSize = 'default' | 'wall'

interface ZoneTrackSizing {
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
const ZONE_SIZES: Record<ZoneTrackSize, ZoneTrackSizing> = {
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

export interface ZoneTrackProps extends ViewProps {
  /** Ordered zone bands, laid left→right; each covers `[previous.upTo, upTo]` of the domain. */
  zones: ZoneTrackZone[]
  /** Domain maximum (right edge). */
  max: number
  /** Domain minimum (left edge). Default 0. */
  min?: number
  /** The value marker — a needle line or a left-anchored fill. Omit for a bare gradient track. */
  marker?: ZoneTrackMarker | null
  /** Optional tick marks with labels below the track. */
  ticks?: ZoneTrackTick[]
  /** Optional translucent range highlight drawn over the gradient. */
  band?: ZoneTrackBand | null
  /** Density: `default` (compact) or `wall` (the across-the-room dashboard scale). Scales track, needle, ticks and labels together. */
  size?: ZoneTrackSize
  /** Track height in px. Overrides the `size` default (14 default / 24 wall). */
  trackHeight?: number
  /** How far a needle marker overhangs the track top + bottom, in px. Overrides the `size` default (6 default / 9 wall). */
  needleOverhang?: number
  /** Muted colour of the track behind / beyond the fill. Default a charcoal step. */
  trackColor?: string
  className?: string
}

/** Map a domain value to a clamped 0..1 fraction of the track width. */
function fraction(value: number, min: number, max: number): number {
  if (max <= min) return 0
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

function pct(frac: number): DimensionValue {
  return `${frac * 100}%`
}

/**
 * Low-level gauge primitive: a horizontal pill track carrying an N-band zone gradient,
 * optional tick marks with labels, and a single value marker (a needle line or a
 * left-anchored fill). The zone bands are weighted by their domain span, so thresholds
 * need not be evenly spaced. This is the shared visual base for the linear gauge family
 * (FatigueMeter needle, TrainingLoadGauge zone bar, RpeCalibration band + marker) — pass
 * the domain (`min`/`max`), the `zones`, and a `marker`; colours are literal hex from the
 * ramp tokens (never `var()` refs, so they survive the RNW/vitest alias).
 */
export function ZoneTrack({
  zones,
  max,
  min = 0,
  marker = null,
  ticks,
  band = null,
  size = 'default',
  trackHeight: trackHeightProp,
  needleOverhang: needleOverhangProp,
  trackColor = DEFAULT_TRACK_COLOR,
  className,
  style,
  accessibilityLabel,
  ...props
}: ZoneTrackProps) {
  const s = ZONE_SIZES[size]
  const trackHeight = trackHeightProp ?? s.trackHeight
  const needleOverhang = needleOverhangProp ?? s.needleOverhang
  const isNeedle = marker?.type === 'needle'
  const markerHeight = isNeedle ? trackHeight + needleOverhang * 2 : trackHeight
  const markerFrac = marker != null ? fraction(marker.value, min, max) : 0

  const bands = zones.map((zone, i) => {
    const prev = i === 0 ? min : zones[i - 1].upTo
    const start = Math.max(min, Math.min(max, prev))
    const end = Math.max(min, Math.min(max, zone.upTo))
    return { color: zone.color, weight: Math.max(0, end - start) }
  })

  return (
    <View
      className={className}
      style={[{ width: '100%' }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={marker != null ? { min, max, now: marker.value } : { min, max, now: min }}
      accessibilityLabel={accessibilityLabel ?? `Zone track: ${marker?.value ?? min}`}
      testID="zone-track"
      {...props}
    >
      <View style={{ position: 'relative', height: markerHeight }}>
        <View
          testID="zone-track-track"
          accessibilityElementsHidden
          style={{
            position: 'absolute',
            top: (markerHeight - trackHeight) / 2,
            left: 0,
            right: 0,
            height: trackHeight,
            borderRadius: trackHeight / 2,
            backgroundColor: trackColor,
            overflow: 'hidden',
            flexDirection: 'row',
            // The pill's own box-shadow renders outside its overflow:hidden, so
            // `glow` haloes the whole track in the marker colour.
            ...(marker?.glow
              ? { boxShadow: glowShadow(marker.color ?? DEFAULT_MARKER_COLOR) }
              : null),
          }}
        >
          {bands.map((b, i) => (
            <View
              key={i}
              testID="zone-track-band"
              style={{
                flexGrow: b.weight,
                flexShrink: 1,
                flexBasis: 0,
                minWidth: 0,
                height: '100%',
                backgroundColor: b.color,
              }}
            />
          ))}

          {band != null && (
            <View
              testID="zone-track-band-highlight"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: pct(fraction(band.from, min, max)),
                width: pct(fraction(band.to, min, max) - fraction(band.from, min, max)),
                backgroundColor: band.color,
              }}
            />
          )}

          {marker?.type === 'fill' && (
            <View
              testID="zone-track-unfilled"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: pct(markerFrac),
                right: 0,
                backgroundColor: trackColor,
              }}
            />
          )}
          {marker?.type === 'fill' && marker.color != null && (
            <View
              testID="zone-track-fill"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: pct(markerFrac),
                backgroundColor: marker.color,
              }}
            />
          )}
        </View>

        {isNeedle && (
          <View
            testID="zone-track-needle"
            style={{
              position: 'absolute',
              top: 0,
              left: pct(markerFrac),
              width: s.needleWidth,
              height: markerHeight,
              borderRadius: s.needleWidth / 2,
              backgroundColor: marker.color ?? DEFAULT_MARKER_COLOR,
              transform: [{ translateX: -s.needleWidth / 2 }],
            }}
          />
        )}

        {/* Colored tick lines over the track (decorative; the labels below carry the a11y). */}
        {ticks?.map((tick, i) => {
          const emphasized = tick.emphasized === true
          const lineColor = tick.color ?? (emphasized ? t['brand-primary'] : TICK_COLOR)
          const lineWidth = emphasized ? s.tickLineEmphasized : s.tickLineNormal
          return (
            <View
              key={`line-${i}`}
              testID="zone-track-tick-line"
              accessibilityElementsHidden
              style={{
                position: 'absolute',
                top: (markerHeight - trackHeight) / 2 - s.tickLineTopPad,
                left: pct(fraction(tick.value, min, max)),
                width: lineWidth,
                height: trackHeight + s.tickLineHeightPad,
                borderRadius: lineWidth / 2,
                backgroundColor: lineColor,
                transform: [{ translateX: -lineWidth / 2 }],
                zIndex: 3,
              }}
            />
          )
        })}
      </View>

      {ticks != null && ticks.length > 0 && (
        <View
          style={{ position: 'relative', height: s.labelRowHeight, marginTop: s.labelMarginTop }}
        >
          {ticks.map((tick, i) => {
            if (tick.label == null) return null
            const emphasized = tick.emphasized === true
            const labelColor = tick.color ?? (emphasized ? t['brand-primary'] : TICK_COLOR)
            const labelNode = (
              <Text
                testID="zone-track-tick-label"
                style={{
                  fontSize: s.tickFont,
                  letterSpacing: s.tickLetterSpacing,
                  color: labelColor,
                  fontFamily: 'monospace',
                  fontWeight: emphasized ? '700' : '400',
                }}
              >
                {tick.label}
              </Text>
            )
            return (
              <View
                key={`label-${i}`}
                testID="zone-track-tick"
                style={{
                  position: 'absolute',
                  left: pct(fraction(tick.value, min, max)),
                  transform: [{ translateX: -s.tickCellWidth / 2 }],
                  width: s.tickCellWidth,
                  alignItems: 'center',
                }}
              >
                {tick.tooltip != null ? (
                  <Tooltip label={tick.tooltip} placement="top">
                    {labelNode}
                  </Tooltip>
                ) : (
                  labelNode
                )}
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
