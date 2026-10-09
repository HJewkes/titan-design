import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ZoneTrack } from '../../components/custom/Workout/ZoneTrack'
import type { ThemeMode } from '../../theme/tokens/semantic'
import { Caption, MODES, ModeUnit, UnitRow } from './ZoneFadeFrame'
import {
  PALETTES,
  SCALES,
  highlightZones,
  rampLabel,
  scaleZones,
  type PaletteId,
  type ScaleId,
} from './zone-fade'

const ZONE_SPAN = 10

function ReadingRow({
  palette,
  scale,
  mode,
  lit,
}: {
  palette: PaletteId
  scale: ScaleId
  mode: ThemeMode
  lit: number
}) {
  const colors = highlightZones(palette, scale, mode, lit)
  const reading = lit * ZONE_SPAN + ZONE_SPAN / 2
  const litLabel = rampLabel(scaleZones(scale, mode)[lit])
  return (
    <View className="gap-1">
      <Caption mode={mode}>{`reading ${reading}: ${litLabel} lit`}</Caption>
      <ZoneTrack
        zones={colors.map((color, i) => ({ upTo: (i + 1) * ZONE_SPAN, color }))}
        max={colors.length * ZONE_SPAN}
        marker={{ type: 'needle', value: reading }}
        accessibilityLabel={`${SCALES[scale]}, reading ${reading}`}
      />
    </View>
  )
}

function HighlightUnits({ palette }: { palette: PaletteId }) {
  return (
    <UnitRow>
      {MODES.map((mode) => (
        <ModeUnit
          key={mode}
          mode={mode}
          title={`Zone highlight, faded: ${PALETTES[palette].title}`}
        >
          {(Object.keys(SCALES) as ScaleId[]).map((scale) => (
            <View key={scale} className="gap-2" testID={`zone-highlight-${scale}`}>
              <Caption mode={mode}>{SCALES[scale]}</Caption>
              {scaleZones(scale, mode).map((zone, lit) => (
                <ReadingRow key={zone.hex} palette={palette} scale={scale} mode={mode} lit={lit} />
              ))}
            </View>
          ))}
        </ModeUnit>
      ))}
    </UnitRow>
  )
}

/**
 * TD-750, owner round: highlight the zone the reading lands in instead of filling the track up
 * to it. The landed zone keeps its full colour; every other zone takes a faded palette (see
 * `Lab/Decisions/ZoneTrack Faded Palette`). One row per zone the reading can land in, in dark
 * and light. The marker is the component's default needle; the shipped component is unchanged.
 */
const meta: Meta<{ palette: PaletteId }> = {
  title: 'Lab/Decisions/ZoneTrack Zone Highlight',
  tags: ['status:lab', '!status:review'],
  args: { palette: 'stepTwo' },
  argTypes: { palette: { control: 'select', options: Object.keys(PALETTES) } },
  parameters: { layout: 'fullscreen' },
  render: (args) => <HighlightUnits {...args} />,
}
export default meta
type Story = StoryObj<{ palette: PaletteId }>

export const Default: Story = {}
