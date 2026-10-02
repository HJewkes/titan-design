import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import { MesoHeader } from '../../components/custom/Workout/MesoHeader'
import {
  MESO_HEADER_FIXTURES,
  mesoHeaderPropsFrom,
  type MesoHeaderFixtureKey,
} from '../../components/custom/Workout/mesoHeader-fixture'

interface FrameArgs {
  fixture: MesoHeaderFixtureKey
}

function RoundFrame({ fixture }: FrameArgs) {
  return (
    <View className="bg-background-base p-gutter-sm" testID="meso-header-frame">
      <MesoHeader {...mesoHeaderPropsFrom(MESO_HEADER_FIXTURES[fixture])} shape="band" />
    </View>
  )
}

/**
 * VW-466 pinned mesocycle header on `#/goals`, before integration. Shoot at 1920 and 360; the
 * header measures its own width and takes its phone form below 640 px, the live strip's threshold.
 *
 * Round 1 prep (VW-647): frame A only, shape A (one band) on Round 0's M3. Frames B, C, P, K and D
 * arrive with round 1 (VW-648). Fixtures are synthetic; their shapes follow the Round 0 M-cases.
 */
const meta: Meta<FrameArgs> = {
  title: 'Lab/Decisions/Meso Header',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  args: { fixture: 'm3Current' },
  argTypes: {
    fixture: { control: 'select', options: Object.keys(MESO_HEADER_FIXTURES) },
  },
  render: (args) => <RoundFrame {...args} />,
}
export default meta

/** A: shape A on M3. Wall: one band. Phone: two lines with "Priorities · 3". */
export const BandCurrent: StoryObj<FrameArgs> = {}
