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

/**
 * Round options under review (VW-448 round 1). Each collapses to the owner's pick afterwards.
 * `zone`: tint the target slots, or a bracket along the baseline. `lowConfidence`: `fade-outline`
 * adds a dashed outline to the faded bar the chart already draws. `pastCue`: a bracket over the
 * reps past the cue, or a badge over the last one. `suspension`: a dotted mark at the change.
 */
export interface VelocityBandTreatment {
  zone: 'tint' | 'bracket'
  lowConfidence: 'fade' | 'fade-outline'
  pastCue: 'bracket' | 'badge'
  suspension: 'mark' | 'none'
  showEdges: boolean
}

export const DEFAULT_BAND_TREATMENT: VelocityBandTreatment = {
  zone: 'tint',
  lowConfidence: 'fade-outline',
  pastCue: 'bracket',
  suspension: 'mark',
  showEdges: false,
}

export interface VelocityBandOverlayProps {
  scale: VelocityBandScale
  /** Measured mean velocity per performed rep, the same array the bars are drawn from. */
  velocities: readonly number[]
  /** Columns the chart draws, from `bandSlotCount`. */
  slotCount: number
  /** The geometry `SetBarChart` hands its `renderReference` painter. */
  chart: Pick<SetBarGeometry, 'scaleDenom' | 'plotHeight'>
  treatment?: Partial<VelocityBandTreatment>
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
const BRACKET_DEPTH = 6
/** The rendered height of one `caption` line. */
const CAPTION_ROW = 24
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
  style,
  inks,
}: {
  zone: BandZoneGeometry
  plotHeight: number
  style: VelocityBandTreatment['zone']
  inks: Inks
}) {
  return (
    <>
      {style === 'tint' ? (
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
      ) : (
        <View
          testID="band-zone-bracket"
          style={absolute({
            left: zone.tickX,
            width: zone.endX - zone.tickX,
            bottom: plotHeight - CAPTION_ROW - BRACKET_DEPTH,
            height: BRACKET_DEPTH,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderColor: inks.ink,
          })}
        />
      )}
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
        alignRight
      />
    </>
  )
}

function Label({
  text,
  color,
  style,
  testID,
  alignRight = false,
}: {
  text: string
  color: string
  style: ViewStyle
  testID: string
  alignRight?: boolean
}) {
  return (
    <View style={absolute(style)} testID={testID}>
      <Typography variant="caption" style={{ color, textAlign: alignRight ? 'right' : 'left' }}>
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
        alignRight
      />
    </>
  )
}

function PastCueMark({
  past,
  style,
  inks,
}: {
  past: BandPastCueGeometry
  style: VelocityBandTreatment['pastCue']
  inks: Inks
}) {
  const bottom = past.top + PAST_CUE_LIFT
  if (style === 'badge') {
    return (
      <Label
        text={past.label}
        color={inks.ink}
        style={{ left: past.x0, width: past.x1 - past.x0, bottom }}
        testID="band-past-cue"
      />
    )
  }
  return (
    <>
      <View
        testID="band-past-cue-bracket"
        style={absolute({
          left: past.x0,
          width: past.x1 - past.x0,
          bottom,
          height: 4,
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: inks.ink,
        })}
      />
      <Label
        text={past.label}
        color={inks.ink}
        style={{ left: past.x0, bottom: bottom + 4 }}
        testID="band-past-cue"
      />
    </>
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

function LowConfidenceOutlines({ geometry }: { geometry: VelocityBandGeometry }) {
  return (
    <>
      {geometry.bars
        .filter((bar) => bar.lowConfidence && bar.band != null)
        .map((bar) => (
          <View
            key={bar.repNumber}
            testID={`band-low-confidence-${bar.repNumber}`}
            style={absolute({
              left: bar.x,
              width: bar.width,
              bottom: 0,
              height: bar.height,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: BAND_INK[bar.band!],
            })}
          />
        ))}
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
  treatment: VelocityBandTreatment
  inks: Inks
}

/** Drawn before the bar columns, so the bars sit on top of the tint. */
function UnderMarks({ geometry, plotHeight, treatment, inks }: MarksProps) {
  return (
    <>
      {treatment.showEdges ? <Edges geometry={geometry} inks={inks} /> : null}
      {geometry.zone ? (
        <ZoneUnder
          zone={geometry.zone}
          plotHeight={plotHeight}
          style={treatment.zone}
          inks={inks}
        />
      ) : null}
    </>
  )
}

function OverMarks({ geometry, plotHeight, treatment, inks }: MarksProps) {
  return (
    <>
      {geometry.zone ? <ZoneOver zone={geometry.zone} plotHeight={plotHeight} inks={inks} /> : null}
      {treatment.suspension === 'mark' && geometry.suspension ? (
        <SuspensionMark mark={geometry.suspension} plotHeight={plotHeight} inks={inks} />
      ) : null}
      {treatment.lowConfidence === 'fade-outline' ? (
        <LowConfidenceOutlines geometry={geometry} />
      ) : null}
      {geometry.lines.map((line) => (
        <GuardLine key={line.key} line={line} inks={inks} />
      ))}
      {geometry.pastCue ? (
        <PastCueMark past={geometry.pastCue} style={treatment.pastCue} inks={inks} />
      ) : null}
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
  treatment,
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
    treatment: { ...DEFAULT_BAND_TREATMENT, ...treatment },
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
