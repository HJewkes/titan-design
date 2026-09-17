// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'

import { cn } from '../../../utils/cn'
import { Typography } from '../Typography'

export type GoalMilestoneTone = 'success' | 'warning' | 'info'

export interface GoalMilestoneWeekStripProps {
  /** Weeks on the axis; every week from 1 to here gets one cell. */
  totalWeeks: number
  goalWeek: number
  currentWeek?: number
  tone: GoalMilestoneTone
  /** Cell height in px; the goal cell stands taller by half. */
  cellHeight?: number
}

const TONE_FILL: Record<GoalMilestoneTone, string> = {
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  info: 'bg-status-info',
}

function cellFill(
  week: number,
  goalWeek: number,
  currentWeek: number | undefined,
  tone: GoalMilestoneTone
) {
  if (week === goalWeek) return TONE_FILL[tone]
  if (currentWeek !== undefined && week <= currentWeek) return 'bg-hairline-strong'
  return 'bg-hairline-default'
}

/** The weeks worth naming: the axis ends, now, and the goal. Now wins a shared week. */
export function weekStripLabels(
  totalWeeks: number,
  goalWeek: number,
  currentWeek?: number
): { week: number; text: string }[] {
  const labels = new Map<number, string>([
    [1, 'w1'],
    [totalWeeks, `w${totalWeeks}`],
    [goalWeek, `w${goalWeek}`],
  ])
  if (currentWeek !== undefined) labels.set(currentWeek, 'now')
  return [...labels.entries()].sort(([a], [b]) => a - b).map(([week, text]) => ({ week, text }))
}

function StripLabel({
  week,
  text,
  totalWeeks,
}: {
  week: number
  text: string
  totalWeeks: number
}) {
  const center = ((week - 0.5) / totalWeeks) * 100
  return (
    <View
      // Centred on its cell: a 40px box pulled back by half its width.
      style={{
        position: 'absolute',
        left: `${center}%`,
        width: 40,
        transform: [{ translateX: -20 }],
      }}
    >
      <Typography variant="caption" color={text === 'now' ? 'primary' : 'tertiary'} align="center">
        {text}
      </Typography>
    </View>
  )
}

/**
 * The meso as a row of week cells, in the chart's `w1..wN` axis language:
 * elapsed weeks a step stronger than future ones, the goal week in the status
 * colour, and the current week ringed. Colour appears once, on the goal cell.
 */
export function GoalMilestoneWeekStrip({
  totalWeeks,
  goalWeek,
  currentWeek,
  tone,
  cellHeight = 8,
}: GoalMilestoneWeekStripProps) {
  const weeks = Array.from({ length: Math.max(totalWeeks, 1) }, (_, i) => i + 1)
  return (
    <View className="gap-stack-sm" testID="goal-milestone-week-strip">
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }} className="gap-inline-sm">
        {weeks.map((week) => (
          <View
            key={week}
            testID={week === goalWeek ? 'goal-milestone-week-goal' : `goal-milestone-week-${week}`}
            className={cn(
              'flex-1 rounded-sm',
              cellFill(week, goalWeek, currentWeek, tone),
              week === currentWeek && 'border border-text-primary'
            )}
            style={{ height: week === goalWeek ? cellHeight * 1.5 : cellHeight }}
          />
        ))}
      </View>
      <View style={{ height: 18 }}>
        {weekStripLabels(totalWeeks, goalWeek, currentWeek).map((label) => (
          <StripLabel key={label.week} {...label} totalWeeks={totalWeeks} />
        ))}
      </View>
    </View>
  )
}
