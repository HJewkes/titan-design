import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { EFFORT_BAND_PALETTE, VelocityBandPreview } from './VelocityBandPreview'
import { BAND_SCALE_FIXTURES, type BandScaleFixtureKey } from './velocityBandScale-fixture'

interface OverlayStoryArgs {
  fixture: BandScaleFixtureKey
  height: number
}

const meta: Meta<OverlayStoryArgs> = {
  title: 'Custom/Workout/VelocityBandOverlay',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { fixture: 'tierBTwoGuards', height: 220 },
  argTypes: {
    fixture: { control: 'select', options: Object.keys(BAND_SCALE_FIXTURES) },
    height: { control: { type: 'range', min: 80, max: 320, step: 10 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Overlay** for a set bar chart (VW-448). Composes `SetBarChart` geometry through ' +
          '`renderReference` (the chart has no story; see it in ' +
          '[VelocityStrip](?path=/docs/custom-workout-velocitystrip--docs)) and [Typography](?path=/docs/foundations-typography--docs) (`caption`). ' +
          'Draws the rep-range zone, up to two guard lines, the past-cue count and the setting-change ' +
          'mark from a `VelocityBandScale`; bands and labels arrive from the caller. Shown here on ' +
          'the tier b palette; the tier a candidates are in `Lab/Decisions/Effort Bands`.',
      },
    },
  },
  render: ({ fixture, height }) => {
    const set = BAND_SCALE_FIXTURES[fixture]
    return (
      <View className="p-inset-md">
        <VelocityBandPreview
          velocities={set.velocities}
          scale={set.scale}
          palette={EFFORT_BAND_PALETTE}
          height={height}
          accessibilityLabel={`${set.title}: ${set.velocities.length} reps`}
        />
      </View>
    )
  },
}
export default meta

export const Default: StoryObj<OverlayStoryArgs> = {}
