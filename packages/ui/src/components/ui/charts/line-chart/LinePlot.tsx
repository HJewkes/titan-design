// The painted layer of LineChart (TD-34 S4): one DOM `<svg aria-hidden>` and its text labels, drawn
// from the facet geometry only. No state and no handlers live here.
import type { CSSProperties } from 'react'
import { View } from 'react-native'

import { resolveColor } from '../../../../theme/resolve-color'
import type { ThemeMode } from '../../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../surface'
import {
  CHART_ENTRANCE,
  drawStyle,
  fadeStyle,
  popStyle,
  useChartEntrance,
  type EntranceState,
} from '../kit/chartEntrance'
import {
  gutterLabels,
  isDashed,
  lonePoints,
  seriesStroke,
  STROKE_WIDTH,
  SWATCH_END,
  SWATCH_START,
  type GutterLabel,
  type PlotFrame,
} from './line-layout-model'
import type { ChartLabels, PointReadout } from './line-readout-model'
import { AxisLabels, BoundaryLabels, GutterLabels, Readout } from './LinePlotLabels'
import { RULE_DASH, Rules } from './LinePlotRules'
import type { ProjectedPoint } from './types'
import type { LineChartFacet } from './useLineChart'

export interface LinePlotProps {
  facet: LineChartFacet
  frame: PlotFrame
  width: number
  height: number
  labels: ChartLabels
  /** Least px between two x labels. */
  xLabelGap: number
  /** Direct end labels; a legend replaces them when false. */
  showEndLabels: boolean
  animate: boolean
  active: ProjectedPoint | null
  readout: PointReadout | null
}

const DASH = '6 4'
const DOT_RADIUS = 3
const ACTIVE_RADIUS = 5

interface SeriesMarksProps {
  facet: LineChartFacet
  index: number
  stroke: string
  entrance: EntranceState
}

function SeriesMarks({ facet, index, stroke, entrance }: SeriesMarksProps) {
  const projected = facet.geometry.series[index]
  if (!projected) return null
  const dashed = isDashed(projected.series)
  // A dashed line cannot draw by dash offset, so it fades in over the same time.
  const pathStyle: CSSProperties = dashed
    ? fadeStyle(entrance, CHART_ENTRANCE.draw)
    : drawStyle(entrance)
  return (
    <>
      {projected.paths.map((d, i) => (
        <path
          key={i}
          data-testid="line-chart-path"
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...(dashed ? { strokeDasharray: DASH } : { pathLength: 1 })}
          style={pathStyle}
        />
      ))}
      {lonePoints(facet, index).map((point) => (
        <circle
          key={point.id}
          data-testid="line-chart-dot"
          cx={point.x}
          cy={point.y ?? 0}
          r={DOT_RADIUS}
          fill={stroke}
          style={popStyle(entrance)}
        />
      ))}
    </>
  )
}

function Swatches({ labels, x }: { labels: GutterLabel[]; x: number }) {
  return (
    <>
      {labels.map((label) =>
        label.stroke ? (
          <line
            key={label.key}
            x1={x + SWATCH_START}
            x2={x + SWATCH_END}
            y1={label.y}
            y2={label.y}
            stroke={label.stroke}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={label.dashed ? RULE_DASH : undefined}
          />
        ) : null
      )}
    </>
  )
}

interface ActiveMarkProps {
  active: ProjectedPoint
  stroke: string
  height: number
  mode: ThemeMode
}

/** A crosshair at the active x, and a ringed dot when the point has a value. */
function ActiveMark({ active, stroke, height, mode }: ActiveMarkProps) {
  return (
    <>
      <line
        data-testid="line-chart-crosshair"
        x1={active.x}
        x2={active.x}
        y1={0}
        y2={height}
        stroke={resolveColor('hairline-strong', mode)}
      />
      {active.y !== null && (
        <circle
          data-testid="line-chart-active-marker"
          cx={active.x}
          cy={active.y}
          r={ACTIVE_RADIUS}
          fill={stroke}
          stroke={resolveColor('text-primary', mode)}
          strokeWidth={STROKE_WIDTH}
        />
      )}
    </>
  )
}

function PlotSvg(props: LinePlotProps & { gutter: GutterLabel[]; mode: ThemeMode }) {
  const { facet, frame, width, height, active, gutter, mode } = props
  const entrance = useChartEntrance(props.animate)
  const strokes = facet.geometry.series.map((s, i) => seriesStroke(s.series, i, mode))
  const activeIndex = facet.geometry.series.findIndex((s) => s.series.id === active?.seriesId)
  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
    >
      <g transform={`translate(${String(frame.left)} ${String(frame.top)})`}>
        <Rules geometry={facet.geometry} mode={mode} />
        {strokes.map((stroke, index) => (
          <SeriesMarks
            key={facet.geometry.series[index]?.series.id}
            facet={facet}
            index={index}
            stroke={stroke}
            entrance={entrance}
          />
        ))}
        <Swatches labels={gutter} x={facet.geometry.width} />
        {active && (
          <ActiveMark
            active={active}
            stroke={strokes[activeIndex] ?? resolveColor('text-primary', mode)}
            height={facet.geometry.height}
            mode={mode}
          />
        )}
      </g>
    </svg>
  )
}

/** Gridlines, rules, series paths, lone dots, labels, the active marker and its readout. */
export function LinePlot(props: LinePlotProps) {
  const { facet, frame, active, readout } = props
  const mode = useSurfaceMode()
  const gutter = gutterLabels(facet, props.showEndLabels, mode)
  const layer = { geometry: facet.geometry, frame }
  return (
    <View testID="line-chart-plot" style={{ width: props.width, height: props.height }}>
      <PlotSvg {...props} gutter={gutter} mode={mode} />
      <AxisLabels
        {...layer}
        width={props.width}
        labels={props.labels}
        xLabelGap={props.xLabelGap}
      />
      <GutterLabels {...layer} gutter={gutter} />
      <BoundaryLabels {...layer} />
      {active && readout && <Readout {...layer} active={active} readout={readout} />}
    </View>
  )
}
