// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../../components/ui/surface'
import { GoalCard, type GoalCardProps } from '../../../components/custom/Workout/GoalCard'
import { GoalMilestoneTile } from '../../../components/custom/Workout/GoalMilestoneTile'
import { GOAL_MILESTONE_SCENARIOS } from '../../../components/custom/Workout/goalMilestone-fixture'
import { GoalMuscleCard } from '../../../components/custom/Workout/GoalMuscleCard'
import { MuscleGroup } from '../../../components/custom/Workout/muscleTaxonomy'
import { PRIMARY_GOAL_SCENARIOS as S } from '../../../components/custom/Workout/primaryGoal-fixture'
import { GoalCardMain } from './GoalCardMain'
import { GoalMilestoneTileMain } from './GoalMilestoneTileMain'
import { GoalMuscleCardMain } from './GoalMuscleCardMain'

type Look = 'stat-card' | 'main'
type Card = 'goal-full' | 'goal-compact' | 'milestone-tile' | 'muscle'

interface RoundArgs {
  card: Card
  look: Look
}

const COMPACT: GoalCardProps = {
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
}

const MUSCLE = {
  name: 'BACK',
  muscle: MuscleGroup.UPPER_BACK,
  side: 'back',
  status: 'ahead',
  liftsOnTrack: 3,
  liftsTotal: 3,
  commonGoalWeek: 5,
  lifts: [
    { name: 'Barbell row', status: 'on_track', reps: 10, load: 100, unit: 'lb', goalWeek: 5 },
    { name: 'Weighted pull up', status: 'deload_week', reps: 6, load: 30, unit: 'lb', goalWeek: 5 },
    { name: 'Lat pulldown', status: 'ahead', reps: 12, load: 70, unit: 'lb', goalWeek: 7 },
  ],
} as const

/** The widest each card is drawn at; below it, the card fills the frame. */
const MAX_WIDTH: Record<Card, number | undefined> = {
  'goal-full': undefined,
  'goal-compact': 440,
  'milestone-tile': 480,
  muscle: 459,
}

function render(card: Card, look: Look): ReactNode {
  const main = look === 'main'
  switch (card) {
    case 'goal-full':
      return main ? <GoalCardMain {...S.onTrack} /> : <GoalCard {...S.onTrack} />
    case 'goal-compact':
      return main ? <GoalCardMain {...COMPACT} /> : <GoalCard {...COMPACT} />
    case 'milestone-tile':
      return main ? (
        <GoalMilestoneTileMain {...GOAL_MILESTONE_SCENARIOS.onTrack} />
      ) : (
        <GoalMilestoneTile {...GOAL_MILESTONE_SCENARIOS.onTrack} />
      )
    case 'muscle':
      return main ? <GoalMuscleCardMain {...MUSCLE} /> : <GoalMuscleCard {...MUSCLE} />
  }
}

function Round1Frame({ card, look }: RoundArgs) {
  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
      <View style={{ width: '100%', maxWidth: MAX_WIDTH[card] }} testID={`round-frame-${look}`}>
        {render(card, look)}
      </View>
    </Surface>
  )
}

const meta: Meta<RoundArgs> = {
  title: 'Lab/Decisions/VW-529 Goal Cards on StatCard',
  component: Round1Frame,
  tags: ['status:lab', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'VW-529 PR B round 1. Each goal card in its StatCard look (`stat-card`) or as it is ' +
          'on main (`main`, a frozen copy in `src/lab/goal-cards/vw-529-before/`), so the ' +
          'round page can show both live. The copies go when the round locks.',
      },
    },
  },
  args: { card: 'goal-full', look: 'stat-card' },
  argTypes: {
    card: {
      control: 'select',
      options: ['goal-full', 'goal-compact', 'milestone-tile', 'muscle'],
    },
    look: { control: 'inline-radio', options: ['stat-card', 'main'] },
  },
}
export default meta

type Story = StoryObj<RoundArgs>

export const GoalCardFull: Story = { args: { card: 'goal-full' } }

export const GoalCardCompact: Story = { args: { card: 'goal-compact' } }

export const MilestoneTile: Story = { args: { card: 'milestone-tile' } }

export const MuscleCard: Story = { args: { card: 'muscle' } }
