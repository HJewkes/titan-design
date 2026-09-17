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
  /** Most gridlines to draw; d3 picks round values and the step widens to stay under it. Default 5. */
  tickCount?: number
  /** Band edge interpolation. `monotone` smooths the edges the way the actual line is. */
  bandCurve?: BandCurve
  /** Rule label font size in px; the y-domain pads so those labels clear the plane. */
  labelFont?: number
}

export type BandCurve = 'linear' | 'monotone'

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
  /** Per-week band extents in px, for layered band treatments ({@link bandPathAt}). */
  bandSlices: BandSlice[]
  /**
   * The band is too thin to read as a fill anywhere, so its centre line carries
   * the ramp. True whenever committed and stretch coincide at every week.
   */
  bandIsDegenerate: boolean
  /** The band's centre line, drawn when {@link bandIsDegenerate}. */
  bandEdgePath: string
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
export const CHART_FONT = 11
/** Rule labels sit this far above their rule (baseline to rule). */
export const RULE_LABEL_LIFT = 5
/** Inter's ascender height as a fraction of the font size ("Stretch" has ascenders). */
export const LABEL_ASCENT = 0.76
/** Inter's descender depth as a fraction of the font size, for label-box maths. */
export const LABEL_DESCENT = 0.24
/** Minimum gap between a rule label's top and the plane's top edge. */
export const LABEL_CLEARANCE = 6
/** Room a marker (r=4 dot plus 2px ring, or the star) needs inside the plane. */
export const MARKER_CLEARANCE = 8
/** Upper bound on how many value steps the floor may drop to clear the bottom edge. */
const MAX_FLOOR_STEPS = 10

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

/** Top of a rule label's glyphs, in px, for a rule drawn at `ruleY`. */
export function ruleLabelTop(ruleY: number, font = CHART_FONT): number {
  return ruleY - RULE_LABEL_LIFT - font * LABEL_ASCENT
}

/** Ascender-to-descender height of a rule label, in px. */
export function ruleLabelHeight(font = CHART_FONT): number {
  return font * (LABEL_ASCENT + LABEL_DESCENT)
}

/** Two rules closer than this in px are one rule as far as the labels are concerned. */
export const RULE_COINCIDENT = 0.5

/** Where a rule's label sits: `above` is the default lift, `below` clears a near neighbour. */
export interface RuleLabelPlacement {
  y: number
  side: 'above' | 'below'
}

export interface RuleLabelLayout {
  merged: boolean
  committed: RuleLabelPlacement
  stretch: RuleLabelPlacement
}

function above(ruleY: number): RuleLabelPlacement {
  return { y: ruleY - RULE_LABEL_LIFT, side: 'above' }
}

function below(ruleY: number, font: number): RuleLabelPlacement {
  return { y: ruleY + RULE_LABEL_LIFT + font * LABEL_ASCENT, side: 'below' }
}

/**
 * Lay the two rule labels out so they never overprint: coincident rules merge into
 * one label, and rules closer than a label's height push the LOWER label under its
 * own rule. VW-414: a calibrating goal has committed === stretch, which printed
 * "Committed 128" and "Stretch 128" on the same baseline.
 */
export function ruleLabelLayout(
  committedY: number,
  stretchY: number,
  font = CHART_FONT
): RuleLabelLayout {
  const gap = Math.abs(committedY - stretchY)
  if (gap <= RULE_COINCIDENT) {
    return { merged: true, committed: above(committedY), stretch: above(stretchY) }
  }
  const stretchIsLower = stretchY > committedY
  const crowded = gap < ruleLabelHeight(font)
  return {
    merged: false,
    committed: crowded && !stretchIsLower ? below(committedY, font) : above(committedY),
    stretch: crowded && stretchIsLower ? below(stretchY, font) : above(stretchY),
  }
}

/** A value that must sit at least `need` px below the plot top. */
interface Clearance {
  value: number
  need: number
}

interface ScaleInput {
  values: number[]
  rules: number[]
  plot: PlotRect
  font: number
}

function topClearances({ values, rules, plot, font }: ScaleInput): Clearance[] {
  // The inverse of ruleLabelTop: the highest a rule may sit and keep its label clear.
  const lowestRuleY = planeRect(plot).y + LABEL_CLEARANCE + RULE_LABEL_LIFT + font * LABEL_ASCENT
  const labelNeed = lowestRuleY - plot.top
  return [
    ...rules.map((value) => ({ value, need: labelNeed })),
    ...values.map((value) => ({ value, need: MARKER_CLEARANCE })),
  ]
}

/**
 * The smallest domain top that keeps every value `need` px below the plot top:
 * y(v) >= top + need  <=>  ceiling >= floor + (v - floor) * H / (H - need).
 */
function ceilingFor(floor: number, clearances: Clearance[], height: number): number {
  return clearances.reduce((ceiling, { value, need }) => {
    const usable = Math.max(height * 0.4, height - need)
    return Math.max(ceiling, floor + ((value - floor) * height) / usable)
  }, floor + VALUE_STEP)
}

/**
 * Value scale. The floor starts strictly below the lowest value and steps down
 * until the lowest mark clears the bottom edge; the top pads until every rule
 * label and marker clears the plane's top edge. Both derive from the label font
 * and the plot height, so a 220px phone pads more value range than a 340px wall.
 */
function valueScale(input: ScaleInput) {
  const all = [...input.values, ...input.rules]
  const min = all.length > 0 ? Math.min(...all) : 0
  const height = input.plot.bottom - input.plot.top
  const clearances = topClearances(input)
  let floor = paddedFloor(min)
  let ceiling = ceilingFor(floor, clearances, height)
  for (let i = 0; i < MAX_FLOOR_STEPS; i++) {
    const gap = ((min - floor) / (ceiling - floor)) * height
    if (gap >= MARKER_CLEARANCE) break
    floor -= VALUE_STEP
    ceiling = ceilingFor(floor, clearances, height)
  }
  return scaleLinear().domain([floor, ceiling]).range([input.plot.bottom, input.plot.top])
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

export interface BandSlice {
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

/**
 * The band path, optionally narrowed about its centre line: `spread` 1 is the
 * full band, 0.5 the middle half of it at every week.
 */
export function bandPathAt(slices: BandSlice[], spread = 1, curve: BandCurve = 'linear'): string {
  if (slices.length < 2) return ''
  const half = (d: BandSlice): number => ((d.bottom - d.top) / 2) * spread
  const centre = (d: BandSlice): number => (d.top + d.bottom) / 2
  const shape = area<BandSlice>()
    .x((d) => d.x)
    .y0((d) => centre(d) + half(d))
    .y1((d) => centre(d) - half(d))
  return (curve === 'monotone' ? shape.curve(curveMonotoneX) : shape)(slices) ?? ''
}

/**
 * The band's centre line as a stroked path. VW-414: when the plan's committed and
 * stretch edges coincide the band has no area to fill, so the ramp it describes is
 * drawn as an edge instead. Same curve as the fill, so the two never disagree.
 */
export function bandCentrePath(slices: BandSlice[], curve: BandCurve = 'linear'): string {
  if (slices.length < 2) return ''
  const shape = line<BandSlice>()
    .x((d) => d.x)
    .y((d) => (d.top + d.bottom) / 2)
  return (curve === 'monotone' ? shape.curve(curveMonotoneX) : shape)(slices) ?? ''
}

/** Thickest the band gets, in px. Zero when every week's committed edge equals its stretch edge. */
export function bandThickness(slices: BandSlice[]): number {
  return slices.reduce((max, s) => Math.max(max, s.bottom - s.top), 0)
}

/**
 * Below this the band's fill cannot be seen from across the room, so the centre
 * edge is drawn instead. Measured on the band's THICKEST week, not its thinnest:
 * a normal band that starts pinched at week 1 (committed === stretch before any
 * divergence) is not degenerate and keeps the plain fill.
 */
export const BAND_MIN_THICKNESS = 1.5

/** One vertical strip of the band, spanning its full extent across the strip's width. */
export interface BandColumn {
  x: number
  width: number
  top: number
  bottom: number
}

/** Column width for gradient-painted bands; a 2px step is below what the eye resolves. */
export const BAND_COLUMN_STEP = 2

type Segment = { x0: number; x1: number; ys: number[] }

/**
 * The drawn edge as segments. d3's monotone cubic places both control points at
 * the thirds of each span, so a segment's x is linear in t and y(x) is exact.
 */
function edgeSegments(points: GeometryPoint[], curve: BandCurve): Segment[] {
  const shape = line<GeometryPoint>()
    .x((p) => p.x)
    .y((p) => p.y)
  const d = (curve === 'monotone' ? shape.curve(curveMonotoneX) : shape)(points) ?? ''
  const commands = d.match(/[MLC][^MLC]*/g) ?? []
  const segments: Segment[] = []
  let at = { x: 0, y: 0 }
  commands.forEach((command) => {
    const n = command.slice(1).split(',').map(Number)
    const end = { x: n[n.length - 2], y: n[n.length - 1] }
    if (command[0] === 'L') segments.push({ x0: at.x, x1: end.x, ys: [at.y, at.y, end.y, end.y] })
    if (command[0] === 'C') segments.push({ x0: at.x, x1: end.x, ys: [at.y, n[1], n[3], end.y] })
    at = end
  })
  return segments
}

function edgeYAt(segments: Segment[], x: number): number {
  const seg = segments.find((s) => x <= s.x1) ?? segments[segments.length - 1]
  const t = seg.x1 === seg.x0 ? 0 : Math.min(1, Math.max(0, (x - seg.x0) / (seg.x1 - seg.x0)))
  const [a, b, c, d] = seg.ys
  const u = 1 - t
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d
}

/**
 * The band cut into abutting integer-x columns, each covering the band's full
 * extent across its width, so a per-column gradient can follow the centre line
 * and a clip to the band path trims the overhang.
 */
export function bandColumns(slices: BandSlice[], curve: BandCurve = 'linear'): BandColumn[] {
  if (slices.length < 2) return []
  const top = edgeSegments(
    slices.map((s) => ({ x: s.x, y: s.top })),
    curve
  )
  const bottom = edgeSegments(
    slices.map((s) => ({ x: s.x, y: s.bottom })),
    curve
  )
  const columns: BandColumn[] = []
  const end = Math.ceil(slices[slices.length - 1].x)
  for (let x = Math.floor(slices[0].x); x < end; x += BAND_COLUMN_STEP) {
    const edges = [x, x + BAND_COLUMN_STEP / 2, x + BAND_COLUMN_STEP]
    const tops = edges.map((e) => edgeYAt(top, e))
    const bottoms = edges.map((e) => edgeYAt(bottom, e))
    columns.push({
      x,
      width: BAND_COLUMN_STEP,
      top: Math.min(...tops),
      bottom: Math.max(...bottoms),
    })
  }
  return columns
}

/**
 * Round-valued ticks, at most one more than asked. d3's step for a count can
 * overshoot it (a 14-unit span at 5 gives 7, at step 2), so the request shrinks
 * until the lines fit; one extra is allowed so a 25-unit span keeps its six
 * lines at step 5 rather than collapsing to three at step 10.
 */
export function cappedTicks(
  scale: { ticks: (count: number) => number[] },
  target: number
): number[] {
  const max = target + 1
  for (let count = target; count > 1; count--) {
    const ticks = scale.ticks(count)
    if (ticks.length <= max) return ticks
  }
  return scale.ticks(1).slice(0, max)
}

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
  ].filter((v) => Number.isFinite(v))
  const rules = [committed, stretch].filter((v) => Number.isFinite(v))
  const xScale = scaleLinear()
    .domain([wks.min, wks.max])
    .range([plot.left + WEEK_INSET, plot.right - WEEK_INSET])
  const yScale = valueScale({ values, rules, plot, font: input.labelFont ?? CHART_FONT })
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
    bandPath: hasBand ? bandPathAt(slices, 1, input.bandCurve) : '',
    bandSlices: hasBand ? slices : [],
    bandIsDegenerate: hasBand && bandThickness(slices) < BAND_MIN_THICKNESS,
    bandEdgePath: hasBand ? bandCentrePath(slices, input.bandCurve) : '',
    // One actual is not a line: d3 emits "M42,266Z", a closed zero-length path
    // that paints nothing but still carries the drop-shadow filter (VW-414).
    linePath: actuals.length > 1 ? (actualLine(actuals) ?? '') : '',
    yTicks: cappedTicks(yScale, input.tickCount ?? DEFAULT_TICK_COUNT).map((value) => ({
      value,
      y: toY(value),
    })),
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
