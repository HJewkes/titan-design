// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import { GoalCard } from './GoalCard'
import type { CalibratingPlacement } from './goalTrajectoryCalibratingFixture'
import { calibratingScenario } from './primaryGoal-fixture'

const PLACEMENTS: { key: CalibratingPlacement; name: string }[] = [
  { key: 'start', name: 'Only the start lift on record: one dot on the ramp start' },
  { key: 'above', name: 'Week-2 reading ABOVE the ramp (110 against 102.5)' },
  { key: 'on', name: 'Week-2 reading ON the ramp (102.5)' },
  { key: 'below', name: 'Week-2 reading BELOW the ramp (97.5 against 102.5)' },
]

interface DecisionArgs {
  showRampLabel: boolean
}

function CalibratingCards({ showRampLabel }: DecisionArgs) {
  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm gap-section-sm">
      {PLACEMENTS.map(({ key, name }) => {
        const scenario = calibratingScenario(key)
        return (
          <View key={key} testID={`placement-${key}`} className="gap-stack-sm">
            <Typography variant="caption" color="tertiary">
              {name}
            </Typography>
            <GoalCard {...scenario} goal={{ ...scenario.goal!, showRampLabel }} />
          </View>
        )
      })}
    </Surface>
  )
}

/**
 * VW-433, CHOSEN in round 1: **D with B's dashed ramp**. A calibrating lift has
 * too little history for its own band, so the planned ramp stands in, drawn
 * dashed. The weeks after the latest reading are hatched, with the reason there
 * is no band written in their lower-right corner. Readings are plain dots, and
 * the next target is a hollow dot with no dashed run.
 *
 * Not chosen and deleted (see `REJECTED.md`): today's rendering (PR star and a
 * dashed run to the next target), A plain, B labelled marks and C caption.
 *
 * Still open in round 2: whether the ramp also carries a "Planned ramp" label.
 * Every card is the real full-size `GoalCard` on the calendar-week grid (VW-421).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Calibrating Goal Chart',
  tags: ['autodocs', 'status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: { showRampLabel: { control: 'boolean' } },
  render: (args) => <CalibratingCards {...args} />,
}
export default meta

type Story = StoryObj<DecisionArgs>

/** The dashed ramp with no label: the note in the hatched weeks names it. */
export const RampUnlabelled: Story = {
  name: 'Dashed ramp, no label',
  args: { showRampLabel: false },
}

/** The same, with "Planned ramp" written under the ramp. */
export const RampLabelled: Story = {
  name: 'Dashed ramp, labelled',
  args: { showRampLabel: true },
}
