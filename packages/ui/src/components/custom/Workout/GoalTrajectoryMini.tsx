// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * The per-lift card's trajectory at card scale (VW-385 ideation). A sibling of
 * {@link GoalTrajectoryChart}: same geometry, curve, tones, depth recipe, marks
 * and entrance, with the axes, band and gridlines dropped. Status: `lab`.
 */
import { useMemo } from 'react'
import { View, type ViewProps } from 'react-native'
import { useSurface } from '../../ui/surface'
import { surfaceBackground } from '../../../theme/surface-planes'
import { alpha } from '../../../utils/colors'
import { formatMilestoneLoad } from '../../../utils/workout-format'
import {
  LABEL_ASCENT,
  RULE_LABEL_LIFT,
  deriveTrajectoryGeometry,
  ruleLabelLayout,
  trajectoryWeekScale,
  type GoalActualPoint,
  type GoalDirection,
  type GoalNextTarget,
  type GoalTrajectoryGeometry,
  type GoalTrajectoryGeometryInput,
  type GoalTrajectoryStatus,
  type GoalTrajectoryWeek,
  type PlotInsets,
} from './GoalTrajectoryChartGeometry'
import {
  DEFAULT_LEFT_SHADOW_SPREAD,
  PLANE_RADIUS,
  PlaneLip,
  PlotDefs,
  planeBox,
  ruleLabelX,
  starPoints,
  trajectoryPalette,
  useDefIds,
  type LayerProps,
  type TrajectoryPalette,
} from './GoalTrajectoryPlot'
import { REACH_STATUS, trajectoryReach } from './GoalTrajectoryChart'
import {
  ENTRANCE,
  drawStyle,
  fadeStyle,
  popStyle,
  useTrajectoryEntrance,
  type EntranceState,
} from './goalTrajectoryMotion'

/**
 * - `plane`: the inset plane, line, points and a faint unlabelled committed rule.
 * - `plane-rules`: `plane` plus the stretch rule and tiny left-anchored values.
 * - `on-card`: no plane; the card's own surface, with the lip kept as a baseline.
 * - `week-columns`: `plane` pinned under the week cells, points leading, line recessed.
 */
export type MiniTrajectoryVariant = 'plane' | 'plane-rules' | 'on-card' | 'week-columns'

/** The big chart's marks at card scale: stroke, dot and star all step down together. */
export const MINI_MARKS = { stroke: 2, dot: 3.5, ring: 1.5, star: 5.5, labelFont: 9 } as const

/** No axis gutters: the plane runs edge to edge and its lip sits on the canvas floor. */
export const MINI_INSETS: PlotInsets = { left: 0, right: 0, top: 8, bottom: 1 }

/** Recessed line alpha for `week-columns`, where the points carry the reading. */
export const RECESSED_LINE_ALPHA = 0.4

export interface GoalTrajectoryMiniData {
  actuals: GoalActualPoint[]
  committed: number
  stretch: number
  /** The goal week; the x axis runs from week 1 to here. */
  goalWeek: number
  nextTarget?: GoalNextTarget
}

export interface GoalTrajectoryMiniProps extends GoalTrajectoryMiniData, ViewProps {
  status: GoalTrajectoryStatus
  variant: MiniTrajectoryVariant
  width: number
  height: number
  direction?: GoalDirection
  /** 1-based; `week-columns` tints its column so the cell above reads as its header. */
  currentWeek?: number
  animate?: boolean
  unit?: string
  metricLabel?: string
}

export function miniWeeks(goalWeek: number): GoalTrajectoryWeek[] {
  return Array.from({ length: Math.max(1, goalWeek) }, (_, i) => ({ index: i + 1 }))
}

/** Does this variant draw the stretch rule? Without it, stretch stays out of the value range. */
export function showsStretch(variant: MiniTrajectoryVariant): boolean {
  return variant === 'plane-rules'
}

/**
 * The shared geometry input: no band, compact insets, and the stretch rule only
 * where it is drawn, so an undrawn rule never squeezes the line flat.
 */
export function miniGeometryInput(
  data: GoalTrajectoryMiniData,
  variant: MiniTrajectoryVariant,
  width: number,
  height: number
): GoalTrajectoryGeometryInput {
  return {
    expected: [],
    committed: data.committed,
    stretch: showsStretch(variant) ? data.stretch : data.committed,
    actuals: data.actuals,
    weeks: miniWeeks(data.goalWeek),
    width,
    height,
    insets: MINI_INSETS,
    labelFont: showsStretch(variant) ? MINI_MARKS.labelFont : 0,
    ...(data.nextTarget ? { nextTarget: data.nextTarget } : {}),
  }
}

/** The mini chart's week columns, for a week strip that has to sit exactly over them. */
export function miniWeekAxis(data: GoalTrajectoryMiniData, width: number) {
  const scale = trajectoryWeekScale({
    expected: [],
    weeks: miniWeeks(data.goalWeek),
    actuals: data.actuals,
    ...(data.nextTarget ? { nextTarget: data.nextTarget } : {}),
    width,
    insets: MINI_INSETS,
  })
  return { x: scale.toX, span: scale.span, left: scale.plot.left, right: scale.plot.right }
}

interface MiniLayer extends LayerProps {
  variant: MiniTrajectoryVariant
  ring: string
}

function CommittedRule({ geometry, palette }: LayerProps) {
  const { plot, committedY } = geometry
  return (
    <line
      data-testid="goal-trajectory-mini-committed-line"
      x1={plot.left}
      x2={plot.right}
      y1={committedY}
      y2={committedY}
      stroke={alpha(palette.rule, 0.45)}
      strokeWidth={1}
    />
  )
}

function StretchRule({ geometry, palette }: LayerProps) {
  const { plot, stretchY } = geometry
  return (
    <line
      data-testid="goal-trajectory-mini-stretch-line"
      x1={plot.left}
      x2={plot.right}
      y1={stretchY}
      y2={stretchY}
      stroke={alpha(palette.rule, 0.45)}
      strokeWidth={1}
      strokeDasharray="3 4"
    />
  )
}

function MiniLabel({
  palette,
  x,
  y,
  id,
  text,
}: {
  palette: TrajectoryPalette
  x: number
  y: number
  id: string
  text: string
}) {
  return (
    <text
      data-testid={`goal-trajectory-mini-${id}`}
      x={x}
      y={y}
      fill={palette.axis}
      fontSize={MINI_MARKS.labelFont}
      fontFamily="Inter, sans-serif"
      textAnchor="start"
    >
      {text}
    </text>
  )
}

/**
 * Label baselines for the two rules. A label lifted above the lower rule would be
 * struck through by the upper one, so when the rules sit closer than a label's
 * lift the lower label drops under its own rule instead.
 */
export function miniRuleLabelYs(
  committedY: number,
  stretchY: number,
  font: number = MINI_MARKS.labelFont
): { committed: number; stretch: number } {
  const lift = RULE_LABEL_LIFT + font * LABEL_ASCENT
  const struck = Math.abs(committedY - stretchY) < lift
  const place = (y: number, isLower: boolean) =>
    struck && isLower ? y + lift : y - RULE_LABEL_LIFT
  return {
    committed: place(committedY, committedY > stretchY),
    stretch: place(stretchY, stretchY > committedY),
  }
}

/** Bare values, left-anchored: the big chart's `referenceLabelSide="left"` at card scale. */
function RuleValues({
  geometry,
  palette,
  committed,
  stretch,
}: LayerProps & { committed: number; stretch: number }) {
  const x = ruleLabelX(geometry.plot, 'left')
  const { merged } = ruleLabelLayout(geometry.committedY, geometry.stretchY, MINI_MARKS.labelFont)
  const ys = miniRuleLabelYs(geometry.committedY, geometry.stretchY)
  const c = formatMilestoneLoad(committed)
  if (merged) {
    return <MiniLabel palette={palette} x={x} y={ys.committed} id="merged-label" text={c} />
  }
  return (
    <>
      <MiniLabel palette={palette} x={x} y={ys.committed} id="committed-label" text={c} />
      <MiniLabel
        palette={palette}
        x={x}
        y={ys.stretch}
        id="stretch-label"
        text={formatMilestoneLoad(stretch)}
      />
    </>
  )
}

function CurrentWeekColumn({ geometry, palette, week }: LayerProps & { week: number }) {
  const scaleSpan = geometry.toX(2) - geometry.toX(1)
  const { plane } = geometry
  return (
    <rect
      data-testid="goal-trajectory-mini-current-week"
      x={geometry.toX(week) - scaleSpan / 2}
      y={plane.y}
      width={scaleSpan}
      height={plane.height}
      fill={palette.deload}
    />
  )
}

function MiniLine({
  geometry,
  palette,
  variant,
  shadowId,
  entrance,
}: MiniLayer & { shadowId: string; entrance: EntranceState }) {
  if (!geometry.linePath) return null
  const recessed = variant === 'week-columns'
  const common = {
    d: geometry.linePath,
    fill: 'none',
    stroke: recessed ? alpha(palette.status, RECESSED_LINE_ALPHA) : palette.status,
    strokeWidth: MINI_MARKS.stroke,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  }
  return (
    <>
      {!recessed && (
        <path
          data-testid="goal-trajectory-mini-shadow"
          {...common}
          filter={`url(#${shadowId})`}
          style={fadeStyle(entrance, ENTRANCE.shadow)}
        />
      )}
      <path
        data-testid="goal-trajectory-mini-line"
        {...common}
        pathLength={1}
        style={drawStyle(entrance)}
      />
    </>
  )
}

function MiniNextTarget({ geometry, palette }: LayerProps) {
  const next = geometry.nextTarget
  if (!next) return null
  return (
    <>
      {next.leadPath && (
        <path
          d={next.leadPath}
          fill="none"
          stroke={palette.status}
          strokeWidth={MINI_MARKS.ring}
          strokeLinecap="round"
          strokeDasharray="4 4"
        />
      )}
      <circle
        data-testid="goal-trajectory-mini-next-target"
        cx={next.x}
        cy={next.y}
        r={MINI_MARKS.dot}
        fill="none"
        stroke={palette.status}
        strokeWidth={MINI_MARKS.ring}
      />
    </>
  )
}

function MiniPoints({
  geometry,
  palette,
  ring,
  entrance,
}: MiniLayer & { entrance: EntranceState }) {
  return (
    <g style={popStyle(entrance)}>
      <MiniNextTarget geometry={geometry} palette={palette} />
      {geometry.actuals.map((coord) =>
        coord.isPR ? (
          <polygon
            key={coord.index}
            data-testid="goal-trajectory-mini-pr-star"
            points={starPoints(coord.x, coord.y, MINI_MARKS.star)}
            fill={palette.star}
          />
        ) : (
          <circle
            key={coord.index}
            data-testid="goal-trajectory-mini-dot"
            cx={coord.x}
            cy={coord.y}
            r={MINI_MARKS.dot}
            fill={coord.matched ? palette.status : ring}
            stroke={coord.matched ? ring : palette.status}
            strokeWidth={MINI_MARKS.ring}
          />
        )
      )}
    </g>
  )
}

function PlaneFill({ geometry, palette, ids }: LayerProps & { ids: ReturnType<typeof useDefIds> }) {
  const box = planeBox(geometry.plane)
  return (
    <>
      <rect
        data-testid="goal-trajectory-mini-plane"
        {...box}
        rx={PLANE_RADIUS}
        fill={palette.plane}
      />
      <rect {...box} fill={`url(#${ids.top})`} />
      <rect {...box} fill={`url(#${ids.left})`} />
    </>
  )
}

interface MiniPlotProps extends MiniLayer {
  width: number
  height: number
  committed: number
  stretch: number
  currentWeek?: number
  entrance: EntranceState
}

function MiniPlot(props: MiniPlotProps) {
  const { geometry, palette, variant, width, height } = props
  const ids = useDefIds()
  const layer = { geometry, palette }
  const hasPlane = variant !== 'on-card'
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <PlotDefs ids={ids} {...layer} leftShadowSpread={DEFAULT_LEFT_SHADOW_SPREAD} />
      <g clipPath={`url(#${ids.clip})`}>
        {hasPlane && <PlaneFill {...layer} ids={ids} />}
        {variant === 'week-columns' && props.currentWeek !== undefined && (
          <CurrentWeekColumn {...layer} week={props.currentWeek} />
        )}
        <CommittedRule {...layer} />
        {showsStretch(variant) && <StretchRule {...layer} />}
        <MiniLine {...props} shadowId={ids.shadow} />
        <MiniPoints {...props} />
        <PlaneLip {...layer} />
      </g>
      {showsStretch(variant) && (
        <RuleValues {...layer} committed={props.committed} stretch={props.stretch} />
      )}
    </svg>
  )
}

function miniSummary(
  metricLabel: string,
  geometry: GoalTrajectoryGeometry,
  committed: number,
  unit: string
): string {
  const latest = geometry.actuals[geometry.actuals.length - 1]
  const reading = latest ? `latest ${formatMilestoneLoad(latest.value)} ${unit}` : 'no readings yet'
  return `${metricLabel} trajectory: ${reading}, committed ${formatMilestoneLoad(committed)} ${unit}.`
}

/**
 * A lift's trajectory at card scale: the big chart's inset plane, monotone line,
 * points, PR star and next-target marker, without axes, band or gridlines.
 *
 * @example
 * <GoalTrajectoryMini variant="plane" status="on_track" committed={102.5} stretch={110}
 *   goalWeek={8} actuals={[{ weekIndex: 1, value: 92.5 }]} width={408} height={64} />
 */
export function GoalTrajectoryMini({
  actuals,
  committed,
  stretch,
  goalWeek,
  nextTarget,
  status,
  variant,
  width,
  height,
  direction = 'up',
  currentWeek,
  animate = true,
  unit = 'lb',
  metricLabel = 'Goal',
  ...props
}: GoalTrajectoryMiniProps) {
  const surface = useSurface()
  const reach = trajectoryReach(committed, actuals, direction)
  const palette = trajectoryPalette(
    surface.mode,
    surface.level,
    reach === 'short' ? status : REACH_STATUS[reach]
  )
  const ring =
    variant === 'on-card' ? surfaceBackground(surface.level, surface.mode) : palette.plane
  const entrance = useTrajectoryEntrance(animate)
  const geometry = useMemo(
    () =>
      deriveTrajectoryGeometry(
        miniGeometryInput(
          { actuals, committed, stretch, goalWeek, ...(nextTarget ? { nextTarget } : {}) },
          variant,
          width,
          height
        )
      ),
    [actuals, committed, stretch, goalWeek, nextTarget, variant, width, height]
  )
  return (
    <View
      style={{ width, height }}
      accessibilityRole="image"
      accessibilityLabel={miniSummary(metricLabel, geometry, committed, unit)}
      testID="goal-trajectory-mini"
      {...props}
    >
      <MiniPlot
        geometry={geometry}
        palette={palette}
        variant={variant}
        ring={ring}
        width={width}
        height={height}
        committed={committed}
        stretch={stretch}
        {...(currentWeek !== undefined ? { currentWeek } : {})}
        entrance={entrance}
      />
    </View>
  )
}
