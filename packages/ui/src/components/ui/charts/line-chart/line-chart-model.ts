// LineChart logic (TD-34 S3): cleaning, projection and facets, plus the navigation re-exported from
// line-navigation-model.ts. Pure, so the planned mutation run reaches it; the component paints the
// geometry this returns.
import { scaleLinear, scaleTime } from 'd3-scale'
import { curveMonotoneX, line } from 'd3-shape'

import { CATEGORICAL_CVD_SAFE_MAX } from '../../../../theme/tokens/primitives'
import { cappedTicks, linearDomain, timeDomain, type Domain } from '../kit/scaleMath'
import { decimateMinMax } from '../kit/thinMath'
import type {
  CleanPoint,
  CleanSeries,
  FinitePoint,
  LineBoundary,
  LineDomains,
  LineGeometry,
  LinePoint,
  LineReference,
  LineSeries,
  LineTick,
  LineXScale,
  ProjectedPoint,
  ProjectedSeries,
} from './types'

const Y_TICK_TARGET = 5
const X_TICK_SPACING_PX = 96

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export const toNumber = (x: number | Date): number => (x instanceof Date ? x.getTime() : x)

/** A plot length that is safe to scale to: negative, zero or non-finite becomes 0. */
const plotExtent = (length: number): number => (isFiniteNumber(length) && length > 0 ? length : 0)

function readPoint(series: LineSeries, point: LinePoint, index: number): CleanPoint | undefined {
  const x = toNumber(point.x)
  if (!isFiniteNumber(x)) return undefined
  if (point.y !== null && !isFiniteNumber(point.y)) return undefined
  return { id: point.id ?? `${series.id}@${index}`, x, y: point.y, point }
}

const keyChanged = (points: readonly CleanPoint[], index: number): boolean =>
  index > 0 && points[index - 1]?.point.segmentKey !== points[index]?.point.segmentKey

function splitSegments(points: readonly CleanPoint[]): FinitePoint[][] {
  const segments: FinitePoint[][] = []
  let run: FinitePoint[] = []
  points.forEach((point, index) => {
    if (point.y === null || keyChanged(points, index)) {
      if (run.length > 0) segments.push(run)
      run = []
    }
    if (point.y !== null) run.push(point as FinitePoint)
  })
  if (run.length > 0) segments.push(run)
  return segments
}

/**
 * Drops and counts points whose x or y is not finite, sorts the rest stably by x (duplicate x
 * stays), and splits them into segments at gaps and at `segmentKey` changes.
 */
export function cleanSeries(series: LineSeries): CleanSeries {
  const read = series.points.map((point, index) => readPoint(series, point, index))
  const points = read.filter((p): p is CleanPoint => p !== undefined).sort((a, b) => a.x - b.x)
  return {
    series,
    points,
    segments: splitSegments(points),
    dropped: read.length - points.length,
    gaps: points.filter((p) => p.y === null).length,
    indexChanges: points.filter((_, index) => keyChanged(points, index)).length,
  }
}

export interface LineDomainOptions {
  width: number
  height: number
  xScale?: LineXScale
  includeZero?: boolean
  referenceLines?: readonly LineReference[]
  boundaries?: readonly LineBoundary[]
}

const finiteReferences = (lines: readonly LineReference[] = []) =>
  lines.filter((reference) => isFiniteNumber(reference.y))

const finiteBoundaries = (boundaries: readonly LineBoundary[] = []) =>
  boundaries.filter((boundary) => isFiniteNumber(toNumber(boundary.x)))

/** Domains holding every cleaned point, reference line and boundary, padded off the plot edges. */
export function lineDomains(
  cleaned: readonly CleanSeries[],
  options: LineDomainOptions
): LineDomains {
  const points = cleaned.flatMap((c) => c.points)
  const xs = [
    ...points.map((p) => p.x),
    ...finiteBoundaries(options.boundaries).map((b) => toNumber(b.x)),
  ]
  const width = plotExtent(options.width)
  const x =
    options.xScale === 'linear'
      ? linearDomain({ values: xs, extent: width })
      : timeDomain({ timestamps: xs, extent: width })
  const y = linearDomain({
    values: points.flatMap((p) => (p.y === null ? [] : [p.y])),
    referenceValues: finiteReferences(options.referenceLines).map((r) => r.y),
    includeZero: options.includeZero,
    extent: plotExtent(options.height),
  })
  return { x, y }
}

interface Scales {
  x: (value: number) => number
  y: (value: number) => number
}

function segmentPath(segment: FinitePoint[], scales: Scales): string[] {
  const first = segment[0]
  const last = segment[segment.length - 1]
  if (!first || !last || segment.length < 2) return []
  const columns = Math.max(Math.ceil(scales.x(last.x) - scales.x(first.x)), 1)
  const kept = decimateMinMax(segment, { x: (p) => p.x, y: (p) => p.y, columns })
  const d = line<FinitePoint>()
    .curve(curveMonotoneX)
    .x((p) => scales.x(p.x))
    .y((p) => scales.y(p.y))(kept)
  return d ? [d] : []
}

function projectOne(clean: CleanSeries, scales: Scales): ProjectedSeries {
  const points: ProjectedPoint[] = clean.points.map((p) => ({
    id: p.id,
    seriesId: clean.series.id,
    x: scales.x(p.x),
    y: p.y === null ? null : scales.y(p.y),
    point: p.point,
  }))
  return {
    series: clean.series,
    points,
    paths: clean.segments.flatMap((s) => segmentPath(s, scales)),
  }
}

// scaleTime takes Dates, which drop the padded domain's sub-ms fraction, so its ticks can fall
// outside a domain a few ms wide.
const withinDomain = (ticks: number[], { min, max }: Domain): number[] =>
  ticks.filter((value) => value >= min && value <= max)

function ticksFor(domains: LineDomains, scales: Scales, width: number, xScale?: LineXScale) {
  const xSource =
    xScale === 'linear'
      ? scaleLinear().domain([domains.x.min, domains.x.max])
      : scaleTime().domain([new Date(domains.x.min), new Date(domains.x.max)])
  const xTicker = { ticks: (count: number) => xSource.ticks(count).map(Number) }
  const yTicker = scaleLinear().domain([domains.y.min, domains.y.max])
  const xTarget = Math.max(Math.floor(width / X_TICK_SPACING_PX), 2)
  const project =
    (scale: (v: number) => number) =>
    (value: number): LineTick => ({ value, position: scale(value) })
  return {
    xTicks: withinDomain(cappedTicks(xTicker, xTarget), domains.x).map(project(scales.x)),
    yTicks: withinDomain(cappedTicks(yTicker, Y_TICK_TARGET), domains.y).map(project(scales.y)),
  }
}

export interface ProjectOptions extends LineDomainOptions {
  /** Shared domains, as facets use; computed from `cleaned` when absent. */
  domains?: LineDomains
}

/** Plot-px geometry: points, one monotone path per segment, ticks, reference lines and boundaries. */
export function projectSeries(
  cleaned: readonly CleanSeries[],
  options: ProjectOptions
): LineGeometry {
  const width = plotExtent(options.width)
  const height = plotExtent(options.height)
  const domains = options.domains ?? lineDomains(cleaned, options)
  const scales: Scales = {
    x: scaleLinear().domain([domains.x.min, domains.x.max]).range([0, width]),
    y: scaleLinear().domain([domains.y.min, domains.y.max]).range([height, 0]),
  }
  return {
    width,
    height,
    domains,
    series: cleaned.map((clean) => projectOne(clean, scales)),
    ...ticksFor(domains, scales, width, options.xScale),
    referenceLines: finiteReferences(options.referenceLines).map((r) => ({
      ...r,
      position: scales.y(r.y),
    })),
    boundaries: finiteBoundaries(options.boundaries).map((b) => ({
      ...b,
      position: scales.x(toNumber(b.x)),
    })),
  }
}

/**
 * Splits series into facets of at most `max`, as even as possible, keeping order and count:
 * 18 series give three facets of six, 7 give four and three. Up to `max` stay in one facet.
 */
export function facetSeries<T>(series: readonly T[], max = CATEGORICAL_CVD_SAFE_MAX): T[][] {
  if (series.length === 0) return []
  const cap = Math.max(Math.floor(max), 1)
  const size = Math.ceil(series.length / Math.ceil(series.length / cap))
  const facets: T[][] = []
  for (let start = 0; start < series.length; start += size) {
    facets.push(series.slice(start, start + size))
  }
  return facets
}

export {
  LINE_NAVIGATION_KEYS,
  nearestPoint,
  nextPoint,
  type NavigableSeries,
} from './line-navigation-model'
