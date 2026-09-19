// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo } from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { roundWeight } from '../../../utils/workout-format'
import { useSurface, useOnSurfaceColor } from '../../ui/surface'
import { TipTrigger } from '../../ui/tooltip'
import { Typography } from '../../ui/typography'
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
  trajectoryPalette,
  type ReferenceLabelSide,
} from './GoalTrajectoryPlot'
import { useTrajectoryEntrance } from './goalTrajectoryMotion'
import {
  CalibratingInfo,
  calibratingMarks,
  resolveCalibratingNote,
} from './GoalTrajectoryCalibrating'
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
  goal_met: 'Goal met',
  beyond_goal: 'Beyond goal',
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

const REACH_LABEL = { met: 'Goal met', beyond: 'Beyond goal' } as const

/**
 * The read model's own outcome words. When it sends one, the UI prints it rather
 * than re-deriving the same verdict from the numbers — its committed value and
 * ours can differ, and the read model is the one that knows.
 */
const OUTCOME_REACH = { goal_met: 'met', beyond_goal: 'beyond' } as const

/** The reach a status already states, or null when it only states pace. */
export function outcomeReach(status: GoalTrajectoryStatus): GoalReach | null {
  return status === 'goal_met' || status === 'beyond_goal' ? OUTCOME_REACH[status] : null
}

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
  tickCount: number
  showYLabels: boolean
  maxWeekLabels: number
}

// Phone drops to three gridlines; its y labels stay because the plot has the gutter.
const DENSITY: Record<'phone' | 'wall', Density> = {
  phone: { stroke: 2, star: 6, tickCount: 3, showYLabels: true, maxWeekLabels: 6 },
  wall: { stroke: 3, star: 7.5, tickCount: 5, showYLabels: true, maxWeekLabels: 12 },
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
  /**
   * Draw the week numbers under the plot. Off inside a card whose week cells sit
   * over the columns: the cells label the weeks, and the axis said it twice
   * (VW-385 round 6, human: "they line up with the points on the chart below and
   * so you have a built in labeling scheme there").
   */
  showWeekLabels?: boolean
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
  /**
   * Which plot edge the committed/stretch labels anchor to. Defaults to `left`
   * (VW-385 round 6, human's call): the right edge is where the line ends up on
   * a goal that is going well, and the labels sat on top of it.
   */
  referenceLabelSide?: ReferenceLabelSide
  /**
   * Calibrating only: the first line of the tip behind the info target in the
   * plot's lower-right corner. The consumer supplies it because only the read
   * model knows what calibration is still waiting on; empty or omitted, the
   * default claims nothing. A full sentence is fine: the tip wraps it. The
   * chart's accessible name carries it too.
   */
  calibratingNote?: string
  className?: string
}

/**
 * A calibrating chart (VW-433): readings are plain dots, because a first reading
 * is not an achievement, and the next target is its hollow dot with no dashed run.
 */
function withoutRecords(actuals: GoalActualPoint[]): GoalActualPoint[] {
  return actuals.map((actual) => ({ ...actual, isPR: false }))
}

function withoutLead(geometry: GoalTrajectoryGeometry): GoalTrajectoryGeometry {
  const next = geometry.nextTarget
  return next ? { ...geometry, nextTarget: { ...next, leadPath: '' } } : geometry
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

/** What the hatch and the dashed ramp say to a sighted reader: the whole note, and what the line is. */
function calibratingSummary(note: string): string {
  const sentence = /[.!?]$/.test(note) ? note : `${note}.`
  return ` ${sentence} The line is the planned ramp from the start lift, not an expected band.`
}

/**
 * Goal trajectory over a block: the coach's expected band as a shaded polygon,
 * the committed and stretch rules, the athlete's actual line with PR stars,
 * meso boundary rules and deload shading.
 *
 * It draws no legend (VW-385 round 5, human: "way too chunky and I think
 * unnecessary"). Every rule already carries its own label on the plane, and the
 * status belongs to the card's title row, where it is said once.
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
  showWeekLabels = true,
  metricLabel = 'Goal',
  leftShadowSpread = DEFAULT_LEFT_SHADOW_SPREAD,
  animate = true,
  baseline = 'lip',
  bandFade = 'centre-14',
  bandCurve = 'monotone',
  referenceLabelSide = 'left',
  calibratingNote,
  className,
  ...props
}: GoalTrajectoryChartProps) {
  const surface = useSurface()
  const axisColor = useOnSurfaceColor('tertiary')
  const reach = outcomeReach(status) ?? trajectoryReach(committed, actuals, direction)
  const toneStatus = reach === 'short' ? status : REACH_STATUS[reach]
  const statusLabel = reach === 'short' ? STATUS_LABEL[status] : REACH_LABEL[reach]
  const palette = trajectoryPalette(surface.mode, surface.level, toneStatus)
  const density = width >= WALL_BREAKPOINT ? DENSITY.wall : DENSITY.phone
  const entrance = useTrajectoryEntrance(animate)
  const calibrating = status === 'calibrating'
  const plotted = useMemo(
    () => (calibrating ? withoutRecords(actuals) : actuals),
    [actuals, calibrating]
  )

  const derived = useMemo(
    () =>
      deriveTrajectoryGeometry({
        expected,
        committed,
        stretch,
        actuals: plotted,
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
      plotted,
      weeks,
      mesoBoundaries,
      nextTarget,
      width,
      height,
      density,
      bandCurve,
    ]
  )
  const geometry = calibrating ? withoutLead(derived) : derived
  const note = resolveCalibratingNote(
    calibratingNote,
    calibrating ? STATUS_LABEL.calibrating : undefined
  )
  const marks = calibrating ? calibratingMarks({ geometry }) : null
  const label =
    summarize(statusLabel, geometry, committed, stretch, unit, metricLabel) +
    (calibrating ? calibratingSummary(note) : '')

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
        accessibilityLabel={label}
        testID="goal-trajectory-chart-canvas"
      >
        <GoalTrajectoryPlot
          geometry={geometry}
          palette={palette}
          width={width}
          height={height}
          committed={committed}
          stretch={stretch}
          weeks={showWeekLabels ? axisWeeks : []}
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
          calibrating={marks}
        />
      </View>
      {marks && <CalibratingInfo marks={marks} note={note} palette={palette} />}
      {geometry.nextTarget && nextTarget && (
        <NextTargetTip point={geometry.nextTarget} label={nextTarget.label} />
      )}
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
