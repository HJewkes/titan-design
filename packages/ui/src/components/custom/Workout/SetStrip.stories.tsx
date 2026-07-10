import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { SetStrip, type SetStripSet } from './SetStrip'

/**
 * `SetStrip` — the per-set segmented performance strip. One continuous bar per
 * set (rep intensities as butted color segments, no rep gaps); sets separated by
 * a fixed gap. Colors are the real titan ramp pins (red-600 · orange-400 ·
 * amber-300 · green-300).
 */
const meta: Meta<typeof SetStrip> = {
  title: 'Workout/SetStrip',
  component: SetStrip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** The per-set segmented performance strip — one bar per set, rep ' +
          'intensities as butted ramp-pin segments (no rep gaps), active set pulses. Composes ' +
          '[SetBar](?path=/docs/workout-setbar--docs) × N. ' +
          'Used-by ↑ [ExerciseCardHeading](?path=/docs/workout-exercisecardheading--docs).',
      },
    },
  },
  argTypes: {
    height: { control: { type: 'range', min: 2, max: 16, step: 1 } },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 210, padding: 16, backgroundColor: '#131313' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SetStrip>

const decay = (n: number, start: number, span = 0.4): number[] =>
  Array.from({ length: n }, (_, r) => +(start - (span * r) / Math.max(1, n - 1)).toFixed(3))

export const Completed: Story = {
  args: {
    height: 8,
    sets: [1.0, 0.9, 0.8, 0.7, 0.6].map(
      (s): SetStripSet => ({ status: 'done', velocities: decay(8, s) })
    ),
  },
}

export const InProgress: Story = {
  args: {
    height: 8,
    sets: [
      { status: 'done', velocities: decay(10, 0.72) },
      { status: 'active', velocities: decay(5, 0.62), planned: 10 },
      { status: 'todo', planned: 10 },
    ],
  },
  parameters: {
    docs: { description: { story: 'Active set: performed reps pulse; the remainder is greyed.' } },
  },
}

export const Upcoming: Story = {
  args: {
    height: 8,
    sets: [1, 2, 3, 4, 5].map((): SetStripSet => ({ status: 'todo', planned: 20 })),
  },
}

export const ShortStrip: Story = {
  args: { ...Completed.args, height: 4 },
  parameters: {
    docs: { description: { story: 'The 4px height alternative (default is 8px).' } },
  },
}

// ---- set-type variant sheet: every variant at the real rail width, for eyeballing
function SheetRow({ label, meta, sets }: { label: string; meta: string; sets: SetStripSet[] }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text style={{ color: '#F3F4F6', fontSize: 13, fontWeight: '800' }}>{label}</Text>
        <Text style={{ color: '#6B7280', fontSize: 10, fontFamily: 'monospace' }}>{meta}</Text>
      </View>
      <SetStrip sets={sets} />
    </View>
  )
}

/**
 * Every set-type variant at the real 232px rail width, alongside the flat sets — so the
 * operator can eyeball the gap hierarchy (butted reps < 2px notch < 3px cluster < 5px set gap)
 * and the shared cyan "variable / unknown / opportunity" pin across range + myo-upcoming.
 */
export const SetTypes: Story = {
  render: () => (
    <View style={{ width: 232, gap: 18 }}>
      <SheetRow
        label="Flat sets"
        meta="5 × 8 — done + active + todo"
        sets={[
          { status: 'done', velocities: decay(8, 0.9) },
          { status: 'active', velocities: decay(5, 0.62), planned: 8 },
          { status: 'todo', planned: 8 },
        ]}
      />
      <SheetRow
        label="Variable range"
        meta="3 × 15–20 — todo · 12 · 17"
        sets={[
          { status: 'range', floor: 15, max: 20, doneVels: [] },
          { status: 'range', floor: 15, max: 20, doneVels: decay(12, 0.9) },
          { status: 'range', floor: 15, max: 20, doneVels: decay(17, 0.8) },
        ]}
      />
      <SheetRow
        label="Drop set"
        meta="1 drop — 10→8→6"
        sets={[{ status: 'drop', subloads: [decay(10, 0.85), decay(8, 0.7), decay(6, 0.6)] }]}
      />
      <SheetRow
        label="Myo-rep"
        meta="done — 15 + 5 + 5 + 5"
        sets={[
          {
            status: 'myo',
            activation: decay(15, 0.75),
            clusters: [decay(5, 0.6), decay(5, 0.55), decay(5, 0.5)],
          },
        ]}
      />
      <SheetRow
        label="Myo — upcoming"
        meta="~15 + clusters to failure"
        sets={[{ status: 'myo-upcoming', activationLen: 15 }]}
      />
    </View>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'The four set-type variants (range / drop / myo / myo-upcoming) plus the flat sets, ' +
          'at rail width. Gap hierarchy: butted reps (0) < notch (2px, drop) < cluster (3px, myo) ' +
          '< set gap (5px). Cyan is the shared variable/unknown/opportunity pin.',
      },
    },
  },
}
