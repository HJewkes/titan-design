import { useMemo } from 'react'
import { useSurface } from '../../ui/surface'
import {
  deriveTrajectoryGeometry,
  trajectoryInsets,
  type BandCurve,
  type GoalActualPoint,
  type GoalDirection,
  type GoalExpectedPoint,
  type GoalNextTarget,
  type GoalTrajectoryGeometry,
  type GoalTrajectoryStatus,
  type GoalTrajectoryWeek,
} from './GoalTrajectoryChartGeometry'
import {
  trajectoryPalette,
  type PlotBaseline,
  type PlotStyle,
  type ReferenceLabelSide,
  type TrajectoryPalette,
} from './GoalTrajectoryPlot'
import { useTrajectoryEntrance, type EntranceState } from './goalTrajectoryMotion'
import {
  calibratingMarks,
  resolveCalibratingNote,
  type CalibratingMarks,
} from './GoalTrajectoryCalibrating'
import { hitBoxAround, useHitTargetSize, type HitBox } from './goalTrajectoryTargets'
import type { RuleLabelText } from './goalTrajectoryRuleLabels'
import { weekTips, type WeekTip } from './weekTipModel'
import {
  STATUS_LABEL,
  axisWeeksOf,
  calibratingSummary,
  chartLabels,
  chartTone,
  densityFor,
  summarize,
  withoutLead,
  withoutRecords,
  type Density,
} from './goalTrajectoryChartModel'
import type { BandFade } from './GoalTrajectoryBand'

/** Every prop already defaulted: the component owns the defaults so autodocs can read them. */
export interface TrajectoryChartInput {
  expected: GoalExpectedPoint[]
  committed: number
  stretch: number
  actuals: GoalActualPoint[]
  weeks: GoalTrajectoryWeek[]
  mesoBoundaries: number[]
  nextTarget: GoalNextTarget | undefined
  status: GoalTrajectoryStatus
  direction: GoalDirection
  width: number
  height: number
  unit: string
  showWeekLabels: boolean
  currentWeek: number | undefined
  metricLabel: string
  leftShadowSpread: number
  animate: boolean
  baseline: PlotBaseline
  bandFade: BandFade
  bandCurve: BandCurve
  referenceLabelSide: ReferenceLabelSide
  calibratingNote: string | undefined
  yAxisLabels: boolean
  ruleLabelText: RuleLabelText
}

export interface TrajectoryChartPlot {
  isEmpty: false
  geometry: GoalTrajectoryGeometry
  palette: TrajectoryPalette
  entrance: EntranceState
  marks: CalibratingMarks | null
  note: string
  label: string
  overhang: number
  ruleLabels: ReturnType<typeof chartLabels>['ruleLabels']
  gridLabels: ReturnType<typeof chartLabels>['gridLabels']
  tips: WeekTip[]
  plotWeeks: GoalTrajectoryWeek[]
  weekStride: number
  showYLabels: boolean
  plotStyle: PlotStyle
}

export type TrajectoryChartModel = { isEmpty: true } | TrajectoryChartPlot

function useChartGeometry(
  input: TrajectoryChartInput,
  density: Density,
  calibrating: boolean
): GoalTrajectoryGeometry {
  const { expected, committed, stretch, actuals, weeks, mesoBoundaries, nextTarget } = input
  const { width, height, bandCurve, yAxisLabels, currentWeek } = input
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
        insets: trajectoryInsets(yAxisLabels),
        currentWeek,
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
      yAxisLabels,
      currentWeek,
    ]
  )
  return calibrating ? withoutLead(derived) : derived
}

export function useGoalTrajectoryChart(input: TrajectoryChartInput): TrajectoryChartModel {
  const { committed, stretch, width, height, unit, metricLabel, nextTarget, yAxisLabels } = input
  const surface = useSurface()
  const targetSize = useHitTargetSize()
  const { toneStatus, statusLabel } = chartTone(
    input.status,
    committed,
    input.actuals,
    input.direction
  )
  const palette = trajectoryPalette(surface.mode, surface.level, toneStatus)
  const density = densityFor(width)
  const entrance = useTrajectoryEntrance(input.animate)
  const calibrating = input.status === 'calibrating'
  const geometry = useChartGeometry(input, density, calibrating)
  const note = resolveCalibratingNote(
    input.calibratingNote,
    calibrating ? STATUS_LABEL.calibrating : undefined
  )
  const nextTargetBox =
    geometry.nextTarget && nextTarget
      ? hitBoxAround(geometry.nextTarget, targetSize, width, height)
      : null
  const marks = calibrating ? calibratingMarks({ geometry, targetSize, nextTargetBox }) : null
  const boxes = [nextTargetBox, marks?.target].filter((b): b is HitBox => b != null)
  const { ruleLabels, gridLabels } = chartLabels({ ...input, geometry, boxes })
  // A target hung under the plot may reach past the canvas; the chart grows to hold it.
  const overhang = marks ? Math.max(0, marks.target.y + marks.target.size - height) : 0
  const label =
    summarize(statusLabel, geometry, committed, stretch, unit, metricLabel) +
    (calibrating ? calibratingSummary(note) : '')

  if (!geometry.hasBand && !geometry.hasActuals) return { isEmpty: true }

  const axisWeeks = axisWeeksOf(input.weeks, input.expected)
  const tips = weekTips({
    geometry,
    weeks: axisWeeks,
    expected: input.expected,
    ...(nextTarget ? { nextTarget } : {}),
    unit,
    width,
    height,
    size: targetSize,
  })
  return {
    isEmpty: false,
    geometry,
    palette,
    entrance,
    marks,
    note,
    label,
    overhang,
    ruleLabels,
    gridLabels,
    tips,
    plotWeeks: input.showWeekLabels ? axisWeeks : [],
    weekStride: Math.max(1, Math.ceil(axisWeeks.length / density.maxWeekLabels)),
    showYLabels: density.showYLabels && yAxisLabels,
    plotStyle: {
      stroke: density.stroke,
      star: density.star,
      leftShadowSpread: input.leftShadowSpread,
      baseline: input.baseline,
      bandFade: input.bandFade,
      bandCurve: input.bandCurve,
      referenceLabelSide: input.referenceLabelSide,
    },
  }
}
