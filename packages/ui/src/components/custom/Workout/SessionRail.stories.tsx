import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { SessionRail, type SessionRailExercise } from './SessionRail'

/**
 * `SessionRail` (shell organism) — the live-workout exercise list: a flat raised
 * heading plane over a sunk, inset list of ExerciseCard rail headings, with a
 * `footer` slot for the (separately built) session-pace tile. Surfaces bind to the
 * charcoal ramp; the list depth is a subtle neumorphic inset. Driven entirely by props.
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
          '**Organism** (shell S3). The live-workout exercise list: raised heading plane over ' +
          'a sunk inset list, subtle neumorphic depth (charcoal ramp + `neumorphicShadows`), ' +
          '`footer` slot for the session-pace tile. Composes ' +
          '[ExerciseCardHeading](?path=/docs/shell-sessionrail-exercisecardheading--docs) × N + ' +
          'StatusDot. Sits beside [SideNav](?path=/docs/shell-sidenav--docs) in the dashboard shell.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof SessionRail>

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

const baseArgs = {
  title: 'Pull A · Intensification',
  status: 'ex 3/5 · set 2 live',
  exercises: SESSION,
  stripHeight: 8,
}

/** A stand-in for the (separately built) session-pace tile that mounts in the footer slot. */
function PaceFooterStub() {
  return (
    <View style={{ backgroundColor: '#1F1F1F', padding: 12 }}>
      <Text style={{ color: '#9CA3AF', fontSize: 10, fontFamily: 'monospace' }}>
        SessionPace tile (footer slot)
      </Text>
    </View>
  )
}

export const Default: Story = {
  args: { ...baseArgs, footer: <PaceFooterStub /> },
}

export const NoFooter: Story = {
  args: baseArgs,
}

export const Idle: Story = {
  args: {
    title: 'Pull A · Intensification',
    live: false,
    eyebrow: 'Session ended',
    exercises: SESSION.map((ex) => ({
      ...ex,
      upcoming: false,
      setStates: ex.setStates.map((s) =>
        s.status === 'active' ? { status: 'done', velocities: s.velocities } : s
      ),
    })),
    stripHeight: 8,
  },
  parameters: {
    docs: { description: { story: 'Ended session — no live dot, no active pulse.' } },
  },
}
