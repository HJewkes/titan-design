// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View, type ViewProps, type LayoutChangeEvent } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import {
  zoneBands,
  zoneTrackLayout,
  type ZoneTrackBand,
  type ZoneTrackMarker,
  type ZoneTrackSize,
  type ZoneTrackTick,
  type ZoneTrackZone,
} from './zoneTrackGeometry'
import { ZoneTrackNeedle, ZoneTrackPill } from './ZoneTrackParts'
import { ZoneTrackTickLabels, ZoneTrackTickLines } from './ZoneTrackTicks'

export type {
  ZoneTrackBand,
  ZoneTrackMarker,
  ZoneTrackSize,
  ZoneTrackTick,
  ZoneTrackZone,
} from './zoneTrackGeometry'

/** Muted, un-reached track token — resolved per render so the track follows the theme. */
const TRACK_TOKEN = 'border-prominent'
/** Tick mark + tick label token — resolved per render so ticks follow the theme. */
const TICK_TOKEN = 'text-tertiary'

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
  /** Muted colour of the track behind / beyond the fill. Default the theme's `border-prominent`. */
  trackColor?: string
  className?: string
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
  trackHeight,
  needleOverhang,
  trackColor: trackColorProp,
  className,
  style,
  accessibilityLabel,
  ...props
}: ZoneTrackProps) {
  const t = getSemanticColors(useSurfaceMode())
  const tickColor = t[TICK_TOKEN]
  const trackColor = trackColorProp ?? t[TRACK_TOKEN]
  const layout = zoneTrackLayout({ min, max, marker, size, trackHeight, needleOverhang })

  // Thin the tick labels on a narrow track so they never overlap (each occupies a fixed
  // `tickCellWidth` cell). Width 0 (unmeasured) → show all, so test/server renders match.
  const [trackW, setTrackW] = useState(0)
  const onTrackLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)

  return (
    <View
      className={className}
      style={[{ width: '100%' }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={marker != null ? { min, max, now: marker.value } : { min, max, now: min }}
      accessibilityLabel={accessibilityLabel ?? `Zone track: ${marker?.value ?? min}`}
      testID="zone-track"
      onLayout={onTrackLayout}
      {...props}
    >
      <View style={{ position: 'relative', height: layout.markerHeight }}>
        <ZoneTrackPill
          layout={layout}
          bands={zoneBands(zones, min, max)}
          band={band}
          marker={marker}
          trackColor={trackColor}
        />
        <ZoneTrackNeedle layout={layout} marker={marker} />
        {ticks != null && (
          <ZoneTrackTickLines
            ticks={ticks}
            layout={layout}
            brand={t['brand-primary']}
            muted={tickColor}
          />
        )}
      </View>

      {ticks != null && (
        <ZoneTrackTickLabels
          ticks={ticks}
          layout={layout}
          brand={t['brand-primary']}
          muted={tickColor}
          trackWidth={trackW}
        />
      )}
    </View>
  )
}
