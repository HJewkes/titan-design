// Where LineChart puts things (TD-34 S4): the plot frame, the density table, series colour and
// the labels of the right gutter. Pure, so the planned mutation run reaches it.
import { resolveColor } from '../../../../theme/resolve-color'
import { categoricalPalette } from '../../../../theme/tokens/primitives'
import type { ThemeMode } from '../../../../theme/tokens/semantic'
import type { TooltipPlacement } from '../../tooltip'
import type { LineSeries, ProjectedPoint, ProjectedSeries } from './types'
import type { LineChartFacet } from './useLineChart'

/** Where the plot sits inside the chart box, in px. `right` is the label gutter. */
export interface PlotFrame {
  left: number
  top: number
  right: number
  plotWidth: number
  plotHeight: number
}

export const STROKE_WIDTH = 2
/** The swatch that ties an end label to its line runs between these px, right of the plot. */
export const SWATCH_START = 6
export const SWATCH_END = 18
export const LABEL_START = 24
const LABEL_HEIGHT = 16

const DENSITY_BREAKPOINT_PX = 720
/** Label room by chart width: the gutters and the gap between x labels loosen from 720 px. */
const DENSITY = {
  roomy: { yGutter: 56, labelGutter: 128, xLabelGap: 80 },
  tight: { yGutter: 44, labelGutter: 96, xLabelGap: 60 },
} as const
const EDGE_PAD = 16
const TOP_PAD = 12
const LEGEND_HEIGHT = 28
const X_AXIS_HEIGHT = 28

export const densityFor = (width: number) =>
  width >= DENSITY_BREAKPOINT_PX ? DENSITY.roomy : DENSITY.tight

export interface FrameInput {
  width: number
  height: number
  /** End labels or reference labels need the right gutter; without either none is reserved. */
  hasGutterLabels: boolean
  hasLegend: boolean
}

export function plotFrame({ width, height, hasGutterLabels, hasLegend }: FrameInput): PlotFrame {
  const density = densityFor(width)
  const left = density.yGutter
  const top = hasLegend ? LEGEND_HEIGHT : TOP_PAD
  const right = hasGutterLabels ? density.labelGutter : EDGE_PAD
  return {
    left,
    top,
    right,
    plotWidth: Math.max(width - left - right, 0),
    plotHeight: Math.max(height - top - X_AXIS_HEIGHT, 0),
  }
}

/** Series colour: the categorical palette in order, or the series' own token. */
export function seriesStroke(series: LineSeries, index: number, mode: ThemeMode): string {
  if (series.color) return resolveColor(series.color, mode)
  const palette = categoricalPalette.default
  return palette[index % palette.length] as string
}

export const isDashed = (series: LineSeries): boolean => series.stroke === 'dashed'

const lastFinite = (series: ProjectedSeries): ProjectedPoint | undefined =>
  [...series.points].reverse().find((point) => point.y !== null)

/** Finite points that stand alone in their segment: they get a dot, since no path reaches them. */
export function lonePoints(facet: LineChartFacet, index: number): ProjectedPoint[] {
  const lone = new Set(
    facet.cleaned[index]?.segments.flatMap((s) => (s.length === 1 ? [s[0]?.id] : []))
  )
  return facet.geometry.series[index]?.points.filter((p) => lone.has(p.id)) ?? []
}

export interface GutterLabel {
  key: string
  y: number
  text: string
  /** Stroke of the swatch that ties an end label to its line; a rule label has none. */
  stroke?: string
  dashed?: boolean
}

/** Pushes labels at least `gap` px apart, top to bottom, then back up so none passes `max`. */
function spreadLabels(labels: GutterLabel[], gap: number, max: number): GutterLabel[] {
  const placed = [...labels].sort((a, b) => a.y - b.y)
  placed.forEach((label, i) => {
    const above = placed[i - 1]
    if (above) placed[i] = { ...label, y: Math.max(label.y, above.y + gap) }
  })
  let ceiling = max
  for (let i = placed.length - 1; i >= 0; i--) {
    const label = placed[i] as GutterLabel
    placed[i] = { ...label, y: Math.min(label.y, ceiling) }
    ceiling = (placed[i] as GutterLabel).y - gap
  }
  return placed
}

/** Reference labels, and end labels when shown, each at its line and spread so none overlaps. */
export function gutterLabels(
  facet: LineChartFacet,
  showEndLabels: boolean,
  mode: ThemeMode
): GutterLabel[] {
  const { geometry } = facet
  const rules = geometry.referenceLines.map((rule, i) => ({
    key: `rule-${String(i)}`,
    y: rule.position,
    text: rule.label,
  }))
  const ends = geometry.series.flatMap((s, i) => {
    const end = lastFinite(s)
    if (!showEndLabels || !end || end.y === null) return []
    const stroke = seriesStroke(s.series, i, mode)
    return [
      { key: s.series.id, y: end.y, text: s.series.label, stroke, dashed: isDashed(s.series) },
    ]
  })
  return spreadLabels([...rules, ...ends], LABEL_HEIGHT, geometry.height)
}

/** An active point nearer the top than this shows its readout below, where there is room. */
const READOUT_FLIP_PX = 64
/** Within this of a chart edge the readout opens inward from the point instead of centred. */
const READOUT_HALF_WIDTH = 112

/** Side of the active point the readout opens on: away from whichever chart edge is near. */
export function readoutPlacement(at: { x: number; y: number }, frame: PlotFrame): TooltipPlacement {
  const side = at.y < READOUT_FLIP_PX ? 'bottom' : 'top'
  if (frame.left + at.x < READOUT_HALF_WIDTH) return `${side}-start`
  if (frame.plotWidth - at.x + frame.right < READOUT_HALF_WIDTH) return `${side}-end`
  return side
}
