// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import { GoalCard, type GoalCardProps } from './GoalCard'
import type { RuleLabelText } from './goalTrajectoryRuleLabels'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

interface LabelArgs {
  yAxisLabels: boolean
  ruleLabelText: RuleLabelText
}

const BASE = S.onTrack

/** The same bench block with its committed and stretch pulled to `gap` lb apart. */
function withRules(gap: number, title: string): GoalCardProps {
  const goal = BASE.goal!
  return {
    ...BASE,
    title,
    goal: {
      ...goal,
      committed: 185,
      stretch: 185 + gap,
      expected: goal.expected.map((p) => ({ ...p, high: p.low + gap * 0.5 })),
    },
  }
}

const CARDS: { name: string; card: GoalCardProps }[] = [
  { name: 'Committed 185, stretch 195', card: BASE },
  {
    name: 'Close rules: committed 185, stretch 186.5 (a slow block)',
    card: withRules(1.5, 'Close press'),
  },
  { name: 'Equal rules: committed = stretch 185 (a hold)', card: withRules(0, 'Hold press') },
]

function LabelCards({ yAxisLabels, ruleLabelText }: LabelArgs) {
  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="gap-section-sm p-gutter-sm">
      {CARDS.map(({ name, card }) => (
        <View key={name} className="gap-stack-sm">
          <Typography variant="caption" color="tertiary">
            {name}
          </Typography>
          <GoalCard {...card} goal={{ ...card.goal!, yAxisLabels, ruleLabelText }} />
        </View>
      ))}
    </Surface>
  )
}

/**
 * titan-0201 round 2, human: "Drop the y axis labels on phone, the goal lines
 * contextualize the scale well enough. I might be open to showing it as small labels
 * (like the stretch/committed goals) next to the lines tho inside the chart, same
 * color as the lines themselves" and "Lets drop the literal committed / stretch text
 * and just show the numeric labels".
 *
 * Four options, each on a normal block, a slow block whose rules nearly meet, and a
 * hold whose rules coincide. Numeric labels sit in the rule's colour inside the
 * plot and move off any reading, the next-target tip and each other. The chart's
 * accessible name keeps the words "committed" and "stretch" in every option.
 */
const meta: Meta<LabelArgs> = {
  title: 'Lab/Decisions/Goal Chart Labels',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    yAxisLabels: { control: 'boolean' },
    ruleLabelText: { control: 'inline-radio', options: ['named', 'numeric', 'none'] },
  },
  args: { yAxisLabels: true, ruleLabelText: 'named' },
  render: (args) => <LabelCards {...args} />,
}
export default meta

type Story = StoryObj<LabelArgs>

/** Phone option: no y axis, numeric labels on the rules. */
export const NoAxisNumeric: Story = { args: { yAxisLabels: false, ruleLabelText: 'numeric' } }
/** Phone option: no y axis, no labels on the rules. */
export const NoAxisNoLabels: Story = { args: { yAxisLabels: false, ruleLabelText: 'none' } }
/** Wall option: the y axis kept, numeric labels on the rules. */
export const AxisNumeric: Story = { args: { yAxisLabels: true, ruleLabelText: 'numeric' } }
/** Today, for comparison: the y axis and the named labels. */
export const Today: Story = {}
