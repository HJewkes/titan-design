// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * The D family (VW-385 ideation): the block's week cells laid over the compact
 * chart's own columns, so each cell is the header of the week its point sits in.
 * Status: `lab`.
 */
import { View } from 'react-native'
import { formatMilestoneSet } from '../../../utils/workout-format'
import type { GoalWeekEntry } from './goalMilestone'
import { GoalMilestoneWeekStrip } from './GoalMilestoneWeekStrip'
import {
  GoalTrajectoryMini,
  INSET_CELL_BAND,
  MINI_PLANE_TOP,
  miniWeekAxis,
  type GoalTrajectoryMiniProps,
} from './GoalTrajectoryMini'

export type WeekColumnsVariant = 'cells' | 'cells-ticks' | 'cells-inset'

export interface GoalWeekColumnsChartProps extends Omit<GoalTrajectoryMiniProps, 'variant'> {
  variant: WeekColumnsVariant
  /** One entry per week of the block, aligned to week 1. */
  weeks?: readonly GoalWeekEntry[]
}

/** A cell's tip text: the week's matched set, e.g. "8 x 100 lb". */
export function cellReadingText(entry: GoalWeekEntry, unit: string): string {
  const reading = entry.reading
  return reading && 'load' in reading ? formatMilestoneSet(reading.reps, reading.load, unit) : ''
}

/** Where the cells row's top edge sits, relative to the chart canvas. */
export function cellsRowTop(variant: WeekColumnsVariant): number {
  return variant === 'cells-inset'
    ? MINI_PLANE_TOP + INSET_CELL_BAND.top
    : MINI_PLANE_TOP - INSET_CELL_BAND.cell
}

/**
 * The cells row on the chart's own week axis. `cells` and `cells-ticks` stand
 * it on the plane's top edge; `cells-inset` drops it inside the plane, so the
 * lit current-week column runs from the cell to the floor.
 *
 * @example
 * <GoalWeekColumnsChart variant="cells" weeks={weeks} currentWeek={5}
 *   status="on_track" committed={102.5} goalWeek={8} actuals={actuals} width={408} height={64} />
 */
export function GoalWeekColumnsChart({ variant, weeks, ...chart }: GoalWeekColumnsChartProps) {
  const unit = chart.unit ?? 'lb'
  const top = cellsRowTop(variant)
  const lift = Math.max(0, -top)
  return (
    <View style={{ width: chart.width, paddingTop: lift }} testID="goal-week-columns-chart">
      <GoalTrajectoryMini {...chart} variant={variant} />
      <View style={{ position: 'absolute', left: 0, top: top + lift }}>
        <GoalMilestoneWeekStrip
          weekCount={chart.goalWeek}
          {...(chart.currentWeek !== undefined ? { currentWeek: chart.currentWeek } : {})}
          {...(weeks ? { weeks } : {})}
          readingText={(entry) => cellReadingText(entry, unit)}
          cellHeight={INSET_CELL_BAND.cell}
          axis={miniWeekAxis(chart, chart.width)}
        />
      </View>
    </View>
  )
}
