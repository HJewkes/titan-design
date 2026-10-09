import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ZoneTrack } from '../../components/custom/Workout/ZoneTrack'
import type { ThemeMode } from '../../theme/tokens/semantic'
import { Caption, MODES, ModeUnit, Swatch, UnitRow } from './ZoneFadeFrame'
import { PALETTES, SCALES, measureFade, rampLabel, type PaletteId, type ScaleId } from './zone-fade'

const ZONE_SPAN = 10

function ScaleBlock({
  palette,
  scale,
  mode,
}: {
  palette: PaletteId
  scale: ScaleId
  mode: ThemeMode
}) {
  const measured = measureFade(palette, scale, mode)
  return (
    <View className="gap-2" testID={`zone-fade-${scale}`}>
      <Caption mode={mode}>{SCALES[scale]}</Caption>
      <View className="flex-row gap-1">
        {measured.map(({ bright }) => (
          <Swatch key={bright.hex} mode={mode} fill={bright.hex} label={rampLabel(bright)} />
        ))}
      </View>
      <View className="flex-row gap-1">
        {measured.map(({ bright, faded, vsBright, vsPlane }) => (
          <Swatch
            key={bright.hex}
            mode={mode}
            fill={faded.hex}
            label={faded.label}
            caption={`${vsBright.toFixed(2)} bright\n${vsPlane.toFixed(2)} plane`}
          />
        ))}
      </View>
      <ZoneTrack
        zones={measured.map(({ faded }, i) => ({ upTo: (i + 1) * ZONE_SPAN, color: faded.hex }))}
        max={measured.length * ZONE_SPAN}
        accessibilityLabel={`${SCALES[scale]}, faded`}
      />
    </View>
  )
}

function PaletteUnits({ palette }: { palette: PaletteId }) {
  const { title, note } = PALETTES[palette]
  return (
    <UnitRow>
      {MODES.map((mode) => (
        <ModeUnit key={mode} mode={mode} title={title}>
          <Caption mode={mode}>{note}</Caption>
          <Caption mode={mode}>
            Top row: the zone colours today. Below: the faded palette, then the track in it. Ratios
            are WCAG contrast against the bright zone and against surface-base.
          </Caption>
          {(Object.keys(SCALES) as ScaleId[]).map((scale) => (
            <ScaleBlock key={scale} palette={palette} scale={scale} mode={mode} />
          ))}
        </ModeUnit>
      ))}
    </UnitRow>
  )
}

/**
 * TD-750, owner round: the faded palette a zone highlight paints for the zones the reading is
 * not in. One story per option, each in dark and light. A and B step each zone colour down its
 * own ramp toward the plane; C overlays a scrim, lighter in light (the owner found 30% too dark).
 */
const meta: Meta<{ palette: PaletteId }> = {
  title: 'Lab/Decisions/ZoneTrack Faded Palette',
  tags: ['status:lab', '!status:review'],
  args: { palette: 'stepOne' },
  argTypes: { palette: { control: 'select', options: Object.keys(PALETTES) } },
  parameters: { layout: 'fullscreen' },
  render: (args) => <PaletteUnits {...args} />,
}
export default meta
type Story = StoryObj<{ palette: PaletteId }>

export const StepDownOne: Story = { args: { palette: 'stepOne' } }
export const StepDownTwo: Story = { args: { palette: 'stepTwo' } }
export const Scrim: Story = { args: { palette: 'scrim' } }
