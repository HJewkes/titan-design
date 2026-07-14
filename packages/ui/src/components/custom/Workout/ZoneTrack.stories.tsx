// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ZoneTrack, type ZoneTrackZone } from './ZoneTrack'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'

const { green, yellow, orange, red } = WORKOUT_TOKENS.scale

const FATIGUE_ZONES: ZoneTrackZone[] = [
  { upTo: 10, color: green },
  { upTo: 20, color: yellow },
  { upTo: 30, color: orange },
  { upTo: 40, color: red },
]

const FATIGUE_TICKS = [
  { value: 0, label: 'fresh' },
  { value: 10, label: 'VL10' },
  { value: 20, label: 'VL20' },
  { value: 30, label: 'VL30' },
  { value: 40, label: 'stop' },
]

const meta: Meta<typeof ZoneTrack> = {
  title: 'Workout/DataViz/ZoneTrack',
  component: ZoneTrack,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Primitive.** The shared linear-gauge base: a pill track with an N-band zone ' +
          'gradient, optional tick marks + labels, and a single value marker — a `needle` line ' +
          'or a left-anchored `fill` (clip-reveal gradient, or solid trend colour). Used-by ↓ ' +
          '[FatigueMeter](?path=/docs/workout-dataviz-fatiguemeter--docs); the target base for ' +
          'TrainingLoadGauge (ACWR) + RpeCalibration (band + marker). Zone colours are literal ' +
          'ramp-token hex.',
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

type Story = StoryObj<typeof ZoneTrack>

/** Needle over the fatigue gradient with the VL scale — the FatigueMeter shape. */
export const Needle: Story = {
  args: {
    zones: FATIGUE_ZONES,
    max: 40,
    marker: { type: 'needle', value: 21 },
    ticks: FATIGUE_TICKS,
  },
}

/** Fill marker without a colour clip-reveals the gradient up to the value. */
export const GradientFill: Story = {
  args: {
    zones: FATIGUE_ZONES,
    max: 40,
    marker: { type: 'fill', value: 24 },
    ticks: FATIGUE_TICKS,
  },
}

/** Fill marker with a colour paints a solid trend-coloured bar (FatigueGauge lineage). */
export const SolidTrendFill: Story = {
  args: { zones: FATIGUE_ZONES, max: 40, marker: { type: 'fill', value: 24, color: orange } },
}

/** A range highlight + needle — the RpeCalibration "predicted CI band vs actual" idiom. */
export const BandWithMarker: Story = {
  args: {
    zones: [
      { upTo: 7, color: green },
      { upTo: 8.5, color: yellow },
      { upTo: 10, color: red },
    ],
    min: 6,
    max: 10,
    band: { from: 7.2, to: 8.4, color: 'rgba(255,255,255,0.22)' },
    marker: { type: 'needle', value: 8.1 },
    ticks: [
      { value: 6, label: '6' },
      { value: 7, label: '7' },
      { value: 8, label: '8' },
      { value: 9, label: '9' },
      { value: 10, label: '10' },
    ],
  },
}

/** Bare gradient track — no marker, no ticks. */
export const BareTrack: Story = {
  args: { zones: FATIGUE_ZONES, max: 40 },
}

/** The across-the-room wall scale — `size="wall"` grows track, needle, tick lines and labels together. */
export const WallDensity: Story = {
  args: {
    zones: FATIGUE_ZONES,
    max: 40,
    marker: { type: 'needle', value: 15 },
    ticks: FATIGUE_TICKS,
    size: 'wall',
  },
}

/** `marker.glow` haloes the whole track in the marker colour — a "sweet spot" / attention cue. */
export const Glow: Story = {
  args: {
    zones: FATIGUE_ZONES,
    max: 40,
    marker: { type: 'fill', value: 20, color: green, glow: true },
    trackHeight: 12,
  },
}

/** Colored + emphasized ticks with tooltips — hover a label to expand the acronym / show the raw value. */
export const ColoredTooltipTicks: Story = {
  args: {
    zones: FATIGUE_ZONES,
    max: 40,
    marker: { type: 'needle', value: 22 },
    trackHeight: 12,
    ticks: [
      { value: 10, label: 'VL10', tooltip: '10% velocity loss' },
      { value: 20, label: 'VL20', emphasized: true, tooltip: '20% velocity loss — threshold' },
      { value: 30, label: 'STOP', color: red, tooltip: '30% velocity loss — stop the set' },
    ],
  },
}
