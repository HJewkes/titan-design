import { formatTrimmedDecimal } from '../../../../utils/number-format'

export interface ScatterDatum {
  /** Stable identity — returned by onPress and used as the React key. */
  id: string
  /** Horizontal position in data space. */
  x: number
  /** Vertical position in data space. */
  y: number
  /** Bubble radius in px. Falls back to a fixed default when omitted. */
  r?: number
  /** Bubble fill color. Falls back to a built-in categorical palette by index. */
  color?: string
  /** Optional label shown for large or selected points. */
  label?: string
}

export interface ScatterAxis {
  xLabel?: string
  yLabel?: string
  /** Domain overrides. Any omitted bound is derived from the data. */
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
}

/** A reference line in data space: horizontal, vertical, or `y = slope * x + intercept`. */
export type ScatterReferenceLine = (
  | { y: number }
  | { x: number }
  | { slope: number; intercept: number }
) & {
  /** Stable identity. Falls back to the line's index. */
  id?: string
  /** Joins the canvas accessible name; never painted. */
  label?: string
}

/** The `diagonal` shorthand: y = 1 − x. */
export const DIAGONAL_LINE: ScatterReferenceLine = { slope: -1, intercept: 1 }

export interface ScatterSegment {
  id: string
  label?: string
  x1: number
  y1: number
  x2: number
  y2: number
}

export const DEFAULT_R = 6

export const PLOT_LEFT = 40
export const PLOT_RIGHT = 12
export const PLOT_TOP = 12
export const PLOT_BOTTOM = 34
export const TICK_COUNT = 5

export interface Domain {
  min: number
  max: number
}

export interface ScatterPoint {
  datum: ScatterDatum
  cx: number
  cy: number
  radius: number
  color: string
}

export interface ScatterLayout {
  innerW: number
  innerH: number
  xd: Domain
  yd: Domain
  toX: (x: number) => number
  toY: (y: number) => number
  points: ScatterPoint[]
}

/** Derive a padded [min, max] from values, honoring explicit overrides. */
export function domainOf(values: number[], min?: number, max?: number): Domain {
  const lo = min ?? (values.length ? Math.min(...values) : 0)
  const hi = max ?? (values.length ? Math.max(...values) : 1)
  if (hi > lo) return { min: lo, max: hi }
  const pad = Math.abs(hi) * 0.1 || 0.5
  return { min: lo - pad, max: hi + pad }
}

/** Evenly spaced tick values across a domain. */
export function ticksOf(d: Domain, count: number): number[] {
  return Array.from({ length: count }, (_, i) => d.min + ((d.max - d.min) * i) / (count - 1))
}

/** Adaptive tick precision: sub-1 domains need 2dp to stay legible, else 1dp. */
export function tickLabel(v: number): string {
  return formatTrimmedDecimal(v, Math.abs(v) < 1 ? 2 : 1)
}

/** Plot box, domains, data-to-pixel scales and positioned points for one render. */
export function scatterLayout(
  data: ScatterDatum[],
  width: number,
  height: number,
  axis: ScatterAxis,
  palette: string[]
): ScatterLayout {
  const innerW = Math.max(1, width - PLOT_LEFT - PLOT_RIGHT)
  const innerH = Math.max(1, height - PLOT_TOP - PLOT_BOTTOM)
  const xd = domainOf(
    data.map((d) => d.x),
    axis.xMin,
    axis.xMax
  )
  const yd = domainOf(
    data.map((d) => d.y),
    axis.yMin,
    axis.yMax
  )

  const toX = (x: number) => PLOT_LEFT + ((x - xd.min) / (xd.max - xd.min)) * innerW
  const toY = (y: number) => PLOT_TOP + (1 - (y - yd.min) / (yd.max - yd.min)) * innerH

  const points = data.map((d, i) => ({
    datum: d,
    cx: toX(d.x),
    cy: toY(d.y),
    radius: d.r ?? DEFAULT_R,
    color: d.color ?? palette[i % palette.length],
  }))

  return { innerW, innerH, xd, yd, toX, toY, points }
}

export function scatterAriaLabel(
  axis: ScatterAxis,
  count: number,
  segments: ScatterSegment[] = []
): string {
  const base = `Scatter plot of ${axis.xLabel ?? 'x'} versus ${axis.yLabel ?? 'y'}, ${count} point${count === 1 ? '' : 's'}`
  const labels = segments.flatMap((s) => (s.label ? [s.label] : []))
  return labels.length ? `${base}, reference lines: ${labels.join(', ')}` : base
}

function hasFiniteValues(line: ScatterReferenceLine): boolean {
  if ('y' in line) return Number.isFinite(line.y)
  if ('x' in line) return Number.isFinite(line.x)
  return Number.isFinite(line.slope) && Number.isFinite(line.intercept)
}

/** Data-space endpoints of a line clipped to the domains, or null when it misses the plot box. */
function clipLine(
  line: ScatterReferenceLine,
  xd: Domain,
  yd: Domain
): [[number, number], [number, number]] | null {
  if (!hasFiniteValues(line)) return null
  if ('y' in line) {
    if (line.y < yd.min || line.y > yd.max) return null
    return [
      [xd.min, line.y],
      [xd.max, line.y],
    ]
  }
  if ('x' in line) {
    if (line.x < xd.min || line.x > xd.max) return null
    return [
      [line.x, yd.min],
      [line.x, yd.max],
    ]
  }
  const { slope, intercept } = line
  let lo = xd.min
  let hi = xd.max
  if (slope === 0) {
    if (intercept < yd.min || intercept > yd.max) return null
  } else {
    const a = (yd.min - intercept) / slope
    const b = (yd.max - intercept) / slope
    lo = Math.max(lo, Math.min(a, b))
    hi = Math.min(hi, Math.max(a, b))
    if (lo > hi) return null
  }
  return [
    [lo, slope * lo + intercept],
    [hi, slope * hi + intercept],
  ]
}

/** Pixel segments for reference lines, clipped to the plot box. Lines outside the domain yield none. */
export function referenceSegments(
  layout: Pick<ScatterLayout, 'xd' | 'yd' | 'toX' | 'toY'>,
  lines: ScatterReferenceLine[]
): ScatterSegment[] {
  const { xd, yd, toX, toY } = layout
  return lines.flatMap((line, i) => {
    const ends = clipLine(line, xd, yd)
    if (!ends) return []
    const [[ax, ay], [bx, by]] = ends
    return [
      {
        id: line.id ?? `reference-${i}`,
        label: line.label,
        x1: toX(ax),
        y1: toY(ay),
        x2: toX(bx),
        y2: toY(by),
      },
    ]
  })
}
