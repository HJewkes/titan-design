// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { GoalCard, type GoalCardProps } from './GoalCard'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'

const NAMES = {
  short: 'Cable Row',
  medium: 'Cable Chest Press',
  long: 'Single-Arm Half-Kneeling Cable Row',
  // Pasted garbage, not a name: one unbroken token longer than four lines of any card.
  pasted: 'BenchPressPastedFromTheSpreadsheetWithNoSpaces'.repeat(4),
} as const

// Every mark the header can carry, so each name competes with the widest group.
const MARKS = { priority: 'specialize', isPR: true } as const

const COMPACT_TREND: GoalCardProps['trend'] = {
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
}

function fullCard(title: string): GoalCardProps {
  return { ...S.onTrack, ...MARKS, title }
}

function compactCard(title: string): GoalCardProps {
  return { ...S.onTrack, ...MARKS, title, size: 'compact', goal: undefined, trend: COMPACT_TREND }
}

/**
 * VW-432 — the title row at phone width. Order of preference: the name beside
 * the priority mark, PR star and status badge on one row; if that does not fit,
 * the marks drop to a left-aligned line under the name; only a name wider than
 * the card itself wraps. The name never truncates, in either size.
 *
 * The `Pasted` stories are the functional review's guard, not a design: one
 * unbroken token breaks inside the card, and a four-line clamp no real exercise
 * name reaches stops it growing the card without end.
 *
 * The full card fills the canvas. The compact card is a grid cell, 440px at
 * most (the width of the `Compact` story), and the canvas width below that.
 */
const meta: Meta<typeof GoalCard> = {
  title: 'Lab/Decisions/Goal Card Header',
  component: GoalCard,
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story, { args }) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <View style={{ width: args.size === 'compact' ? 440 : '100%', maxWidth: '100%' }}>
          <Story />
        </View>
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof GoalCard>

export const FullShort: Story = { args: fullCard(NAMES.short) }
export const FullMedium: Story = { args: fullCard(NAMES.medium) }
export const FullLong: Story = { args: fullCard(NAMES.long) }
export const CompactShort: Story = { args: compactCard(NAMES.short) }
export const CompactMedium: Story = { args: compactCard(NAMES.medium) }
export const CompactLong: Story = { args: compactCard(NAMES.long) }
export const FullPasted: Story = { args: fullCard(NAMES.pasted) }
export const FullPastedNoMarks: Story = {
  args: { ...fullCard(NAMES.pasted), priority: undefined, isPR: false },
}
export const CompactPasted: Story = { args: compactCard(NAMES.pasted) }
