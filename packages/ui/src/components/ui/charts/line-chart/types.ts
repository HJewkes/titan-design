import type { ReactNode } from 'react'
import type { ViewProps } from 'react-native'

import type { ColorToken } from '../../../../theme/resolve-color'
import type { Domain } from '../kit/scaleMath'

/** One reading. `y: null` is a gap; `missing` says why (A8). */
export interface LinePoint {
  /** Stable id for the active point; defaults to `${series.id}@${index}` in input order. */
  id?: string
  x: number | Date
  y: number | null
  missing?: string
  /** A change of key breaks the line: values either side are not comparable (34.1). */
  segmentKey?: string
}

export interface LineSeries {
  id: string
  label: string
  points: LinePoint[]
  color?: ColorToken
  stroke?: 'solid' | 'dashed'
}

export interface LineReference {
  y: number
  label: string
}

export interface LineBoundary {
  x: number | Date
  label?: string
}

export type LineXScale = 'time' | 'linear'

/** A point that survived cleaning, with x as a number (epoch ms on a time axis). */
export interface CleanPoint {
  id: string
  x: number
  y: number | null
  point: LinePoint
}

export type FinitePoint = CleanPoint & { y: number }

export interface CleanSeries {
  series: LineSeries
  /** Finite points and gaps, stably sorted by x. */
  points: CleanPoint[]
  /** Unbroken runs of finite points; a gap or a `segmentKey` change starts a new one. */
  segments: FinitePoint[][]
  /** Points dropped because x or y was not finite. */
  dropped: number
  /** Gaps, that is points with `y: null`. */
  gaps: number
  /** Places where `segmentKey` changes between neighbouring points. */
  indexChanges: number
}

/** A point in plot px, origin at the plot's top left. `y` is `null` for a gap. */
export interface ProjectedPoint {
  id: string
  seriesId: string
  x: number
  y: number | null
  point: LinePoint
}

export interface ProjectedSeries {
  series: LineSeries
  points: ProjectedPoint[]
  /** One SVG path per segment, decimated to the plot width. A one-point segment has none. */
  paths: string[]
}

export interface LineTick {
  value: number
  position: number
}

export interface LineGeometry {
  width: number
  height: number
  domains: LineDomains
  series: ProjectedSeries[]
  xTicks: LineTick[]
  yTicks: LineTick[]
  referenceLines: (LineReference & { position: number })[]
  boundaries: (LineBoundary & { position: number })[]
}

export interface LineDomains {
  x: Domain
  y: Domain
}

export interface LineSummaryOptions {
  metricLabel: string
  formatY?: (y: number) => string
  unit?: string
}

export interface LineChartProps extends ViewProps {
  series: LineSeries[]
  width: number
  height: number
  size?: 'full' | 'compact'
  xScale?: LineXScale
  formatX?: (x: number | Date) => string
  formatY?: (y: number) => string
  unit?: string
  includeZero?: boolean
  referenceLines?: LineReference[]
  boundaries?: LineBoundary[]
  metricLabel: string
  summarize?: (series: LineSeries[]) => string
  /** Controlled active point; `null` means none, `undefined` leaves it uncontrolled (A6). */
  activePointId?: string | null
  defaultActivePointId?: string
  onActivePointChange?: (id: string | null) => void
  onPointPress?: (point: LinePoint, series: LineSeries) => void
  showLegend?: boolean
  facetColumns?: number
  animate?: boolean
  isLoading?: boolean
  emptyState?: ReactNode
  className?: string
}
