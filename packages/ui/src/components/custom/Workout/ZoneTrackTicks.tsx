import { View, Text } from 'react-native'
import { Tooltip } from '../../ui/tooltip/Tooltip'
import {
  fraction,
  pct,
  showsTickLabel,
  tickLabelStep,
  type ZoneTrackLayout,
  type ZoneTrackTick,
} from './zoneTrackGeometry'

interface TickColors {
  ticks: ZoneTrackTick[]
  layout: ZoneTrackLayout
  brand: string
  muted: string
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
