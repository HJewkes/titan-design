// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import { GoalCard } from './GoalCard'
import type { CalibratingTreatment, CalibrationProgress } from './GoalTrajectoryCalibrating'
import type { CalibratingPlacement } from './goalTrajectoryCalibratingFixture'
import { calibratingScenario } from './primaryGoal-fixture'

const PLACEMENTS: { key: CalibratingPlacement; name: string }[] = [
  { key: 'above', name: 'Week-2 reading ABOVE the ramp (110 against 102.5)' },
  { key: 'on', name: 'Week-2 reading ON the ramp (102.5)' },
  { key: 'below', name: 'Week-2 reading BELOW the ramp (97.5 against 102.5)' },
]

/** Placeholder: the read model states the shortfall only in its basis prose today. */
const PROGRESS: CalibrationProgress = { sessions: 2, needed: 3 }

interface DecisionArgs {
  treatment: CalibratingTreatment
}

function CalibratingCards({ treatment }: DecisionArgs) {
  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm gap-section-sm">
      {PLACEMENTS.map(({ key, name }) => {
        const scenario = calibratingScenario(key)
        return (
          <View key={key} testID={`placement-${key}`} className="gap-stack-sm">
            <Typography variant="caption" color="tertiary">
              {name}
            </Typography>
            <GoalCard
              {...scenario}
              goal={{
                ...scenario.goal!,
                calibratingTreatment: treatment,
                calibration: PROGRESS,
              }}
            />
          </View>
        )
      })}
    </Surface>
  )
}

/**
 * VW-433 review round 1: how a calibrating goal's chart reads. OPEN, a menu.
 *
 * A calibrating lift has too little history for its own band, so the planned ramp
 * stands in. Each story is one treatment, drawn in the real full-size `GoalCard`
 * for the three places the week-2 reading can land against the ramp. Every
 * fixture is on the calendar-week grid (VW-421): the start lift is week 1, where
 * the ramp starts. `v0` is what ships today.
 *
 * Once the human picks, the unchosen treatments are deleted and recorded in
 * `REJECTED.md`, and this file becomes the record of the pick.
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Calibrating Goal Chart',
  tags: ['autodocs', 'status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    treatment: {
      control: 'inline-radio',
      options: ['v0', 'plain', 'labelled', 'caption', 'annotated'],
    },
  },
  render: (args) => <CalibratingCards {...args} />,
}
export default meta

type Story = StoryObj<DecisionArgs>

/** v0, today: PR star on the reading, dashed run to the next target, solid ramp. */
export const Today: Story = { name: 'v0 — today', args: { treatment: 'v0' } }

/** A: remove what confuses. Plain dots, no next-target run or marker, nothing added. */
export const Plain: Story = { name: 'A — plain', args: { treatment: 'plain' } }

/** B: every mark labelled on the plane. Ghost ramp with words, a flat "next week" rule. */
export const Labelled: Story = { name: 'B — labelled marks', args: { treatment: 'labelled' } }

/** C: the plot as A, with a sentence under it saying what each mark is. */
export const Caption: Story = { name: 'C — caption', args: { treatment: 'caption' } }

/** D: the weeks still to come hatched, with the reason there is no band written in them. */
export const Annotated: Story = {
  name: 'D — annotated empty weeks',
  args: { treatment: 'annotated' },
}
