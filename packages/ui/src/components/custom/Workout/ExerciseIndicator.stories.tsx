import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  ExerciseIndicator,
  resolveIndicator,
  INDICATOR_PRECEDENCE,
  type ExerciseIndicatorKind,
} from './ExerciseIndicator'

/**
 * `ExerciseIndicator` — a small circular OUTLINED chip in an exercise heading's
 * title line. The LOCKED taxonomy is 6 precedence-ranked kinds across four tier
 * colors (danger/warning/success/info): glyph = the specific signal, color = the
 * severity tier. Only one chip is ever shown per exercise — {@link resolveIndicator}
 * picks the highest-precedence active signal.
 */
const meta: Meta<typeof ExerciseIndicator> = {
  title: 'Workout/ExerciseIndicator',
  component: ExerciseIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** A small circular outlined chip in an exercise heading title line. Six ' +
          'precedence-ranked kinds (imbalance › overshoot › velocity-loss › missed-reps › pr › ' +
          'info) over four status-token tier colors; glyph = signal, color = severity tier. ' +
          '`resolveIndicator()` selects the single chip to show. Used-by ↑ ' +
          '[ExerciseHeading](?path=/docs/workout-exerciseheading--docs).',
      },
    },
  },
  argTypes: {
    kind: { control: 'select', options: [...INDICATOR_PRECEDENCE] },
    onPress: { action: 'press' },
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 24, backgroundColor: '#131313' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ExerciseIndicator>

export const Imbalance: Story = { args: { kind: 'imbalance' } }
export const Overshoot: Story = { args: { kind: 'overshoot' } }
export const VelocityLoss: Story = { args: { kind: 'velocity-loss' } }
export const MissedReps: Story = { args: { kind: 'missed-reps' } }
export const PersonalRecord: Story = { args: { kind: 'pr' } }
export const Info: Story = { args: { kind: 'info' } }

const KIND_LABELS: Record<ExerciseIndicatorKind, string> = {
  imbalance: 'imbalance · danger',
  overshoot: 'overshoot · danger',
  'velocity-loss': 'velocity-loss · warning',
  'missed-reps': 'missed-reps · warning',
  pr: 'pr · success',
  info: 'info · info',
}

/** All six kinds in precedence order (1=highest → 6=lowest). */
export const AllKinds: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      {INDICATOR_PRECEDENCE.map((kind, i) => (
        <View key={kind} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: '#8A8A8A', fontSize: 11, width: 14 }}>{i + 1}</Text>
          <ExerciseIndicator kind={kind} />
          <Text style={{ color: '#CFCFCF', fontSize: 12 }}>{KIND_LABELS[kind]}</Text>
        </View>
      ))}
    </View>
  ),
}

/**
 * `resolveIndicator` demo — each row is a set of active signals; the resolver
 * collapses them to the single highest-precedence chip actually shown.
 */
export const ResolvePrecedence: Story = {
  render: () => {
    const scenarios: ExerciseIndicatorKind[][] = [
      ['info', 'pr'],
      ['pr', 'missed-reps'],
      ['velocity-loss', 'overshoot', 'info'],
      ['missed-reps', 'imbalance', 'pr'],
    ]
    return (
      <View style={{ gap: 12 }}>
        {scenarios.map((candidates, i) => {
          const winner = resolveIndicator(candidates)
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ color: '#8A8A8A', fontSize: 12, width: 200 }}>
                {candidates.join(', ')}
              </Text>
              <Text style={{ color: '#8A8A8A', fontSize: 12 }}>→</Text>
              {winner ? <ExerciseIndicator kind={winner} /> : null}
              <Text style={{ color: '#CFCFCF', fontSize: 12 }}>{winner}</Text>
            </View>
          )
        })}
      </View>
    )
  },
}
