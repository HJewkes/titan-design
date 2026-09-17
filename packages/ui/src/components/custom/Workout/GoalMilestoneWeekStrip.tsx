// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
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
  if (currentWeek !== undefined && week <= currentWeek) return 'bg-text-tertiary'
  return 'bg-hairline-strong'
}

/** Axis ends closer than this to the goal are dropped so their labels never collide. */
const END_LABEL_CLEARANCE = 2

/** The weeks named under the strip: the goal, and whichever axis ends clear it. */
export function weekStripLabels(totalWeeks: number, goalWeek: number): number[] {
  const ends = [1, totalWeeks].filter((end) => Math.abs(end - goalWeek) >= END_LABEL_CLEARANCE)
  return [...new Set([...ends, goalWeek])].sort((a, b) => a - b)
}

function StripLabel({
  week,
  totalWeeks,
  children,
  emphasis = false,
}: {
  week: number
  totalWeeks: number
  children: string
  emphasis?: boolean
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
      <Typography variant="caption" color={emphasis ? 'primary' : 'tertiary'} align="center">
        {children}
      </Typography>
    </View>
  )
}

function LabelRow({ children }: { children: ReactNode }) {
  return <View style={{ height: 18 }}>{children}</View>
}

/**
 * The meso as a row of week cells, in the chart's `w1..wN` axis language:
 * elapsed weeks a step stronger than future ones, the goal week in the status
 * colour, and the current week ringed and named above the strip, clear of the
 * week labels below. Colour appears once, on the goal cell.
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
      {currentWeek !== undefined && currentWeek <= totalWeeks && (
        <LabelRow>
          <StripLabel week={currentWeek} totalWeeks={totalWeeks} emphasis>
            now
          </StripLabel>
        </LabelRow>
      )}
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
      <LabelRow>
        {weekStripLabels(totalWeeks, goalWeek).map((week) => (
          <StripLabel key={week} week={week} totalWeeks={totalWeeks}>
            {`w${week}`}
          </StripLabel>
        ))}
      </LabelRow>
    </View>
  )
}
