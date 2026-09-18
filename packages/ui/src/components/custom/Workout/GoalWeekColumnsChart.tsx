// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * The compact goal chart: {@link GoalTrajectoryMini} with the block's week cells
 * standing on the plane's top edge, each cell the header of the column its point
 * sits in. The chosen shape of the VW-385 ideation round (D1) — the plane-only,
 * ticked and inset variants were not chosen and are gone.
 */
import { View } from 'react-native'
import { formatMilestoneSet } from '../../../utils/workout-format'
import type { GoalWeekEntry } from './goalMilestone'
import { GoalMilestoneWeekStrip } from './GoalMilestoneWeekStrip'
import {
  GoalTrajectoryMini,
  MINI_CELL_HEIGHT,
  MINI_PLANE_TOP,
  miniWeekAxis,
  type GoalTrajectoryMiniProps,
} from './GoalTrajectoryMini'

export interface GoalWeekColumnsChartProps extends GoalTrajectoryMiniProps {
  /** One entry per week of the block, aligned to week 1. */
  weeks?: readonly GoalWeekEntry[]
}

/** A cell's tip text: the week's matched set, e.g. "8 x 100 lb". */
export function cellReadingText(entry: GoalWeekEntry, unit: string): string {
  const reading = entry.reading
  return reading && 'load' in reading ? formatMilestoneSet(reading.reps, reading.load, unit) : ''
}

/** The cells stand ON the plane's top edge, so the row hangs above the canvas. */
export const CELLS_ROW_TOP = MINI_PLANE_TOP - MINI_CELL_HEIGHT

/**
 * @example
 * <GoalWeekColumnsChart weeks={weeks} currentWeek={5} status="on_track"
 *   committed={102.5} goalWeek={8} actuals={actuals} width={408} height={64} />
 */
export function GoalWeekColumnsChart({ weeks, ...chart }: GoalWeekColumnsChartProps) {
  const unit = chart.unit ?? 'lb'
  const lift = Math.max(0, -CELLS_ROW_TOP)
  return (
    <View style={{ width: chart.width, paddingTop: lift }} testID="goal-week-columns-chart">
      <GoalTrajectoryMini {...chart} />
      <View style={{ position: 'absolute', left: 0, top: CELLS_ROW_TOP + lift }}>
        <GoalMilestoneWeekStrip
          weekCount={chart.goalWeek}
          {...(chart.currentWeek !== undefined ? { currentWeek: chart.currentWeek } : {})}
          {...(weeks ? { weeks } : {})}
          readingText={(entry) => cellReadingText(entry, unit)}
          cellHeight={MINI_CELL_HEIGHT}
          axis={miniWeekAxis(chart, chart.width)}
        />
      </View>
    </View>
  )
}
