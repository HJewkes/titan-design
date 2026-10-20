import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ZoneTrack } from '../../components/custom/Workout/ZoneTrack'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { Caption, ModeUnit, Swatch, UnitRow } from './ZoneFadeFrame'
import {
  ADJACENT_FLOOR,
  PALETTE,
  PLANES,
  PLANE_FLOOR,
  SCALES,
  fadedPalette,
  highlightZones,
  paintOn,
  planeReadings,
  scaleZones,
  type PlaneReading,
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

const ratio = (value: number, floor: number) => `${value.toFixed(2)}${value < floor ? ' MISS' : ''}`

function ReadingRow({ scale, mode, lit }: UnitProps & { scale: ScaleId; lit: number }) {
  const readings = highlightZones(scale, mode, lit)
  const plane = getSemanticColors(mode)['surface-base']
  const reading = lit * ZONE_SPAN + ZONE_SPAN / 2
  return (
    <View className="gap-1">
      <Caption mode={mode}>{`${readings[lit].color.label} lit`}</Caption>
      <ZoneTrack
        zones={readings.map(({ color }, i) => ({
          upTo: (i + 1) * ZONE_SPAN,
          color: paintOn(color.fill, plane),
        }))}
        max={readings.length * ZONE_SPAN}
        marker={{ type: 'needle', value: reading }}
        accessibilityLabel={`${SCALES[scale]}, reading ${reading}`}
      />
      <View className="flex-row flex-wrap gap-1">
        {readings.map((r) => (
          <Swatch
            key={r.color.ramp}
            mode={mode}
            fill={paintOn(r.color.fill, plane)}
            label={r.color.label}
            caption={readingCaption(r)}
          />
        ))}
      </View>
    </View>
  )
}

/** The faded zones beside the track, on one plane, each with its ratio to both. */
function PlaneRow({ mode, reading }: { mode: ThemeMode; reading: PlaneReading }) {
  return (
    <View className="gap-1 rounded-sm p-2" style={{ backgroundColor: reading.plane }}>
      <Caption mode={mode}>{`plane ${reading.level} (${PLANES[reading.level]})`}</Caption>
      <View className="flex-row flex-wrap gap-1">
        <Swatch mode={mode} fill={reading.track} label="track" caption="border-prominent" />
        {reading.zones.map(({ color, painted, vsTrack, vsPlane }) => (
          <Swatch
            key={color.ramp}
            mode={mode}
            fill={painted}
            label={color.label}
            caption={
              `${ratio(vsTrack, PLANE_FLOOR)} track\n` + `${ratio(vsPlane, PLANE_FLOOR)} plane`
            }
          />
        ))}
      </View>
    </View>
  )
}

function ScaleBlock({ scale, mode }: UnitProps & { scale: ScaleId }) {
  const steps = fadedPalette(scale, mode)
    .map(({ label }) => label)
    .join(', ')
  return (
    <View className="gap-3" testID={`zone-adjacent-${scale}`}>
      <Caption mode={mode}>{`${SCALES[scale]}\nfaded: ${steps}`}</Caption>
      {scaleZones(scale, mode).map((zone, lit) => (
        <ReadingRow key={zone.ramp} scale={scale} mode={mode} lit={lit} />
      ))}
      {planeReadings(scale, mode).map((reading) => (
        <PlaneRow key={reading.level} mode={mode} reading={reading} />
      ))}
    </View>
  )
}

interface UnitProps {
  mode: ThemeMode
}

const LIGHT_TITLE = 'Light, step 50 (ships)'

function PaletteUnit({ mode }: UnitProps) {
  const { note } = PALETTE
  const title = mode === 'light' ? LIGHT_TITLE : PALETTE.title
  return (
    <ModeUnit mode={mode} title={title}>
      <Caption mode={mode}>{note}</Caption>
      <Caption mode={mode}>
        {`Every zone lit in turn. Under each swatch: the lit zone's neighbours against it ` +
          `(floor ${ADJACENT_FLOOR}:1) and every zone against surface-base. Below, each faded ` +
          `zone against the track and the plane on planes 0 and -1 (floor ${PLANE_FLOOR}:1). ` +
          `The track is measured as painted over the plane. MISS marks a ratio under its floor.`}
      </Caption>
      {(Object.keys(SCALES) as ScaleId[]).map((scale) => (
        <ScaleBlock key={scale} scale={scale} mode={mode} />
      ))}
    </ModeUnit>
  )
}

/** The shipped fade: dark as built, then light at step 50, on the same data. */
const MODES: ThemeMode[] = ['dark', 'light']

function RoundUnits() {
  return (
    <UnitRow>
      {MODES.map((mode) => (
        <PaletteUnit key={mode} mode={mode} />
      ))}
    </UnitRow>
  )
}

/**
 * TD-750, owner round: light fades every zone to step 50, the one step that clears both light planes.
 * Dark ships as built, the owner's pick over the subtle fill tokens.
 */
const meta: Meta = {
  title: 'Lab/Decisions/ZoneTrack Adjacent Contrast',
  tags: ['status:lab', '!status:review'],
  parameters: { layout: 'fullscreen' },
  render: () => <RoundUnits />,
}
export default meta
type Story = StoryObj

export const Chosen: Story = {}
