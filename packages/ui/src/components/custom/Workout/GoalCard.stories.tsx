// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { GoalCard } from './GoalCard'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const meta: Meta<typeof GoalCard> = {
  title: 'Custom/Workout/Goals/GoalCard',
  component: GoalCard,
  tags: ['autodocs', 'status:candidate'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "One goal at card scale, in two sizes. `full` is the wall's lead card — the " +
          "meso target's summary folded over a trajectory chart, its week cells standing " +
          "on the chart's own week columns. `compact` is a cell in the per-lift grid: the " +
          'same title row and summary over a sparkline (see `GoalLiftCard`, the preset). ' +
          'Composes `Card`, `GoalPriorityIcon`, `Pill` + `TipTrigger`, `PrBadge`, ' +
          '`GoalMilestoneSummary`, `GoalTrajectoryChart` and `Sparkline`.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['full', 'compact'] },
    status: {
      control: 'select',
      options: [
        'on_track',
        'ahead',
        'behind',
        'tolerated',
        'deload_week',
        'calibrating',
        'stalled',
        'goal_met',
        'beyond_goal',
      ],
    },
    priority: { control: 'inline-radio', options: ['specialize', 'maintain', 'deprioritize'] },
    chartWidth: {
      control: { type: 'range', min: 320, max: 1800, step: 20 },
      description: 'Pins the measured content width. Leave unset to follow the canvas.',
    },
  },
  decorators: [
    (Story) => (
      // No frame: the card is the canvas width, so the chart measures whatever
      // the Storybook pane (or a viewport preset) currently is.
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <View style={{ width: '100%' }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof GoalCard>

/** The wall's own calibrating payload, captured from the SPA on 2026-09-17. */
export const Calibrating: Story = { args: { ...S.calibrating } }

export const OnTrack: Story = { args: { ...S.onTrack } }

export const Behind: Story = { args: { ...S.behind } }

export const Ahead: Story = { args: { ...S.ahead } }

/** A reading exactly on the committed target: success green, the hit label. */
export const HitExact: Story = { args: { ...S.hitExact } }

/** A reading past the target: the `ahead` blue on the line, the hero and the pill. */
export const BeyondGoal: Story = { args: { ...S.beyondGoal } }

/**
 * `status="goal_met"` — the read model's own outcome word (voltras-mcp VW-400).
 * The readings here are still a pound short of the block's target; the card
 * prints what it was told rather than re-deriving the verdict from the numbers.
 */
export const StatusGoalMet: Story = { args: { ...S.onTrack, status: 'goal_met' } }

/** `status="beyond_goal"` — the same, for a target the read model says was beaten. */
export const StatusBeyondGoal: Story = { args: { ...S.onTrack, status: 'beyond_goal' } }

/**
 * Phone width. The card still fills its container — the container is what is
 * 360 wide — and the chart drops to its 220px phone density under 720px.
 */
export const Phone: Story = {
  args: { ...S.onTrack },
  decorators: [
    (Story) => (
      <Surface
        level="base"
        style={{ minHeight: '100%', width: 360, maxWidth: '100%' }}
        className="p-gutter-sm"
      >
        <Story />
      </Surface>
    ),
  ],
}

/**
 * `compact`: the same title row and summary over the sparkline, which is what a
 * per-lift grid cell renders. `GoalLiftCard` is this size under the name the SPA
 * already calls it by.
 */
export const Compact: Story = {
  args: {
    ...S.onTrack,
    size: 'compact',
    goal: undefined,
    trend: {
      committed: 185,
      stretch: 195,
      goalWeek: 6,
      unit: 'lb',
      actuals: [
        { weekIndex: 1, value: 175 },
        { weekIndex: 2, value: 178 },
        { weekIndex: 3, value: 181 },
        { weekIndex: 4, value: 184 },
      ],
    },
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <View style={{ width: 440 }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
}
