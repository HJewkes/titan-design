// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { WholeBodyCard } from './WholeBodyCard'
import { WHOLE_BODY_SESSIONS as S, WHOLE_BODY_WEIGHT as W } from './wholeBody-fixture'

const meta: Meta<typeof WholeBodyCard> = {
  title: 'Custom/Workout/Goals/WholeBodyCard',
  component: WholeBodyCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism.** The two goals on `#/goals` that are not a lift: bodyweight against ' +
          "the diet phase's band, and training days in the rolling 28-day window (VW-455). " +
          'A row with no goal is not drawn; with neither, the card renders nothing and the ' +
          'page drops the section. Composes ' +
          '[Card](?path=/docs/components-molecules-card--docs), ' +
          '[Metric](?path=/docs/custom-metric--docs), ' +
          '[Pill](?path=/docs/components-atoms-pill--docs), ' +
          '[ZoneTrack](?path=/docs/custom-workout-zonetrack--docs) (the band, in the goal ' +
          "chart's own band colour), [SegmentedBar](?path=/docs/custom-workout-segmentedbar--docs) " +
          'and [Progress](?path=/docs/components-atoms-progress--docs).\n\n' +
          'Side by side from a 720px content box, stacked below it. No loading state (the page ' +
          'fetches first), no error state (the page shows a failed fetch), no disabled state ' +
          '(nothing is pressable). Bodyweight fixtures come from the band constants: the ' +
          "owner's store holds no weigh-ins yet.",
      },
    },
  },
  args: { bodyweight: W.cut, sessions: S.underPace, sessionsVisual: 'segments' },
  argTypes: {
    bodyweight: { control: 'object' },
    sessions: { control: 'object' },
    scale: { control: 'inline-radio', options: [undefined, 'wall', 'phone'] },
    sessionsVisual: { control: 'inline-radio', options: ['segments', 'progress', 'number'] },
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <View style={{ width: '100%' }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof WholeBodyCard>

/** F14: both goals, a cut and an under-pace window. */
export const Default: Story = {}

/** F2: the owner's real history is one training day, so a goal made today reads 1 of 1. */
export const SessionsRealHistory: Story = {
  args: { bodyweight: null, sessions: S.realHistory },
}

/** F3: a goal made today. Nothing is due yet, and the marker sits at the start. */
export const SessionsWindowStarted: Story = {
  args: { bodyweight: null, sessions: S.windowStarted },
}

/** F4: under pace while the first window fills. */
export const SessionsUnderPace: Story = {
  args: { bodyweight: null, sessions: S.underPace },
}

/** F5: a daily commitment. Segments fall back to a plain bar past 20. */
export const SessionsLargeCommitment: Story = {
  args: { bodyweight: null, sessions: S.largeCommitment },
}

/** F6: a cut from 200 lb, week 3 of 8. */
export const WeightCut: Story = { args: { bodyweight: W.cut, sessions: null } }

/** F7: a gain from 170 lb, week 2 of 8. */
export const WeightGain: Story = { args: { bodyweight: W.gain, sessions: null } }

/** F8: a hold inside its ±2 % corridor. */
export const WeightHold: Story = { args: { bodyweight: W.hold, sessions: null } }

/** F9: 0.5 lb over the hold corridor. */
export const WeightOutsideHold: Story = { args: { bodyweight: W.outsideHold, sessions: null } }

/** F10: slow-loss recomposition. Committed equals stretch, so the band is one line. */
export const WeightSlowLoss: Story = { args: { bodyweight: W.slowLoss, sessions: null } }

/** F11: one weigh-in. The rate waits for a second week. */
export const WeightOneReading: Story = { args: { bodyweight: W.oneReading, sessions: null } }

/** F12: an accepted goal with no weigh-in yet. */
export const WeightNoReadings: Story = { args: { bodyweight: W.noReadings, sessions: null } }

/** F13: week 1 after a phase change. The review holds its verdict. */
export const WeightRateVetoed: Story = { args: { bodyweight: W.rateVetoed, sessions: null } }
