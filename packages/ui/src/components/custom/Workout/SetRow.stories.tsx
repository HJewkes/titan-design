import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SetRow } from './SetRow'

const meta: Meta<typeof SetRow> = {
  title: 'Custom/Workout/SetRow',
  component: SetRow,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['active', 'completed', 'history'],
      description: 'Row display mode',
    },
    unit: {
      control: 'select',
      options: ['lbs', 'kg'],
      description: 'Weight unit',
    },
    isNextSet: {
      control: 'boolean',
      description: 'Whether this is the next set to perform',
    },
  },
}

export default meta
type Story = StoryObj<typeof SetRow>

export const CompletedWithVelocity: Story = {
  args: {
    mode: 'completed',
    setNumber: 1,
    reps: 8,
    weight: 135,
    unit: 'lbs',
    rpe: 7.5,
    previous: { reps: 8, weight: 130 },
    velocities: [1.1, 0.95, 0.82, 0.68, 0.55, 0.48, 0.42, 0.38],
  },
}

export const ActiveWithTargets: Story = {
  args: {
    mode: 'active',
    setNumber: 3,
    reps: null,
    weight: null,
    unit: 'lbs',
    previous: { reps: 8, weight: 135 },
    targets: { reps: 10, weight: 150 },
  },
}

export const ActiveNextSet: Story = {
  args: {
    mode: 'active',
    setNumber: 2,
    reps: null,
    weight: null,
    unit: 'lbs',
    isNextSet: true,
    targets: { reps: 8, weight: 135 },
    previous: { reps: 8, weight: 130 },
  },
}

export const HistorySet: Story = {
  args: {
    mode: 'history',
    setNumber: 1,
    reps: 10,
    weight: 185,
    unit: 'lbs',
    rpe: 8,
    previous: { reps: 10, weight: 180 },
  },
}

export const WithTypeBadge: Story = {
  args: {
    mode: 'completed',
    setNumber: 1,
    reps: 5,
    weight: 95,
    unit: 'lbs',
    setType: 'W',
    previous: null,
  },
}

export const WithPrBadges: Story = {
  args: {
    mode: 'completed',
    setNumber: 3,
    reps: 8,
    weight: 225,
    unit: 'lbs',
    rpe: 9.5,
    previous: { reps: 8, weight: 215 },
    prBadges: [
      { type: 'e1rm', label: 'PR e1RM' },
      { type: 'weight', label: 'PR Weight' },
    ],
  },
}

export const WithRPE: Story = {
  args: {
    mode: 'completed',
    setNumber: 4,
    reps: 5,
    weight: 275,
    unit: 'lbs',
    rpe: 10,
    previous: { reps: 5, weight: 265 },
  },
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 4, padding: 16, maxWidth: 400 }}>
      <SetRow
        mode="completed"
        setNumber={1}
        reps={8}
        weight={135}
        unit="lbs"
        rpe={7}
        previous={{ reps: 8, weight: 130 }}
        velocities={[1.1, 0.95, 0.82, 0.68, 0.55, 0.48, 0.42, 0.38]}
        prBadges={[{ type: 'e1rm', label: 'PR e1RM' }]}
      />
      <SetRow
        mode="completed"
        setNumber={2}
        reps={8}
        weight={135}
        unit="lbs"
        rpe={8.5}
        previous={{ reps: 8, weight: 135 }}
        velocities={[0.95, 0.88, 0.78, 0.65, 0.52, 0.45, 0.40, 0.35]}
      />
      <SetRow
        mode="active"
        setNumber={3}
        reps={null}
        weight={null}
        unit="lbs"
        isNextSet
        targets={{ reps: 8, weight: 135 }}
        previous={{ reps: 8, weight: 135 }}
      />
      <SetRow
        mode="active"
        setNumber={4}
        reps={null}
        weight={null}
        unit="lbs"
        targets={{ reps: 8, weight: 135 }}
        previous={{ reps: 8, weight: 135 }}
      />
    </View>
  ),
}
