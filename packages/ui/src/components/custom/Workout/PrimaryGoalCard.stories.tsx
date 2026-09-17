// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { PrimaryGoalCard } from './PrimaryGoalCard'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const meta: Meta<typeof PrimaryGoalCard> = {
  title: 'Custom/Workout/Goals/PrimaryGoalCard',
  component: PrimaryGoalCard,
  tags: ['autodocs', 'status:candidate'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The lead priority at the top of the `#/goals` wall. Composes `Card`, ' +
          '`GoalPriorityIcon`, `Pill` + `TipTrigger`, `PrBadge`, `GoalTrajectoryChart` ' +
          'and `GoalMilestoneTile`.',
      },
    },
  },
  argTypes: {
    layout: {
      control: 'inline-radio',
      options: ['fill', 'fixed'],
      description: 'A: chart fills the card. B: chart pinned to 1200 with the tile beside it.',
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

type Story = StoryObj<typeof PrimaryGoalCard>

/** The wall's own calibrating payload, captured from the SPA on 2026-09-17. */
export const Calibrating: Story = { args: { ...S.calibrating, layout: 'fill' } }

export const OnTrack: Story = { args: { ...S.onTrack, layout: 'fill' } }

export const Behind: Story = { args: { ...S.behind, layout: 'fill' } }

export const Ahead: Story = { args: { ...S.ahead, layout: 'fill' } }

/** A reading exactly on the committed target: success green, the hit label. */
export const HitExact: Story = { args: { ...S.hitExact, layout: 'fill' } }

/** A reading past the target: the `ahead` blue on the line, the tile and the pill. */
export const BeyondGoal: Story = { args: { ...S.beyondGoal, layout: 'fill' } }

/** Layout B: the chart pinned to 1200 with the milestone tile in a right column. */
export const FixedChartWithSideTile: Story = { args: { ...S.onTrack, layout: 'fixed' } }

/**
 * Phone width. The card still fills its container — the container is what is
 * 360 wide — and the chart drops to its 220px phone density under 720px.
 */
export const Phone: Story = {
  args: { ...S.onTrack, layout: 'fill' },
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
