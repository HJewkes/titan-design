// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import { GoalPriorityIcon, GOAL_PRIORITY_LABEL, type GoalPriority } from './GoalPriorityIcon'
import { PrimaryGoalCard, type PrimaryGoalCardLayout } from './PrimaryGoalCard'
import { PRIMARY_GOAL_SCENARIOS as S, type PrimaryGoalScenario } from './primaryGoal-fixture'

type Frame = 'wall' | 'phone'

/** The wall is 1920 wide; the page gutter is what the card actually gets. */
const FRAME_WIDTH: Record<Frame, number> = { wall: 1920, phone: 360 }

const STATES: { key: PrimaryGoalScenario; name: string }[] = [
  { key: 'calibrating', name: 'Calibrating — the captured wall payload' },
  { key: 'onTrack', name: 'On track' },
  { key: 'behind', name: 'Behind' },
  { key: 'ahead', name: 'Ahead, still short of the goal' },
  { key: 'hitExact', name: 'Exactly at the goal — success green' },
  { key: 'beyondGoal', name: 'Past the goal — the ahead blue' },
]

const PRIORITIES: GoalPriority[] = ['specialize', 'maintain', 'deprioritize']

function Cell({ id, name, children }: { id: string; name: string; children: ReactNode }) {
  return (
    <View testID={`state-${id}`} className="gap-stack-sm">
      <Typography variant="caption" color="tertiary">
        {name}
      </Typography>
      {children}
    </View>
  )
}

/** The three priority marks side by side, at the size the card's header uses. */
function PriorityRow() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-lg">
      {PRIORITIES.map((priority) => (
        <View
          key={priority}
          style={{ flexDirection: 'row', alignItems: 'center' }}
          className="gap-inline-sm"
        >
          <GoalPriorityIcon priority={priority} />
          <Typography variant="caption" color="tertiary">
            {GOAL_PRIORITY_LABEL[priority]}
          </Typography>
        </View>
      ))}
    </View>
  )
}

function Board({ layout }: { layout: PrimaryGoalCardLayout }) {
  return (
    <View className="gap-section-sm">
      {STATES.map(({ key, name }) => (
        <Cell key={key} id={key} name={name}>
          <PrimaryGoalCard {...S[key]} layout={layout} />
        </Cell>
      ))}
    </View>
  )
}

interface DecisionArgs {
  frame: Frame
  layout: PrimaryGoalCardLayout
}

/**
 * VW-385 unit 1 — the two layouts the human chooses between.
 *
 * **A (`fill`)**: the chart measures the card and takes its whole width, capped
 * at 340 high, with the milestone tile under it. **B (`fixed`)**: the chart stays
 * at its original 1200 and the tile takes the right column.
 *
 * The old header block is gone in both: the week reads off the chart's axis,
 * committed and stretch off its rules, next week off the hollow marker, and the
 * status basis off the pill's tip. Dark only (VW-397).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Primary Goal Card',
  tags: ['autodocs', 'status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    frame: { control: 'inline-radio', options: ['wall', 'phone'] },
    layout: { control: 'inline-radio', options: ['fill', 'fixed'] },
  },
  render: (args) => (
    <Surface
      level="base"
      style={{ minHeight: '100%', width: FRAME_WIDTH[args.frame] }}
      className="p-gutter-sm gap-section-sm"
    >
      <View className="gap-stack-sm">
        <Typography variant="h6">
          {args.layout === 'fill' ? 'Layout A — chart fills the card' : 'Layout B — chart at 1200'}
        </Typography>
        <Typography variant="body2" color="secondary">
          Hover, focus or press the status pill for its basis, the priority mark for its meaning,
          and the hollow marker for next week&apos;s target.
        </Typography>
        <PriorityRow />
      </View>
      <Board layout={args.layout} />
    </Surface>
  ),
}
export default meta

type Story = StoryObj<DecisionArgs>

/** Layout A at the wall's 1920. */
export const WallLayoutA: Story = { args: { frame: 'wall', layout: 'fill' } }

/** Layout B at the wall's 1920: 1200 of chart, the tile in what is left. */
export const WallLayoutB: Story = { args: { frame: 'wall', layout: 'fixed' } }

/** Layout A at 360. */
export const PhoneLayoutA: Story = { args: { frame: 'phone', layout: 'fill' } }

/** Layout B at 360 — the 1200 chart cannot fit, which is the point of the comparison. */
export const PhoneLayoutB: Story = { args: { frame: 'phone', layout: 'fixed' } }
