// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'

import { Card } from '../../ui/card'
import { useSurfaceMode } from '../../ui/surface'
import { Typography } from '../Typography'
import { useMeasuredWidth } from '../Table/column-fit'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { cn } from '../../../utils/cn'
import { formatBodyweight } from '../../../utils/workout-format'
import { BAND_OPACITY } from './GoalTrajectoryBand'
import { ZoneTrack, type ZoneTrackTick } from './ZoneTrack'
import { FigureLine, GoalCardHeader, useStatusColor } from './wholeBodyCardParts'
import {
  bandCaption,
  bandDomain,
  leadCaption,
  phaseLabel,
  weighInDate,
  weightCaptions,
  wholeBodyScale,
  type WeightCaptionKey,
  type WholeBodyScale,
  type WholeBodyWeightRow,
} from './wholeBody'

export interface BodyweightGoalCardProps extends ViewProps {
  goal: WholeBodyWeightRow
  /** Which detail line sits beside the weight; the other moves into the tip. Round-2 comparison (VW-455). */
  lead?: WeightCaptionKey
  /** Pins the layout. Omitted, the card measures itself: wall sizes from a 560px content box. */
  scale?: WholeBodyScale
  /** Pins the detail tip open, for review frames and tests. */
  isTipOpen?: boolean
  className?: string
}

/** Tick labels at the band's edges; a zero-width band is one emphasised line instead. */
function bandTicks(row: WholeBodyWeightRow, lineColor: string): ZoneTrackTick[] {
  const lo = Math.min(row.week.low, row.week.high)
  const hi = Math.max(row.week.low, row.week.high)
  if (lo === hi) {
    return [{ value: lo, label: formatBodyweight(lo), color: lineColor, emphasized: true }]
  }
  return [
    { value: lo, label: formatBodyweight(lo) },
    { value: hi, label: formatBodyweight(hi) },
  ]
}

function WeightTrack({ row, scale }: { row: WholeBodyWeightRow; scale: WholeBodyScale }) {
  const t = getSemanticColors(useSurfaceMode())
  const needle = useStatusColor(row.status)
  const latest = row.latest?.value ?? null
  const { min, max } = bandDomain(row.week.low, row.week.high, latest)
  return (
    <ZoneTrack
      min={min}
      max={max}
      size={scale === 'wall' ? 'wall' : 'default'}
      zones={[{ upTo: max, color: 'transparent' }]}
      band={{
        from: Math.min(row.week.low, row.week.high),
        to: Math.max(row.week.low, row.week.high),
        color: alpha(t['brand-secondary'], BAND_OPACITY),
      }}
      ticks={bandTicks(row, t['brand-secondary'])}
      marker={latest === null ? null : { type: 'needle', value: latest, color: needle }}
      accessibilityLabel={`Bodyweight against this week's band. ${bandCaption(row)}`}
    />
  )
}

/**
 * A bodyweight goal on `#/goals`: the latest weight, one detail line beside it
 * (this week's band or the rate `goal.weekly_review` judges; the other sits in
 * the tip), then the weigh-in against this week's band in the goal chart's own
 * band colour. A hold draws its ±2 % corridor. Before the first weigh-in it
 * says so and draws no track.
 *
 * A sibling of `SessionsGoalCard`, not a row of one card: the page's card grid
 * places the two, side by side on the wall and stacked on a phone (VW-455
 * round 1, owner: "make the whole body cards be separated").
 *
 * No loading state: the page fetches first. No error state: the page shows a
 * failed fetch. No disabled state: only the detail tip is pressable.
 */
export function BodyweightGoalCard({
  goal,
  lead = 'band',
  scale,
  isTipOpen,
  className,
  ...props
}: BodyweightGoalCardProps) {
  const measured = useMeasuredWidth()
  const resolved = wholeBodyScale(measured.width, scale)
  const captions = leadCaption(weightCaptions(goal), lead)
  return (
    <Card
      elevation={1}
      className={cn('p-inset-lg', className)}
      role="article"
      aria-label="Bodyweight goal"
      // Card clips by default; nothing here reaches its rounded edge, and the detail tip must escape it.
      style={{ overflow: 'visible' }}
      testID="bodyweight-goal-card"
      {...props}
    >
      <View className="gap-stack-md" onLayout={measured.onLayout}>
        {/* Raised over the track below: every RNW View is its own stacking context. */}
        <View style={{ zIndex: 10 }}>
          <GoalCardHeader
            label="Bodyweight"
            tag={phaseLabel(goal.phase)}
            status={goal.status}
            testID="bodyweight-goal-header"
          />
          {goal.latest === null ? (
            <Typography variant="body2" color="secondary" testID="bodyweight-goal-empty">
              No weigh-in yet. Log one to start this goal.
            </Typography>
          ) : (
            <FigureLine
              scale={resolved}
              value={formatBodyweight(goal.latest.value)}
              unit={goal.unit}
              label={`Weighed ${weighInDate(goal.latest.ts)}`}
              lead={captions.lead}
              rest={captions.rest}
              tipLabel="Bodyweight details"
              isTipOpen={isTipOpen}
              testID="bodyweight-goal-value"
            />
          )}
        </View>
        {goal.latest !== null && <WeightTrack row={goal} scale={resolved} />}
      </View>
    </Card>
  )
}
