import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ZoneTrack } from '../../components/custom/Workout/ZoneTrack'
import type { ThemeMode } from '../../theme/tokens/semantic'
import { Caption, MODES, ModeUnit, Swatch, UnitRow } from './ZoneFadeFrame'
import {
  ADJACENT_FLOOR,
  PALETTES,
  PLANE_FLOOR,
  SCALES,
  fadedPalette,
  highlightZones,
  rampLabel,
  scaleZones,
  type PaletteId,
  type ScaleId,
  type ZoneReading,
} from './zone-fade'

const ZONE_SPAN = 10

function readingCaption({ lit, vsLit, vsPlane }: ZoneReading): string {
  const plane = `${vsPlane.toFixed(2)} plane${vsPlane < PLANE_FLOOR ? ' MISS' : ''}`
  if (lit) return `lit\n${plane}`
  if (vsLit == null) return `\n${plane}`
  return `${vsLit.toFixed(2)} vs lit${vsLit < ADJACENT_FLOOR ? ' MISS' : ''}\n${plane}`
}

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
  const readings = highlightZones(palette, scale, mode, lit)
  const reading = lit * ZONE_SPAN + ZONE_SPAN / 2
  return (
    <View className="gap-1">
      <Caption mode={mode}>{`${rampLabel(readings[lit].color)} lit`}</Caption>
      <ZoneTrack
        zones={readings.map(({ color }, i) => ({ upTo: (i + 1) * ZONE_SPAN, color: color.hex }))}
        max={readings.length * ZONE_SPAN}
        marker={{ type: 'needle', value: reading }}
        accessibilityLabel={`${SCALES[scale]}, reading ${reading}`}
      />
      <View className="flex-row gap-1">
        {readings.map((r) => (
          <Swatch
            key={r.color.ramp}
            mode={mode}
            fill={r.color.hex}
            label={rampLabel(r.color)}
            caption={readingCaption(r)}
          />
        ))}
      </View>
    </View>
  )
}

function ScaleBlock({
  palette,
  scale,
  mode,
}: {
  palette: PaletteId
  scale: ScaleId
  mode: ThemeMode
}) {
  const steps = fadedPalette(palette, scale, mode).map(rampLabel).join(', ')
  return (
    <View className="gap-3" testID={`zone-adjacent-${scale}`}>
      <Caption mode={mode}>{`${SCALES[scale]}\nfaded: ${steps}`}</Caption>
      {scaleZones(scale, mode).map((zone, lit) => (
        <ReadingRow key={zone.ramp} palette={palette} scale={scale} mode={mode} lit={lit} />
      ))}
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
            {`Every zone lit in turn. Under each swatch: the lit zone's neighbours against it ` +
              `(floor ${ADJACENT_FLOOR}:1), and every zone against surface-base ` +
              `(floor ${PLANE_FLOOR}:1). MISS marks a ratio under its floor.`}
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
 * TD-750, owner round: the faded palette is chosen by the contrast between the lit zone and the
 * faded zones beside it, not against the zone's own full colour. One story per option, each in
 * dark and light: the chosen palette, then the owner's two named alternatives. The shipped
 * component is unchanged.
 */
const meta: Meta<{ palette: PaletteId }> = {
  title: 'Lab/Decisions/ZoneTrack Adjacent Contrast',
  tags: ['status:lab', '!status:review'],
  args: { palette: 'adjacentFloor' },
  argTypes: { palette: { control: 'select', options: Object.keys(PALETTES) } },
  parameters: { layout: 'fullscreen' },
  render: (args) => <PaletteUnits {...args} />,
}
export default meta
type Story = StoryObj<{ palette: PaletteId }>

export const Chosen: Story = { args: { palette: 'adjacentFloor' } }
export const DarkOneStepFurther: Story = { args: { palette: 'darkFurther' } }
export const LightCyanBlueOneShadeFurther: Story = { args: { palette: 'lightCoolFurther' } }
