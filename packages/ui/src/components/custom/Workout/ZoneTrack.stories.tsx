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

/** Each zone's light step 50, its dark "as built" step and its subtle token, left to right. */
const HIGHLIGHT_RAMPS: Record<
  HighlightScale,
  { light: string; asBuilt: string; subtle: SemanticToken }[]
> = {
  effort: [
    { light: r.green[50], asBuilt: r.green[500], subtle: 'status-success-subtle' },
    { light: r.amber[50], asBuilt: r.amber[600], subtle: 'status-warning-subtle' },
    { light: r.orange[50], asBuilt: r.orange[700], subtle: 'brand-primary-subtle' },
    { light: r.red[50], asBuilt: r.red[800], subtle: 'status-error-subtle' },
  ],
  diverging: [
    { light: r.blue[50], asBuilt: r.blue[700], subtle: 'status-info-subtle' },
    { light: r.cyan[50], asBuilt: r.cyan[600], subtle: 'brand-secondary-subtle' },
    { light: r.green[50], asBuilt: r.green[500], subtle: 'status-success-subtle' },
    { light: r.amber[50], asBuilt: r.amber[700], subtle: 'status-warning-subtle' },
    { light: r.red[50], asBuilt: r.red[800], subtle: 'status-error-subtle' },
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
      ? 'Light, step 50 (ships; the same in both dark options)'
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
 * other zone takes its `faded` colour. Light fades to step 50. Dark steps each zone down its
 * ramp until it clears 1.5:1 against a lit neighbour (Lab/Decisions/ZoneTrack Adjacent Contrast).
 */
export const ZoneHighlight = {
  ...zoneHighlightStory('asBuilt'),
  name: 'Dark, as built (ships)',
}

/**
 * The alternative dark fade, for comparison only: each zone's hue takes its subtle fill token,
 * painted over the plane. Light is the same step 50 as the shipped story.
 */
export const ZoneHighlightSubtle = {
  ...zoneHighlightStory('subtle'),
  name: 'Dark, subtle tokens (alternative)',
}
