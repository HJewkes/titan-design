import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { MuscleStrip, type MuscleStripMuscleData } from './MuscleStrip'
import { MuscleGroup } from './muscleTaxonomy'

const ALL_MUSCLES = Object.values(MuscleGroup)

function buildData(
  overrides: Partial<Record<MuscleGroup, MuscleStripMuscleData>> = {}
): Record<MuscleGroup, MuscleStripMuscleData> {
  return ALL_MUSCLES.reduce(
    (acc, muscle) => {
      acc[muscle] = overrides[muscle] ?? { sets: 0, target: 0, volumeStatus: 'untrained' }
      return acc
    },
    {} as Record<MuscleGroup, MuscleStripMuscleData>
  )
}

const WEEK_DATA = buildData({
  [MuscleGroup.CHEST]: { sets: 12, target: 14, volumeStatus: 'ontrack' },
  [MuscleGroup.FRONT_DELTS]: { sets: 6, target: 6, volumeStatus: 'target' },
  [MuscleGroup.SIDE_DELTS]: { sets: 18, target: 14, volumeStatus: 'over' },
  [MuscleGroup.TRICEPS]: { sets: 12, target: 8, volumeStatus: 'approaching' },
  [MuscleGroup.LATS]: { sets: 6, target: 14, volumeStatus: 'behind' },
  [MuscleGroup.UPPER_BACK]: { sets: 10, target: 12, volumeStatus: 'ontrack' },
  [MuscleGroup.REAR_DELTS]: { sets: 4, target: 12, volumeStatus: 'behind' },
  [MuscleGroup.BICEPS]: { sets: 9, target: 10, volumeStatus: 'ontrack' },
  [MuscleGroup.FOREARMS]: { sets: 0, target: 6, volumeStatus: 'untrained' },
  [MuscleGroup.QUADS]: { sets: 12, target: 12, volumeStatus: 'target' },
  [MuscleGroup.HAMSTRINGS]: { sets: 8, target: 10, volumeStatus: 'ontrack' },
  [MuscleGroup.GLUTES]: { sets: 9, target: 10, volumeStatus: 'approaching' },
  [MuscleGroup.CALVES]: { sets: 6, target: 10, volumeStatus: 'behind' },
  [MuscleGroup.ABS]: { sets: 8, target: 8, volumeStatus: 'target' },
  [MuscleGroup.OBLIQUES]: { sets: 0, target: 6, volumeStatus: 'untrained' },
})

const meta: Meta<typeof MuscleStrip> = {
  title: 'Custom/Workout/MuscleStrip',
  component: MuscleStrip,
  tags: ['autodocs'],
  argTypes: {
    data: { control: false },
    onMusclePress: { action: 'muscle-pressed' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** All 15 [MuscleGroupChip](?path=/docs/custom-workout-musclegroupchip--docs)s ' +
          'in one wrapping row, each labeled with weekly sets against target. Wraps via `style` ' +
          '`flexWrap` — phone-width containers stack several rows, wall-width containers fit ' +
          'one or two.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof MuscleStrip>

export const Default: Story = {
  args: {
    data: WEEK_DATA,
  },
}

export const Wall: Story = {
  args: {
    data: WEEK_DATA,
  },
  decorators: [
    (Story) => (
      <View style={{ width: 1200 }}>
        <Story />
      </View>
    ),
  ],
}

export const Phone: Story = {
  args: {
    data: WEEK_DATA,
  },
  decorators: [
    (Story) => (
      <View style={{ width: 360 }}>
        <Story />
      </View>
    ),
  ],
}

export const EmptyUntrained: Story = {
  args: {
    data: buildData(),
  },
}

export const OneOfEachStatus: Story = {
  args: {
    data: buildData({
      [MuscleGroup.CHEST]: { sets: 0, target: 14, volumeStatus: 'untrained' },
      [MuscleGroup.LATS]: { sets: 6, target: 14, volumeStatus: 'behind' },
      [MuscleGroup.QUADS]: { sets: 10, target: 12, volumeStatus: 'ontrack' },
      [MuscleGroup.ABS]: { sets: 8, target: 8, volumeStatus: 'target' },
      [MuscleGroup.GLUTES]: { sets: 9, target: 10, volumeStatus: 'approaching' },
      [MuscleGroup.SIDE_DELTS]: { sets: 18, target: 14, volumeStatus: 'over' },
    }),
  },
}
