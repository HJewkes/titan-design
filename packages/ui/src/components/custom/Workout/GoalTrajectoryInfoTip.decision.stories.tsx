// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Surface } from '../../ui/surface'
import { GoalCard } from './GoalCard'
import type { GoalActualPoint } from './GoalTrajectoryChartGeometry'
import { CALIBRATING_TIP_LABEL } from './GoalTrajectoryCalibrating'
import { PRIMARY_GOAL_SCENARIOS, calibratingScenario } from './primaryGoal-fixture'

const NOTES = {
  short: '2 more sessions',
  long:
    'Waiting on 3 more comparable sessions, more working sets of this lift at a steady load, ' +
    'and a fresh start lift after the deload so the band has something honest to fit.',
  empty: '',
} as const

type NoteKey = keyof typeof NOTES

type Scene = 'early' | 'lateLow' | 'lastWeekLow' | 'onTrack'

interface InfoTipArgs {
  note: NoteKey
  /**
   * `early`: a week-2 reading. `lateLow`: the consumer's phone page, five readings low in the
   * plot, the latest in week 5 of 8. `lastWeekLow`: low readings through week 8, the one case
   * that moves the target under the plot. `onTrack`: not calibrating, so no target at all.
   */
  scene: Scene
  /** Open the tip (the story focuses the target, as a keyboard user would). */
  open: boolean
}

const LATE_LOW_VALUES = [100, 101, 100, 100.5, 100]
const LAST_WEEK_LOW_VALUES = [96, 95, 95.5, 95, 95, 95.5, 95, 95]

function lowScenario(values: number[]) {
  const base = calibratingScenario('start')
  const expected = Array.from({ length: 8 }, (_, i) => ({
    weekIndex: i + 1,
    low: 100 + i * 2.5,
    high: 100 + i * 2.5,
  }))
  const actuals: GoalActualPoint[] = values.map((value, i) => ({
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
      nextTarget:
        values.length < 8
          ? {
              weekIndex: values.length + 1,
              value: expected[values.length].low,
              label: `next week: ${String(expected[values.length].low)} x 8`,
            }
          : undefined,
    },
    milestone: {
      ...base.milestone!,
      target: { ...base.milestone!.target, load: 117.5 },
      weekCount: 8,
      currentWeek: values.length,
      latest: { reps: 8, load: Math.max(...values) },
      weeks: values.map((load) => ({
        outcome: 'on_track' as const,
        reading: { reps: 8, load },
      })),
    },
  }
}

function sceneOf(scene: Scene) {
  if (scene === 'lateLow') return lowScenario(LATE_LOW_VALUES)
  if (scene === 'lastWeekLow') return lowScenario(LAST_WEEK_LOW_VALUES)
  if (scene === 'onTrack') return PRIMARY_GOAL_SCENARIOS.onTrack
  return calibratingScenario('above')
}

function InfoTipCard({ note, scene }: InfoTipArgs) {
  const scenario = sceneOf(scene)
  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
      <GoalCard {...scenario} goal={{ ...scenario.goal!, calibratingNote: NOTES[note] }} />
    </Surface>
  )
}

/**
 * titan-0201 round 2 (human, round 1: "Lets move to a info hover tip target in the lower
 * right corner of the chart that we can then put whatever text we need into it"). The
 * reason there is no band is no longer written on the plane: an info target sits in the
 * plot's lower-right corner, inside the hatch, and its tip carries the consumer's note
 * then the two explanation lines. It opens on hover, keyboard focus and press, and closes
 * on blur, Escape and a press outside. The hit area is 24px, 44px under a touch pointer.
 * When low readings run to the last week and fill that corner, the target hangs just under
 * the plot. Non-calibrating charts have no target.
 *
 * Shoot at 1920, 360 and 320, closed and open.
 */
const meta: Meta<InfoTipArgs> = {
  title: 'Lab/Decisions/Calibrating Info Tip',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    note: { control: 'inline-radio', options: Object.keys(NOTES) },
    scene: { control: 'inline-radio', options: ['early', 'lateLow', 'lastWeekLow', 'onTrack'] },
    open: { control: 'boolean' },
  },
  args: { note: 'short', scene: 'early', open: false },
  render: (args) => <InfoTipCard {...args} />,
  play: async ({ args, canvasElement }) => {
    if (!args.open) return
    // The card draws its chart only once it has measured itself, so wait for the target.
    const selector = `[aria-label="${CALIBRATING_TIP_LABEL}"]`
    for (let tries = 0; tries < 50; tries++) {
      const target = canvasElement.querySelector<HTMLElement>(selector)
      if (target) return target.focus()
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  },
}
export default meta

type Story = StoryObj<InfoTipArgs>

export const ShortClosed: Story = {}
export const ShortOpen: Story = { args: { open: true } }
export const LongClosed: Story = { args: { note: 'long' } }
export const LongOpen: Story = { args: { note: 'long', open: true } }
export const LateLowClosed: Story = { args: { note: 'long', scene: 'lateLow' } }
export const LateLowOpen: Story = { args: { note: 'long', scene: 'lateLow', open: true } }
export const LastWeekLowOpen: Story = { args: { scene: 'lastWeekLow', open: true } }
export const EmptyOpen: Story = { args: { note: 'empty', open: true } }
export const NotCalibrating: Story = { args: { scene: 'onTrack' } }
