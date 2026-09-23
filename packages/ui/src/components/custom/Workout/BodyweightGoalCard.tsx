// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'

import { Card } from '../../ui/card'
import { useSurfaceMode } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { useMeasuredWidth } from '../Table/column-fit'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { cn } from '../../../utils/cn'
import { formatBodyweight } from '../../../utils/workout-format'
import { BAND_OPACITY } from './GoalTrajectoryBand'
import { ZoneTrack, type ZoneTrackTick } from './ZoneTrack'
import {
  CardTrackRow,
  FigureLine,
  GoalCardHeader,
  PHASE_TAG_COLLAPSE_WIDTH,
  useStatusColor,
  type TrackLabel,
} from './wholeBodyCardParts'
import {
  bandCaption,
  bandDomain,
  trackFraction,
  leadCaption,
  phaseLabel,
  weighInDate,
  weightCaptions,
  wholeBodyScale,
  type WholeBodyScale,
  type WholeBodyWeightRow,
} from './wholeBody'

export interface BodyweightGoalCardProps extends ViewProps {
  goal: WholeBodyWeightRow
  /**
   * Pins the phase tag's collapse. Omitted, the card measures its own box:
   * `onLayout` never fires in jsdom, so a test or a story says it outright.
   */
  tagCollapsed?: boolean
  /** Pins the phase tag's tip open, for review frames and tests. */
  isTagTipOpen?: boolean
  /** Pins the layout. Omitted, the card measures itself: wall sizes from a 560px content box. */
  scale?: WholeBodyScale
  /** Pins the detail tip open, for review frames and tests. */
  isTipOpen?: boolean
  className?: string
}

/**
 * Lines at the band's edges, with NO labels of their own: the labels sit in the
 * shared track row below, which is what lets this card's track line up with the
 * sessions card's bar. A zero-width band is one emphasised line instead.
 */
function bandTicks(row: WholeBodyWeightRow, lineColor: string): ZoneTrackTick[] {
  const lo = Math.min(row.week.low, row.week.high)
  const hi = Math.max(row.week.low, row.week.high)
  if (lo === hi) return [{ value: lo, color: lineColor, emphasized: true }]
  return [{ value: lo }, { value: hi }]
}

/** The band's two numbers, each under its own edge. */
function bandLabels(row: WholeBodyWeightRow): TrackLabel[] {
  const { min, max } = bandDomain(row.week.low, row.week.high, row.latest?.value ?? null)
  const lo = Math.min(row.week.low, row.week.high)
  const hi = Math.max(row.week.low, row.week.high)
  const edges = lo === hi ? [lo] : [lo, hi]
  return edges.map((edge) => ({
    fraction: trackFraction(edge, min, max),
    text: formatBodyweight(edge),
  }))
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
 * A bodyweight goal on `#/goals`: the latest weight, its rate this week beside it
 * ("Rate: -0.6%/wk", or "Rate: N/A" before there is one; the bands sit in the tip),
 * then the weigh-in against this week's band in the goal chart's own band colour. A hold draws its ±2 % corridor. Before the first weigh-in it
 * says so and draws no track.
 *
 * A sibling of `SessionsGoalCard`, not a row of one card: the page's card grid
 * places the two, side by side on the wall and stacked on a phone (VW-455
 * round 1, owner: "make the whole body cards be separated"). Give both
 * `style={{ height: '100%' }}` in a grid row and they end level with their tracks
 * on one line. Pass `scale` when the width is known, to skip the phone-sized first paint.
 *
 * No loading state: the page fetches first. No error state: the page shows a
 * failed fetch. No disabled state: only the detail tip is pressable.
 */
export function BodyweightGoalCard({
  goal,
  scale,
  isTipOpen,
  tagCollapsed,
  isTagTipOpen,
  className,
  style,
  ...props
}: BodyweightGoalCardProps) {
  const measured = useMeasuredWidth()
  const resolved = wholeBodyScale(measured.width, scale)
  const captions = leadCaption(weightCaptions(goal), 'rate')
  return (
    <Card
      elevation={1}
      className={cn('p-inset-lg', className)}
      role="article"
      aria-label="Bodyweight goal"
      // Card clips by default; nothing here reaches its rounded edge, and the detail tip must escape it.
      // A caller's own style still applies: a page grid passes `height: '100%'` to level two cards.
      style={[{ overflow: 'visible' }, style]}
      testID="bodyweight-goal-card"
      {...props}
    >
      <View className="gap-stack-md" style={{ flex: 1 }} onLayout={measured.onLayout}>
        {/* Raised over the track below: every RNW View is its own stacking context. */}
        <View style={{ zIndex: 10 }}>
          <GoalCardHeader
            label="Bodyweight"
            tag={{
              phase: goal.phase.name,
              text: phaseLabel(goal.phase),
              tipText: phaseLabel(goal.phase),
            }}
            tagCollapsed={
              tagCollapsed ?? (measured.width !== null && measured.width < PHASE_TAG_COLLAPSE_WIDTH)
            }
            isTagTipOpen={isTagTipOpen}
            status={goal.status}
            basis={goal.basis}
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
        {goal.latest !== null && (
          <CardTrackRow scale={resolved} labels={bandLabels(goal)} testID="bodyweight-goal-track">
            <WeightTrack row={goal} scale={resolved} />
          </CardTrackRow>
        )}
      </View>
    </Card>
  )
}
