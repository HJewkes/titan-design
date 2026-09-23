import { useState } from 'react'
import { View, type LayoutChangeEvent, type ViewStyle } from 'react-native'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { alpha } from '../../../utils/colors'
import { Typography } from '../../ui/typography'
import { useOnSurfaceColor } from '../../ui/surface'
import type { SetBarGeometry } from '../charts/SetBarChart'
import {
  velocityBandGeometry,
  type BandLineGeometry,
  type BandPastCueGeometry,
  type BandSuspensionGeometry,
  type BandZoneGeometry,
  type VelocityBandGeometry,
} from './velocityBandGeometry'
import type { VelocityBandIndex, VelocityBandScale } from './VelocityBandScale'

export interface VelocityBandOverlayProps {
  scale: VelocityBandScale
  /** Measured mean velocity per performed rep, the same array the bars are drawn from. */
  velocities: readonly number[]
  /** Columns the chart draws, from `bandSlotCount`. */
  slotCount: number
  /** The geometry `SetBarChart` hands its `renderReference` painter. */
  chart: Pick<SetBarGeometry, 'scaleDenom' | 'plotHeight'>
  /** Draw faint rules at the band edges the scale carries. Not reviewed yet; off by default. */
  showEdges?: boolean
  /** Plot width in px. Measured from layout when omitted. */
  plotWidth?: number
  testID?: string
}

const BAND_INK = [
  WORKOUT_TOKENS.scale.green,
  WORKOUT_TOKENS.scale.yellow,
  WORKOUT_TOKENS.scale.orange,
  WORKOUT_TOKENS.scale.red,
] as const

/** Lifts the over layer above the bar columns; every react-native-web View sits at zIndex 0. */
const ABOVE_BARS = 1
const LABEL_HEIGHT = 14
/** Keeps the zone label clear of its own end line. */
const LABEL_INSET = 4
const ZONE_TINT_OPACITY = 0.1
const TICK_HEIGHT = 10
const PAST_CUE_LIFT = 6

interface Inks {
  ink: string
  faint: string
}

function lineInk(band: VelocityBandIndex | null, inks: Inks): string {
  return band == null ? inks.ink : BAND_INK[band]
}

function absolute(style: ViewStyle): ViewStyle {
  return { position: 'absolute', ...style }
}

function ZoneUnder({
  zone,
  plotHeight,
  inks,
}: {
  zone: BandZoneGeometry
  plotHeight: number
  inks: Inks
}) {
  return (
    <>
      <View
        testID="band-zone-tint"
        style={absolute({
          left: zone.x0,
          width: zone.x1 - zone.x0,
          bottom: 0,
          height: plotHeight,
          backgroundColor: alpha(inks.faint, ZONE_TINT_OPACITY),
        })}
      />
      <View
        testID="band-zone-tick"
        style={absolute({
          left: zone.tickX,
          width: 1,
          bottom: 0,
          height: TICK_HEIGHT,
          backgroundColor: inks.faint,
        })}
      />
    </>
  )
}

function ZoneOver({
  zone,
  plotHeight,
  inks,
}: {
  zone: BandZoneGeometry
  plotHeight: number
  inks: Inks
}) {
  const endWidth = zone.firedCue ? 2 : 1
  return (
    <>
      <View
        testID="band-zone-end"
        style={absolute({
          left: zone.endX - endWidth / 2,
          width: endWidth,
          bottom: 0,
          height: plotHeight,
          backgroundColor: inks.ink,
        })}
      />
      <Label
        text={zone.label}
        color={inks.ink}
        style={{ top: 0, left: 0, width: Math.max(0, zone.endX - LABEL_INSET) }}
        testID="band-zone-label"
        align="right"
      />
    </>
  )
}

function Label({
  text,
  color,
  style,
  testID,
  align = 'left',
}: {
  text: string
  color: string
  style: ViewStyle
  testID: string
  align?: 'left' | 'center' | 'right'
}) {
  return (
    <View style={absolute(style)} testID={testID}>
      <Typography variant="caption" style={{ color, textAlign: align }}>
        {text}
      </Typography>
    </View>
  )
}

function GuardLine({ line, inks }: { line: BandLineGeometry; inks: Inks }) {
  const color = lineInk(line.band, inks)
  const weight = line.firedCue ? 2 : 1.5
  const labelBottom = line.labelSide === 'above' ? line.y + 2 : line.y - LABEL_HEIGHT - 2
  return (
    <>
      <View
        testID={`band-line-${line.key}`}
        style={absolute({
          left: 0,
          right: 0,
          bottom: line.y - weight / 2,
          height: 0,
          borderTopWidth: weight,
          borderTopColor: color,
          borderStyle: line.reached ? 'solid' : 'dashed',
        })}
      />
      <Label
        text={line.label}
        color={color}
        style={{ right: 0, bottom: Math.max(0, labelBottom) }}
        testID={`band-line-label-${line.key}`}
        align="right"
      />
    </>
  )
}

function PastCueBadge({ past, inks }: { past: BandPastCueGeometry; inks: Inks }) {
  return (
    <Label
      text={past.label}
      color={inks.ink}
      style={{ left: past.x0, width: past.x1 - past.x0, bottom: past.top + PAST_CUE_LIFT }}
      testID="band-past-cue"
      align="center"
    />
  )
}

function SuspensionMark({
  mark,
  plotHeight,
  inks,
}: {
  mark: BandSuspensionGeometry
  plotHeight: number
  inks: Inks
}) {
  return (
    <>
      <View
        testID="band-suspension"
        style={absolute({
          left: mark.x,
          bottom: 0,
          height: plotHeight,
          width: 0,
          borderLeftWidth: 1.5,
          borderLeftColor: inks.ink,
          borderStyle: 'dashed',
        })}
      />
      {mark.label ? (
        <Label
          text={mark.label}
          color={inks.ink}
          style={{ left: mark.x + LABEL_INSET, top: 0 }}
          testID="band-suspension-label"
        />
      ) : null}
    </>
  )
}

function Edges({ geometry, inks }: { geometry: VelocityBandGeometry; inks: Inks }) {
  return (
    <>
      {geometry.edges.map((edge) => (
        <View
          key={edge.band}
          testID={`band-edge-${edge.band}`}
          style={absolute({
            left: 0,
            right: 0,
            bottom: edge.y,
            height: 1,
            backgroundColor: alpha(inks.faint, 0.4),
          })}
        />
      ))}
    </>
  )
}

interface MarksProps {
  geometry: VelocityBandGeometry
  plotHeight: number
  showEdges: boolean
  inks: Inks
}

/** Drawn before the bar columns, so the bars sit on top of the tint. */
function UnderMarks({ geometry, plotHeight, showEdges, inks }: MarksProps) {
  return (
    <>
      {showEdges ? <Edges geometry={geometry} inks={inks} /> : null}
      {geometry.zone ? (
        <ZoneUnder zone={geometry.zone} plotHeight={plotHeight} inks={inks} />
      ) : null}
    </>
  )
}

function OverMarks({ geometry, plotHeight, inks }: MarksProps) {
  return (
    <>
      {geometry.zone ? <ZoneOver zone={geometry.zone} plotHeight={plotHeight} inks={inks} /> : null}
      {geometry.suspension ? (
        <SuspensionMark mark={geometry.suspension} plotHeight={plotHeight} inks={inks} />
      ) : null}
      {geometry.lines.map((line) => (
        <GuardLine key={line.key} line={line} inks={inks} />
      ))}
      {geometry.pastCue ? <PastCueBadge past={geometry.pastCue} inks={inks} /> : null}
    </>
  )
}

/** The marks restate what the chart's own label says; screen readers skip them. */
const DECORATIVE = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
} as const

const FILL: ViewStyle = {
  pointerEvents: 'none',
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
}

/**
 * The band-scale marks for a `SetBarChart`: the rep-range target zone, up to two guard lines, the
 * past-cue count and the setting-change mark. Paint it from `renderReference`: its under layer
 * sits beneath the bars and its over layer above them, both on the chart's own columns and height
 * scale. It draws no bar and decides no colour: bands arrive on the scale, labels from the caller.
 */
export function VelocityBandOverlay({
  scale,
  velocities,
  slotCount,
  chart,
  showEdges = false,
  plotWidth: plotWidthProp,
  testID = 'velocity-band-overlay',
}: VelocityBandOverlayProps) {
  const [measured, setMeasured] = useState(0)
  const onLayout = (e: LayoutChangeEvent) => setMeasured(e.nativeEvent.layout.width)
  const inks = { ink: useOnSurfaceColor('secondary'), faint: useOnSurfaceColor('tertiary') }
  const plotWidth = plotWidthProp ?? measured
  const geometry = velocityBandGeometry(scale, {
    plotWidth,
    plotHeight: chart.plotHeight,
    slotCount,
    velocities,
    scaleDenom: chart.scaleDenom,
  })
  const marks: MarksProps = {
    geometry,
    plotHeight: chart.plotHeight,
    showEdges,
    inks,
  }
  return (
    <>
      <View testID={testID} onLayout={onLayout} {...DECORATIVE} style={FILL}>
        <UnderMarks {...marks} />
      </View>
      <View testID={`${testID}-over`} {...DECORATIVE} style={[FILL, { zIndex: ABOVE_BARS }]}>
        <OverMarks {...marks} />
      </View>
    </>
  )
}
