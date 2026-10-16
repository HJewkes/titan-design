import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text, View, type ViewStyle } from 'react-native'
import { getPressedRecessShadow } from '../../theme/elevation'
import type { ThemeMode } from '../../theme/tokens/semantic'
import {
  MODES,
  PLANES,
  WELL_OPTIONS,
  measureWell,
  modeColorProperties,
  type Plane,
  type WellOption,
  type WellOptionKey,
} from './inset-well-options'

interface Args {
  option: WellOptionKey | 'all'
  mode: ThemeMode | 'both'
}

/** The filled field's shape (Input md: h-10 px-4 rounded-md, transparent border) in a given well. */
function Field({
  well,
  mode,
  text,
  chevron,
}: {
  well: string
  mode: ThemeMode
  text: string
  chevron?: boolean
}) {
  const style = { backgroundColor: well, ...getPressedRecessShadow(well, mode) } as ViewStyle
  return (
    <View
      style={style}
      className="h-10 w-44 flex-row items-center justify-between rounded-md border border-transparent px-4"
    >
      <Text className="text-base text-text-primary">{text}</Text>
      {chevron ? <Text className="text-sm text-text-secondary">▾</Text> : null}
    </View>
  )
}

function PlaneRow({ option, mode, plane }: { option: WellOption; mode: ThemeMode; plane: Plane }) {
  const m = measureWell(option, plane, mode)
  return (
    <View
      style={{ backgroundColor: m.plane }}
      className="flex-row flex-wrap items-center gap-5 px-5 py-4"
    >
      <Text className="w-36 font-mono text-xs text-text-secondary">
        {plane} plane{'\n'}
        {m.plane}
      </Text>
      <Field well={m.well} mode={mode} text="185 lb" />
      <Field well={m.well} mode={mode} text="Bench press" chevron />
      <Text className="font-mono text-xs text-text-secondary">
        well {m.well}
        {'\n'}vs plane {m.againstPlane.toFixed(2)}:1 · ΔE {m.deltaE.toFixed(1)}
        {'\n'}text-primary on well {m.text.toFixed(2)}:1
      </Text>
    </View>
  )
}

function ModeBlock({ option, mode }: { option: WellOption; mode: ThemeMode }) {
  return (
    <View style={modeColorProperties(mode) as ViewStyle}>
      <View className="bg-background-base px-5 pt-4">
        <Text className="text-sm font-semibold text-text-primary">{mode}</Text>
      </View>
      {PLANES.map((plane) => (
        <PlaneRow key={plane} option={option} mode={mode} plane={plane} />
      ))}
    </View>
  )
}

function OptionUnit({ option, modes }: { option: WellOption; modes: ThemeMode[] }) {
  return (
    <View
      className="gap-2 rounded-lg border border-hairline p-4"
      testID={`well-option-${option.key}`}
    >
      <Text className="text-base font-semibold text-text-primary">{option.name}</Text>
      <Text className="text-sm text-text-secondary">{option.note}</Text>
      <View className="gap-2">
        {modes.map((mode) => (
          <ModeBlock key={mode} option={option} mode={mode} />
        ))}
      </View>
    </View>
  )
}

/**
 * TD-278 Gate 2 view: the filled Input / Select well on the five planes, in light and dark,
 * one unit per option. Each mode block re-declares that mode's `--color-*` properties, so both
 * modes render on one page whatever the toolbar theme is.
 */
const meta: Meta<Args> = {
  title: 'Lab/Decisions/Inset Well',
  tags: ['autodocs', 'status:lab', '!status:review'],
  args: { option: 'all', mode: 'both' },
  argTypes: {
    option: { control: 'inline-radio', options: ['all', ...WELL_OPTIONS.map((o) => o.key)] },
    mode: { control: 'inline-radio', options: ['both', ...MODES] },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-278). The filled [Input](?path=/docs/components-atoms-input--docs) and ' +
          'Select trigger shape, drawn by hand so every option can be painted: the well fill plus the ' +
          'inset-well recess (`getPressedRecessShadow`, web only). Under each row: the well hex, its ' +
          'contrast and OKLab ΔE against the plane, and text-primary on the well. Option 1 is what the ' +
          'components ship on this branch; option 3 needs a new well token.',
      },
    },
  },
  render: function Render({ option, mode }) {
    const options = option === 'all' ? WELL_OPTIONS : WELL_OPTIONS.filter((o) => o.key === option)
    const modes = mode === 'both' ? MODES : [mode]
    return (
      <View className="gap-6">
        {options.map((o) => (
          <OptionUnit key={o.key} option={o} modes={modes} />
        ))}
      </View>
    )
  },
}
export default meta
type Story = StoryObj<Args>

export const Options: Story = {}
