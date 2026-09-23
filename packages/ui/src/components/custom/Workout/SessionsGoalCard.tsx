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
import {
  CardTrackRow,
  FigureLine,
  GoalCardHeader,
  useStatusColor,
  type TrackLabel,
} from './wholeBodyCardParts'
import {
  dueMarkerPosition,
  leadCaption,
  sessionCaptions,
  sessionCells,
  sessionsBarLabel,
  wholeBodyScale,
  type SessionCell,
  type WholeBodyScale,
  type WholeBodySessionsRow,
} from './wholeBody'

export interface SessionsGoalCardProps extends ViewProps {
  goal: WholeBodySessionsRow
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

/** One label under the bar: where the count due by now falls. The row keeps its height without it. */
function dueLabels(row: WholeBodySessionsRow): TrackLabel[] {
  const cells = sessionCells(row)
  const marker = dueMarkerPosition(row, cells?.length ?? row.committed)
  return marker === null ? [] : [{ fraction: marker, text: 'due' }]
}

function SessionsBar(props: { row: WholeBodySessionsRow; scale: WholeBodyScale }) {
  const { row, scale } = props
  const t = getSemanticColors(useSurfaceMode())
  const colors = useCellColors(row.status)
  const cells = sessionCells(row)
  if (cells === null) {
    return (
      <Progress
        value={Math.min(row.counted, row.committed)}
        max={row.committed}
        size={scale === 'wall' ? 'lg' : 'md'}
        color={progressTone(row.status)}
        accessibilityLabel={sessionsBarLabel(row)}
        testID="sessions-goal-progress"
      />
    )
  }
  const marker = dueMarkerPosition(row, cells.length)
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={sessionsBarLabel(row)}
      aria-valuenow={row.counted}
      aria-valuemin={0}
      aria-valuemax={row.committed}
      testID="sessions-goal-bar"
    >
      <SegmentedBar
        segments={cells.map((cell) => colors[cell])}
        height={scale === 'wall' ? 16 : 10}
        marker={marker === null ? null : { position: marker, color: t['text-primary'] }}
        testID="sessions-goal-segments"
      />
    </View>
  )
}

/**
 * A training-days goal on `#/goals`: the count in the rolling window against the
 * commitment, what is due beside it (the rest sit in the tip), then one cell per
 * committed day, a darker cell per day past it, and a marker at the count due by now. Past `SESSION_SEGMENT_LIMIT` cells it falls
 * back to a plain bar. Never a streak.
 *
 * A sibling of `BodyweightGoalCard`; the page's card grid places the two, each
 * with `style={{ height: '100%' }}` so they end level. `dueByNow` equals
 * `committed` once the first window is full; below it the marker and the lead show.
 *
 * No loading state: the page fetches first. No error state: the page shows a
 * failed fetch. No disabled state: only the detail tip is pressable.
 */
export function SessionsGoalCard({
  goal,
  scale,
  isTipOpen,
  className,
  style,
  ...props
}: SessionsGoalCardProps) {
  const measured = useMeasuredWidth()
  const resolved = wholeBodyScale(measured.width, scale)
  const captions = leadCaption(sessionCaptions(goal), 'due')
  return (
    <Card
      elevation={1}
      className={cn('p-inset-lg', className)}
      role="article"
      aria-label="Training days goal"
      // Card clips by default; nothing here reaches its rounded edge, and the detail tip must escape it.
      // A caller's own style still applies: a page grid passes `height: '100%'` to level two cards.
      style={[{ overflow: 'visible' }, style]}
      testID="sessions-goal-card"
      {...props}
    >
      <View className="gap-stack-md" style={{ flex: 1 }} onLayout={measured.onLayout}>
        {/* Raised over the track below: every RNW View is its own stacking context. */}
        <View style={{ zIndex: 10 }}>
          <GoalCardHeader
            label={`Sessions · ${goal.windowDays} days`}
            status={goal.status}
            basis={goal.basis}
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
        <CardTrackRow scale={resolved} labels={dueLabels(goal)} testID="sessions-goal-track">
          <SessionsBar row={goal} scale={resolved} />
        </CardTrackRow>
      </View>
    </Card>
  )
}
