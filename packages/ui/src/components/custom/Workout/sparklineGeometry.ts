/**
 * An explicit plotting range. Both axes default to the data's own extent, which
 * is what every pre-VW-386 consumer gets.
 *
 * `x` exists because a series can stop short of the range it is measured
 * against: a goal's readings run to the current week, but the chart has to run
 * to the goal week so the distance left to close is legible. `y` exists for the
 * same reason on the other axis — a reference line above every reading is drawn
 * OUTSIDE the box unless the caller widens the range to include it.
 */
export interface SparklineDomain {
  x?: [number, number]
  y?: [number, number]
}

/** A shaded region between two values on the y axis, e.g. a committed/stretch band. */
export interface SparklineBand {
  from: number
  to: number
  /** Defaults to a low-alpha `text-tertiary`. */
  color?: string
}

/** Where a reference line's label sits. `above` is the pre-VW-386 behaviour. */
export type SparklineReferenceLabelPlacement = 'above' | 'left'

export interface SparklineReferenceLine {
  value: number
  color: string
  dashed?: boolean
  label?: string
}

export interface SparklinePoint {
  x: number
  y: number
}

/** A [min, max] pair that never has zero width, so no scale divides by zero. */
export function extentOf(values: number[], override?: [number, number]): [number, number] {
  if (override) return override
  if (values.length === 0) return [0, 1]
  return [Math.min(...values), Math.max(...values)]
}

export function scaleY(value: number, [lo, hi]: [number, number], height: number): number {
  return height - ((value - lo) / (hi - lo || 1)) * height
}

export function scaleX(value: number, [lo, hi]: [number, number], width: number): number {
  return ((value - lo) / (hi - lo || 1)) * width
}

/** Each datum's pixel position, plus the y domain the reference lines and band share. */
export function sparklinePoints(
  data: number[],
  xValues: number[] | undefined,
  domain: SparklineDomain | undefined,
  width: number,
  height: number
): { points: SparklinePoint[]; yDomain: [number, number] } {
  const xs = xValues ?? data.map((_, i) => i)
  const xDomain = extentOf(xs, domain?.x)
  const yDomain = extentOf(data, domain?.y)
  const points = data.map((value, i) => ({
    x: scaleX(xs[i] ?? i, xDomain, width),
    y: scaleY(value, yDomain, height),
  }))
  return { points, yDomain }
}

/** Length and rotation in degrees of the segment drawn from `prev` to `point`. */
export function segmentBetween(
  prev: SparklinePoint,
  point: SparklinePoint
): { length: number; angle: number } {
  const dx = point.x - prev.x
  const dy = point.y - prev.y
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  return { length, angle }
}

export function bandRect(
  band: SparklineBand,
  yDomain: [number, number],
  height: number
): { top: number; height: number } {
  return {
    top: Math.min(scaleY(band.from, yDomain, height), scaleY(band.to, yDomain, height)),
    height: Math.abs(scaleY(band.to, yDomain, height) - scaleY(band.from, yDomain, height)),
  }
}
