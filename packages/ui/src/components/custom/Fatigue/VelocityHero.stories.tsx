import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { VelocityHero } from './VelocityHero'
import { greyRamp } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { MOCK_MEAN_VELOCITIES } from './fatigue-mock'

const PAGE_BG = greyRamp[975]
const PANEL_BG = greyRamp[950]
const t = getSemanticColors('dark')

const meta: Meta<typeof VelocityHero> = {
  title: 'Workout/DataViz/VelocityHero',
  component: VelocityHero,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The shipped `VelocityStrip` hero with LOSS-RELATIVE VL20/VL30 decision bands layered behind ' +
          'the bars (on the hero’s own peak scale). The velocity-loss language lives here so the ' +
          'fatigue card carries no separate VL chart. (Deferred: recolouring the bar FILL loss-relative ' +
          'needs a new VelocityStrip prop — this component owns the band overlay only.)',
      },
    },
  },
  argTypes: {
    targetReps: { control: { type: 'number', min: 1, max: 12 } },
    height: { control: { type: 'number', min: 160, max: 360, step: 4 } },
  },
}
export default meta
type Story = StoryObj<typeof VelocityHero>

export const Default: Story = {
  args: { velocities: MOCK_MEAN_VELOCITIES, targetReps: 8, width: 800, height: 320 },
  render: (args) => (
    <View style={{ backgroundColor: PAGE_BG, padding: 28 }}>
      <View style={{ backgroundColor: PANEL_BG, borderRadius: 12, padding: 16, gap: 10 }}>
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 1,
            fontFamily: 'monospace',
            color: t['text-tertiary'],
          }}
        >
          8-REP SET · bars = per-rep mean concentric velocity · bands = VL decision zones
        </Text>
        <VelocityHero {...args} />
      </View>
    </View>
  ),
}

/** Mid-set — only the reps landed so far, with dashed placeholders for the reps to come. */
export const MidSet: Story = {
  render: () => (
    <View style={{ backgroundColor: PAGE_BG, padding: 28 }}>
      <View style={{ backgroundColor: PANEL_BG, borderRadius: 12, padding: 16 }}>
        <VelocityHero
          velocities={MOCK_MEAN_VELOCITIES.slice(0, 4)}
          targetReps={8}
          width={800}
          height={320}
        />
      </View>
    </View>
  ),
}
