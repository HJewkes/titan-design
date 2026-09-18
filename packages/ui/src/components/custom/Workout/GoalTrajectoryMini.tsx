// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * The per-lift card's trajectory at card scale (VW-385 ideation). A sibling of
 * {@link GoalTrajectoryChart}: same geometry, curve, tones, depth recipe, marks
 * and entrance, with the axes, band and gridlines dropped. Status: `lab`.
 */
import { useMemo } from 'react'
import { View, type ViewProps } from 'react-native'
import { useSurface } from '../../ui/surface'
import { alpha } from '../../../utils/colors'
import { formatMilestoneLoad } from '../../../utils/workout-format'
import {
  PLANE_OVERHANG,
  deriveTrajectoryGeometry,
  trajectoryWeekScale,
  type ActualCoord,
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
  starPoints,
  trajectoryPalette,
  useDefIds,
  type LayerProps,
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
 * - `plane` (A): the inset plane, line, points and a faint unlabelled committed rule.
 * - `cells` (D1): the week cells sit on the plane's top edge; the current week's column is lit.
 * - `cells-ticks` (D2): D1 plus a hairline from the plane's top edge down to each point.
 * - `cells-inset` (D3): the cells sit inside the plane, so the lit column runs cell to floor.
 */
export type MiniTrajectoryVariant = 'plane' | 'cells' | 'cells-ticks' | 'cells-inset'

/** The big chart's marks at card scale: stroke, dot and star all step down together. */
export const MINI_MARKS = { stroke: 2, dot: 3.5, ring: 1.5, star: 5.5 } as const

/** No axis gutters: the plane runs edge to edge and its lip sits on the canvas floor. */
export const MINI_INSETS: PlotInsets = { left: 0, right: 0, top: 8, bottom: 1 }

/** Where the plane starts in every variant, so the cells row can sit exactly on it. */
export const MINI_PLANE_TOP = MINI_INSETS.top - PLANE_OVERHANG

/** Height of the cells band inside the plane for `cells-inset`: cell height plus air above and below. */
export const INSET_CELL_BAND = { top: 4, cell: 8, bottom: 4 } as const

/** `cells-inset` pushes the plot down below the band; the plane still starts at {@link MINI_PLANE_TOP}. */
export const INSET_INSETS: PlotInsets = {
  ...MINI_INSETS,
  top: MINI_PLANE_TOP + INSET_CELL_BAND.top + INSET_CELL_BAND.cell + INSET_CELL_BAND.bottom,
}

/** The D family: the lit column's alpha, the recessed line's, and the point ticks'. */
export const WEEK_COLUMN = { tintAlpha: 0.2, lineAlpha: 0.45, tickAlpha: 0.35 } as const

export interface GoalTrajectoryMiniData {
  actuals: GoalActualPoint[]
  committed: number
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
  /** 1-based; the D variants light this week's column. */
  currentWeek?: number
  animate?: boolean
  unit?: string
  metricLabel?: string
}

export function isCellsVariant(variant: MiniTrajectoryVariant): boolean {
  return variant !== 'plane'
}

export function miniWeeks(goalWeek: number): GoalTrajectoryWeek[] {
  return Array.from({ length: Math.max(1, goalWeek) }, (_, i) => ({ index: i + 1 }))
}

export function miniInsets(variant: MiniTrajectoryVariant): PlotInsets {
  return variant === 'cells-inset' ? INSET_INSETS : MINI_INSETS
}

/** The shared geometry input: no band, compact insets, and only the committed rule. */
export function miniGeometryInput(
  data: GoalTrajectoryMiniData,
  variant: MiniTrajectoryVariant,
  width: number,
  height: number
): GoalTrajectoryGeometryInput {
  return {
    expected: [],
    committed: data.committed,
    stretch: data.committed,
    actuals: data.actuals,
    weeks: miniWeeks(data.goalWeek),
    width,
    height,
    insets: miniInsets(variant),
    labelFont: 0,
    ...(data.nextTarget ? { nextTarget: data.nextTarget } : {}),
  }
}

/**
 * The geometry with its plane raised to {@link MINI_PLANE_TOP}. `cells-inset`
 * lowers the plot to make room for the cells, but the plane has to hold them.
 */
export function withPlaneTop(geometry: GoalTrajectoryGeometry): GoalTrajectoryGeometry {
  const { plane } = geometry
  const rise = plane.y - MINI_PLANE_TOP
  if (rise <= 0) return geometry
  return { ...geometry, plane: { ...plane, y: MINI_PLANE_TOP, height: plane.height + rise } }
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

function CurrentWeekColumn({ geometry, palette, week }: LayerProps & { week: number }) {
  const span = geometry.toX(2) - geometry.toX(1)
  const { plane } = geometry
  return (
    <rect
      data-testid="goal-trajectory-mini-current-week"
      x={geometry.toX(week) - span / 2}
      y={plane.y}
      width={span}
      height={plane.height}
      fill={alpha(palette.rule, WEEK_COLUMN.tintAlpha)}
    />
  )
}

/** A tick's run: from the plane's top edge to just above the mark it points at. */
export function tickSpan(top: number, markY: number): { y1: number; y2: number } | null {
  const y2 = markY - MINI_MARKS.dot - MINI_MARKS.ring
  return y2 > top ? { y1: top, y2 } : null
}

function PointTicks({ geometry, palette }: LayerProps) {
  const marks: { x: number; y: number }[] = [
    ...geometry.actuals,
    ...(geometry.nextTarget ? [geometry.nextTarget] : []),
  ]
  return (
    <>
      {marks.map((mark) => {
        const span = tickSpan(geometry.plane.y, mark.y)
        if (!span) return null
        return (
          <line
            key={mark.x}
            data-testid="goal-trajectory-mini-tick"
            x1={mark.x}
            x2={mark.x}
            {...span}
            stroke={alpha(palette.rule, WEEK_COLUMN.tickAlpha)}
            strokeWidth={1}
          />
        )
      })}
    </>
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
  const recessed = isCellsVariant(variant)
  const common = {
    d: geometry.linePath,
    fill: 'none',
    stroke: recessed ? alpha(palette.status, WEEK_COLUMN.lineAlpha) : palette.status,
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

function MiniPoint({ coord, palette }: { coord: ActualCoord; palette: LayerProps['palette'] }) {
  if (coord.isPR) {
    return (
      <polygon
        data-testid="goal-trajectory-mini-pr-star"
        points={starPoints(coord.x, coord.y, MINI_MARKS.star)}
        fill={palette.star}
      />
    )
  }
  return (
    <circle
      data-testid="goal-trajectory-mini-dot"
      cx={coord.x}
      cy={coord.y}
      r={MINI_MARKS.dot}
      fill={coord.matched ? palette.status : palette.plane}
      stroke={coord.matched ? palette.plane : palette.status}
      strokeWidth={MINI_MARKS.ring}
    />
  )
}

function MiniPoints({ geometry, palette, entrance }: LayerProps & { entrance: EntranceState }) {
  return (
    <g style={popStyle(entrance)}>
      <MiniNextTarget geometry={geometry} palette={palette} />
      {geometry.actuals.map((coord) => (
        <MiniPoint key={coord.index} coord={coord} palette={palette} />
      ))}
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
  currentWeek?: number
  entrance: EntranceState
}

function MiniPlot(props: MiniPlotProps) {
  const { geometry, palette, variant, width, height, currentWeek } = props
  const ids = useDefIds()
  const layer = { geometry, palette }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <PlotDefs ids={ids} {...layer} leftShadowSpread={DEFAULT_LEFT_SHADOW_SPREAD} />
      <g clipPath={`url(#${ids.clip})`}>
        <PlaneFill {...layer} ids={ids} />
        {isCellsVariant(variant) && currentWeek !== undefined && (
          <CurrentWeekColumn {...layer} week={currentWeek} />
        )}
        <CommittedRule {...layer} />
        {variant === 'cells-ticks' && <PointTicks {...layer} />}
        <MiniLine {...props} shadowId={ids.shadow} />
        <MiniPoints {...layer} entrance={props.entrance} />
        <PlaneLip {...layer} />
      </g>
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
 * points, PR star and next-target marker, without axes, band or gridlines. The
 * D variants expect {@link GoalWeekColumnsChart} to lay the week cells over them.
 *
 * @example
 * <GoalTrajectoryMini variant="plane" status="on_track" committed={102.5}
 *   goalWeek={8} actuals={[{ weekIndex: 1, value: 92.5 }]} width={408} height={64} />
 */
export function GoalTrajectoryMini({
  actuals,
  committed,
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
  const tone = reach === 'short' ? status : REACH_STATUS[reach]
  const palette = trajectoryPalette(surface.mode, surface.level, tone)
  const entrance = useTrajectoryEntrance(animate)
  const geometry = useMemo(() => {
    const data = { actuals, committed, goalWeek, ...(nextTarget ? { nextTarget } : {}) }
    return withPlaneTop(deriveTrajectoryGeometry(miniGeometryInput(data, variant, width, height)))
  }, [actuals, committed, goalWeek, nextTarget, variant, width, height])
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
        width={width}
        height={height}
        {...(currentWeek !== undefined ? { currentWeek } : {})}
        entrance={entrance}
      />
    </View>
  )
}
