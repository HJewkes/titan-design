// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Card } from '../../ui/card'
import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import { GoalMilestoneTile } from './GoalMilestoneTile'
import type { GoalWeekOutcomeStyle } from './GoalMilestoneWeekStrip'
import { GOAL_MILESTONE_SCENARIOS as S, type GoalMilestoneScenario } from './goalMilestone-fixture'

type Frame = 'wall' | 'phone'

const STATES: { key: GoalMilestoneScenario; name: string }[] = [
  { key: 'onTrack', name: 'Upcoming, on track' },
  { key: 'behind', name: 'Upcoming, behind' },
  { key: 'ahead', name: 'Upcoming, ahead' },
  { key: 'hit', name: 'Hit' },
  { key: 'missed', name: 'Missed' },
]

const TREATMENT: Record<GoalWeekOutcomeStyle, string> = {
  cells:
    'Past weeks paint the cell: filled on track, brand-filled ahead, hollow muted missed, faint empty for no data.',
  dots: 'Past cells stay neutral; a dot under each carries the verdict (hollow when missed, none for no data).',
}

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

/** The compact tile as it sits in a per-lift card. */
function CompactInCard({ style }: { style: GoalWeekOutcomeStyle }) {
  return (
    <Card elevation={1}>
      <View className="p-inset-md gap-stack-sm">
        <Typography variant="overline" color="tertiary">
          BENCH PRESS
        </Typography>
        <GoalMilestoneTile {...S.onTrack} outcomeStyle={style} layout="compact" />
      </View>
    </Card>
  )
}

function Board({ frame, style }: { frame: Frame; style: GoalWeekOutcomeStyle }) {
  const width = frame === 'wall' ? '48%' : '100%'
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }} className="gap-section-sm">
      {STATES.map(({ key, name }) => (
        <View key={key} style={{ width }}>
          <Cell id={key} name={name}>
            <GoalMilestoneTile {...S[key]} outcomeStyle={style} />
          </Cell>
        </View>
      ))}
      <View style={{ width }}>
        <Cell id="compact" name="Compact, in a per-lift card">
          <CompactInCard style={style} />
        </Cell>
      </View>
    </View>
  )
}

function Backdrop({ frame, style }: { frame: Frame; style: GoalWeekOutcomeStyle }) {
  return (
    <Surface
      level="base"
      style={{ minHeight: '100%', width: frame === 'wall' ? 1200 : 360 }}
      className="p-gutter-sm gap-section-sm"
    >
      <View className="gap-stack-sm">
        <Typography variant="h6">{`Past weeks: ${style}`}</Typography>
        <Typography variant="body2" color="secondary">
          {TREATMENT[style]}
        </Typography>
      </View>
      <Board frame={frame} style={style} />
    </Surface>
  )
}

interface DecisionArgs {
  frame: Frame
  outcomeStyle: GoalWeekOutcomeStyle
}

/**
 * VW-385 unit 3, round 2. The human picked one tile: gap-led, with a progress
 * bar and a thin week strip, framed as the MESO target. The open question is
 * how past weeks show their verdict: `cells` or `dots`. Dark only (VW-397).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Goal Milestone Tiles',
  tags: ['autodocs', 'status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    frame: { control: 'inline-radio', options: ['wall', 'phone'] },
    outcomeStyle: { control: 'inline-radio', options: ['cells', 'dots'] },
  },
  render: (args) => <Backdrop frame={args.frame} style={args.outcomeStyle} />,
}
export default meta

type Story = StoryObj<DecisionArgs>

export const WallCells: Story = { args: { frame: 'wall', outcomeStyle: 'cells' } }
export const WallDots: Story = { args: { frame: 'wall', outcomeStyle: 'dots' } }
export const PhoneCells: Story = { args: { frame: 'phone', outcomeStyle: 'cells' } }
export const PhoneDots: Story = { args: { frame: 'phone', outcomeStyle: 'dots' } }
