// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'

import { Card } from '../../ui/card'
import { Progress } from '../../ui/progress'
import { useSurfaceMode } from '../../ui/surface'
import { useMeasuredWidth } from '../Table/column-fit'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { cn } from '../../../utils/cn'
import { GOAL_STATUS_TONE, type GoalLiftStatus } from './GoalCard'
import { SegmentedBar, type SegmentedBarSegment } from './SegmentedBar'
import { FigureLine, GoalCardHeader, useStatusColor } from './wholeBodyCardParts'
import {
  dueMarkerPosition,
  leadCaption,
  sessionCaptions,
  sessionCells,
  wholeBodyScale,
  type SessionCell,
  type SessionsCaptionKey,
  type SessionsPastCommitment,
  type WholeBodyScale,
  type WholeBodySessionsRow,
} from './wholeBody'

export interface SessionsGoalCardProps extends ViewProps {
  goal: WholeBodySessionsRow
  /** Which detail line sits beside the count; the others move into the tip. Round-2 comparison (VW-455). */
  lead?: SessionsCaptionKey
  /** Days past the commitment: `append` adds a cell for each, `cap` stops at the commitment. Round-2 comparison. */
  pastCommitment?: SessionsPastCommitment
  /** Pins the layout. Omitted, the card measures itself: wall sizes from a 560px content box. */
  scale?: WholeBodyScale
  /** Pins the detail tip open, for review frames and tests. */
  isTipOpen?: boolean
  className?: string
}

/** The pill's tone as a `Progress` colour, so the bar's track is the same hue as its fill. */
function progressTone(status: GoalLiftStatus): 'success' | 'warning' | 'info' {
  const tone = GOAL_STATUS_TONE[status]
  return tone === 'success' || tone === 'warning' ? tone : 'info'
}

function useCellColors(status: GoalLiftStatus): Record<SessionCell, SegmentedBarSegment> {
  const t = getSemanticColors(useSurfaceMode())
  return {
    done: { color: useStatusColor(status) },
    extra: { color: t['status-success-muted'] },
    open: { color: t['text-tertiary'], outline: true },
  }
}

function SessionsBar(props: {
  row: WholeBodySessionsRow
  pastCommitment: SessionsPastCommitment
  scale: WholeBodyScale
}) {
  const { row, scale } = props
  const t = getSemanticColors(useSurfaceMode())
  const colors = useCellColors(row.status)
  const cells = sessionCells(row, props.pastCommitment)
  if (cells === null) {
    return (
      <Progress
        value={Math.min(row.counted, row.committed)}
        max={row.committed}
        size={scale === 'wall' ? 'lg' : 'md'}
        color={progressTone(row.status)}
        accessibilityLabel={`${row.counted} of ${row.committed} training days`}
        testID="sessions-goal-progress"
      />
    )
  }
  const marker = dueMarkerPosition(row, cells.length)
  return (
    <SegmentedBar
      segments={cells.map((cell) => colors[cell])}
      height={scale === 'wall' ? 16 : 10}
      marker={marker === null ? null : { position: marker, color: t['text-primary'] }}
      testID="sessions-goal-segments"
    />
  )
}

/**
 * A training-days goal on `#/goals`: the count in the rolling window against the
 * commitment, one detail line beside it (what is due, or what leaves the window
 * this week; the rest sit in the tip), then one cell per committed day with a
 * marker at the count due by now. Past `SESSION_SEGMENT_LIMIT` cells it falls
 * back to a plain bar. Never a streak.
 *
 * A sibling of `BodyweightGoalCard`; the page's card grid places the two.
 *
 * No loading state: the page fetches first. No error state: the page shows a
 * failed fetch. No disabled state: only the detail tip is pressable.
 */
export function SessionsGoalCard({
  goal,
  lead = 'due',
  pastCommitment = 'append',
  scale,
  isTipOpen,
  className,
  ...props
}: SessionsGoalCardProps) {
  const measured = useMeasuredWidth()
  const resolved = wholeBodyScale(measured.width, scale)
  const captions = leadCaption(sessionCaptions(goal), lead)
  return (
    <Card
      elevation={1}
      className={cn('p-inset-lg', className)}
      role="article"
      aria-label="Training days goal"
      // Card clips by default; nothing here reaches its rounded edge, and the detail tip must escape it.
      style={{ overflow: 'visible' }}
      testID="sessions-goal-card"
      {...props}
    >
      <View className="gap-stack-md" onLayout={measured.onLayout}>
        {/* Raised over the track below: every RNW View is its own stacking context. */}
        <View style={{ zIndex: 10 }}>
          <GoalCardHeader
            label={`Sessions · ${goal.windowDays} days`}
            status={goal.status}
            testID="sessions-goal-header"
          />
          <FigureLine
            scale={resolved}
            value={`${goal.counted}`}
            unit={`of ${goal.committed}`}
            label="Training days"
            lead={captions.lead}
            rest={captions.rest}
            tipLabel="Training days details"
            isTipOpen={isTipOpen}
            testID="sessions-goal-value"
          />
        </View>
        <SessionsBar row={goal} pastCommitment={pastCommitment} scale={resolved} />
      </View>
    </Card>
  )
}
