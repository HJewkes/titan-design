import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import { Eyebrow } from '../../components/ui/eyebrow'
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
}

/** Below this frame width the chart takes its phone height. */
const PHONE_BREAKPOINT = 600
const PHONE_HEIGHT = 150
const WALL_HEIGHT = 240

function RoundFrame({ fixture, palette, zone }: FrameArgs) {
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
      {set.eyebrow ? <Eyebrow>{set.eyebrow}</Eyebrow> : null}
      <VelocityBandPreview
        velocities={set.velocities}
        scale={set.scale}
        palette={SLOWING_PALETTES[palette]}
        height={height}
        treatment={{ zone }}
        accessibilityLabel={`${set.title}: ${set.velocities.length} reps`}
      />
    </View>
  )
}

/**
 * VW-448 band overlay on fixtures, before integration. Every string on the chart is a PROPOSAL
 * (the SPA supplies the owner's wording). Dark only (VW-397). Shoot at 1920 and 360.
 *
 * Round 2, CHOSEN (owner, 2026-09-21): the past-cue count is a badge (`+2`); a low-confidence bar
 * is only faded; a setting change dims the later bars and draws a labelled mark (`Setting
 * changed`); the target-RPE fallback lives in the hero eyebrow and names the target and the range
 * (`RPE 8 · 8-12 reps`); the RPE 9 line keeps spanning the chart after a change.
 * NOT CHOSEN: the past-cue bracket, the dashed low-confidence outline, dimmed bars with no mark,
 * and "by reps until calibrated" on the chart. See REJECTED.md.
 * Round 1 (palette, zone, guards) is still open: `palette` and `zone` remain args on `Frame`.
 */
const meta: Meta<FrameArgs> = {
  title: 'Lab/Decisions/Effort Bands',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  args: { fixture: 'tierBRepRangeOneGuard', palette: 'effort', zone: 'tint' },
  argTypes: {
    fixture: { control: 'select', options: Object.keys(BAND_SCALE_FIXTURES) },
    palette: { control: 'select', options: Object.keys(SLOWING_PALETTES) },
    zone: { control: 'inline-radio', options: ['tint', 'bracket'] },
  },
  render: (args) => <RoundFrame {...args} />,
}
export default meta

/** One set per frame; the review round picks the fixture and the open options through args. */
export const Frame: StoryObj<FrameArgs> = {}

const ROUND_2_CHOSEN: { fixture: BandScaleFixtureKey; palette: SlowingPaletteKey }[] = [
  { fixture: 'tierBPastCue', palette: 'effort' },
  { fixture: 'tierATargetRpeFallback', palette: 'slowingBlue' },
  { fixture: 'tierBLowConfidence', palette: 'effort' },
  { fixture: 'tierBSuspendedTail', palette: 'effort' },
]

/** CHOSEN (round 2): the four decided treatments, rendered by the shipped overlay. */
export const Round2Chosen: StoryObj<FrameArgs> = {
  render: ({ zone }) => (
    <View testID="effort-bands-round-2-chosen">
      {ROUND_2_CHOSEN.map(({ fixture, palette }) => (
        <RoundFrame key={fixture} fixture={fixture} palette={palette} zone={zone} />
      ))}
    </View>
  ),
}
