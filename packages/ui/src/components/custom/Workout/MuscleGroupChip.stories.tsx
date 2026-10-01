import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { MuscleGroupChip } from './MuscleGroupChip'
import { VOLUME_STATUSES } from './muscleTaxonomy'

const meta: Meta<typeof MuscleGroupChip> = {
  title: 'Custom/Workout/MuscleGroupChip',
  component: MuscleGroupChip,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Muscle group name',
    },
    volumeStatus: {
      control: 'select',
      options: [undefined, ...VOLUME_STATUSES],
      description:
        'Volume status. The dot paints the same `dataviz-diverging-*` scale as the BodyMap figure (VW-333). `noverdict` draws a `result-neutral` ring (VW-741).',
    },
    onPress: {
      action: 'pressed',
      description: 'Callback when chip is tapped',
    },
  },
}

export default meta
type Story = StoryObj<typeof MuscleGroupChip>

export const Default: Story = {
  args: {
    name: 'Chest',
    volumeStatus: 'ontrack',
  },
}

export const Untrained: Story = {
  args: {
    name: 'Rear Delts',
    volumeStatus: 'untrained',
  },
}

/** Trained, but the muscle's MEV is withheld: a hollow `result-neutral` ring (VW-741). */
export const NoVerdict: Story = {
  args: {
    name: 'Glutes',
    volumeStatus: 'noverdict',
  },
}

export const Behind: Story = {
  args: {
    name: 'Quads',
    volumeStatus: 'behind',
  },
}

export const OnTrack: Story = {
  args: {
    name: 'Back',
    volumeStatus: 'ontrack',
  },
}

export const Target: Story = {
  args: {
    name: 'Biceps',
    volumeStatus: 'target',
  },
}

export const Approaching: Story = {
  args: {
    name: 'Glutes',
    volumeStatus: 'approaching',
  },
}

export const Over: Story = {
  args: {
    name: 'Front Delts',
    volumeStatus: 'over',
  },
}

export const WithoutStatus: Story = {
  args: {
    name: 'Hamstrings',
  },
}

export const Tappable: Story = {
  args: {
    name: 'Glutes',
    volumeStatus: 'ontrack',
    onPress: () => {},
  },
}

export const AllStatuses: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {VOLUME_STATUSES.map((status) => (
        <MuscleGroupChip
          key={status}
          name={status.charAt(0).toUpperCase() + status.slice(1)}
          volumeStatus={status}
        />
      ))}
      <MuscleGroupChip name="No Status" />
    </View>
  ),
}

export const MuscleGroups: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      <MuscleGroupChip name="Chest" volumeStatus="ontrack" />
      <MuscleGroupChip name="Triceps" volumeStatus="target" />
      <MuscleGroupChip name="Front Delts" volumeStatus="over" />
      <MuscleGroupChip name="Side Delts" volumeStatus="behind" />
      <MuscleGroupChip name="Glutes" volumeStatus="approaching" />
      <MuscleGroupChip name="Abs" volumeStatus="untrained" />
      <MuscleGroupChip name="Lats" volumeStatus="noverdict" />
    </View>
  ),
}
