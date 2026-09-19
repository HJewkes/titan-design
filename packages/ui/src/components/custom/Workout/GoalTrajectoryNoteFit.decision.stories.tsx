// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Surface } from '../../ui/surface'
import { GoalCard } from './GoalCard'
import type { GoalActualPoint } from './GoalTrajectoryChartGeometry'
import { calibratingScenario } from './primaryGoal-fixture'

const NOTES = {
  short: '2 more sessions',
  twoLine: '1 more comparable session and more working sets of this lift',
  long:
    'Waiting on 3 more comparable sessions, more working sets of this lift at a steady load, ' +
    'and a fresh start lift after the deload so the band has something honest to fit',
  empty: '',
} as const

type NoteKey = keyof typeof NOTES

interface NoteFitArgs {
  note: NoteKey
  /** The consumer's phone page: five readings low in the plot, the latest in week 5 of 8. */
  lateLow: boolean
}

const LATE_LOW_VALUES = [100, 101, 100, 100.5, 100]

function lateLowScenario() {
  const base = calibratingScenario('start')
  const expected = Array.from({ length: 8 }, (_, i) => ({
    weekIndex: i + 1,
    low: 100 + i * 2.5,
    high: 100 + i * 2.5,
  }))
  const actuals: GoalActualPoint[] = LATE_LOW_VALUES.map((value, i) => ({
    weekIndex: i + 1,
    value,
    isPR: false,
    matched: true,
  }))
  return {
    ...base,
    goal: {
      ...base.goal!,
      expected,
      committed: 117.5,
      stretch: 117.5,
      actuals,
      weeks: expected.map((e) => ({ index: e.weekIndex })),
      nextTarget: { weekIndex: 6, value: 112.5, label: 'next week: 112.5 x 8' },
    },
    milestone: {
      ...base.milestone!,
      target: { ...base.milestone!.target, load: 117.5 },
      weekCount: 8,
      currentWeek: 5,
      latest: { reps: 8, load: 101 },
      weeks: LATE_LOW_VALUES.map((load) => ({
        outcome: 'on_track' as const,
        reading: { reps: 8, load },
      })),
    },
  }
}

function NoteFitCard({ note, lateLow }: NoteFitArgs) {
  const scenario = lateLow ? lateLowScenario() : calibratingScenario('above')
  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
      <GoalCard {...scenario} goal={{ ...scenario.goal!, calibratingNote: NOTES[note] }} />
    </Surface>
  )
}

/**
 * Functional review C2: the calibrating note fits the chart. The consumer's note
 * wraps to two lines inside the hatched weeks, clear of the readings and the next
 * target. Where the hatch has no room for the whole block (a late reading, a
 * narrow phone), the block moves under the plot, and past two lines of that it
 * ends in an ellipsis. The screen-reader name always carries the note whole. An
 * empty note falls back to "No band yet".
 *
 * Shoot at 1920, 360 and 320.
 */
const meta: Meta<NoteFitArgs> = {
  title: 'Lab/Decisions/Calibrating Note Fit',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    note: { control: 'inline-radio', options: Object.keys(NOTES) },
    lateLow: { control: 'boolean' },
  },
  args: { note: 'short', lateLow: false },
  render: (args) => <NoteFitCard {...args} />,
}
export default meta

type Story = StoryObj<NoteFitArgs>

export const Short: Story = {}
export const TwoLine: Story = { args: { note: 'twoLine' } }
export const Long: Story = { args: { note: 'long' } }
export const Empty: Story = { args: { note: 'empty' } }
export const LateLowReading: Story = { args: { note: 'twoLine', lateLow: true } }
