/**
 * Pure geometry for {@link GoalTrajectoryChart} (VW-353 / goal-coach G6).
 *
 * The shapes mirror voltras-mcp's `goal-progress` read model so the SPA can pass
 * the payload straight through. Everything here is px maths over that payload:
 * no React, no colour, no theme.
 *
 * The one rule that shapes the whole file: a LOSS goal (bodyweight in a fat-loss
 * phase) arrives with `low` numerically GREATER than `high`, because `low` is the
 * committed edge and `high` the stretch edge, not the smaller and larger number.
 * Band geometry therefore orders in PIXEL space (`Math.min`/`Math.max` on y), so
 * a rising and a falling goal produce an identically well-formed polygon.
 */

/** Read-model status vocabulary (plan §2d). */
export type GoalTrajectoryStatus =
  | 'on_track'
  | 'ahead'
  | 'behind'
  | 'tolerated'
  | 'deload_week'
  | 'calibrating'
  | 'stalled'

/** Which way "better" points. `down` is a loss goal (bodyweight, fat loss). */
export type GoalDirection = 'up' | 'down'

/** One week of the expected band. `low` is the committed edge, `high` the stretch edge. */
export interface GoalExpectedPoint {
  weekIndex: number
  low: number
  high: number
}

/**
 * One measured value. Carries `weekIndex`, or `ts` (YYYY-MM-DD) resolved against
 * week `startDate`s. A point that can be placed by neither is dropped.
 */
export interface GoalActualPoint {
  weekIndex?: number
  ts?: string
  value: number
  isPR?: boolean
  matched?: boolean
}

/** One planned week. `startDate` is only needed to place `ts`-dated actuals. */
export interface GoalTrajectoryWeek {
  index: number
  isDeload?: boolean
  startDate?: string
}

export interface GoalTrajectoryGeometryInput {
  expected: GoalExpectedPoint[]
  committed: number
  stretch: number
  actuals: GoalActualPoint[]
  weeks: GoalTrajectoryWeek[]
  mesoBoundaries?: number[]
  width: number
  height: number
}

export interface GeometryPoint {
  x: number
  y: number
}

/** One vertical slice of the band fill (the no-SVG polygon, as in CapacityBandChart). */
export interface BandColumn {
  x: number
  top: number
  height: number
}

/** A rotated line segment: the no-SVG stroke primitive shared with StrengthTrendChart. */
export interface EdgeSegment {
  left: number
  top: number
  length: number
  angle: number
}

export interface ActualCoord extends GeometryPoint {
  value: number
  weekIndex: number
  isPR: boolean
  matched: boolean
  index: number
}

export interface DeloadRect {
  weekIndex: number
  x: number
  width: number
}

export interface BoundaryRule {
  weekIndex: number
  x: number
}

export interface GoalTrajectoryGeometry {
  hasBand: boolean
  hasActuals: boolean
  toX: (weekIndex: number) => number
  toY: (value: number) => number
  /** Closed ring: top edge left→right, then bottom edge right→left. */
  bandPolygon: GeometryPoint[]
  bandColumns: BandColumn[]
  bandTopEdge: EdgeSegment[]
  bandBottomEdge: EdgeSegment[]
  committedY: number
  stretchY: number
  actuals: ActualCoord[]
  prStars: ActualCoord[]
  actualSegments: EdgeSegment[]
  deloadRects: DeloadRect[]
  boundaries: BoundaryRule[]
  plot: { left: number; right: number; top: number; bottom: number }
}

/** Left gutter for y-axis value labels. */
export const PLOT_LEFT = 34
export const PLOT_RIGHT = 12
export const PLOT_TOP = 14
/** Bottom gutter for the week-number axis. */
export const PLOT_BOTTOM = 20
/** Band fill slice width, in px. Matches CapacityBandChart's COLUMN_STEP. */
export const COLUMN_STEP = 4

function parseDay(date: string): number {
  const parts = date.split('-')
  if (parts.length === 3) {
    return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  }
  const parsed = Date.parse(date)
  return Number.isNaN(parsed) ? Number.NaN : parsed
}

/**
 * Carry the last non-deload band values through every deload week, so the band
 * runs FLAT across a deload instead of continuing to climb against work the plan
 * did not ask for (plan §2d: a deload flattens the band and suspends the verdict).
 */
export function flattenDeloadWeeks(
  expected: GoalExpectedPoint[],
  weeks: GoalTrajectoryWeek[]
): GoalExpectedPoint[] {
  const deload = new Set(weeks.filter((w) => w.isDeload).map((w) => w.index))
  let held: { low: number; high: number } | undefined
  return expected.map((point) => {
    if (!deload.has(point.weekIndex)) {
      held = { low: point.low, high: point.high }
      return point
    }
    return held ? { weekIndex: point.weekIndex, low: held.low, high: held.high } : point
  })
}

/**
 * Place an actual on the week axis. `weekIndex` wins; otherwise `ts` is located
 * between the bracketing week `startDate`s and returned as a fractional week.
 * `undefined` means "not placeable" and the caller drops the point.
 */
export function resolveActualWeek(
  actual: GoalActualPoint,
  weeks: GoalTrajectoryWeek[]
): number | undefined {
  if (actual.weekIndex !== undefined) return actual.weekIndex
  if (!actual.ts) return undefined
  const dated = weeks
    .filter((w) => w.startDate)
    .map((w) => ({ index: w.index, t: parseDay(w.startDate as string) }))
    .filter((w) => !Number.isNaN(w.t))
    .sort((a, b) => a.t - b.t)
  if (dated.length === 0) return undefined
  const t = parseDay(actual.ts)
  if (Number.isNaN(t)) return undefined
  if (t <= dated[0].t) return dated[0].index
  for (let i = 0; i < dated.length - 1; i++) {
    const a = dated[i]
    const b = dated[i + 1]
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t
      const f = span === 0 ? 0 : (t - a.t) / span
      return a.index + f * (b.index - a.index)
    }
  }
  return dated[dated.length - 1].index
}

function buildEdge(points: GeometryPoint[]): EdgeSegment[] {
  const segments: EdgeSegment[] = []
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const dx = b.x - a.x
    const dy = b.y - a.y
    segments.push({
      left: a.x,
      top: a.y,
      length: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    })
  }
  return segments
}

function interpolateY(points: GeometryPoint[], x: number): number {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (x >= a.x && x <= b.x) {
      const f = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x)
      return a.y + f * (b.y - a.y)
    }
  }
  return points[points.length - 1].y
}

function buildColumns(top: GeometryPoint[], bottom: GeometryPoint[]): BandColumn[] {
  if (top.length < 2) return []
  const start = top[0].x
  const end = top[top.length - 1].x
  const columns: BandColumn[] = []
  for (let x = start; x < end; x += COLUMN_STEP) {
    const t = interpolateY(top, x)
    const b = interpolateY(bottom, x)
    columns.push({ x, top: t, height: Math.max(0, b - t) })
  }
  return columns
}

function weekDomain(
  expected: GoalExpectedPoint[],
  weeks: GoalTrajectoryWeek[],
  actualWeeks: number[]
): { min: number; max: number } {
  const all = [
    ...expected.map((p) => p.weekIndex),
    ...weeks.map((w) => w.index),
    ...actualWeeks,
  ].filter((n) => Number.isFinite(n))
  if (all.length === 0) return { min: 0, max: 1 }
  const min = Math.min(...all)
  const max = Math.max(...all)
  return { min, max: max === min ? min + 1 : max }
}

function valueDomain(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 1 }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.12 || Math.max(1, Math.abs(max) * 0.05)
  return { min: min - pad, max: max + pad }
}

/**
 * Map a goal-progress payload onto chart pixels: the expected-band polygon, the
 * committed and stretch rules, the actual line with its PR stars, deload shading
 * and meso boundary rules.
 *
 * @example
 * const g = deriveTrajectoryGeometry({
 *   expected, committed: 185, stretch: 195, actuals, weeks, width: 1200, height: 340,
 * })
 * g.bandColumns.forEach((c) => paint(c.x, c.top, c.height))
 */
export function deriveTrajectoryGeometry(
  input: GoalTrajectoryGeometryInput
): GoalTrajectoryGeometry {
  const { committed, stretch, weeks, mesoBoundaries = [], width, height } = input
  const expected = flattenDeloadWeeks(input.expected, weeks)

  const placed = input.actuals
    .map((actual, index) => ({ actual, index, week: resolveActualWeek(actual, weeks) }))
    .filter(
      (a): a is { actual: GoalActualPoint; index: number; week: number } => a.week !== undefined
    )
    .sort((a, b) => a.week - b.week)

  const plot = {
    left: PLOT_LEFT,
    right: Math.max(PLOT_LEFT + 1, width - PLOT_RIGHT),
    top: PLOT_TOP,
    bottom: Math.max(PLOT_TOP + 1, height - PLOT_BOTTOM),
  }
  const plotWidth = plot.right - plot.left
  const plotHeight = plot.bottom - plot.top

  const wks = weekDomain(
    expected,
    weeks,
    placed.map((p) => p.week)
  )
  const values = [
    ...expected.flatMap((p) => [p.low, p.high]),
    ...placed.map((p) => p.actual.value),
    committed,
    stretch,
  ].filter((v) => Number.isFinite(v))
  const vals = valueDomain(values)

  const toX = (weekIndex: number): number =>
    plot.left + ((weekIndex - wks.min) / (wks.max - wks.min)) * plotWidth
  const toY = (value: number): number =>
    plot.top + (1 - (value - vals.min) / (vals.max - vals.min)) * plotHeight

  // Pixel-space ordering: this is what makes a loss goal (low > high) draw the
  // same well-formed band as a gain goal.
  const ordered = expected
    .map((p) => {
      const a = toY(p.low)
      const b = toY(p.high)
      return { x: toX(p.weekIndex), top: Math.min(a, b), bottom: Math.max(a, b) }
    })
    .sort((a, b) => a.x - b.x)

  const topPoints = ordered.map((p) => ({ x: p.x, y: p.top }))
  const bottomPoints = ordered.map((p) => ({ x: p.x, y: p.bottom }))
  const hasBand = ordered.length >= 2

  const actuals: ActualCoord[] = placed.map((p, i) => ({
    x: toX(p.week),
    y: toY(p.actual.value),
    value: p.actual.value,
    weekIndex: p.week,
    isPR: p.actual.isPR === true,
    matched: p.actual.matched !== false,
    index: i,
  }))

  const weekSpan = plotWidth / Math.max(1, wks.max - wks.min)
  const deloadRects: DeloadRect[] = weeks
    .filter((w) => w.isDeload)
    .map((w) => {
      const centre = toX(w.index)
      const left = Math.max(plot.left, centre - weekSpan / 2)
      const right = Math.min(plot.right, centre + weekSpan / 2)
      return { weekIndex: w.index, x: left, width: Math.max(0, right - left) }
    })

  return {
    hasBand,
    hasActuals: actuals.length > 0,
    toX,
    toY,
    bandPolygon: hasBand ? [...topPoints, ...[...bottomPoints].reverse()] : [],
    bandColumns: hasBand ? buildColumns(topPoints, bottomPoints) : [],
    bandTopEdge: hasBand ? buildEdge(topPoints) : [],
    bandBottomEdge: hasBand ? buildEdge(bottomPoints) : [],
    committedY: toY(committed),
    stretchY: toY(stretch),
    actuals,
    prStars: actuals.filter((a) => a.isPR),
    actualSegments: buildEdge(actuals.map((a) => ({ x: a.x, y: a.y }))),
    deloadRects,
    boundaries: mesoBoundaries.map((weekIndex) => ({ weekIndex, x: toX(weekIndex) })),
    plot,
  }
}
