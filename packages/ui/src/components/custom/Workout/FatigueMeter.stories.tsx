// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { FatigueMeter } from './FatigueMeter'

const meta: Meta<typeof FatigueMeter> = {
  title: 'Workout/DataViz/FatigueMeter',
  component: FatigueMeter,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 40, step: 1 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Component.** The winning fatigue-visual lineage: a sliding needle over a fixed ' +
          'green→gold→orange→red velocity-loss gradient with VL10/VL20/VL30/stop markers. ' +
          'Composes the [ZoneTrack](?path=/docs/workout-dataviz-zonetrack--docs) primitive. ' +
          'Prop-driven: `value` plus overridable `thresholds` / `max` / `zoneColors` / `labels`.',
      },
    },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 360, padding: 20, backgroundColor: '#131313' }}>
        <Story />
      </View>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof FatigueMeter>

/** Fresh — needle sits in the green zone. */
export const Fresh: Story = { args: { value: 5 } }

/** VL20 — needle crossing into the orange zone. */
export const Vl20: Story = { args: { value: 21 } }

/** Stop zone — deep into the red. */
export const StopZone: Story = { args: { value: 34 } }

/** The across-the-room wall scale — `size="wall"` grows the track, needle and tick labels together. */
export const WallDensity: Story = { args: { value: 21, size: 'wall' } }

/** Custom scale — a tighter 0..30 domain with earlier thresholds. */
export const CustomScale: Story = {
  args: { value: 12, max: 30, thresholds: [8, 16, 24], labels: ['ok', 'w1', 'w2', 'w3', 'max'] },
}
