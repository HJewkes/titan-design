import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { formatVelocity } from '../../../utils/workout-format'
import { VelocityBandChart } from './VelocityBandChart'
import { BAND_SCALE_FIXTURES, type BandScaleFixtureKey } from './velocityBandScale-fixture'

interface ChartStoryArgs {
  fixture: BandScaleFixtureKey
  height: number
  showValueLabels: boolean
  orientation: 'up' | 'down'
}

const meta: Meta<ChartStoryArgs> = {
  title: 'Custom/Workout/VelocityBandChart',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { fixture: 'tierBTwoGuards', height: 220, showValueLabels: false, orientation: 'up' },
  argTypes: {
    fixture: { control: 'select', options: Object.keys(BAND_SCALE_FIXTURES) },
    height: { control: { type: 'range', min: 80, max: 320, step: 10 } },
    showValueLabels: { control: 'boolean' },
    orientation: { control: 'inline-radio', options: ['up', 'down'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule** (VW-448). Composes `SetBarChart` (no story of its own; see it in ' +
          '[VelocityStrip](?path=/docs/custom-workout-velocitystrip--docs)), the band overlay and ' +
          '[Typography](?path=/docs/foundations-typography--docs) (`caption`). Colours each bar by ' +
          'the band the resolver decided and draws the rep-range zone, up to two guard lines, the ' +
          'past-cue count and the setting-change mark from a `VelocityBandScale`. Tier b takes the ' +
          'effort colours, tier a the `dataviz-slowing` blues; every label comes from the caller. ' +
          'Decisions: `Lab/Decisions/Effort Bands`.',
      },
    },
  },
  render: ({ fixture, height, showValueLabels, orientation }) => {
    const set = BAND_SCALE_FIXTURES[fixture]
    return (
      <View className="p-inset-md">
        <VelocityBandChart
          velocities={set.velocities}
          scale={set.scale}
          height={height}
          showValueLabels={showValueLabels}
          formatValue={formatVelocity}
          orientation={orientation}
          accessibilityLabel={`${set.title}: ${set.velocities.length} reps`}
        />
      </View>
    )
  },
}
export default meta

export const Default: StoryObj<ChartStoryArgs> = {}
