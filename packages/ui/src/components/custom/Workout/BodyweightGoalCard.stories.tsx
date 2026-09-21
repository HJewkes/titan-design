// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { BodyweightGoalCard } from './BodyweightGoalCard'
import { WHOLE_BODY_WEIGHT as W } from './wholeBody-fixture'

/** The wall's two-up grid cell at 1920; narrower canvases take their own width. */
const CELL_MAX_WIDTH = 920

const meta: Meta<typeof BodyweightGoalCard> = {
  title: 'Custom/Workout/Goals/BodyweightGoalCard',
  component: BodyweightGoalCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism.** A bodyweight goal on `#/goals` (VW-455): the latest weight, one ' +
          'detail line beside it with the rest in a tip, then the weigh-in against this ' +
          "week's band. Sibling of [SessionsGoalCard](?path=/docs/custom-workout-goals-sessionsgoalcard--docs); " +
          'the page grid places the two. Composes ' +
          '[Card](?path=/docs/components-molecules-card--docs), ' +
          '[Metric](?path=/docs/custom-metric--docs), ' +
          '[Pill](?path=/docs/components-atoms-pill--docs), ' +
          '[ZoneTrack](?path=/docs/custom-workout-zonetrack--docs) (the band in the goal ' +
          "chart's own band colour) and a Tooltip with an InfoIcon.\n\n" +
          'The lead line is the rate; the lengths (`percent`, `verdict`, `full`) are a round-3 ' +
          'comparison and every string in them is a PROPOSAL. Whatever the lead drops — this ' +
          "week's band, the phase's rate band — sits in the tip.\n\n" +
          'Bodyweight numbers come from the band constants: the store holds no weigh-ins yet. ' +
          'The slow-loss band (-0.25 to -0.5 %/wk) is a stand-in: voltras-mcp pins both edges ' +
          'at -0.5 %/wk today, and a server task will give the phase a real band. No loading ' +
          'state (the page fetches first), no error state (the page shows a failed fetch), no ' +
          'disabled state.',
      },
    },
  },
  args: {
    goal: W.cut,
    lead: 'rate',
    rateLength: 'percent',
    leadColon: true,
    isTipOpen: false,
    isTagTipOpen: false,
  },
  argTypes: {
    goal: { control: 'object' },
    lead: { control: 'inline-radio', options: ['band', 'rate'] },
    rateLength: { control: 'inline-radio', options: ['percent', 'verdict', 'full'] },
    leadColon: { control: 'boolean' },
    isTagTipOpen: { control: 'boolean' },
    scale: { control: 'inline-radio', options: [undefined, 'wall', 'phone'] },
    isTipOpen: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <View style={{ width: '100%', maxWidth: CELL_MAX_WIDTH }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof BodyweightGoalCard>

/** F6: a cut from 200 lb, week 3 of 8, leading with the rate at its shortest. */
export const Default: Story = {}

/** The populated lead without its colon, beside the N/A form that always has one. Round 6. */
export const NoColon: Story = { args: { leadColon: false } }

/**
 * The phase tag's tip, pinned open by state. The tag collapses ONLY when the card's
 * own box is narrow, so this story shows its words at a wide width and the glyph plus
 * the tip at a narrow one. Nothing here pins the collapse.
 */
export const TagTip: Story = { args: { isTagTipOpen: true } }

/** The rate with a word for where it sits against the phase's band. Proposed wording. */
export const RateVerdict: Story = { args: { rateLength: 'verdict' } }

/** The round-2 sentence, which the owner called far too long. Kept for the comparison. */
export const RateFull: Story = { args: { rateLength: 'full' } }

/** F7: a gain from 170 lb, week 2 of 8. */
export const Gain: Story = { args: { goal: W.gain } }

/** F8: a hold inside its ±2 % corridor. */
export const Hold: Story = { args: { goal: W.hold } }

/** F9: 0.5 lb over the hold corridor. */
export const OutsideHold: Story = { args: { goal: W.outsideHold } }

/** F10: slow-loss recomposition with a band. The band is a stand-in until the server rule changes. */
export const SlowLoss: Story = { args: { goal: W.slowLoss } }

/** The server's slow-loss rule today: both edges at -0.5 %/wk, so one line. */
export const SlowLossOneLine: Story = { args: { goal: W.slowLossOneLine } }

/** F11: one weigh-in. The rate reads N/A and the reason sits in the tip. */
export const OneReading: Story = { args: { goal: W.oneReading } }

/** F11 with its tip pinned open by state, so the reason behind N/A is visible. */
export const OneReadingTip: Story = { args: { goal: W.oneReading, isTipOpen: true } }

/** F12: an accepted goal with no weigh-in yet. */
export const NoReadings: Story = { args: { goal: W.noReadings } }

/** F13: week 1 after a phase change. The review holds its verdict. */
export const RateVetoed: Story = { args: { goal: W.rateVetoed } }
