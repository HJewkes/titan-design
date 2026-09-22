// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { GoalCard, type GoalCardProps } from './GoalCard'
import { GoalMilestoneTile } from './GoalMilestoneTile'
import { GOAL_MILESTONE_SCENARIOS as M } from './goalMilestone-fixture'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

type Surfaces = 'compact' | 'full' | 'tile'

const TREND: GoalCardProps['trend'] = {
  committed: 185,
  stretch: 195,
  goalWeek: 6,
  unit: 'lb',
  actuals: S.onTrack.goal!.actuals,
}

interface LeadingArgs {
  surface: Surfaces
  heroLeading: 'default' | 'tight'
}

function LeadingFrame({ surface, heroLeading }: LeadingArgs) {
  const milestone = { ...S.onTrack.milestone, heroLeading }
  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
      <View style={{ width: surface === 'compact' ? 440 : '100%', maxWidth: '100%' }}>
        {surface === 'tile' ? (
          <GoalMilestoneTile {...M.onTrack} layout="full" heroLeading={heroLeading} />
        ) : (
          <GoalCard
            {...S.onTrack}
            title="Cable Chest Press"
            milestone={milestone}
            {...(surface === 'compact'
              ? { size: 'compact' as const, goal: undefined, trend: TREND }
              : {})}
          />
        )}
      </View>
    </Surface>
  )
}

/**
 * titan-0201 round 3, after round 2's "vertical spacing between the header and the 1lb
 * on phone is too wide". The compact card's gap under its name is already tightened.
 * This is the further option: the hero numeral's line height set to its font size
 * (32px) instead of its type step's 40px, which takes the empty leading above the
 * "1 lb" away. It moves EVERY milestone surface, so each is shown before (`default`,
 * today) and after (`tight`).
 */
const meta: Meta<LeadingArgs> = {
  title: 'Lab/Decisions/Milestone Hero Leading',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    surface: { control: 'inline-radio', options: ['compact', 'full', 'tile'] },
    heroLeading: { control: 'inline-radio', options: ['default', 'tight'] },
  },
  args: { surface: 'compact', heroLeading: 'default' },
  render: (args) => <LeadingFrame {...args} />,
}
export default meta

type Story = StoryObj<LeadingArgs>

export const CompactToday: Story = {}
export const CompactTight: Story = { args: { heroLeading: 'tight' } }
export const FullToday: Story = { args: { surface: 'full' } }
export const FullTight: Story = { args: { surface: 'full', heroLeading: 'tight' } }
export const TileToday: Story = { args: { surface: 'tile' } }
export const TileTight: Story = { args: { surface: 'tile', heroLeading: 'tight' } }
