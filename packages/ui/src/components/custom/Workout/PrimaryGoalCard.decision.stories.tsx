// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import { GoalPriorityIcon, GOAL_PRIORITY_LABEL, type GoalPriority } from './GoalPriorityIcon'
import { PrimaryGoalCard, type PrimaryGoalCardLayout } from './PrimaryGoalCard'
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
  width: WidthChoice
  layout: PrimaryGoalCardLayout
}

/**
 * VW-385 unit 1 — the two layouts the human chooses between, at whatever width
 * the canvas is.
 *
 * **A (`fill`)**: the chart takes the card's whole content width, capped at 340
 * high, with the milestone tile under it. **B (`fixed`)**: the chart caps at 1200
 * and the tile takes the right column, wrapping under the chart when what is left
 * is narrower than a tile.
 *
 * Nothing here is a fixed frame: the card is 100% of its container and the chart
 * measures its own box, so `width: fill` follows the Storybook pane. The pinned
 * widths are for judging the same card at 1920, 1440, 1200 and 360.
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
    width: { control: 'inline-radio', options: WIDTHS },
    layout: { control: 'inline-radio', options: ['fill', 'fixed'] },
  },
  render: (args) => (
    <Surface
      level="base"
      style={{ minHeight: '100%', width: frameWidth(args.width), maxWidth: '100%' }}
      className="p-gutter-sm gap-section-sm"
    >
      <View className="gap-stack-sm">
        <Typography variant="h6">
          {args.layout === 'fill'
            ? 'Layout A — the chart takes the card'
            : 'Layout B — the chart caps at 1200'}
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

/** Layout A at the canvas width — resize the pane and the cards follow. */
export const LayoutA: Story = { args: { width: 'fill', layout: 'fill' } }

/** Layout B at the canvas width. */
export const LayoutB: Story = { args: { width: 'fill', layout: 'fixed' } }

/** Layout A pinned to the wall's 1920. */
export const LayoutAWall: Story = { args: { width: '1920', layout: 'fill' } }

/** Layout B pinned to the wall's 1920: 1200 of chart, the tile in what is left. */
export const LayoutBWall: Story = { args: { width: '1920', layout: 'fixed' } }

/** Layout A at 360. */
export const LayoutAPhone: Story = { args: { width: '360', layout: 'fill' } }

/** Layout B at 360, where the cap has nothing left to give the tile a column. */
export const LayoutBPhone: Story = { args: { width: '360', layout: 'fixed' } }
