import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { primitiveRamps } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { SessionRail, type SessionRailExercise } from './SessionRail'

const t = getSemanticColors('dark')

/**
 * `SessionRail` (shell organism) — the live-workout exercise list: a flat raised
 * `SessionHeader` glance (title, stat tiles, chunked pace bar) over a sunk, inset list
 * of ExerciseCard rail headings. The header plan (chunk widths ∝ sets) is derived from
 * `exercises`. Surfaces bind to the charcoal ramp; the list depth is a subtle neumorphic
 * inset. Driven entirely by props.
 */
const meta: Meta<typeof SessionRail> = {
  title: 'Shell/SessionRail',
  component: SessionRail,
  tags: ['autodocs'],
  argTypes: {
    stripHeight: { control: { type: 'range', min: 2, max: 16, step: 1 } },
    onExercisePress: { action: 'exercise-press' },
  },
  decorators: [
    (Story) => (
      <View className="min-h-screen flex-row" style={{ backgroundColor: t['background-base'] }}>
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
          '**Organism** (shell S3). The live-workout exercise list: raised header glance over ' +
          'a sunk inset list, subtle neumorphic depth (charcoal ramp + `neumorphicShadows`). ' +
          'Composes ' +
          '[SessionHeader](?path=/docs/shell-sessionrail-sessionheader--docs) + ' +
          '[ExerciseCardHeading](?path=/docs/workout-exercisecardheading--docs) × N. ' +
          'Sits beside [SideNav](?path=/docs/shell-sidenav--docs) in the dashboard shell.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof SessionRail>

const AMBER = primitiveRamps.amber[300]

const decay = (n: number, start: number, span = 0.4): number[] =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

const SESSION: SessionRailExercise[] = [
  {
    name: 'Seated Cable Row',
    summary: { sets: 5, reps: 8, weight: 145, unit: 'lbs' },
    tempo: [3, 1, 2, 0],
    indicator: 'pr',
    setStates: [1.0, 0.9, 0.8, 0.7, 0.6].map((s) => ({ status: 'done', velocities: decay(8, s) })),
  },
  {
    name: 'Incline DB Press',
    summary: { sets: 3, reps: 8, weight: 70, unit: 'lbs' },
    tempo: [3, 0, 3, 0],
    setStates: [0.72, 0.62, 0.54].map((s) => ({ status: 'done', velocities: decay(8, s) })),
  },
  {
    name: 'Cable Chest Press',
    summary: { sets: 3, reps: 10, weight: 90, unit: 'lbs' },
    tempo: [2, 1, 2, 0],
    indicator: 'info',
    setStates: [
      { status: 'done', velocities: decay(10, 0.72) },
      { status: 'active', velocities: decay(5, 0.62), planned: 10 },
      { status: 'todo', planned: 10 },
    ],
  },
  {
    name: 'Standing Calf Raise',
    summary: { sets: 5, reps: 20, weight: 25, unit: 'lbs' },
    tempo: [2, 1, 2, 0],
    upcoming: true,
    setStates: [1, 2, 3, 4, 5].map(() => ({ status: 'todo', planned: 20 })),
  },
  {
    name: 'Face Pull',
    summary: { sets: 3, reps: '15-20', weight: 40, unit: 'lbs' },
    tempo: [2, 1, 2, 0],
    upcoming: true,
    setStates: [1, 2, 3].map(() => ({ status: 'todo', planned: 18 })),
  },
]

const LIVE_METRICS = [
  { label: 'Volume', value: '76%' },
  { label: 'Load', value: '7.3k' },
  { label: 'Fatigue', value: 'MOD', valueColor: AMBER },
]

const baseArgs = {
  title: 'Pull A · Intensification',
  exercises: SESSION,
  stripHeight: 8,
}

export const Default: Story = {
  args: {
    ...baseArgs,
    setsDone: 7.2,
    elapsedMs: (42 * 60 + 18) * 1000,
    budgetMs: 60 * 60 * 1000,
    metrics: LIVE_METRICS,
  },
  parameters: {
    docs: {
      description: {
        story: 'Live, behind pace — the header carries the session glance over the exercise list.',
      },
    },
  },
}

export const NoTimeTarget: Story = {
  args: {
    ...baseArgs,
    setsDone: 7.2,
    elapsedMs: (42 * 60 + 18) * 1000,
    metrics: LIVE_METRICS,
  },
  parameters: {
    docs: {
      description: { story: 'Live with no time budget — plain (steel) progress, ⏱ elapsed only.' },
    },
  },
}

export const Upcoming: Story = {
  args: {
    ...baseArgs,
    title: 'Lower B · Volume',
    budgetMs: 52 * 60 * 1000,
    next: Date.now() + 2 * 24 * 60 * 60 * 1000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Upcoming session — the header shows Date / Time / Until + the empty plan bar.',
      },
    },
  },
}
