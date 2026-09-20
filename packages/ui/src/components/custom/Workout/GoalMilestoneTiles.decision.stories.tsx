// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Card } from '../../ui/card'
import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { GoalMilestoneTile } from './GoalMilestoneTile'
import { GOAL_MILESTONE_SCENARIOS as S, type GoalMilestoneScenario } from './goalMilestone-fixture'

type Frame = 'wall' | 'phone'

const STATES: { key: GoalMilestoneScenario; name: string }[] = [
  { key: 'onTrack', name: 'Upcoming, on track' },
  { key: 'behind', name: 'Upcoming, behind' },
  { key: 'ahead', name: 'Upcoming, ahead' },
  { key: 'hit', name: 'Hit, beyond the goal' },
  { key: 'hitExact', name: 'Hit, exactly the goal' },
  { key: 'missed', name: 'Missed' },
]

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

function Heading({ title, note }: { title: string; note: string }) {
  return (
    <View className="gap-stack-sm">
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="secondary">
        {note}
      </Typography>
    </View>
  )
}

/** The compact tile as it sits in a per-lift card. */
function CompactInCard() {
  return (
    <Card elevation={1}>
      <View className="p-inset-md gap-stack-sm">
        <Typography variant="overline" color="tertiary">
          BENCH PRESS
        </Typography>
        <GoalMilestoneTile {...S.onTrack} layout="compact" />
      </View>
    </Card>
  )
}

function Board({ frame }: { frame: Frame }) {
  const width = frame === 'wall' ? '48%' : '100%'
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }} className="gap-section-sm">
      {STATES.map(({ key, name }) => (
        <View key={key} style={{ width }}>
          <Cell id={key} name={name}>
            <GoalMilestoneTile {...S[key]} />
          </Cell>
        </View>
      ))}
      <View style={{ width }}>
        <Cell id="compact" name="Compact, in a per-lift card">
          <CompactInCard />
        </Cell>
      </View>
    </View>
  )
}

interface DecisionArgs {
  frame: Frame
}

/**
 * VW-385 unit 3, round 4 — the locked shape. The gap leads with the week count
 * under it; best and goal sit on its line as Metric cells, wrapping beneath on
 * a phone. The block's weeks are cells with a stacked tip card each, the current
 * week taller and ringed, and the last week carries no goal colour. `ahead` is
 * `status-info` blue for the chart and the tile. Dark only (VW-397).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Goal Milestone Tiles',
  tags: ['autodocs', 'status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: { frame: { control: 'inline-radio', options: ['wall', 'phone'] } },
  render: (args) => (
    <Surface
      level="base"
      style={{ minHeight: '100%', width: args.frame === 'wall' ? 1200 : 360 }}
      className="p-gutter-sm gap-section-sm"
    >
      <Heading
        title="Meso target tile"
        note="Hover, focus or press a week cell for its tip card: week number, that week's set, and the verdict."
      />
      <Board frame={args.frame} />
    </Surface>
  ),
}
export default meta

type Story = StoryObj<DecisionArgs>

export const Wall: Story = { args: { frame: 'wall' } }
export const Phone: Story = { args: { frame: 'phone' } }
