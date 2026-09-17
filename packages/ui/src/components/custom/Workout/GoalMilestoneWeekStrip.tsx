// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewStyle } from 'react-native'

import { useSurfaceMode } from '../../ui/surface'
import { Typography } from '../Typography'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { CHART_FONT } from './GoalTrajectoryChartGeometry'
import { STATUS_TOKEN } from './GoalTrajectoryPlot'
import { weekStripCells, type GoalWeekCell, type GoalWeekOutcome } from './goalMilestone'

/** How past weeks show their verdict: the cell itself, or a dot under a neutral cell. */
export type GoalWeekOutcomeStyle = 'cells' | 'dots'

export interface GoalMilestoneWeekStripProps {
  weekCount: number
  goalWeek: number
  currentWeek?: number
  /** One verdict per week, aligned to week 1; only past weeks read theirs. */
  weekOutcomes?: readonly GoalWeekOutcome[]
  outcomeStyle?: GoalWeekOutcomeStyle
  /** The target's colour, resolved by the tile; paints a goal week still ahead. */
  goalColor: string
  /** Cell height in px; the goal cell stands half again as tall. */
  cellHeight?: number
}

type Palette = ReturnType<typeof getSemanticColors>

const OUTCOME_LABEL: Record<GoalWeekOutcome, string> = {
  ahead: 'ahead',
  on_track: 'on track',
  missed: 'missed',
  none: 'no data',
}

/**
 * Missed is hollow and muted, never red: failure is not scored. No data is
 * an empty cell, fainter than a week still to come.
 */
function outcomeCell(outcome: GoalWeekOutcome, t: Palette): ViewStyle {
  switch (outcome) {
    case 'ahead':
      return { backgroundColor: t[STATUS_TOKEN.ahead] }
    case 'on_track':
      return { backgroundColor: t[STATUS_TOKEN.on_track] }
    case 'missed':
      return { borderWidth: 1, borderColor: t['text-tertiary'] }
    case 'none':
      return { backgroundColor: t['hairline-subtle'] }
  }
}

function cellFill(
  cell: GoalWeekCell,
  style: GoalWeekOutcomeStyle,
  goalColor: string,
  t: Palette
): ViewStyle {
  if (cell.outcome && style === 'cells') return outcomeCell(cell.outcome, t)
  // Solid, not a ring: a ring read as the hollow "missed" cell beside it.
  if (cell.phase === 'current') return { backgroundColor: t['text-secondary'] }
  if (cell.phase === 'future' && cell.isGoal) return { backgroundColor: goalColor }
  if (cell.phase === 'future') return { backgroundColor: t['hairline-strong'] }
  return { backgroundColor: t['text-tertiary'] }
}

const DOT = 6

function OutcomeDot({ outcome, t }: { outcome?: GoalWeekOutcome; t: Palette }) {
  const box: ViewStyle = { width: DOT, height: DOT, borderRadius: DOT / 2 }
  if (!outcome || outcome === 'none') return <View style={box} />
  const paint =
    outcome === 'missed'
      ? { borderWidth: 1, borderColor: t['text-tertiary'] }
      : { backgroundColor: t[STATUS_TOKEN[outcome]] }
  return <View style={[box, paint]} testID={`goal-milestone-dot-${outcome}`} />
}

interface WeekCellProps {
  cell: GoalWeekCell
  style: GoalWeekOutcomeStyle
  goalColor: string
  height: number
  t: Palette
}

function WeekCell({ cell, style, goalColor, height, t }: WeekCellProps) {
  const box: ViewStyle = {
    alignSelf: 'stretch',
    borderRadius: 2,
    height: cell.isGoal ? height * 1.5 : height,
  }
  return (
    <View style={{ flex: 1, alignItems: 'center' }} className="gap-stack-sm">
      <View
        testID={`goal-milestone-week-${cell.week}`}
        style={[box, cellFill(cell, style, goalColor, t)]}
      />
      {style === 'dots' && <OutcomeDot outcome={cell.outcome} t={t} />}
      <Typography
        variant="caption"
        align="center"
        color={cell.phase === 'current' ? 'primary' : 'tertiary'}
        // Same size as the chart's week axis, so the strip reads as that axis.
        style={{ fontSize: CHART_FONT, lineHeight: CHART_FONT + 3 }}
      >
        {`w${cell.week}`}
      </Typography>
    </View>
  )
}

function stripSummary(cells: GoalWeekCell[]): string {
  const current = cells.find((c) => c.phase === 'current')
  const now = current ? `Week ${current.week} of ${cells.length}` : `${cells.length} weeks`
  const past = cells.flatMap((c) =>
    c.outcome ? [`week ${c.week} ${OUTCOME_LABEL[c.outcome]}`] : []
  )
  return [now, ...past].join(', ')
}

/**
 * The block as a row of week cells in the chart's `w1..wN` axis language: the
 * current week solid and light, the goal week taller, and each past week showing its
 * verdict against that week's band.
 */
export function GoalMilestoneWeekStrip({
  weekCount,
  goalWeek,
  currentWeek,
  weekOutcomes,
  outcomeStyle = 'cells',
  goalColor,
  cellHeight = 6,
}: GoalMilestoneWeekStripProps) {
  const t = getSemanticColors(useSurfaceMode())
  const cells = weekStripCells(weekCount, goalWeek, currentWeek, weekOutcomes)
  return (
    <View
      role="img"
      aria-label={stripSummary(cells)}
      style={{ flexDirection: 'row', alignItems: 'flex-end' }}
      className="gap-inline-sm"
      testID="goal-milestone-week-strip"
    >
      {cells.map((cell) => (
        <WeekCell
          key={cell.week}
          cell={cell}
          style={outcomeStyle}
          goalColor={goalColor}
          height={cellHeight}
          t={t}
        />
      ))}
    </View>
  )
}
