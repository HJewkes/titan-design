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
import { roundWeight } from '../../../utils/workout-format'
import type {
  ActualCoord,
  GoalTrajectoryGeometry,
  GoalTrajectoryStatus,
  GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'

type ColorToken = keyof ReturnType<typeof getSemanticColors>

/**
 * Status tone tokens.
 *
 * `ahead` takes the BRAND tone, never warning-amber: amber is the pacing/PR hue,
 * and painting "better than asked" in the warning colour is the collision
 * REJECTED.md records under "amber holds".
 */
export const STATUS_TOKEN = {
  on_track: 'status-success',
  ahead: 'brand-primary',
  behind: 'status-warning',
  tolerated: 'status-info',
  deload_week: 'result-neutral',
  calibrating: 'result-inconclusive',
  stalled: 'status-error',
} as const satisfies Record<GoalTrajectoryStatus, ColorToken>

/** The locked depth recipe (2026-09-17): line shadow "1a" and the plane's inner shadows. */
export const DEPTH = {
  lineShadow: { dy: 2, blur: 3, opacity: 0.45 },
  topInner: { opacity: 0.22, spread: 0.12 },
  leftInner: { opacity: 0.16 },
} as const

export const DEFAULT_LEFT_SHADOW_SPREAD = 0.03
export const CHART_FONT = 11
const FONT_FAMILY = 'Inter, sans-serif'
const LABEL_GAP = 8
const RULE_LABEL_LIFT = 5
const PLANE_RADIUS = 6
export const DOT_RADIUS = 4
const DOT_RING = 2

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
    band: alpha(t['brand-secondary'], 0.28),
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

export interface PlotStyle {
  stroke: number
  star: number
  leftShadowSpread: number
}

interface LayerProps {
  geometry: GoalTrajectoryGeometry
  palette: TrajectoryPalette
}

interface DefIds {
  shadow: string
  top: string
  left: string
  clip: string
}

function useDefIds(): DefIds {
  const base = useId().replace(/[^a-zA-Z0-9]/g, '')
  return {
    shadow: `gtc-shadow-${base}`,
    top: `gtc-top-${base}`,
    left: `gtc-left-${base}`,
    clip: `gtc-clip-${base}`,
  }
}

function PlotDefs({
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

function planeBox(plane: GoalTrajectoryGeometry['plane']) {
  return { x: plane.x, y: plane.y, width: plane.width, height: plane.height }
}

function Gridlines({ geometry, palette, showLabels }: LayerProps & { showLabels: boolean }) {
  const { plot, yTicks } = geometry
  return (
    <g data-testid="goal-trajectory-chart-gridlines">
      {yTicks.map((tick) => (
        <g key={tick.value}>
          <line
            data-testid="goal-trajectory-chart-gridline"
            x1={plot.left}
            x2={plot.right}
            y1={tick.y}
            y2={tick.y}
            stroke={palette.grid}
            strokeWidth={1}
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

function RuleLabels({
  geometry,
  palette,
  committed,
  stretch,
}: LayerProps & { committed: number; stretch: number }) {
  const { plot } = geometry
  const labels = [
    {
      key: 'committed',
      y: geometry.committedY,
      text: `Committed ${String(roundWeight(committed))}`,
    },
    { key: 'stretch', y: geometry.stretchY, text: `Stretch ${String(roundWeight(stretch))}` },
  ]
  return (
    <>
      {labels.map((label) => (
        <text
          key={label.key}
          data-testid={`goal-trajectory-chart-${label.key}-label`}
          x={plot.right}
          y={label.y - RULE_LABEL_LIFT}
          fill={palette.rule}
          fontSize={CHART_FONT}
          fontFamily={FONT_FAMILY}
          textAnchor="end"
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
}: LayerProps & { stroke: number; shadowId: string }) {
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
      />
      <path data-testid="goal-trajectory-chart-actual-line" {...common} pathLength={1} />
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
  committed: number
  stretch: number
  weeks: GoalTrajectoryWeek[]
  weekStride: number
  showYLabels: boolean
  style: PlotStyle
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
      <Gridlines {...layer} showLabels={props.showYLabels} />
      <g clipPath={`url(#${ids.clip})`}>
        <DeloadAndBoundaries {...layer} height={height} />
        {geometry.hasBand && (
          <path
            data-testid="goal-trajectory-chart-band"
            d={geometry.bandPath}
            fill={palette.band}
          />
        )}
        <TargetRules {...layer} />
        <ActualLine {...layer} stroke={style.stroke} shadowId={ids.shadow} />
        {geometry.actuals.map((coord) => (
          <ActualPoint key={coord.index} coord={coord} palette={palette} star={style.star} />
        ))}
        <rect data-testid="goal-trajectory-chart-inner-top" {...box} fill={`url(#${ids.top})`} />
        <rect data-testid="goal-trajectory-chart-inner-left" {...box} fill={`url(#${ids.left})`} />
      </g>
      <RuleLabels {...layer} committed={props.committed} stretch={props.stretch} />
      <WeekAxis {...layer} weeks={props.weeks} stride={props.weekStride} />
    </svg>
  )
}
