import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Typography } from '../../components/ui/typography'
import { Surface, useSurfaceMode } from '../../components/ui/surface'
import { ZoneTrack, type ZoneTrackZone } from '../../components/custom/Workout/ZoneTrack'
import { WORKOUT_TOKENS, heatmapColors } from '../../theme/workout-tokens'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { compositeOver, contrast } from '../../theme/color-checks'
import { alpha } from '../../utils/colors'

const FILL_VALUE = 24
const MAX = 40

interface OverlayOption {
  title: string
  note: string
  overlay: (mode: ThemeMode) => string
}

/** The empty the other bar views paint (SetBar to-do, Gauge ticks): border-prominent, flattened. */
function emptyTrack(mode: ThemeMode) {
  const c = getSemanticColors(mode)
  return compositeOver(c['border-prominent'], c['surface-base'])
}

const OPTIONS = {
  opaque: {
    title: 'A. Opaque empty',
    note:
      'border-prominent flattened onto the plane: the colour SetBar paints a to-do rep and Gauge an ' +
      'unfilled tick. Hides the zones past the fill in both themes.',
    overlay: emptyTrack,
  },
  emptyTint: {
    title: 'B. Empty tint, 60%',
    note:
      'Option A at 60% alpha, so the zone hue shows through the empty grey. NEW VALUE: 60% is not ' +
      'a token; it needs the owner before it ships.',
    overlay: (mode) => alpha(emptyTrack(mode), 0.6),
  },
  scrimSubtle: {
    title: 'C. Shade, scrim-subtle',
    note: 'Black at 30% (the scrim-subtle token, the same in both themes). Darkens, keeps the hue.',
    overlay: (mode) => getSemanticColors(mode)['scrim-subtle'],
  },
  scrimDefault: {
    title: 'D. Shade, scrim-default',
    note: 'Black at 50% (the scrim-default token, the modal backdrop). The deepest darkening.',
    overlay: (mode) => getSemanticColors(mode)['scrim-default'],
  },
} satisfies Record<string, OverlayOption>

type OptionKey = keyof typeof OPTIONS

function fixtures(mode: ThemeMode): Array<{ name: string; zones: ZoneTrackZone[] }> {
  const { green, yellow, orange, red } = WORKOUT_TOKENS.scale
  const heat = heatmapColors(mode)
  return [
    {
      name: 'Fatigue (effort scale)',
      zones: [
        { upTo: 10, color: green },
        { upTo: 20, color: yellow },
        { upTo: 30, color: orange },
        { upTo: 40, color: red },
      ],
    },
    {
      name: 'Volume (dataviz-diverging)',
      zones: [
        { upTo: 8, color: heat.under },
        { upTo: 16, color: heat.maintenance },
        { upTo: 24, color: heat.productive },
        { upTo: 32, color: heat.approaching },
        { upTo: 40, color: heat.over },
      ],
    },
  ]
}

/** One line per zone past the fill: the colour it shows and its contrast. */
function Measurements({
  zones,
  overlay,
  mode,
}: {
  zones: ZoneTrackZone[]
  overlay: string
  mode: ThemeMode
}) {
  const plane = getSemanticColors(mode)['surface-base']
  const unreached = zones.filter((z) => z.upTo > FILL_VALUE)
  return (
    <View testID="zone-track-unreached-measurements">
      {unreached.map((z) => {
        const shown = compositeOver(overlay, z.color)
        return (
          <Typography key={z.upTo} variant="mono" color="secondary">
            {`${z.color} → ${shown} · ${contrast(shown, plane).toFixed(2)}:1 on plane · ` +
              `${contrast(shown, z.color).toFixed(2)}:1 vs the bare zone`}
          </Typography>
        )
      })}
    </View>
  )
}

function OptionFrame({ option }: { option: OptionKey }) {
  const mode = useSurfaceMode()
  const { title, note, overlay } = OPTIONS[option]
  const trackColor = overlay(mode)
  return (
    <View className="gap-stack-md" testID={`zone-track-unreached-${option}`}>
      <Typography variant="subtitle1">{title}</Typography>
      <Typography variant="body2" color="secondary">
        {`${note} Overlay: ${trackColor}.`}
      </Typography>
      {fixtures(mode).map(({ name, zones }) => (
        <View key={name} className="gap-stack-sm">
          <Typography variant="overline" color="secondary">
            {name}
          </Typography>
          <ZoneTrack
            zones={zones}
            max={MAX}
            marker={{ type: 'fill', value: FILL_VALUE }}
            trackColor={trackColor}
          />
          <Measurements zones={zones} overlay={trackColor} mode={mode} />
        </View>
      ))}
    </View>
  )
}

/**
 * TD-750, owner round: the un-reached overlay must match in both themes, and darken the zones
 * rather than lighten them (dark painted white at 30%, light opaque grey 400). Each story is one
 * option, theme-aware: switch the theme to compare. Option A is the empty the other bar views
 * paint; B to D are darkening tints. Every option keeps the one-layer fix: the pill is clear
 * under a fill marker, so the overlay is the only layer over the zones.
 */
const meta: Meta<{ option: OptionKey }> = {
  title: 'Lab/Decisions/ZoneTrack Unreached',
  tags: ['status:lab', '!status:review'],
  args: { option: 'opaque' },
  argTypes: { option: { control: 'select', options: Object.keys(OPTIONS) } },
  render: (args) => <OptionFrame {...args} />,
  decorators: [
    (Story) => (
      <Surface level="base" style={{ width: 560, padding: 20 }}>
        <Story />
      </Surface>
    ),
  ],
}
export default meta
type Story = StoryObj<{ option: OptionKey }>

export const OpaqueEmpty: Story = { args: { option: 'opaque' } }
export const EmptyTint: Story = { args: { option: 'emptyTint' } }
export const ShadeSubtle: Story = { args: { option: 'scrimSubtle' } }
export const ShadeDefault: Story = { args: { option: 'scrimDefault' } }
