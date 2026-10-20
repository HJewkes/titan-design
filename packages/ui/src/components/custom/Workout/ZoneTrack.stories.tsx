// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ZoneTrack, type ZoneTrackZone } from './ZoneTrack'
import { WORKOUT_TOKENS, heatmapColors } from '../../../theme/workout-tokens'
import { Surface, useSurfaceMode } from '../../ui/surface'
import { View } from 'react-native'
import { Typography } from '../../ui/typography'
import { primitiveRamps } from '../../../theme/tokens/primitives'
import type { ThemeMode } from '../../../theme/tokens/semantic'

const { green, yellow, orange, red } = WORKOUT_TOKENS.scale
type HighlightScale = 'effort' | 'diverging'
interface ZoneHighlightArgs {
  scale: HighlightScale
  reading: number
}

const r = primitiveRamps

/** Each zone's light step 50 and its dark "as built" step, left to right. */
const HIGHLIGHT_RAMPS: Record<HighlightScale, { light: string; dark: string }[]> = {
  effort: [
    { light: r.green[50], dark: r.green[500] },
    { light: r.amber[50], dark: r.amber[600] },
    { light: r.orange[50], dark: r.orange[700] },
    { light: r.red[50], dark: r.red[800] },
  ],
  diverging: [
    { light: r.blue[50], dark: r.blue[700] },
    { light: r.cyan[50], dark: r.cyan[600] },
    { light: r.green[50], dark: r.green[500] },
    { light: r.amber[50], dark: r.amber[700] },
    { light: r.red[50], dark: r.red[800] },
  ],
}

function litColors(scale: HighlightScale, mode: ThemeMode): string[] {
  if (scale === 'effort') return [green, yellow, orange, red]
  const heat = heatmapColors(mode)
  return [heat.under, heat.maintenance, heat.productive, heat.approaching, heat.over]
}

function highlightZones(scale: HighlightScale, mode: ThemeMode) {
  const lit = litColors(scale, mode)
  return HIGHLIGHT_RAMPS[scale].map(
    ({ light, dark }, i): ZoneTrackZone => ({
      upTo: (i + 1) * 8,
      color: lit[i],
      faded: mode === 'light' ? light : dark,
    })
  )
}

const meta: Meta<typeof ZoneTrack> = {
  title: 'Custom/Workout/DataViz/ZoneTrack',
  component: ZoneTrack,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Primitive.** The shared linear-gauge base: a pill track with N zone bands and a ' +
          'value marker. Its design is the zone highlight: only the zone the marker lands in ' +
          'stays lit, and every other zone takes its `faded` colour. Used-by ↓ ' +
          '[FatigueMeter](?path=/docs/custom-workout-dataviz-fatiguemeter--docs), ' +
          '[VolumeLandmarkBar](?path=/docs/custom-workout-dataviz-volumelandmarkbar--docs) and ' +
          'BodyweightGoalCard, whose stories show the needle, fill, band, tick and wall-size ' +
          'modes they use. Zone colours are literal ' +
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

function ZoneHighlightTrack({ scale, reading }: ZoneHighlightArgs) {
  const mode = useSurfaceMode()
  const zones = highlightZones(scale, mode)
  const caption = mode === 'light' ? 'Light, step 50 (ships)' : 'Dark, as built (ships)'
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
 * other zone takes its `faded` colour. Light fades to step 50. Dark steps each zone down its
 * ramp until it clears 1.5:1 against a lit neighbour (Lab/Decisions/ZoneTrack Adjacent Contrast).
 */
export const ZoneHighlight: StoryObj<ZoneHighlightArgs> = {
  name: 'Zone highlight (ships)',
  args: { scale: 'effort', reading: 24 },
  argTypes: {
    scale: { control: 'select', options: ['effort', 'diverging'] },
    reading: { control: { type: 'range', min: 0, max: 40, step: 1 } },
  },
  render: function Render({ scale, reading }) {
    return <ZoneHighlightTrack scale={scale} reading={reading} />
  },
}
