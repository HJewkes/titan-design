import { useState } from 'react'
import { View, type LayoutChangeEvent, type ViewStyle } from 'react-native'
import { alpha } from '../../../utils/colors'
import { Typography } from '../../ui/typography'
import { useOnSurfaceColor } from '../../ui/surface'
import type { SetBarGeometry } from '../charts/SetBarChart'
import {
  velocityBandGeometry,
  type BandLineGeometry,
  type BandSuspensionGeometry,
  type BandZoneGeometry,
  type VelocityBandGeometry,
} from './velocityBandGeometry'
import { EFFORT_BAND_PALETTE } from './velocityBandPalette'
import { BAND_LABEL_METRICS, type BandLabel, type BandLabelInk } from './velocityBandLabels'
import type { VelocityBandScale } from './VelocityBandScale'

export interface VelocityBandOverlayProps {
  scale: VelocityBandScale
  /** Measured mean velocity per performed rep, the same array the bars are drawn from. */
  velocities: readonly number[]
  /** Columns the chart draws, from `bandSlotCount`. */
  slotCount: number
  /**
   * The geometry `SetBarChart` hands its `renderReference` painter. `flip` (a `down` wing)
   * counter-flips the labels; the top row then sits on the wing's outer edge.
   */
  chart: Pick<SetBarGeometry, 'scaleDenom' | 'plotHeight' | 'flip'>
  /** Draw faint rules at the band edges the scale carries. Not reviewed yet; off by default. */
  showEdges?: boolean
  /** Plot width in px. Measured from layout when omitted. */
  plotWidth?: number
  testID?: string
}

/** Lifts the over layer above the bar columns; every react-native-web View sits at zIndex 0. */
const ABOVE_BARS = 1
const ZONE_TINT_OPACITY = 0.1
const TICK_HEIGHT = 10

interface Inks {
  ink: string
  faint: string
}

interface PlotSize {
  width: number
  height: number
}

function inkFor(ink: BandLabelInk, inks: Inks): string {
  return ink === 'ink' || ink === 'faint' ? inks[ink] : EFFORT_BAND_PALETTE[ink]
}

function absolute(style: ViewStyle): ViewStyle {
  return { position: 'absolute', ...style }
}

/** A vertical rule centred on `x`, kept wholly inside the plot. */
function verticalRule(x: number, width: number, plotWidth: number): ViewStyle {
  return { left: Math.max(0, Math.min(x - width / 2, plotWidth - width)), width }
}

function ZoneUnder({ zone, plot, inks }: { zone: BandZoneGeometry; plot: PlotSize; inks: Inks }) {
  return (
    <>
      <View
        testID="band-zone-tint"
        style={absolute({
          left: zone.x0,
          width: zone.x1 - zone.x0,
          bottom: 0,
          height: plot.height,
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

function ZoneEnd({ zone, plot, inks }: { zone: BandZoneGeometry; plot: PlotSize; inks: Inks }) {
  const width = zone.firedCue ? 2 : 1
  return (
    <View
      testID="band-zone-end"
      style={absolute({
        ...verticalRule(zone.endX, width, plot.width),
        bottom: 0,
        height: plot.height,
        backgroundColor: inks.ink,
      })}
    />
  )
}

function GuardLine({ line, inks }: { line: BandLineGeometry; inks: Inks }) {
  const weight = line.firedCue ? 2 : 1.5
  return (
    <View
      testID={`band-line-${line.key}`}
      style={absolute({
        left: 0,
        right: 0,
        bottom: line.y - weight / 2,
        height: 0,
        borderTopWidth: weight,
        borderTopColor: inkFor(line.band ?? 'ink', inks),
        borderStyle: line.reached ? 'solid' : 'dashed',
      })}
    />
  )
}

function SuspensionMark({
  mark,
  plot,
  inks,
}: {
  mark: BandSuspensionGeometry
  plot: PlotSize
  inks: Inks
}) {
  return (
    <View
      testID="band-suspension"
      style={absolute({
        ...verticalRule(mark.x, 1.5, plot.width),
        bottom: 0,
        height: plot.height,
        borderLeftWidth: 1.5,
        borderLeftColor: inks.ink,
        borderStyle: 'dashed',
      })}
    />
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

const COUNTER_FLIP: ViewStyle = { transform: [{ scaleY: -1 }] }

function Label({ label, inks, flip }: { label: BandLabel; inks: Inks; flip: boolean }) {
  const { fontSize, height } = BAND_LABEL_METRICS
  return (
    <View
      testID={`band-label-${label.key}`}
      style={absolute({
        left: label.x,
        bottom: label.y,
        width: label.width,
        height: label.height,
        ...(flip ? COUNTER_FLIP : null),
      })}
    >
      <Typography
        variant="caption"
        numberOfLines={1}
        style={{
          color: inkFor(label.ink, inks),
          fontSize,
          lineHeight: height,
          textAlign: label.align,
        }}
      >
        {label.text}
      </Typography>
    </View>
  )
}

interface MarksProps {
  geometry: VelocityBandGeometry
  plot: PlotSize
  showEdges: boolean
  flip: boolean
  inks: Inks
}

/** Drawn before the bar columns, so the bars sit on top of the tint. */
function UnderMarks({ geometry, plot, showEdges, inks }: MarksProps) {
  return (
    <>
      {showEdges ? <Edges geometry={geometry} inks={inks} /> : null}
      {geometry.zone ? <ZoneUnder zone={geometry.zone} plot={plot} inks={inks} /> : null}
    </>
  )
}

function OverMarks({ geometry, plot, flip, inks }: MarksProps) {
  return (
    <>
      {geometry.zone ? <ZoneEnd zone={geometry.zone} plot={plot} inks={inks} /> : null}
      {geometry.suspension ? (
        <SuspensionMark mark={geometry.suspension} plot={plot} inks={inks} />
      ) : null}
      {geometry.lines.map((line) => (
        <GuardLine key={line.key} line={line} inks={inks} />
      ))}
      {geometry.labels.map((label) => (
        <Label key={label.key} label={label} inks={inks} flip={flip} />
      ))}
    </>
  )
}

/**
 * The marks restate what the chart's own label says, so screen readers skip them. react-native-web
 * maps only `aria-hidden` to the DOM; the two native props cover iOS and Android.
 */
const DECORATIVE = {
  'aria-hidden': true,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
} as const

/** Pinned to the baseline at the plot's own height, so nothing reaches the value-label row. */
const FILL: ViewStyle = {
  pointerEvents: 'none',
  position: 'absolute',
  left: 0,
  right: 0,
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
  const onLayout =
    plotWidthProp == null
      ? (e: LayoutChangeEvent) => setMeasured(e.nativeEvent.layout.width)
      : undefined
  const inks = { ink: useOnSurfaceColor('secondary'), faint: useOnSurfaceColor('tertiary') }
  const plot = { width: plotWidthProp ?? measured, height: chart.plotHeight }
  const geometry = velocityBandGeometry(scale, {
    plotWidth: plot.width,
    plotHeight: plot.height,
    slotCount,
    velocities,
    scaleDenom: chart.scaleDenom,
  })
  const marks: MarksProps = { geometry, plot, showEdges, flip: chart.flip ?? false, inks }
  const layer = [FILL, { height: plot.height }]
  return (
    <>
      <View testID={testID} onLayout={onLayout} {...DECORATIVE} style={layer}>
        <UnderMarks {...marks} />
      </View>
      <View testID={`${testID}-over`} {...DECORATIVE} style={[...layer, { zIndex: ABOVE_BARS }]}>
        <OverMarks {...marks} />
      </View>
    </>
  )
}
