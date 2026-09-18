// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo } from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { alpha } from '../../../utils/colors'
import { roundWeight } from '../../../utils/workout-format'
import { useSurface, useOnSurfaceColor } from '../../ui/surface'
import { TipTrigger } from '../../ui/tooltip'
import { Typography } from '../Typography'
import { valueReach, type GoalReach } from './goalMilestone'
import {
  deriveTrajectoryGeometry,
  type GoalActualPoint,
  type GoalNextTarget,
  type NextTargetCoord,
  type GoalDirection,
  type GoalExpectedPoint,
  type GoalTrajectoryGeometry,
  type GoalTrajectoryStatus,
  type GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'
import {
  DEFAULT_LEFT_SHADOW_SPREAD,
  GoalTrajectoryPlot,
  starPoints,
  trajectoryPalette,
  type ReferenceLabelSide,
  type TrajectoryPalette,
} from './GoalTrajectoryPlot'
import { useTrajectoryEntrance } from './goalTrajectoryMotion'
import type { BandFade } from './GoalTrajectoryBand'
import type { BandCurve } from './GoalTrajectoryChartGeometry'
import type { PlotBaseline } from './GoalTrajectoryPlot'

export type {
  GoalActualPoint,
  GoalDirection,
  GoalExpectedPoint,
  GoalNextTarget,
  GoalTrajectoryStatus,
  GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'

const STATUS_LABEL: Record<GoalTrajectoryStatus, string> = {
  on_track: 'On track',
  ahead: 'Ahead',
  behind: 'Behind',
  tolerated: 'Tolerated',
  deload_week: 'Deload week',
  calibrating: 'Calibrating',
  stalled: 'Stalled',
}

/**
 * Once a reading reaches the committed target the pill stops reporting pace and
 * reports the result: reaching the goal is success green, going past it is the
 * `ahead` blue. Both tones and both words are shared with `GoalMilestoneTile`,
 * which derives the same verdict from the same helper.
 */
export const REACH_STATUS = { met: 'on_track', beyond: 'ahead' } as const satisfies Record<
  Exclude<GoalReach, 'short'>,
  GoalTrajectoryStatus
>

const REACH_LABEL = { met: 'Hit', beyond: 'Beyond goal' } as const

/** The best reading in the goal's direction, judged against the committed target. */
export function trajectoryReach(
  committed: number,
  actuals: GoalActualPoint[],
  direction: GoalDirection = 'up'
): GoalReach {
  const values = actuals.map((a) => a.value).filter((v) => Number.isFinite(v))
  if (values.length === 0) return 'short'
  const best = direction === 'down' ? Math.min(...values) : Math.max(...values)
  return valueReach(committed, best, direction)
}

/** Above this width the chart renders at wall density (across-the-room scale). */
export const WALL_BREAKPOINT = 720

interface Density {
  stroke: number
  star: number
  pillFont: number
  tickCount: number
  showYLabels: boolean
  maxWeekLabels: number
  /** The phone drops the rule entries: each rule already carries its own label. */
  showRuleLegend: boolean
}

// Phone drops to three gridlines; its y labels stay because the plot has the gutter.
const DENSITY: Record<'phone' | 'wall', Density> = {
  phone: {
    stroke: 2,
    star: 6,
    pillFont: 10,
    tickCount: 3,
    showYLabels: true,
    maxWeekLabels: 6,
    showRuleLegend: false,
  },
  wall: {
    stroke: 3,
    star: 7.5,
    pillFont: 16,
    tickCount: 5,
    showYLabels: true,
    maxWeekLabels: 12,
    showRuleLegend: true,
  },
}

export interface GoalTrajectoryChartProps extends ViewProps {
  /** Expected band per planned week. `low` is the committed edge, `high` the stretch edge. */
  expected: GoalExpectedPoint[]
  /** Committed target value — the low edge of the honest band (plan §1.7). */
  committed: number
  /** Stretch target value — the high edge. */
  stretch: number
  /** Measured values, placed by `weekIndex` or by `ts` against week start dates. */
  actuals: GoalActualPoint[]
  /** Planned weeks; `isDeload` flattens the band and shades the column. */
  weeks: GoalTrajectoryWeek[]
  /** Week indices where a mesocycle boundary falls. */
  mesoBoundaries?: number[]
  /**
   * The next planned waypoint: a hollow dot at (`weekIndex`, `value`), joined to
   * the latest reading by a dashed run, carrying `label` as its tip. Unlabelled
   * on the plane — the plan reads as a shape, and the words are one hover away.
   */
  nextTarget?: GoalNextTarget
  /** Read-model status; drives the actual line's tone and the status pill. */
  status: GoalTrajectoryStatus
  /** Which way "better" points. `down` is a loss goal (low > high numerically). */
  direction?: GoalDirection
  /** Chart plot width in px (360 phone, 1200 wall). */
  width: number
  /** Chart plot height in px. */
  height: number
  /** Unit suffix for value labels, e.g. "lbs". */
  unit?: string
  /** Metric name for the accessible summary, e.g. "Bench top load". */
  metricLabel?: string
  /**
   * Fraction of the plot width the plane's left inner shadow fades over.
   * Exposed while the human picks between 3% and 4%.
   */
  leftShadowSpread?: number
  /**
   * Play the entrance: the line draws, then its shadow and points arrive. Off
   * renders the final frame at once (visual baselines); reduced motion forces it off.
   */
  animate?: boolean
  /** What marks the plane's bottom edge. Locked: `lip`; `inset-rule` was not chosen. */
  baseline?: PlotBaseline
  /** Band fade. Locked: `centre-14`; the others were not chosen. */
  bandFade?: BandFade
  /** Band edge interpolation. Locked: `monotone`; `linear` was not chosen. */
  bandCurve?: BandCurve
  /** Which plot edge the committed/stretch labels anchor to. `left` is on trial (VW-385). */
  referenceLabelSide?: ReferenceLabelSide
  className?: string
}

function summarize(
  statusLabel: string,
  geometry: GoalTrajectoryGeometry,
  committed: number,
  stretch: number,
  unit: string,
  metricLabel: string
): string {
  const latest = geometry.actuals[geometry.actuals.length - 1]
  const current = latest
    ? `Latest ${String(roundWeight(latest.value))} ${unit} at week ${String(Math.round(latest.weekIndex))}.`
    : 'No measured values yet.'
  const prs = geometry.prStars.length
  return (
    `${metricLabel} trajectory chart. Status: ${statusLabel}. ` +
    `Committed ${String(roundWeight(committed))} ${unit}, stretch ${String(roundWeight(stretch))} ${unit}. ` +
    `${current} ${String(prs)} personal record${prs === 1 ? '' : 's'}.`
  )
}

/**
 * Goal trajectory over a block: the coach's expected band as a shaded polygon,
 * the committed and stretch rules, the athlete's actual line with PR stars,
 * meso boundary rules and deload shading.
 *
 * Drawn as one SVG ({@link GoalTrajectoryPlot}) on a lowered plane. All geometry
 * comes from `deriveTrajectoryGeometry`, which orders the band in pixel space so a
 * LOSS goal (`low` numerically greater than `high`, e.g. bodyweight in a fat-loss
 * phase) draws identically to a gain goal.
 *
 * @example
 * <GoalTrajectoryChart
 *   expected={[{ weekIndex: 1, low: 178, high: 182 }, { weekIndex: 6, low: 185, high: 195 }]}
 *   committed={185}
 *   stretch={195}
 *   actuals={[{ weekIndex: 1, value: 175 }, { weekIndex: 4, value: 185, isPR: true }]}
 *   weeks={[{ index: 1 }, { index: 5, isDeload: true }, { index: 6 }]}
 *   mesoBoundaries={[6]}
 *   status="on_track"
 *   width={1200}
 *   height={340}
 * />
 */
export function GoalTrajectoryChart({
  expected,
  committed,
  stretch,
  actuals,
  weeks,
  mesoBoundaries = [],
  nextTarget,
  status,
  direction = 'up',
  width,
  height,
  unit = 'lbs',
  metricLabel = 'Goal',
  leftShadowSpread = DEFAULT_LEFT_SHADOW_SPREAD,
  animate = true,
  baseline = 'lip',
  bandFade = 'centre-14',
  bandCurve = 'monotone',
  referenceLabelSide = 'right',
  className,
  ...props
}: GoalTrajectoryChartProps) {
  const surface = useSurface()
  const axisColor = useOnSurfaceColor('tertiary')
  const reach = trajectoryReach(committed, actuals, direction)
  const toneStatus = reach === 'short' ? status : REACH_STATUS[reach]
  const statusLabel = reach === 'short' ? STATUS_LABEL[status] : REACH_LABEL[reach]
  const palette = trajectoryPalette(surface.mode, surface.level, toneStatus)
  const density = width >= WALL_BREAKPOINT ? DENSITY.wall : DENSITY.phone
  const entrance = useTrajectoryEntrance(animate)

  const geometry = useMemo(
    () =>
      deriveTrajectoryGeometry({
        expected,
        committed,
        stretch,
        actuals,
        weeks,
        mesoBoundaries,
        nextTarget,
        width,
        height,
        tickCount: density.tickCount,
        bandCurve,
      }),
    [
      expected,
      committed,
      stretch,
      actuals,
      weeks,
      mesoBoundaries,
      nextTarget,
      width,
      height,
      density,
      bandCurve,
    ]
  )

  if (!geometry.hasBand && !geometry.hasActuals) {
    return (
      <View
        style={{ width, height }}
        className={cn('items-center justify-center', className)}
        accessibilityRole="image"
        accessibilityLabel={`${metricLabel} trajectory chart. Calibrating: not enough matched sessions to draw a band yet.`}
        testID="goal-trajectory-chart-empty"
        {...props}
      >
        <Text style={{ color: axisColor, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
          Calibrating — no band yet
        </Text>
      </View>
    )
  }

  const axisWeeks = weeks.length > 0 ? weeks : expected.map((p) => ({ index: p.weekIndex }))
  return (
    <View style={{ width }} className={cn(className)} testID="goal-trajectory-chart" {...props}>
      <View
        style={{ width, height }}
        accessibilityRole="image"
        accessibilityLabel={summarize(statusLabel, geometry, committed, stretch, unit, metricLabel)}
        testID="goal-trajectory-chart-canvas"
      >
        <GoalTrajectoryPlot
          geometry={geometry}
          palette={palette}
          width={width}
          height={height}
          committed={committed}
          stretch={stretch}
          weeks={axisWeeks}
          weekStride={Math.max(1, Math.ceil(axisWeeks.length / density.maxWeekLabels))}
          showYLabels={density.showYLabels}
          style={{
            stroke: density.stroke,
            star: density.star,
            leftShadowSpread,
            baseline,
            bandFade,
            bandCurve,
            referenceLabelSide,
          }}
          entrance={entrance}
        />
      </View>
      {geometry.nextTarget && nextTarget && (
        <NextTargetTip point={geometry.nextTarget} label={nextTarget.label} />
      )}
      <ChartLegend
        statusLabel={statusLabel}
        direction={direction}
        palette={palette}
        axisColor={axisColor}
        font={density.pillFont}
        hasDeload={geometry.deloadRects.length > 0}
        showRules={density.showRuleLegend}
      />
    </View>
  )
}

/** Side of the square hit area the next-target tip opens from. */
const TIP_HIT = 24

/**
 * The marker's words, one hover away: a hit target over the plane rather than a
 * label on it. Absolute against the chart's own box, whose origin is the canvas.
 */
function NextTargetTip({ point, label }: { point: NextTargetCoord; label: string }) {
  return (
    <View
      style={{ position: 'absolute', left: point.x - TIP_HIT / 2, top: point.y - TIP_HIT / 2 }}
      testID="goal-trajectory-chart-next-target-tip"
    >
      <TipTrigger
        label="Next target"
        content={<Typography variant="body2">{label}</Typography>}
        style={{ width: TIP_HIT, height: TIP_HIT }}
      >
        <View style={{ width: TIP_HIT, height: TIP_HIT }} />
      </TipTrigger>
    </View>
  )
}

interface ChartLegendProps {
  statusLabel: string
  direction: GoalDirection
  palette: TrajectoryPalette
  axisColor: string
  font: number
  hasDeload: boolean
  showRules: boolean
}

function LegendLabel({ color, font, children }: { color: string; font: number; children: string }) {
  return <Text style={{ color, fontSize: font, fontFamily: 'Inter, sans-serif' }}>{children}</Text>
}

function StatusPill({
  statusLabel,
  palette,
  font,
}: Pick<ChartLegendProps, 'statusLabel' | 'palette' | 'font'>) {
  return (
    <View
      testID="goal-trajectory-chart-status-pill"
      accessibilityLabel={`Goal status: ${statusLabel}`}
      className="px-squish-x-sm py-squish-y-sm"
      style={{
        borderRadius: 4,
        borderWidth: 1,
        backgroundColor: alpha(palette.status, 0.15),
        borderColor: alpha(palette.status, 0.3),
      }}
    >
      <Text
        style={{
          color: palette.status,
          fontSize: font,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
        }}
      >
        {statusLabel}
      </Text>
    </View>
  )
}

function RuleSwatch({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <svg width={14} height={4} aria-hidden="true">
      <line
        x1={0}
        x2={14}
        y1={2}
        y2={2}
        stroke={color}
        strokeWidth={dashed ? 1.5 : 2}
        strokeDasharray={dashed ? '3 2' : undefined}
      />
    </svg>
  )
}

function RuleLegend({
  palette,
  axisColor,
  font,
}: Pick<ChartLegendProps, 'palette' | 'axisColor' | 'font'>) {
  return (
    <>
      <View className="flex-row items-center gap-inline-sm">
        <RuleSwatch color={palette.rule} />
        <LegendLabel color={axisColor} font={font}>
          Committed
        </LegendLabel>
      </View>
      <View className="flex-row items-center gap-inline-sm">
        <RuleSwatch color={palette.rule} dashed />
        <LegendLabel color={axisColor} font={font}>
          Stretch
        </LegendLabel>
      </View>
    </>
  )
}

function ChartLegend({
  statusLabel,
  direction,
  palette,
  axisColor,
  font,
  hasDeload,
  showRules,
}: ChartLegendProps) {
  return (
    <View
      className="flex-row items-center flex-wrap mt-stack-md gap-3"
      testID="goal-trajectory-chart-legend"
    >
      <StatusPill statusLabel={statusLabel} palette={palette} font={font} />
      <View className="flex-row items-center gap-inline-sm">
        <View style={{ width: 14, height: 8, borderRadius: 2, backgroundColor: palette.band }} />
        <LegendLabel color={axisColor} font={font}>
          {direction === 'down' ? 'Expected (loss)' : 'Expected'}
        </LegendLabel>
      </View>
      {showRules && <RuleLegend palette={palette} axisColor={axisColor} font={font} />}
      <View className="flex-row items-center gap-inline-sm">
        <svg width={12} height={12} aria-hidden="true">
          <polygon points={starPoints(6, 6.5, 6)} fill={palette.star} />
        </svg>
        <LegendLabel color={axisColor} font={font}>
          PR
        </LegendLabel>
      </View>
      {hasDeload && (
        <View className="flex-row items-center gap-inline-sm">
          <View style={{ width: 14, height: 8, backgroundColor: palette.deload }} />
          <LegendLabel color={axisColor} font={font}>
            Deload
          </LegendLabel>
        </View>
      )}
    </View>
  )
}
