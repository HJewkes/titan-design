import { View, Text } from 'react-native'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getGlowShadow } from '../../../theme/elevation'
import { Tooltip } from '../../ui/tooltip/Tooltip'
import {
  fraction,
  pct,
  showsTickLabel,
  tickLabelStep,
  type ZoneTrackBand,
  type ZoneTrackLayout,
  type ZoneTrackMarker,
  type ZoneTrackTick,
} from './zoneTrackGeometry'

/** Default needle / fill-marker colour. */
const DEFAULT_MARKER_COLOR = primitiveColors.white

interface TickColors {
  ticks: ZoneTrackTick[]
  layout: ZoneTrackLayout
  brand: string
  muted: string
}

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
        backgroundColor: trackColor,
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

      <ZoneTrackFill markerFrac={layout.markerFrac} marker={marker} trackColor={trackColor} />
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

/** Colored tick lines over the track (decorative; the labels below carry the a11y). */
export function ZoneTrackTickLines({ ticks, layout, brand, muted }: TickColors) {
  const { min, max, sizing: s, markerHeight, trackHeight } = layout
  const lines = ticks.map((tick, i) => {
    const emphasized = tick.emphasized === true
    const lineColor = tick.color ?? (emphasized ? brand : muted)
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
  })
  return <>{lines}</>
}

/** Only labels earn the row: a caller that passes lines alone (VW-455) gets no dead space. */
export function ZoneTrackTickLabels({
  ticks,
  layout,
  brand,
  muted,
  trackWidth,
}: TickColors & { trackWidth: number }) {
  if (!ticks.some((tick) => tick.label != null)) return null
  const s = layout.sizing
  const step = tickLabelStep(trackWidth, ticks.length, s.tickCellWidth)
  return (
    <View style={{ position: 'relative', height: s.labelRowHeight, marginTop: s.labelMarginTop }}>
      {ticks.map((tick, i) => {
        if (tick.label == null) return null
        if (!showsTickLabel(i, tick.emphasized === true, step, ticks.length)) return null
        return (
          <ZoneTrackTickLabel
            key={`label-${i}`}
            tick={tick}
            label={tick.label}
            layout={layout}
            brand={brand}
            muted={muted}
          />
        )
      })}
    </View>
  )
}

function ZoneTrackTickLabel({
  tick,
  label,
  layout,
  brand,
  muted,
}: Omit<TickColors, 'ticks'> & { tick: ZoneTrackTick; label: string }) {
  const s = layout.sizing
  const emphasized = tick.emphasized === true
  const labelColor = tick.color ?? (emphasized ? brand : muted)
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
      {label}
    </Text>
  )
  return (
    <View
      testID="zone-track-tick"
      style={{
        position: 'absolute',
        left: pct(fraction(tick.value, layout.min, layout.max)),
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
}
