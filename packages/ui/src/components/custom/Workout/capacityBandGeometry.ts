import { formatChartDate } from '../../../utils/workout-format'

export const PADDING_LEFT = 28
export const PADDING_RIGHT = 10
export const PADDING_TOP = 8
export const PADDING_BOTTOM = 16
export const COLUMN_STEP = 4
export const DOT_SIZE = 8

// Structural shapes of the chart's public types, which stay declared in CapacityBandChart.tsx:
// re-exporting interfaces through this module drops their `type` marker in the bundled dist/index.d.ts.
export type DotStatus = 'within' | 'above' | 'below'

export interface BandPoint {
  date: string
  bandLow: number
  bandHigh: number
}

export interface LoadDot {
  date: string
  load: number
  status: DotStatus
}

export interface BandProjection {
  withTraining: BandPoint[]
  withRest: BandPoint[]
}

export interface CapacityBandColors {
  success: string
  info: string
  dotBorder: string
  bandFill: string
  bandEdge: string
  projectionFill: string
  dots: Record<DotStatus, string>
}

export interface PixelPoint {
  x: number
  yHigh: number
  yLow: number
}

export interface CapacityBandScale {
  toX: (date: string) => number
  toY: (value: number) => number
}

export const STATUS_PHRASES: Record<DotStatus, string> = {
  within: 'within range',
  above: 'above range',
  below: 'below range',
}

export function parseTime(date: string): number {
  const parts = date.split('-')
  if (parts.length === 3) {
    return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  }
  const parsed = Date.parse(date)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function toPixels(
  points: BandPoint[],
  toX: (date: string) => number,
  toY: (value: number) => number
): PixelPoint[] {
  return points
    .map((p) => ({ x: toX(p.date), yHigh: toY(p.bandHigh), yLow: toY(p.bandLow) }))
    .sort((a, b) => a.x - b.x)
}

export function interpEdge(pixels: PixelPoint[], x: number, key: 'yHigh' | 'yLow'): number {
  for (let i = 0; i < pixels.length - 1; i++) {
    const a = pixels[i]
    const b = pixels[i + 1]
    if (x >= a.x && x <= b.x) {
      const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x)
      return a[key] + t * (b[key] - a[key])
    }
  }
  return pixels[pixels.length - 1][key]
}

export function buildColumns(pixels: PixelPoint[], step: number) {
  if (pixels.length < 2) return []
  const start = pixels[0].x
  const end = pixels[pixels.length - 1].x
  const columns: Array<{ x: number; top: number; height: number }> = []
  for (let x = start; x < end; x += step) {
    const top = interpEdge(pixels, x, 'yHigh')
    const bottom = interpEdge(pixels, x, 'yLow')
    columns.push({ x, top, height: Math.max(0, bottom - top) })
  }
  return columns
}

export function buildEdges(pixels: PixelPoint[], key: 'yHigh' | 'yLow') {
  const segments: Array<{ left: number; top: number; length: number; angle: number }> = []
  for (let i = 1; i < pixels.length; i++) {
    const a = pixels[i - 1]
    const b = pixels[i]
    const dx = b.x - a.x
    const dy = b[key] - a[key]
    segments.push({
      left: a.x,
      top: a[key],
      length: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    })
  }
  return segments
}

export function collectValues(
  band: BandPoint[],
  workouts: LoadDot[],
  projection?: BandProjection
): number[] {
  const values: number[] = []
  band.forEach((p) => values.push(p.bandLow, p.bandHigh))
  workouts.forEach((w) => values.push(w.load))
  projection?.withTraining.forEach((p) => values.push(p.bandLow, p.bandHigh))
  projection?.withRest.forEach((p) => values.push(p.bandLow, p.bandHigh))
  return values
}

export function currentStatus(workouts: LoadDot[]): string {
  if (workouts.length === 0) return 'no recent sessions'
  const latest = [...workouts].sort((a, b) => parseTime(b.date) - parseTime(a.date))[0]
  return STATUS_PHRASES[latest.status]
}

/** Maps dates and load values into the plot box, padding the value domain by 10%. */
export function capacityBandScale(
  band: BandPoint[],
  workouts: LoadDot[],
  projection: BandProjection | undefined,
  plotWidth: number,
  plotHeight: number
): CapacityBandScale {
  const times = band.map((p) => parseTime(p.date))
  projection?.withTraining.forEach((p) => times.push(parseTime(p.date)))
  projection?.withRest.forEach((p) => times.push(parseTime(p.date)))
  const minT = times.length ? Math.min(...times) : 0
  const maxT = times.length ? Math.max(...times) : 1
  const tRange = maxT - minT || 1

  const values = collectValues(band, workouts, projection)
  const minV = values.length ? Math.min(...values) : 0
  const maxV = values.length ? Math.max(...values) : 1
  const pad = (maxV - minV) * 0.1 || 1
  const domainMin = minV - pad
  const domainMax = maxV + pad
  const vRange = domainMax - domainMin || 1

  const toX = (date: string) => PADDING_LEFT + ((parseTime(date) - minT) / tRange) * plotWidth
  const toY = (value: number) => PADDING_TOP + (1 - (value - domainMin) / vRange) * plotHeight
  return { toX, toY }
}

export type CapacityBandLayout = ReturnType<typeof capacityBandLayout>

/** Pixel geometry for a non-empty band: fill columns, edges, projections and x-label stride. */
export function capacityBandLayout(
  band: BandPoint[],
  projection: BandProjection | undefined,
  { toX, toY }: CapacityBandScale
) {
  const bandPixels = toPixels(band, toX, toY)
  const columns = buildColumns(bandPixels, COLUMN_STEP)
  const topEdge = buildEdges(bandPixels, 'yHigh')
  const bottomEdge = buildEdges(bandPixels, 'yLow')

  const lastBandPoint = band[band.length - 1]
  const trainingPixels = projection
    ? toPixels([lastBandPoint, ...projection.withTraining], toX, toY)
    : []
  const restPixels = projection ? toPixels([lastBandPoint, ...projection.withRest], toX, toY) : []

  const labelStride = Math.max(1, Math.ceil(band.length / 5))
  const hasProjection = Boolean(projection)
  return { columns, topEdge, bottomEdge, trainingPixels, restPixels, labelStride, hasProjection }
}

/** The chart image's accessibility label. */
export function capacityBandSummary(workouts: LoadDot[]): string {
  return `Training capacity band chart. Current capacity: ${currentStatus(
    workouts
  )}. ${workouts.length} workout${workouts.length === 1 ? '' : 's'} shown.`
}

/** A workout dot's accessibility label. */
export function workoutDotLabel(workout: LoadDot): string {
  return `Workout on ${formatChartDate(workout.date)}, load ${workout.load}, ${
    STATUS_PHRASES[workout.status]
  }`
}
