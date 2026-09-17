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
import { area, curveMonotoneX, line } from 'd3-shape'
import { scaleLinear } from 'd3-scale'

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
  /** Approximate gridline count; d3 picks round values near it. Default 5. */
  tickCount?: number
  /** Px kept clear between the highest value and the plot top, for the rule labels. */
  headroom?: number
}

export interface GeometryPoint {
  x: number
  y: number
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

export interface YTick {
  value: number
  y: number
}

export interface PlotRect {
  left: number
  right: number
  top: number
  bottom: number
}

export interface PlaneRect {
  x: number
  y: number
  width: number
  height: number
}

export interface GoalTrajectoryGeometry {
  hasBand: boolean
  hasActuals: boolean
  toX: (weekIndex: number) => number
  toY: (value: number) => number
  /** Value range the plot spans, bottom edge to top edge. */
  domain: { min: number; max: number }
  /** Closed ring: top edge left→right, then bottom edge right→left. */
  bandPolygon: GeometryPoint[]
  /** SVG path for the band: straight edges, because the band is a plan. */
  bandPath: string
  /** SVG path for the actual line: monotone cubic, so it passes through every point. */
  linePath: string
  yTicks: YTick[]
  committedY: number
  stretchY: number
  actuals: ActualCoord[]
  prStars: ActualCoord[]
  deloadRects: DeloadRect[]
  boundaries: BoundaryRule[]
  plot: PlotRect
  /** The lowered plane behind the plot; it overhangs the plot top by PLANE_OVERHANG. */
  plane: PlaneRect
}

/** Left gutter for y-axis value labels. */
export const PLOT_LEFT = 34
export const PLOT_RIGHT = 12
export const PLOT_TOP = 14
/** Bottom gutter for the week-number axis. */
export const PLOT_BOTTOM = 20
/** How far the lowered plane rises above the plot top. */
export const PLANE_OVERHANG = 6
/** The y-domain floor rounds down to a multiple of this, in the goal's unit. */
export const VALUE_STEP = 5
/** Keeps the first and last week's dot and ring inside the rounded plane. */
export const WEEK_INSET = 8
export const DEFAULT_TICK_COUNT = 5
export const DEFAULT_HEADROOM = 11

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

/**
 * The floor sits strictly below the lowest value, on a VALUE_STEP multiple, so the
 * lowest point never lands on the plot's bottom edge (175 floors to 170, 176 to 175).
 */
export function paddedFloor(min: number, step = VALUE_STEP): number {
  return step * (Math.ceil(min / step) - 1)
}

/**
 * Value scale: the padded floor maps to the plot bottom and the highest value to
 * `headroom` px below the plot top, so the stretch label never touches the frame.
 */
function valueScale(values: number[], plot: PlotRect, headroom: number) {
  const min = values.length > 0 ? Math.min(...values) : 0
  const floor = paddedFloor(min)
  const max = values.length > 0 ? Math.max(...values) : floor + VALUE_STEP
  const high = max > floor ? max : floor + VALUE_STEP
  const room = Math.min(headroom, (plot.bottom - plot.top) / 4)
  const fitted = scaleLinear()
    .domain([floor, high])
    .range([plot.bottom, plot.top + room])
  return scaleLinear()
    .domain([floor, fitted.invert(plot.top)])
    .range([plot.bottom, plot.top])
}

function placeActuals(input: GoalTrajectoryGeometryInput) {
  return input.actuals
    .map((actual, index) => ({ actual, index, week: resolveActualWeek(actual, input.weeks) }))
    .filter(
      (a): a is { actual: GoalActualPoint; index: number; week: number } => a.week !== undefined
    )
    .sort((a, b) => a.week - b.week)
}

function plotRect(width: number, height: number): PlotRect {
  return {
    left: PLOT_LEFT,
    right: Math.max(PLOT_LEFT + 1, width - PLOT_RIGHT),
    top: PLOT_TOP,
    bottom: Math.max(PLOT_TOP + 1, height - PLOT_BOTTOM),
  }
}

function planeRect(plot: PlotRect): PlaneRect {
  const y = Math.max(0, plot.top - PLANE_OVERHANG)
  return { x: plot.left, y, width: plot.right - plot.left, height: plot.bottom - y }
}

function deloadRects(
  weeks: GoalTrajectoryWeek[],
  plot: PlotRect,
  weekSpan: number,
  toX: (weekIndex: number) => number
): DeloadRect[] {
  return weeks
    .filter((w) => w.isDeload)
    .map((w) => {
      const centre = toX(w.index)
      const left = Math.max(plot.left, centre - weekSpan / 2)
      const right = Math.min(plot.right, centre + weekSpan / 2)
      return { weekIndex: w.index, x: left, width: Math.max(0, right - left) }
    })
}

interface BandSlice {
  x: number
  top: number
  bottom: number
}

// Pixel-space ordering: this is what makes a loss goal (low > high) draw the
// same well-formed band as a gain goal.
function bandSlices(
  expected: GoalExpectedPoint[],
  toX: (weekIndex: number) => number,
  toY: (value: number) => number
): BandSlice[] {
  return expected
    .map((p) => {
      const a = toY(p.low)
      const b = toY(p.high)
      return { x: toX(p.weekIndex), top: Math.min(a, b), bottom: Math.max(a, b) }
    })
    .sort((a, b) => a.x - b.x)
}

function ringOf(slices: BandSlice[]): GeometryPoint[] {
  const top = slices.map((p) => ({ x: p.x, y: p.top }))
  const bottom = slices.map((p) => ({ x: p.x, y: p.bottom }))
  return [...top, ...bottom.reverse()]
}

function actualCoords(
  placed: ReturnType<typeof placeActuals>,
  toX: (weekIndex: number) => number,
  toY: (value: number) => number
): ActualCoord[] {
  return placed.map((p, i) => ({
    x: toX(p.week),
    y: toY(p.actual.value),
    value: p.actual.value,
    weekIndex: p.week,
    isPR: p.actual.isPR === true,
    matched: p.actual.matched !== false,
    index: i,
  }))
}

const bandArea = area<BandSlice>()
  .x((d) => d.x)
  .y0((d) => d.bottom)
  .y1((d) => d.top)

const actualLine = line<ActualCoord>()
  .x((d) => d.x)
  .y((d) => d.y)
  .curve(curveMonotoneX)

/**
 * Map a goal-progress payload onto chart pixels: the expected-band path, the
 * committed and stretch rules, y gridlines, the actual line with its PR stars,
 * deload shading and meso boundary rules.
 *
 * @example
 * const g = deriveTrajectoryGeometry({
 *   expected, committed: 185, stretch: 195, actuals, weeks, width: 1200, height: 340,
 * })
 * paint(g.bandPath, g.linePath)
 */
export function deriveTrajectoryGeometry(
  input: GoalTrajectoryGeometryInput
): GoalTrajectoryGeometry {
  const { committed, stretch, weeks, mesoBoundaries = [], width, height } = input
  const expected = flattenDeloadWeeks(input.expected, weeks)
  const placed = placeActuals(input)
  const plot = plotRect(width, height)

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
  const xScale = scaleLinear()
    .domain([wks.min, wks.max])
    .range([plot.left + WEEK_INSET, plot.right - WEEK_INSET])
  const yScale = valueScale(values, plot, input.headroom ?? DEFAULT_HEADROOM)
  const toX = (weekIndex: number): number => xScale(weekIndex)
  const toY = (value: number): number => yScale(value)
  const [domainMin, domainMax] = yScale.domain()

  const slices = bandSlices(expected, toX, toY)
  const hasBand = slices.length >= 2
  const actuals = actualCoords(placed, toX, toY)
  const weekSpan = (plot.right - plot.left - 2 * WEEK_INSET) / Math.max(1, wks.max - wks.min)

  return {
    hasBand,
    hasActuals: actuals.length > 0,
    toX,
    toY,
    domain: { min: domainMin, max: domainMax },
    bandPolygon: hasBand ? ringOf(slices) : [],
    bandPath: hasBand ? (bandArea(slices) ?? '') : '',
    linePath: actuals.length > 0 ? (actualLine(actuals) ?? '') : '',
    yTicks: yScale
      .ticks(input.tickCount ?? DEFAULT_TICK_COUNT)
      .map((value) => ({ value, y: toY(value) })),
    committedY: toY(committed),
    stretchY: toY(stretch),
    actuals,
    prStars: actuals.filter((a) => a.isPR),
    deloadRects: deloadRects(weeks, plot, weekSpan, toX),
    boundaries: mesoBoundaries.map((weekIndex) => ({ weekIndex, x: toX(weekIndex) })),
    plot,
    plane: planeRect(plot),
  }
}
