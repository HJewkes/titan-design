import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import { Eyebrow } from '../../components/ui/eyebrow'
import { Typography } from '../../components/ui/typography'
import {
  VelocityBandPreview,
  paletteFor,
} from '../../components/custom/Workout/VelocityBandPreview'
import {
  BAND_SCALE_FIXTURES,
  type BandScaleFixtureKey,
} from '../../components/custom/Workout/velocityBandScale-fixture'

interface FrameArgs {
  fixture: BandScaleFixtureKey
}

/** Below this frame width the chart takes its phone height. */
const PHONE_BREAKPOINT = 600
const PHONE_HEIGHT = 150
const WALL_HEIGHT = 240

function RoundFrame({ fixture }: FrameArgs) {
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
        palette={paletteFor(set.scale.meaning)}
        height={height}
        accessibilityLabel={`${set.title}: ${set.velocities.length} reps`}
      />
    </View>
  )
}

function FrameStack({ fixtures, testID }: { fixtures: BandScaleFixtureKey[]; testID: string }) {
  return (
    <View testID={testID}>
      {fixtures.map((fixture) => (
        <RoundFrame key={fixture} fixture={fixture} />
      ))}
    </View>
  )
}

/**
 * VW-448 band overlay on fixtures, before integration. Every string on the chart is a caller
 * placeholder (the SPA supplies the owner's wording). Dark only (VW-397). Shoot at 1920 and 360.
 *
 * Round 1, CHOSEN (owner, 2026-09-23): tier a in one blue, light to dark (Pa1); the rep-range zone
 * as a tint over the target slots (Zt); the guard colour rule reads (effort cap coloured by the
 * effort it targets, loss guard neutral, the line that fired heavier). Wording stands as proposed:
 * `8 to 12`, `RPE 9`, `VL 30%`. NOT CHOSEN: blue dark to light, effort colours in tier a, the zone
 * bracket.
 * Round 2, CHOSEN (owner, 2026-09-21): the past-cue count is a badge (`+2`); a low-confidence bar
 * is only faded; a setting change dims the later bars and draws a labelled mark (`Setting
 * changed`); the target-RPE fallback lives in the hero eyebrow (`RPE 8 · 8-12 reps`); the RPE line
 * keeps spanning the chart after a change. NOT CHOSEN: the past-cue bracket, the dashed
 * low-confidence outline, dimmed bars with no mark, "by reps until calibrated" on the chart.
 * See REJECTED.md for both rounds.
 */
const meta: Meta<FrameArgs> = {
  title: 'Lab/Decisions/Effort Bands',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  args: { fixture: 'tierBRepRangeOneGuard' },
  argTypes: {
    fixture: { control: 'select', options: Object.keys(BAND_SCALE_FIXTURES) },
  },
  render: (args) => <RoundFrame {...args} />,
}
export default meta

/** One fixture per frame; the palette follows the scale's meaning. */
export const Frame: StoryObj<FrameArgs> = {}

/** CHOSEN (round 1): the tier a palette and the zone tint, one guard in each tier. */
export const Round1Chosen: StoryObj<FrameArgs> = {
  render: () => (
    <FrameStack
      testID="effort-bands-round-1-chosen"
      fixtures={['tierBRepRangeOneGuard', 'tierARepRangeLossGuard', 'tierANoGuard', 'emptySet']}
    />
  ),
}

/** CHOSEN (round 2): the four decided treatments, rendered by the shipped overlay. */
export const Round2Chosen: StoryObj<FrameArgs> = {
  render: () => (
    <FrameStack
      testID="effort-bands-round-2-chosen"
      fixtures={[
        'tierBPastCue',
        'tierATargetRpeFallback',
        'tierBLowConfidence',
        'tierBSuspendedTail',
      ]}
    />
  ),
}
