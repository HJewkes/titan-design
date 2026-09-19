import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Typography } from '../../ui/typography'
import { LiveAuraFrame } from '../../custom/Workout/LiveAuraFrame'
import { VelocityStrip, calculateVelocityLoss } from '../../custom/Workout/VelocityStrip'
import { PinnedLiveStrip } from './PinnedLiveStrip'
import {
  INTENT_SETS,
  stripRepsOf,
  thresholdsFromStop,
  type IntentSet,
} from './liveBarColour-fixture'

function IntentFrame({ set }: { set: IntentSet }) {
  const loss = calculateVelocityLoss(set.velocities)
  const isStop = loss >= set.stopPct
  const lossThresholds = thresholdsFromStop(set.stopPct)
  return (
    <View className="gap-stack-md" testID={`intent-${set.intent.toLowerCase()}`}>
      <Typography variant="overline" color="secondary">
        {`${set.intent} · stop at ${set.stopPct}% loss · this set ${loss}% · ${isStop ? 'stop' : 'productive'}`}
      </Typography>
      <PinnedLiveStrip
        state="set"
        exerciseName={set.exerciseName}
        loadLabel={set.loadLabel}
        setNumber={2}
        setCount={3}
        reps={stripRepsOf(set)}
        targetReps={set.targetReps}
        isFatigued={isStop}
        lossThresholds={lossThresholds}
        onPress={() => undefined}
      />
      <LiveAuraFrame category={isStop ? 'stop' : 'productive'} pulse={false}>
        <View className="p-inset-md">
          <VelocityStrip
            variant="hero"
            velocities={set.velocities}
            targetReps={set.targetReps}
            liveRepIndex={set.velocities.length - 1}
            height={180}
            lossThresholds={lossThresholds}
          />
        </View>
      </LiveAuraFrame>
    </View>
  )
}

/**
 * VW-429 bar colour, CHOSEN: the pinned strip and the live hero colour bars the same way, by loss from
 * the set's best against ONE caller-supplied `lossThresholds`. Here the caller scales them to each
 * intent's stop (green under a third, yellow under two thirds, orange under the stop, red from it),
 * so the last bar turns red with the strip's edge and the hero's aura. When the amber and red lines
 * sit closer than a label height (power, 7 and 10 percent) only the stop line is labelled.
 * NOT CHOSEN (colour round 1): today's split, strip-follows-hero at fixed 10/20/30, absolute zones on
 * both, and three aura steps. See REJECTED.md. Shoot at 1920 and 360. Dark only.
 */
const meta: Meta = {
  title: 'Lab/Decisions/Live Bar Colour',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  render: () => (
    <View className="gap-section-md bg-background-base p-gutter-sm" testID="live-bar-colour">
      {INTENT_SETS.map((set) => (
        <IntentFrame key={set.intent} set={set} />
      ))}
    </View>
  ),
}
export default meta

/** CHOSEN (v2): both surfaces, the same thresholds, scaled to the intent's stop. */
export const V2IntentThreshold: StoryObj = {}
