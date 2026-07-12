// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps, type DimensionValue } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { primitiveColors } from '../../../theme/tokens/primitives'

const t = getSemanticColors('dark')

/** Muted, un-reached track colour — a charcoal step, matches the IntensityBar track family. */
const DEFAULT_TRACK_COLOR = primitiveColors.charcoal[200]
/** Default needle / fill-marker colour. */
const DEFAULT_MARKER_COLOR = primitiveColors.white
/** Tick mark + tick label colour. */
const TICK_COLOR = t['text-tertiary']

const DEFAULT_TRACK_HEIGHT = 14
const DEFAULT_NEEDLE_OVERHANG = 6
const NEEDLE_WIDTH = 4

/** A single colour band of the zone gradient, spanning `[prev.upTo, upTo]` of the domain. */
export interface ZoneTrackZone {
  /** Upper bound of this band in domain units. The last band's `upTo` should reach `max`. */
  upTo: number
  /** Band fill colour — a literal hex (RNW-safe), sourced from a ramp/effort-scale token. */
  color: string
}

/** A tick mark with an optional label, positioned at `value` in the domain. */
export interface ZoneTrackTick {
  /** Position of the tick in domain units. */
  value: number
  /** Optional label rendered under the tick. */
  label?: string
}

/**
 * The value marker sitting on the track.
 * - `needle`: a vertical line at `value`, overhanging the track (FatigueMeter / TrainingLoadGauge).
 * - `fill`: a left-anchored fill from `min` to `value`. Omit `color` to clip-reveal the zone
 *   gradient up to `value`; supply `color` for a solid trend-coloured fill (FatigueGauge-style).
 */
export type ZoneTrackMarker =
  | { type: 'needle'; value: number; color?: string }
  | { type: 'fill'; value: number; color?: string }

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
  /** Track height in px. Default 14. */
  trackHeight?: number
  /** How far a needle marker overhangs the track top + bottom, in px. Default 6. */
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
  trackHeight = DEFAULT_TRACK_HEIGHT,
  needleOverhang = DEFAULT_NEEDLE_OVERHANG,
  trackColor = DEFAULT_TRACK_COLOR,
  className,
  style,
  accessibilityLabel,
  ...props
}: ZoneTrackProps) {
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
              width: NEEDLE_WIDTH,
              height: markerHeight,
              borderRadius: NEEDLE_WIDTH / 2,
              backgroundColor: marker.color ?? DEFAULT_MARKER_COLOR,
              transform: [{ translateX: -NEEDLE_WIDTH / 2 }],
            }}
          />
        )}
      </View>

      {ticks != null && ticks.length > 0 && (
        <View
          style={{ position: 'relative', height: 14, marginTop: 4 }}
          accessibilityElementsHidden
        >
          {ticks.map((tick, i) => (
            <View
              key={i}
              testID="zone-track-tick"
              style={{
                position: 'absolute',
                left: pct(fraction(tick.value, min, max)),
                alignItems: 'center',
                transform: [{ translateX: -12 }],
                width: 24,
              }}
            >
              <View style={{ width: 1, height: 3, backgroundColor: TICK_COLOR }} />
              {tick.label != null && (
                <Text
                  testID="zone-track-tick-label"
                  style={{
                    fontSize: 8,
                    color: TICK_COLOR,
                    fontFamily: '"Nunito Sans", sans-serif',
                    marginTop: 2,
                  }}
                >
                  {tick.label}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
