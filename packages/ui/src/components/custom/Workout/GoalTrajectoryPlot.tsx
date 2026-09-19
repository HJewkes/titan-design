// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * The SVG layer of {@link GoalTrajectoryChart} (VW-385). A DOM `<svg>`, the path
 * CircularProgress, GhostBloom and SvgIcon already take; all maths comes from
 * `deriveTrajectoryGeometry`, so this file only paints.
 */
import { useId } from 'react'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { pressedLevel, surfaceBackground, type SurfaceLevel } from '../../../theme/surface-planes'
import { alpha } from '../../../utils/colors'
import { LIFT_RIM_ALPHA } from '../../../theme/lift'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { roundWeight } from '../../../utils/workout-format'
import type { RuleLabelSpec } from './goalTrajectoryRuleLabels'
import type {
  ActualCoord,
  GoalTrajectoryGeometry,
  GoalTrajectoryStatus,
  GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'
import { CHART_FONT, type BandCurve } from './GoalTrajectoryChartGeometry'
import { BAND_OPACITY, BandLayer, type BandFade } from './GoalTrajectoryBand'
import { CalibratingHatch, type CalibratingMarks } from './GoalTrajectoryCalibrating'
import {
  ENTRANCE,
  drawStyle,
  fadeStyle,
  popStyle,
  type EntranceState,
} from './goalTrajectoryMotion'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/**
 * Status tone tokens.
 *
 * `ahead` is a COOL tone, never warning-amber and no longer the brand orange:
 * amber is the pacing/PR hue, and REJECTED.md's "amber holds" rule is that a hue
 * must never collide with the semantic pacing tones. Orange satisfied the letter
 * of that rule but not its intent — beside `behind`'s amber it read as the same
 * warm family (VW-385 round 3, human call: "change ahead for chart and tile
 * together"). Blue cannot collide with amber at any value.
 *
 * Cyan (`brand-secondary`) was the other candidate and lost: the expected band is
 * painted in exactly that hue at 0.28 alpha, so an "ahead" line would sit on a
 * wash of itself. Blue's own overlap is `tolerated`, which shares the token; the
 * two never describe the same target at the same time.
 *
 * These are the existing semantic status tokens. When the `dataviz-*` semantic
 * keys land the chart-specific entries should move onto them; the map is the
 * single place that swap has to happen.
 */
export const STATUS_TOKEN = {
  on_track: 'status-success',
  ahead: 'status-info',
  behind: 'status-warning',
  tolerated: 'status-info',
  deload_week: 'result-neutral',
  calibrating: 'result-inconclusive',
  stalled: 'status-error',
  // The outcomes take the tones the derived verdict already used: reaching the
  // goal is success green, beating it is the `ahead` blue.
  goal_met: 'status-success',
  beyond_goal: 'status-info',
} as const satisfies Record<GoalTrajectoryStatus, ColorToken>

/** The locked depth recipe (2026-09-17): line shadow "1a" and the plane's inner shadows. */
export const DEPTH = {
  lineShadow: { dy: 2, blur: 3, opacity: 0.45 },
  topInner: { opacity: 0.22, spread: 0.12 },
  leftInner: { opacity: 0.16 },
} as const

export const DEFAULT_LEFT_SHADOW_SPREAD = 0.04
const FONT_FAMILY = 'Inter, sans-serif'
const LABEL_GAP = 8
export const PLANE_RADIUS = 6
export const DOT_RADIUS = 4
export const DOT_RING = 2

/** The alpha a `rgba()` token carries, so a scrim can stand in for pure black. */
function tokenAlpha(color: string): number {
  const match = color.match(/,\s*([\d.]+)\s*\)$/)
  return match ? Number(match[1]) : 1
}

/** Literal colours for one theme mode and plane. Resolved at render, never at import. */
export function trajectoryPalette(
  mode: ThemeMode,
  level: SurfaceLevel,
  status: GoalTrajectoryStatus
) {
  const t = getSemanticColors(mode)
  const shade = t['scrim-default']
  return {
    status: t[STATUS_TOKEN[status]],
    band: alpha(t['brand-secondary'], BAND_OPACITY),
    bandHue: t['brand-secondary'],
    // The card rim's white and alpha, so the plane's lip matches every lifted card.
    lip: alpha(primitiveColors.white, LIFT_RIM_ALPHA[mode]),
    rule: t['text-secondary'],
    grid: alpha(t['text-primary'], 0.12),
    axis: t['text-tertiary'],
    star: t['status-warning'],
    deload: alpha(t['text-primary'], 0.05),
    boundary: alpha(t['text-tertiary'], 0.35),
    plane: surfaceBackground(pressedLevel(level), mode),
    shade,
    // Stop and flood opacities multiply with the scrim's own alpha.
    shadeScale: 1 / tokenAlpha(shade),
  }
}

export type TrajectoryPalette = ReturnType<typeof trajectoryPalette>

/**
 * What sits on the plane's bottom edge: `lip` (locked) drops the floor gridline
 * for the card rim light; `inset-rule` (not chosen) keeps it, clear of the corners.
 */
export type PlotBaseline = 'inset-rule' | 'lip'

/** Which edge of the plot the committed and stretch labels anchor to. */
export type ReferenceLabelSide = 'left' | 'right'

/** Inset from the plot edge for left-anchored labels, so they clear the plane's rounded corner. */
export const LEFT_LABEL_INSET = PLANE_RADIUS + 2

export interface PlotStyle {
  stroke: number
  star: number
  leftShadowSpread: number
  baseline: PlotBaseline
  bandFade: BandFade
  bandCurve: BandCurve
  referenceLabelSide: ReferenceLabelSide
}

export interface LayerProps {
  geometry: GoalTrajectoryGeometry
  palette: TrajectoryPalette
}

export interface DefIds {
  shadow: string
  top: string
  left: string
  clip: string
}

export function useDefIds(): DefIds {
  const base = useId().replace(/[^a-zA-Z0-9]/g, '')
  return {
    shadow: `gtc-shadow-${base}`,
    top: `gtc-top-${base}`,
    left: `gtc-left-${base}`,
    clip: `gtc-clip-${base}`,
  }
}

export function PlotDefs({
  ids,
  geometry,
  palette,
  leftShadowSpread,
}: LayerProps & { ids: DefIds; leftShadowSpread: number }) {
  const { plane } = geometry
  const { lineShadow, topInner, leftInner } = DEPTH
  return (
    <defs>
      <filter id={ids.shadow} x="-5%" y="-40%" width="110%" height="180%">
        <feDropShadow
          dx={0}
          dy={lineShadow.dy}
          stdDeviation={lineShadow.blur}
          floodColor={palette.shade}
          floodOpacity={lineShadow.opacity * palette.shadeScale}
        />
      </filter>
      <linearGradient id={ids.top} x1="0" y1="0" x2="0" y2="1">
        <stop
          offset="0"
          stopColor={palette.shade}
          stopOpacity={topInner.opacity * palette.shadeScale}
        />
        <stop offset={topInner.spread} stopColor={palette.shade} stopOpacity={0} />
      </linearGradient>
      <linearGradient id={ids.left} x1="0" y1="0" x2="1" y2="0">
        <stop
          offset="0"
          stopColor={palette.shade}
          stopOpacity={leftInner.opacity * palette.shadeScale}
        />
        <stop offset={leftShadowSpread} stopColor={palette.shade} stopOpacity={0} />
      </linearGradient>
      <clipPath id={ids.clip}>
        <rect {...planeBox(plane)} rx={PLANE_RADIUS} />
      </clipPath>
    </defs>
  )
}

type PlaneBox = GoalTrajectoryGeometry['plane']

export function planeBox(plane: PlaneBox): PlaneBox {
  return { x: plane.x, y: plane.y, width: plane.width, height: plane.height }
}

/** The floor gridline lands on the plane's bottom edge, where it reads as the lip. */
function isBaseline(tickY: number, plotBottom: number): boolean {
  return Math.abs(tickY - plotBottom) < 0.5
}

function Gridline({
  geometry,
  palette,
  y,
  baseline,
}: LayerProps & { y: number; baseline: PlotBaseline | null }) {
  if (baseline === 'lip') return null
  const inset = baseline === 'inset-rule' ? PLANE_RADIUS : 0
  return (
    <line
      data-testid={baseline ? 'goal-trajectory-chart-baseline' : 'goal-trajectory-chart-gridline'}
      x1={geometry.plot.left + inset}
      x2={geometry.plot.right - inset}
      y1={y}
      y2={y}
      stroke={palette.grid}
      strokeWidth={1}
    />
  )
}

function Gridlines({
  geometry,
  palette,
  showLabels,
  baseline,
}: LayerProps & { showLabels: boolean; baseline: PlotBaseline }) {
  const { plot, yTicks } = geometry
  return (
    <g data-testid="goal-trajectory-chart-gridlines">
      {yTicks.map((tick) => (
        <g key={tick.value}>
          <Gridline
            geometry={geometry}
            palette={palette}
            y={tick.y}
            baseline={isBaseline(tick.y, plot.bottom) ? baseline : null}
          />
          {showLabels && (
            <text
              data-testid="goal-trajectory-chart-y-label"
              x={plot.left - LABEL_GAP}
              y={tick.y + 4}
              fill={palette.axis}
              fontSize={CHART_FONT}
              fontFamily={FONT_FAMILY}
              textAnchor="end"
            >
              {String(roundWeight(tick.value))}
            </text>
          )}
        </g>
      ))}
    </g>
  )
}

function roundedRectPath({ x, y, width, height }: PlaneBox, r: number): string {
  return (
    `M${x + r},${y}H${x + width - r}A${r},${r} 0 0 1 ${x + width},${y + r}` +
    `V${y + height - r}A${r},${r} 0 0 1 ${x + width - r},${y + height}` +
    `H${x + r}A${r},${r} 0 0 1 ${x},${y + height - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`
  )
}

/**
 * The inset well's bottom lip: the plane minus itself shifted up 1px, which
 * leaves a 1px sliver that follows the rounded corners (CSS `inset 0 -1px 0`).
 */
export function PlaneLip({ geometry, palette }: LayerProps) {
  const box = planeBox(geometry.plane)
  const d =
    roundedRectPath(box, PLANE_RADIUS) + roundedRectPath({ ...box, y: box.y - 1 }, PLANE_RADIUS)
  return (
    <path data-testid="goal-trajectory-chart-lip" d={d} fill={palette.lip} fillRule="evenodd" />
  )
}

function DeloadAndBoundaries({ geometry, palette, height }: LayerProps & { height: number }) {
  const { plane } = geometry
  return (
    <>
      {geometry.deloadRects.map((rect) => (
        <rect
          key={`deload-${rect.weekIndex}`}
          data-testid="goal-trajectory-chart-deload"
          x={rect.x}
          y={plane.y}
          width={rect.width}
          height={plane.height}
          fill={palette.deload}
        />
      ))}
      {geometry.boundaries.map((boundary) => (
        <line
          key={`boundary-${boundary.weekIndex}`}
          data-testid="goal-trajectory-chart-meso-boundary"
          x1={boundary.x}
          x2={boundary.x}
          y1={0}
          y2={height}
          stroke={palette.boundary}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ))}
    </>
  )
}

/** Committed solid, stretch dashed, both neutral: status lives on the line and the pill. */
function TargetRules({ geometry, palette }: LayerProps) {
  const { plot, committedY, stretchY } = geometry
  return (
    <>
      <line
        data-testid="goal-trajectory-chart-committed-line"
        x1={plot.left}
        x2={plot.right}
        y1={committedY}
        y2={committedY}
        stroke={palette.rule}
        strokeWidth={1.5}
      />
      <line
        data-testid="goal-trajectory-chart-stretch-line"
        x1={plot.left}
        x2={plot.right}
        y1={stretchY}
        y2={stretchY}
        stroke={palette.rule}
        strokeWidth={1}
        strokeDasharray="3 4"
      />
    </>
  )
}

/** The x a rule label anchors at for a given side. */
export function ruleLabelX(
  plot: { left: number; right: number },
  side: ReferenceLabelSide
): number {
  return side === 'left' ? plot.left + LEFT_LABEL_INSET : plot.right
}

/** The committed and stretch labels, laid out by `ruleLabelSpecs`. */
function RuleLabels({ palette, labels }: { palette: TrajectoryPalette; labels: RuleLabelSpec[] }) {
  return (
    <>
      {labels.map((label) => (
        <text
          key={label.id}
          data-testid={`goal-trajectory-chart-${label.id}`}
          x={label.x}
          y={label.y}
          fill={palette.rule}
          fontSize={CHART_FONT}
          fontFamily={FONT_FAMILY}
          textAnchor={label.anchor}
        >
          {label.text}
        </text>
      ))}
    </>
  )
}

function ActualLine({
  geometry,
  palette,
  stroke,
  shadowId,
  entrance,
}: LayerProps & { stroke: number; shadowId: string; entrance: EntranceState }) {
  if (!geometry.linePath) return null
  const common = {
    d: geometry.linePath,
    fill: 'none',
    stroke: palette.status,
    strokeWidth: stroke,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  }
  return (
    <>
      <path
        data-testid="goal-trajectory-chart-actual-shadow"
        {...common}
        filter={`url(#${shadowId})`}
        style={fadeStyle(entrance, ENTRANCE.shadow)}
      />
      <path
        data-testid="goal-trajectory-chart-actual-line"
        {...common}
        pathLength={1}
        style={drawStyle(entrance)}
      />
    </>
  )
}

/** Five-point star centred on (cx, cy), so it sits on the line like a dot does. */
export function starPoints(cx: number, cy: number, outer: number): string {
  const inner = outer * 0.45
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    return `${String(cx + r * Math.cos(a))},${String(cy + r * Math.sin(a))}`
  }).join(' ')
}

function ActualPoint({
  coord,
  palette,
  star,
}: {
  coord: ActualCoord
  palette: TrajectoryPalette
  star: number
}) {
  if (coord.isPR) {
    return (
      <polygon
        data-testid="goal-trajectory-chart-pr-star"
        points={starPoints(coord.x, coord.y, star)}
        fill={palette.star}
      />
    )
  }
  return (
    <circle
      data-testid="goal-trajectory-chart-actual-dot"
      cx={coord.x}
      cy={coord.y}
      r={DOT_RADIUS}
      fill={coord.matched ? palette.status : palette.plane}
      stroke={coord.matched ? palette.plane : palette.status}
      strokeWidth={DOT_RING}
    />
  )
}

/**
 * The next planned waypoint: a dashed run out of the latest reading to a hollow
 * dot. Hollow and dashed because nothing has been measured there yet — the
 * filled dots and the solid line are readings, this is the ask.
 */
function NextTargetMark({ geometry, palette, stroke }: LayerProps & { stroke: number }) {
  const next = geometry.nextTarget
  if (!next) return null
  return (
    <>
      {next.leadPath && (
        <path
          data-testid="goal-trajectory-chart-next-target-lead"
          d={next.leadPath}
          fill="none"
          stroke={palette.status}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray="6 5"
        />
      )}
      <circle
        data-testid="goal-trajectory-chart-next-target-dot"
        cx={next.x}
        cy={next.y}
        r={DOT_RADIUS}
        fill="none"
        stroke={palette.status}
        strokeWidth={DOT_RING}
      />
    </>
  )
}

function WeekAxis({
  geometry,
  palette,
  weeks,
  stride,
}: LayerProps & { weeks: GoalTrajectoryWeek[]; stride: number }) {
  const y = geometry.plot.bottom + CHART_FONT + 4
  return (
    <>
      {weeks.map((week, i) =>
        i % stride === 0 || i === weeks.length - 1 ? (
          <text
            key={`week-${week.index}`}
            data-testid="goal-trajectory-chart-week-label"
            x={geometry.toX(week.index)}
            y={y}
            fill={palette.axis}
            fontSize={CHART_FONT}
            fontFamily={FONT_FAMILY}
            textAnchor="middle"
          >
            {`w${String(week.index)}`}
          </text>
        ) : null
      )}
    </>
  )
}

export interface GoalTrajectoryPlotProps extends LayerProps {
  width: number
  height: number
  /** The committed and stretch labels, from `ruleLabelSpecs`. */
  ruleLabels: RuleLabelSpec[]
  weeks: GoalTrajectoryWeek[]
  weekStride: number
  showYLabels: boolean
  style: PlotStyle
  entrance: EntranceState
  /** A calibrating goal's hatch; null for every other status. */
  calibrating?: CalibratingMarks | null
}

export function GoalTrajectoryPlot(props: GoalTrajectoryPlotProps) {
  const { geometry, palette, width, height, style } = props
  const ids = useDefIds()
  const layer = { geometry, palette }
  const box = planeBox(geometry.plane)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <PlotDefs ids={ids} {...layer} leftShadowSpread={style.leftShadowSpread} />
      <rect
        data-testid="goal-trajectory-chart-plane"
        {...box}
        rx={PLANE_RADIUS}
        fill={palette.plane}
      />
      <Gridlines {...layer} showLabels={props.showYLabels} baseline={style.baseline} />
      <g clipPath={`url(#${ids.clip})`}>
        <DeloadAndBoundaries {...layer} height={height} />
        {props.calibrating && <CalibratingHatch marks={props.calibrating} {...layer} />}
        <BandLayer
          geometry={geometry}
          hue={palette.bandHue}
          fade={style.bandFade}
          curve={style.bandCurve}
          dashed={Boolean(props.calibrating)}
        />
        <TargetRules {...layer} />
        <ActualLine
          {...layer}
          stroke={style.stroke}
          shadowId={ids.shadow}
          entrance={props.entrance}
        />
        <g style={popStyle(props.entrance)}>
          <NextTargetMark {...layer} stroke={style.stroke} />
        </g>
        {geometry.actuals.map((coord) => (
          <g key={coord.index} style={popStyle(props.entrance)}>
            <ActualPoint coord={coord} palette={palette} star={style.star} />
          </g>
        ))}
        <rect data-testid="goal-trajectory-chart-inner-top" {...box} fill={`url(#${ids.top})`} />
        <rect data-testid="goal-trajectory-chart-inner-left" {...box} fill={`url(#${ids.left})`} />
        {style.baseline === 'lip' && <PlaneLip {...layer} />}
      </g>
      <RuleLabels palette={palette} labels={props.ruleLabels} />
      <WeekAxis {...layer} weeks={props.weeks} stride={props.weekStride} />
    </svg>
  )
}
