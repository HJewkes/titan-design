import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { VolumeLandmarkBar } from './VolumeLandmarkBar'

const meta: Meta<typeof VolumeLandmarkBar> = {
  title: 'Workout/DataViz/VolumeLandmarkBar',
  component: VolumeLandmarkBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Horizontal weekly-volume bar with MEV / MAV / MRV landmark ticks, a HEAT-scale ' +
          'fill positioned against the MAV target, and a % readout. Reuses the canonical ' +
          'BodyMap volume heat scale (under → maintenance → productive → approaching → over).',
      },
    },
  },
  argTypes: {
    muscle: { control: 'text', description: 'Muscle group label' },
    currentSets: {
      control: { type: 'range', min: 0, max: 30, step: 1 },
      description: 'Current weekly working sets',
    },
    width: { control: 'number', description: 'Track width in px' },
    trackHeight: { control: 'number', description: 'Track height in px' },
    scaleMax: { control: 'number', description: 'Upper bound of the track scale (sets)' },
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 24, paddingBottom: 40, backgroundColor: '#101010' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof VolumeLandmarkBar>

const LANDMARKS = { mev: 8, mav: 16, mrv: 22 }

export const UnderMEV: Story = {
  args: { muscle: 'Rear Delts', currentSets: 5, landmarks: LANDMARKS },
}

export const Maintenance: Story = {
  args: { muscle: 'Calves', currentSets: 12, landmarks: LANDMARKS },
}

export const Optimal: Story = {
  args: { muscle: 'Quads', currentSets: 17, landmarks: LANDMARKS },
}

export const ApproachingMRV: Story = {
  args: { muscle: 'Back', currentSets: 21, landmarks: LANDMARKS },
}

export const OverMRV: Story = {
  args: { muscle: 'Biceps', currentSets: 26, landmarks: LANDMARKS },
}

export const AllZones: Story = {
  render: () => (
    <View style={{ gap: 28 }}>
      <VolumeLandmarkBar muscle="Rear Delts" currentSets={5} landmarks={LANDMARKS} />
      <VolumeLandmarkBar muscle="Calves" currentSets={12} landmarks={LANDMARKS} />
      <VolumeLandmarkBar muscle="Quads" currentSets={17} landmarks={LANDMARKS} />
      <VolumeLandmarkBar muscle="Back" currentSets={21} landmarks={LANDMARKS} />
      <VolumeLandmarkBar muscle="Biceps" currentSets={26} landmarks={LANDMARKS} />
    </View>
  ),
}
