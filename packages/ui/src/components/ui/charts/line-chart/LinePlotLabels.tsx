// The text of a LinePlot: axis labels, gutter and boundary labels, the readout and the legend.
import { View } from 'react-native'

import { useSurfaceMode } from '../../surface'
import { Tooltip } from '../../tooltip'
import { Typography } from '../../typography'
import { thinLabels } from '../kit/thinMath'
import {
  isDashed,
  LABEL_START,
  readoutPlacement,
  seriesStroke,
  STROKE_WIDTH,
  SWATCH_END,
  SWATCH_START,
  type GutterLabel,
  type PlotFrame,
} from './line-layout-model'
import type { ChartLabels, PointReadout } from './line-readout-model'
import type { LineGeometry, LineSeries, ProjectedPoint } from './types'

const BOUNDARY_LABEL_WIDTH = 112
/** Where Tooltip puts its arrow on a start or end placement: `left-4` plus half the arrow. */
const READOUT_ARROW_INSET = 20
const NOWRAP = 'web:whitespace-nowrap'
const TIGHT = 'absolute leading-tight'

interface LabelLayerProps {
  geometry: LineGeometry
  frame: PlotFrame
}

interface AxisLabelsProps extends LabelLayerProps {
  width: number
  labels: ChartLabels
  /** Least px between two x labels. */
  xLabelGap: number
}

export function AxisLabels({ geometry, frame, width, labels, xLabelGap }: AxisLabelsProps) {
  const { xTicks, yTicks, height } = geometry
  const xLeft = (position: number) =>
    Math.min(Math.max(frame.left + position - xLabelGap / 2, 0), Math.max(width - xLabelGap, 0))
  // Ticks closer than the label's own precision repeat its text; the repeat is dropped.
  const xLabels = thinLabels(xTicks, (tick) => tick.position, xLabelGap)
    .map((tick) => ({ ...tick, text: labels.xTick(tick.value) }))
    .filter((label, i, kept) => label.text !== kept[i - 1]?.text)
  return (
    <>
      {yTicks.map((tick) => (
        <Typography
          key={tick.value}
          variant="caption"
          color="tertiary"
          align="right"
          className={TIGHT}
          style={{ left: 0, width: frame.left - 8, top: frame.top + tick.position - 8 }}
        >
          {labels.yTick(tick.value)}
        </Typography>
      ))}
      {xLabels.map((tick) => (
        <Typography
          key={tick.value}
          testID="line-chart-x-label"
          variant="caption"
          color="tertiary"
          align="center"
          truncate
          className={TIGHT}
          style={{ left: xLeft(tick.position), width: xLabelGap, top: frame.top + height + 6 }}
        >
          {tick.text}
        </Typography>
      ))}
    </>
  )
}

/** End labels and reference labels, in the gutter right of the plot. */
export function GutterLabels({
  geometry,
  frame,
  gutter,
}: LabelLayerProps & { gutter: GutterLabel[] }) {
  return (
    <>
      {gutter.map((label) => {
        const inset = label.stroke ? LABEL_START : SWATCH_START
        return (
          <Typography
            key={label.key}
            testID={label.stroke ? 'line-chart-end-label' : 'line-chart-reference-label'}
            variant="caption"
            color="secondary"
            truncate
            className={TIGHT}
            style={{
              left: frame.left + geometry.width + inset,
              width: frame.right - inset,
              top: frame.top + label.y - 8,
            }}
          >
            {label.text}
          </Typography>
        )
      })}
    </>
  )
}

/** Each boundary's label beside its rule, flipped to the left of it near the plot's right edge. */
export function BoundaryLabels({ geometry, frame }: LabelLayerProps) {
  return (
    <>
      {geometry.boundaries.map((boundary, i) => {
        const flipped = boundary.position > geometry.width - BOUNDARY_LABEL_WIDTH
        const x = frame.left + boundary.position
        return boundary.label ? (
          <Typography
            key={i}
            testID="line-chart-boundary-label"
            variant="caption"
            color="tertiary"
            align={flipped ? 'right' : 'left'}
            truncate
            className={TIGHT}
            style={{
              left: flipped ? x - 4 - BOUNDARY_LABEL_WIDTH : x + 4,
              width: BOUNDARY_LABEL_WIDTH,
              top: frame.top,
            }}
          >
            {boundary.label}
          </Typography>
        ) : null
      })}
    </>
  )
}

interface ReadoutProps extends LabelLayerProps {
  active: ProjectedPoint
  readout: PointReadout
}

/**
 * The readout: a controlled Tooltip whose anchor is a box centred on the active point. The box is
 * as wide as the Tooltip's start and end arrow insets, so the arrow lands on the point either way.
 */
export function Readout({ active, readout, frame, geometry }: ReadoutProps) {
  const at = { x: active.x, y: active.y ?? geometry.height / 2 }
  return (
    <Tooltip
      isOpen
      placement={readoutPlacement(at, frame)}
      testID="line-chart-readout"
      style={{
        position: 'absolute',
        left: frame.left + at.x - READOUT_ARROW_INSET,
        top: frame.top + at.y,
        width: 2 * READOUT_ARROW_INSET,
        pointerEvents: 'none',
      }}
      content={
        <View>
          <Typography variant="caption" color="secondary" className={NOWRAP}>
            {`${readout.series} · ${readout.x}`}
          </Typography>
          <Typography variant="subtitle2" className={NOWRAP}>
            {readout.value}
          </Typography>
        </View>
      }
    >
      <View />
    </Tooltip>
  )
}

export interface LineLegendProps {
  series: readonly LineSeries[]
  left: number
}

/** Swatch and label per series, in the band above the plot. */
export function LineLegend({ series, left }: LineLegendProps) {
  const mode = useSurfaceMode()
  return (
    <View
      testID="line-chart-legend"
      className="absolute top-0 flex-row flex-wrap items-center gap-inline-md"
      style={{ left }}
    >
      {series.map((s, index) => (
        <View key={s.id} className="flex-row items-center gap-inline-sm">
          <View
            style={{
              width: SWATCH_END - SWATCH_START,
              borderTopWidth: STROKE_WIDTH,
              borderTopColor: seriesStroke(s, index, mode),
              borderStyle: isDashed(s) ? 'dashed' : 'solid',
            }}
          />
          <Typography variant="caption" color="secondary" className="leading-tight">
            {s.label}
          </Typography>
        </View>
      ))}
    </View>
  )
}
