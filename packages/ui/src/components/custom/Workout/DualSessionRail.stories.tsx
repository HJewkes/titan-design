import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { DualSessionRail, type DualSessionRailSlot } from './DualSessionRail'

/**
 * `DualSessionRail` (shell composition) — two {@link SessionRail} columns side by
 * side, one per Voltra device slot, for a dual-Voltra bench session (e.g. "Left
 * Arm" / "Right Arm"). Each column keeps its own exercise list, set progress and
 * stat tiles; only the session clock is shared. A thin composition — no new
 * set-marker vocabulary.
 */
const meta: Meta<typeof DualSessionRail> = {
  title: 'Shell/SessionRail/DualSessionRail',
  component: DualSessionRail,
  tags: ['autodocs'],
  argTypes: {
    stripHeight: { control: { type: 'range', min: 2, max: 16, step: 1 } },
    onExercisePress: { action: 'exercise-press' },
  },
  decorators: [
    (Story) => (
      <View className="min-h-screen flex-row" style={{ backgroundColor: '#101010' }}>
        <Story />
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: '#6B7280', fontSize: 12 }}>main viewport</Text>
        </View>
      </View>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Composition** (shell S3, dual-device). Two independent ' +
          '[SessionRail](?path=/docs/shell-sessionrail--docs) columns, one per device slot, ' +
          'separated by a hairline divider. Both share the session clock (`elapsedMs` / ' +
          '`budgetMs` / `running` / `next`); everything else — exercises, `setsDone`, ' +
          '`metrics` — is per-slot, since two Voltra devices progress independently.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DualSessionRail>

const decay = (n: number, start: number, span = 0.4): number[] =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

// LEFT ARM — ahead on the shared curl, mid-drop-set on the accessory move.
// Exercises the flat done/active/todo trio + the `drop` set-type marker.
const LEFT_SLOT: DualSessionRailSlot = {
  label: 'Left Arm',
  setsDone: 2.4,
  metrics: [
    { label: 'Volume', value: '54%' },
    { label: 'Load', value: '3.1k' },
    { label: 'Fatigue', value: 'MOD' },
  ],
  exercises: [
    {
      name: 'Standing Cable Curl',
      summary: { sets: 4, reps: 10, weight: 35, unit: 'lbs' },
      tempo: [2, 1, 2, 0],
      indicator: 'pr',
      setStates: [
        { status: 'done', velocities: decay(10, 0.95) },
        { status: 'done', velocities: decay(10, 0.85) },
        { status: 'active', velocities: decay(5, 0.7), planned: 10 },
        { status: 'todo', planned: 10 },
      ],
    },
    {
      name: 'Hammer Curl',
      summary: { sets: 3, reps: 8, weight: 30, unit: 'lbs' },
      tempo: [2, 0, 2, 0],
      upcoming: true,
      setStates: [
        { status: 'drop', subloads: [decay(8, 0.8), decay(6, 0.65), decay(5, 0.55)] },
        { status: 'todo', planned: 8 },
        { status: 'todo', planned: 8 },
      ],
    },
  ],
}

// RIGHT ARM — behind pace (velocity-loss flagged), already through a completed
// myo-rep set, next up is a variable rep-range with a myo-upcoming trail.
// Exercises the `myo`, `range`, and `myo-upcoming` set-type markers.
const RIGHT_SLOT: DualSessionRailSlot = {
  label: 'Right Arm',
  setsDone: 1.4,
  metrics: [
    { label: 'Volume', value: '38%' },
    { label: 'Load', value: '2.0k' },
    { label: 'Fatigue', value: 'LOW' },
  ],
  exercises: [
    {
      name: 'Standing Cable Curl',
      summary: { sets: 4, reps: 10, weight: 35, unit: 'lbs' },
      tempo: [2, 1, 2, 0],
      indicator: 'velocity-loss',
      setStates: [
        { status: 'done', velocities: decay(10, 0.78) },
        { status: 'active', velocities: decay(4, 0.55), planned: 10 },
        { status: 'todo', planned: 10 },
        { status: 'todo', planned: 10 },
      ],
    },
    {
      name: 'Preacher Curl',
      summary: { sets: 1, reps: 15, weight: 25, unit: 'lbs' },
      tempo: [2, 0, 2, 0],
      setStates: [
        { status: 'myo', activation: decay(15, 0.75), clusters: [decay(5, 0.6), decay(5, 0.5)] },
      ],
    },
    {
      name: 'Bayesian Curl',
      summary: { sets: 3, reps: '15-20', weight: 20, unit: 'lbs' },
      tempo: [2, 1, 2, 0],
      upcoming: true,
      setStates: [
        { status: 'range', floor: 15, max: 20, doneVels: [] },
        { status: 'todo', planned: 18 },
        { status: 'myo-upcoming', activationLen: 12 },
      ],
    },
  ],
}

export const Default: Story = {
  args: {
    slots: [LEFT_SLOT, RIGHT_SLOT],
    elapsedMs: (18 * 60 + 42) * 1000,
    budgetMs: 45 * 60 * 1000,
    stripHeight: 8,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A realistic dual-Voltra bench session — Left Arm ahead on the shared curl and mid ' +
          'drop-set on the accessory move; Right Arm behind pace (velocity-loss flagged), past ' +
          'a completed myo-rep set, next up a variable rep-range with a myo-upcoming trail. ' +
          'Both columns share one session clock but progress independently.',
      },
    },
  },
}

export const Upcoming: Story = {
  args: {
    slots: [
      { ...LEFT_SLOT, setsDone: 0, metrics: undefined },
      { ...RIGHT_SLOT, setsDone: 0, metrics: undefined },
    ],
    budgetMs: 45 * 60 * 1000,
    next: Date.now() + 2 * 24 * 60 * 60 * 1000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Upcoming dual session — both columns show the Date/Time/Until glance.',
      },
    },
  },
}
