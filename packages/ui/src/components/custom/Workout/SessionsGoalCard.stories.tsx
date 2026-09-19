// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { SessionsGoalCard } from './SessionsGoalCard'
import { WHOLE_BODY_SESSIONS as S } from './wholeBody-fixture'

/** The wall's two-up grid cell at 1920; narrower canvases take their own width. */
const CELL_MAX_WIDTH = 920

const meta: Meta<typeof SessionsGoalCard> = {
  title: 'Custom/Workout/Goals/SessionsGoalCard',
  component: SessionsGoalCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism.** A training-days goal on `#/goals` (VW-455): the count in the rolling ' +
          '28-day window against the commitment, one detail line beside it with the rest in a ' +
          'tip, then one cell per committed day with a marker at the count due by now. Past 20 ' +
          'cells it falls back to a plain bar. Never a streak. Sibling of ' +
          '[BodyweightGoalCard](?path=/docs/custom-workout-goals-bodyweightgoalcard--docs). ' +
          'Composes [Card](?path=/docs/components-molecules-card--docs), ' +
          '[Metric](?path=/docs/custom-metric--docs), ' +
          '[Pill](?path=/docs/components-atoms-pill--docs), ' +
          '[SegmentedBar](?path=/docs/custom-workout-segmentedbar--docs), ' +
          '[Progress](?path=/docs/components-atoms-progress--docs) and a Tooltip with an ' +
          'InfoIcon. Sessions count training days (voltras-mcp VW-460). No loading, error or ' +
          'disabled state.',
      },
    },
  },
  args: { goal: S.underPace, lead: 'due', pastCommitment: 'append', isTipOpen: false },
  argTypes: {
    goal: { control: 'object' },
    lead: { control: 'inline-radio', options: ['due', 'leaving'] },
    pastCommitment: { control: 'inline-radio', options: ['append', 'cap'] },
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

type Story = StoryObj<typeof SessionsGoalCard>

/** F4: under pace while the first window fills. */
export const Default: Story = {}

/** F2: the owner's real history is one training day, so a goal made today reads 1 of 1. */
export const RealHistory: Story = { args: { goal: S.realHistory } }

/** F3: a goal made today. Nothing is due yet, and the marker sits at the start. */
export const WindowStarted: Story = { args: { goal: S.windowStarted } }

/** 14 of 12: two training days past the commitment. `pastCommitment` appends or caps them. */
export const OverCommitment: Story = { args: { goal: S.overCommitment } }

/** F5: a daily commitment. Cells fall back to a plain bar past 20. */
export const LargeCommitment: Story = { args: { goal: S.largeCommitment } }
