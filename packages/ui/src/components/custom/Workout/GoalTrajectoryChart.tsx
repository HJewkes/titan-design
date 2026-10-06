// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ViewProps } from 'react-native'
import type {
  BandCurve,
  GoalActualPoint,
  GoalDirection,
  GoalExpectedPoint,
  GoalNextTarget,
  GoalTrajectoryStatus,
  GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'
import {
  DEFAULT_LEFT_SHADOW_SPREAD,
  type PlotBaseline,
  type ReferenceLabelSide,
} from './GoalTrajectoryPlot'
import type { RuleLabelText } from './goalTrajectoryRuleLabels'
import type { BandFade } from './GoalTrajectoryBand'
import { GoalTrajectoryChartEmpty, GoalTrajectoryChartFrame } from './GoalTrajectoryChartParts'
import { useGoalTrajectoryChart } from './useGoalTrajectoryChart'

export type {
  GoalActualPoint,
  GoalDirection,
  GoalExpectedPoint,
  GoalNextTarget,
  GoalTrajectoryStatus,
  GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'
export {
  REACH_STATUS,
  WALL_BREAKPOINT,
  outcomeReach,
  trajectoryReach,
} from './goalTrajectoryChartModel'

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
  /**
   * 1-based; this week's column is lit behind the marks, in the same tint as the
   * compact chart's (VW-423).
   */
  currentWeek?: number
  /** Metric name for the accessible summary, e.g. "Bench top load". */
  metricLabel?: string
  /**
   * Play the entrance: the line draws, then its shadow and points arrive. Off
   * renders the final frame at once (visual baselines); reduced motion forces it off.
   */
  animate?: boolean
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
  /**
   * The y-axis value labels outside the plot. Default off (titan-0201 round 3): each
   * gridline carries its value inside the plot instead, and the plot takes back the
   * gutter. A GoalCard lines its week cells up with the plot either way.
   */
  yAxisLabels?: boolean
  /**
   * The committed and stretch labels: `numeric` ("185", the default since titan-0201
   * round 3, placed clear of the readings and tip targets), `named` ("Committed 185")
   * or `none`. The accessible name keeps the words in every case.
   */
  ruleLabelText?: RuleLabelText
  className?: string
}

/**
 * The VW-385 design-exploration knobs, settled and kept off the public props so
 * only the Explore stories can re-read the rejected treatments. Not in any barrel.
 */
export interface GoalTrajectoryChartExplorationProps extends GoalTrajectoryChartProps {
  /** Fraction of the plot width the plane's left inner shadow fades over. */
  leftShadowSpread?: number
  /** What marks the plane's bottom edge. Locked: `lip`; `inset-rule` was not chosen. */
  baseline?: PlotBaseline
  /** Band fade. Locked: `centre-14`; the others were not chosen. */
  bandFade?: BandFade
  /** Band edge interpolation. Locked: `monotone`; `linear` was not chosen. */
  bandCurve?: BandCurve
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
export function GoalTrajectoryChart(props: GoalTrajectoryChartProps) {
  return <GoalTrajectoryChartExploration {...props} />
}

/** {@link GoalTrajectoryChart} with the exploration knobs open; for the Explore stories only. */
export function GoalTrajectoryChartExploration({
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
  currentWeek,
  metricLabel = 'Goal',
  leftShadowSpread = DEFAULT_LEFT_SHADOW_SPREAD,
  animate = true,
  baseline = 'lip',
  bandFade = 'centre-14',
  bandCurve = 'monotone',
  referenceLabelSide = 'left',
  calibratingNote,
  yAxisLabels = false,
  ruleLabelText = 'numeric',
  className,
  ...props
}: GoalTrajectoryChartExplorationProps) {
  const chart = useGoalTrajectoryChart({
    expected,
    committed,
    stretch,
    actuals,
    weeks,
    mesoBoundaries,
    nextTarget,
    status,
    direction,
    width,
    height,
    unit,
    showWeekLabels,
    currentWeek,
    metricLabel,
    leftShadowSpread,
    animate,
    baseline,
    bandFade,
    bandCurve,
    referenceLabelSide,
    calibratingNote,
    yAxisLabels,
    ruleLabelText,
  })
  if (chart.isEmpty) {
    return (
      <GoalTrajectoryChartEmpty
        width={width}
        height={height}
        metricLabel={metricLabel}
        className={className}
        viewProps={props}
      />
    )
  }
  return (
    <GoalTrajectoryChartFrame
      chart={chart}
      width={width}
      height={height}
      currentWeek={currentWeek}
      className={className}
      viewProps={props}
    />
  )
}
