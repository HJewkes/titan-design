// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ZoneTrack, type ZoneTrackZone } from './ZoneTrack'
import { WORKOUT_TOKENS, heatmapColors } from '../../../theme/workout-tokens'
import { Surface, useSurfaceMode } from '../../ui/surface'
import { View } from 'react-native'
import { Typography } from '../../ui/typography'
import { compositeOver } from '../../../theme/color-checks'
import { primitiveRamps } from '../../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'

const { green, yellow, orange, red } = WORKOUT_TOKENS.scale
const t = getSemanticColors('dark')

const FATIGUE_ZONES: ZoneTrackZone[] = [
  { upTo: 10, color: green },
  { upTo: 20, color: yellow },
  { upTo: 30, color: orange },
  { upTo: 40, color: red },
]

type HighlightScale = 'effort' | 'diverging'
type DarkFade = 'asBuilt' | 'subtle'
interface ZoneHighlightArgs {
  scale: HighlightScale
  darkFade: DarkFade
  reading: number
}

const DARK_FADE_LABEL: Record<DarkFade, string> = {
  asBuilt: 'Dark, as built (ships)',
  subtle: 'Dark, subtle tokens (alternative)',
}

const r = primitiveRamps
type SemanticToken = keyof ReturnType<typeof getSemanticColors>

/** Each zone's light step 100, its dark "as built" step and its subtle token, left to right. */
const HIGHLIGHT_RAMPS: Record<
  HighlightScale,
  { light: string; asBuilt: string; subtle: SemanticToken }[]
> = {
  effort: [
    { light: r.green[100], asBuilt: r.green[500], subtle: 'status-success-subtle' },
    { light: r.amber[100], asBuilt: r.amber[600], subtle: 'status-warning-subtle' },
    { light: r.orange[100], asBuilt: r.orange[700], subtle: 'brand-primary-subtle' },
    { light: r.red[100], asBuilt: r.red[800], subtle: 'status-error-subtle' },
  ],
  diverging: [
    { light: r.blue[100], asBuilt: r.blue[700], subtle: 'status-info-subtle' },
    { light: r.cyan[100], asBuilt: r.cyan[600], subtle: 'brand-secondary-subtle' },
    { light: r.green[100], asBuilt: r.green[500], subtle: 'status-success-subtle' },
    { light: r.amber[100], asBuilt: r.amber[700], subtle: 'status-warning-subtle' },
    { light: r.red[100], asBuilt: r.red[800], subtle: 'status-error-subtle' },
  ],
}

function litColors(scale: HighlightScale, mode: ThemeMode): string[] {
  if (scale === 'effort') return [green, yellow, orange, red]
  const heat = heatmapColors(mode)
  return [heat.under, heat.maintenance, heat.productive, heat.approaching, heat.over]
}

function highlightZones(scale: HighlightScale, darkFade: DarkFade, mode: ThemeMode) {
  const colors = getSemanticColors(mode)
  const lit = litColors(scale, mode)
  return HIGHLIGHT_RAMPS[scale].map(({ light, asBuilt, subtle }, i): ZoneTrackZone => {
    const dark =
      darkFade === 'asBuilt' ? asBuilt : compositeOver(colors[subtle], colors['surface-base'])
    return { upTo: (i + 1) * 8, color: lit[i], faded: mode === 'light' ? light : dark }
  })
}

const FATIGUE_TICKS = [
  { value: 0, label: 'fresh' },
  { value: 10, label: 'VL10' },
  { value: 20, label: 'VL20' },
  { value: 30, label: 'VL30' },
  { value: 40, label: 'stop' },
]

const meta: Meta<typeof ZoneTrack> = {
  title: 'Custom/Workout/DataViz/ZoneTrack',
  component: ZoneTrack,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Primitive.** The shared linear-gauge base: a pill track with N zone bands, ' +
          'optional tick marks + labels, and a single value marker — a `needle` line or a ' +
          'left-anchored solid `fill`. Zones with a `faded` colour give the zone highlight: only ' +
          'the zone the marker lands in stays lit. Used-by ↓ ' +
          '[FatigueMeter](?path=/docs/custom-workout-dataviz-fatiguemeter--docs); the target base for ' +
          'TrainingLoadGauge (ACWR) + RpeCalibration (band + marker). Zone colours are literal ' +
          'palette hex: the effort scale (`WORKOUT_TOKENS.scale`) for fatigue, `heatmapColors` (dataviz-diverging) for volume.' +
          ' Composes **Tooltip**.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ width: 360, padding: 20 }}>
        <Story />
      </Surface>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof ZoneTrack>

/** Needle over the fatigue zones with the VL scale — the FatigueMeter shape. */
export const Needle: Story = {
  args: {
    zones: FATIGUE_ZONES,
    max: 40,
    marker: { type: 'needle', value: 21 },
    ticks: FATIGUE_TICKS,
  },
}

/** Fill marker with a colour paints a solid trend-coloured bar (FatigueGauge lineage). */
export const SolidTrendFill: Story = {
  args: { zones: FATIGUE_ZONES, max: 40, marker: { type: 'fill', value: 24, color: orange } },
}

function zoneHighlightStory(darkFade: DarkFade): StoryObj<Omit<ZoneHighlightArgs, 'darkFade'>> {
  return {
    args: { scale: 'effort', reading: 24 },
    argTypes: {
      scale: { control: 'select', options: ['effort', 'diverging'] },
      reading: { control: { type: 'range', min: 0, max: 40, step: 1 } },
    },
    render: function Render({ scale, reading }) {
      return <ZoneHighlightTrack scale={scale} darkFade={darkFade} reading={reading} />
    },
  }
}

function ZoneHighlightTrack({ scale, darkFade, reading }: ZoneHighlightArgs) {
  const mode = useSurfaceMode()
  const zones = highlightZones(scale, darkFade, mode)
  const caption =
    mode === 'light'
      ? 'Light, step 100 (ships; the same in both dark options)'
      : DARK_FADE_LABEL[darkFade]
  return (
    <View style={{ gap: 8 }}>
      <Typography variant="monoLabel" className="text-text-secondary">
        {caption}
      </Typography>
      <ZoneTrack
        zones={zones}
        max={zones[zones.length - 1].upTo}
        marker={{ type: 'needle', value: reading }}
        accessibilityLabel={`Zone highlight, reading ${reading}`}
      />
    </View>
  )
}

/**
 * The zone highlight, the shipped design: the zone the needle lands in keeps its colour, every
 * other zone takes its `faded` colour. Light fades to step 100. Dark steps each zone down its
 * ramp until it clears 1.5:1 against a lit neighbour (Lab/Decisions/ZoneTrack Adjacent Contrast).
 */
export const ZoneHighlight = {
  ...zoneHighlightStory('asBuilt'),
  name: 'Dark, as built (ships)',
}

/**
 * The alternative dark fade, for comparison only: each zone's hue takes its subtle fill token,
 * painted over the plane. Light is the same step 100 as the shipped story.
 */
export const ZoneHighlightSubtle = {
  ...zoneHighlightStory('subtle'),
  name: 'Dark, subtle tokens (alternative)',
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
    band: { from: 7.2, to: 8.4, color: t['hairline-strong'] },
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

/** Bare zone track — no marker, no ticks. */
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
// The STOP label is text: in light it takes text-error, since red 600 misses 4.5:1 on the
// grey 100 page (TD-789 3b).
export const ColoredTooltipTicks: Story = {
  args: {
    zones: FATIGUE_ZONES,
    max: 40,
    marker: { type: 'needle', value: 22 },
    trackHeight: 12,
  },
  render: function Render(args) {
    const stop = useSurfaceMode() === 'light' ? getSemanticColors('light')['text-error'] : red
    return (
      <ZoneTrack
        {...args}
        ticks={[
          { value: 10, label: 'VL10', tooltip: '10% velocity loss' },
          { value: 20, label: 'VL20', emphasized: true, tooltip: '20% velocity loss — threshold' },
          { value: 30, label: 'STOP', color: stop, tooltip: '30% velocity loss — stop the set' },
        ]}
      />
    )
  },
}
