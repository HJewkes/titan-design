import { View } from 'react-native'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getGlowShadow } from '../../../theme/elevation'
import {
  fraction,
  pct,
  type ZoneTrackBand,
  type ZoneTrackLayout,
  type ZoneTrackMarker,
} from './zoneTrackGeometry'

/** Default needle / fill-marker colour. */
const DEFAULT_MARKER_COLOR = primitiveColors.white

const sameColor = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export function ZoneTrackPill({
  layout,
  bands,
  band,
  marker,
  trackColor,
}: {
  layout: ZoneTrackLayout
  bands: Array<{ color: string; weight: number }>
  band: ZoneTrackBand | null
  marker: ZoneTrackMarker | null
  trackColor: string
}) {
  const { min, max, markerHeight, trackHeight } = layout
  // A fill marker's un-reached overlay paints the track over the bands, so the pill stays
  // clear there: translucent track tokens would otherwise stack a second layer.
  const bandsPaintTrack = bands.length > 0 && bands.every((b) => sameColor(b.color, trackColor))
  const pillColor = marker?.type === 'fill' && bands.length > 0 ? 'transparent' : trackColor
  return (
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
        backgroundColor: pillColor,
        overflow: 'hidden',
        flexDirection: 'row',
        // The pill's own box-shadow renders outside its overflow:hidden, so
        // `glow` haloes the whole track in the marker colour. Emphasis, not depth.
        ...(marker?.glow ? getGlowShadow(marker.color ?? DEFAULT_MARKER_COLOR, 'subtle') : null),
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

      <ZoneTrackFill
        markerFrac={layout.markerFrac}
        marker={marker}
        trackColor={bandsPaintTrack ? 'transparent' : trackColor}
      />
    </View>
  )
}

function ZoneTrackFill({
  markerFrac,
  marker,
  trackColor,
}: {
  markerFrac: number
  marker: ZoneTrackMarker | null
  trackColor: string
}) {
  return (
    <>
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
    </>
  )
}

export function ZoneTrackNeedle({
  layout,
  marker,
}: {
  layout: ZoneTrackLayout
  marker: ZoneTrackMarker | null
}) {
  if (!layout.isNeedle || marker == null) return null
  const s = layout.sizing
  return (
    <View
      testID="zone-track-needle"
      style={{
        position: 'absolute',
        top: 0,
        left: pct(layout.markerFrac),
        width: s.needleWidth,
        height: layout.markerHeight,
        borderRadius: s.needleWidth / 2,
        backgroundColor: marker.color ?? DEFAULT_MARKER_COLOR,
        transform: [{ translateX: -s.needleWidth / 2 }],
      }}
    />
  )
}
