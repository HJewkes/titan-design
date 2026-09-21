import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import { Typography } from '../../components/ui/typography'
import { VelocityBandPreview } from '../../components/custom/Workout/VelocityBandPreview'
import type { VelocityBandTreatment } from '../../components/custom/Workout/VelocityBandOverlay'
import {
  BAND_SCALE_FIXTURES,
  type BandScaleFixtureKey,
} from '../../components/custom/Workout/velocityBandScale-fixture'
import { SLOWING_PALETTES, type SlowingPaletteKey } from './slowingPalettes'

interface FrameArgs {
  fixture: BandScaleFixtureKey
  palette: SlowingPaletteKey
  zone: VelocityBandTreatment['zone']
  lowConfidence: VelocityBandTreatment['lowConfidence']
  pastCue: VelocityBandTreatment['pastCue']
  suspension: VelocityBandTreatment['suspension']
}

/** Below this frame width the chart takes its phone height. */
const PHONE_BREAKPOINT = 600
const PHONE_HEIGHT = 150
const WALL_HEIGHT = 240

function RoundFrame({ fixture, palette, ...treatment }: FrameArgs) {
  const [width, setWidth] = useState(0)
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)
  const set = BAND_SCALE_FIXTURES[fixture]
  const height = width > 0 && width < PHONE_BREAKPOINT ? PHONE_HEIGHT : WALL_HEIGHT
  return (
    <View
      onLayout={onLayout}
      className="gap-stack-sm bg-background-base p-gutter-sm"
      testID="effort-bands-frame"
    >
      <Typography variant="overline" color="secondary">
        {set.title}
      </Typography>
      <VelocityBandPreview
        velocities={set.velocities}
        scale={set.scale}
        palette={SLOWING_PALETTES[palette]}
        height={height}
        treatment={treatment}
        accessibilityLabel={`${set.title}: ${set.velocities.length} reps`}
      />
    </View>
  )
}

/**
 * VW-448 round 1: the band overlay on fixtures, before any integration. Every string on the chart
 * is a PROPOSAL (the SPA will supply the owner's wording). The `palette` arg shows the candidates
 * for the proposed `dataviz-slowing-*` token beside the tier b scale. Dark only (VW-397). Shoot at
 * 1920 and 360.
 */
const meta: Meta<FrameArgs> = {
  title: 'Lab/Decisions/Effort Bands',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  args: {
    fixture: 'tierBRepRangeOneGuard',
    palette: 'effort',
    zone: 'tint',
    lowConfidence: 'fade-outline',
    pastCue: 'bracket',
    suspension: 'mark',
  },
  argTypes: {
    fixture: { control: 'select', options: Object.keys(BAND_SCALE_FIXTURES) },
    palette: { control: 'select', options: Object.keys(SLOWING_PALETTES) },
    zone: { control: 'inline-radio', options: ['tint', 'bracket'] },
    lowConfidence: { control: 'inline-radio', options: ['fade', 'fade-outline'] },
    pastCue: { control: 'inline-radio', options: ['bracket', 'badge'] },
    suspension: { control: 'inline-radio', options: ['mark', 'none'] },
  },
  render: (args) => <RoundFrame {...args} />,
}
export default meta

/** One set per frame; the review round picks the fixture and the option through args. */
export const Frame: StoryObj<FrameArgs> = {}
