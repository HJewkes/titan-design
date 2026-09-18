// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import { GoalPriorityIcon, GOAL_PRIORITY_LABEL, type GoalPriority } from './GoalPriorityIcon'
import { PrimaryGoalCard } from './PrimaryGoalCard'
import { PRIMARY_GOAL_SCENARIOS as S, type PrimaryGoalScenario } from './primaryGoal-fixture'

/**
 * `fill` is the canvas itself — resize the Storybook pane and everything follows.
 * The pinned widths are for comparing the same card at the sizes the wall and the
 * phone actually run at, without a frame that forces a horizontal scrollbar.
 */
const WIDTHS = ['fill', '1920', '1440', '1200', '360'] as const
type WidthChoice = (typeof WIDTHS)[number]

function frameWidth(choice: WidthChoice): number | '100%' {
  return choice === 'fill' ? '100%' : Number(choice)
}

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
    <View
      style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}
      className="gap-inline-lg"
    >
      {PRIORITIES.map((priority) => (
        <View
          key={priority}
          style={{ flexDirection: 'row', alignItems: 'center' }}
          className="gap-inline-sm"
        >
          <GoalPriorityIcon priority={priority} size={20} />
          <Typography variant="caption" color="tertiary">
            {GOAL_PRIORITY_LABEL[priority]}
          </Typography>
        </View>
      ))}
    </View>
  )
}

function Board() {
  return (
    <View className="gap-section-sm">
      {STATES.map(({ key, name }) => (
        <Cell key={key} id={key} name={name}>
          <PrimaryGoalCard {...S[key]} />
        </Cell>
      ))}
    </View>
  )
}

interface DecisionArgs {
  width: WidthChoice
}

/**
 * VW-385 unit 1 — the folded card, at whatever width the canvas is.
 *
 * One card, two zones: the meso target's summary (gap hero, the week/best/goal
 * facts line, the block's week cells) and, directly under the cells, the chart on
 * its inset plane. Each cell stands on its own week column — same x as the axis
 * label below the plot — so a cell reads as the header of that week.
 *
 * Nothing here is a fixed frame: the card is 100% of its container and the chart
 * measures its own box, so `width: fill` follows the Storybook pane. The pinned
 * widths are for judging the same card at 1920, 1440, 1200 and 360.
 *
 * The old header block is gone: the week reads off the chart's axis and the facts
 * line, committed and stretch off the chart's rules, next week off the hollow
 * marker, and the status basis off the pill's tip. Dark only (VW-397).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Primary Goal Card',
  tags: ['autodocs', 'status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: { width: { control: 'inline-radio', options: WIDTHS } },
  render: (args) => (
    <Surface
      level="base"
      style={{ minHeight: '100%', width: frameWidth(args.width), maxWidth: '100%' }}
      className="p-gutter-sm gap-section-sm"
    >
      <View className="gap-stack-sm">
        <Typography variant="h6">The folded goal card</Typography>
        <Typography variant="body2" color="secondary">
          Hover, focus or press the status pill for its basis, the priority mark for its meaning,
          and the hollow marker for next week&apos;s target.
        </Typography>
        <PriorityRow />
      </View>
      <Board />
    </Surface>
  ),
}
export default meta

type Story = StoryObj<DecisionArgs>

/** The canvas width — resize the pane and the cards follow. */
export const Responsive: Story = { args: { width: 'fill' } }

/** Pinned to the wall's 1920. */
export const Wall: Story = { args: { width: '1920' } }

/** Pinned to 1440. */
export const Laptop: Story = { args: { width: '1440' } }

/** Pinned to 1200, the width the wall chart used to be. */
export const Narrow: Story = { args: { width: '1200' } }

/** Pinned to 360: the summary stacks and the chart drops to phone density. */
export const Phone: Story = { args: { width: '360' } }
