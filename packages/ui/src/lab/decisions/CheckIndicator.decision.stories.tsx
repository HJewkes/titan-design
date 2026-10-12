import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text, View } from 'react-native'
import { SurfaceContext } from '../../components/ui/surface/SurfaceContext'
import type { ThemeMode } from '../../theme/tokens/semantic'
import { CheckIndicatorBox } from './CheckIndicatorBox'
import {
  CHECK_OPTIONS,
  MODES,
  NON_TEXT_FLOOR,
  PLANES,
  PLANE_LEVEL,
  SIZES,
  STATES,
  measureCheck,
  type CheckOption,
  type CheckOptionKey,
  type Plane,
  type Size,
} from './check-indicator-options'
import { modeColorProperties } from './focus-ring-options'

interface Args {
  option: CheckOptionKey | 'all'
  mode: ThemeMode | 'both'
}

const PLANE_CLASS: Record<Plane, string> = {
  'background-base': 'bg-background-base',
  'surface-base': 'bg-surface-base',
}

function verdict(ratio: number) {
  return ratio >= NON_TEXT_FLOOR ? ratio.toFixed(2) : `${ratio.toFixed(2)} (below 3)`
}

function ContrastLine({
  option,
  mode,
  plane,
}: {
  option: CheckOption
  mode: ThemeMode
  plane: Plane
}) {
  const m = measureCheck(option, mode, plane)
  return (
    <Text className="font-mono text-xs text-text-secondary">
      {plane} (level {PLANE_LEVEL[plane]}){'\n'}indicator / box {verdict(m.indicator)}
      {'\n'}checked box / plane {verdict(m.box)}
      {'\n'}unchecked border / plane {verdict(m.unchecked)}
    </Text>
  )
}

function SizeRow({ option, size }: { option: CheckOption; size: Size }) {
  return (
    <View className="flex-row items-end gap-4">
      <Text className="w-6 font-mono text-xs text-text-secondary">{size}</Text>
      {STATES.map((state) => (
        <View key={state} className="items-center gap-1" style={{ width: 84 }}>
          <CheckIndicatorBox option={option} size={size} state={state} />
          <Text className="font-mono text-xs text-text-tertiary">{state}</Text>
        </View>
      ))}
    </View>
  )
}

function ContextSample({ option }: { option: CheckOption }) {
  return (
    <View className="flex-row items-start gap-2">
      <CheckIndicatorBox option={option} size="md" state="checked" />
      <View className="flex-1">
        <Text className="font-heading text-base font-medium text-text-primary">
          Include warm-up sets
        </Text>
        <Text className="text-xs text-text-secondary mt-0.5">The label as TD-802 sets it.</Text>
      </View>
    </View>
  )
}

function PlaneRow({ option, mode, plane }: { option: CheckOption; mode: ThemeMode; plane: Plane }) {
  return (
    <View className={`${PLANE_CLASS[plane]} gap-3 p-5`}>
      <ContrastLine option={option} mode={mode} plane={plane} />
      {SIZES.map((size) => (
        <SizeRow key={size} option={option} size={size} />
      ))}
      <ContextSample option={option} />
    </View>
  )
}

function ModeBlock({ option, mode }: { option: CheckOption; mode: ThemeMode }) {
  return (
    <SurfaceContext.Provider value={{ mode, level: 'base' }}>
      <View style={modeColorProperties(mode)}>
        <View className="bg-background-base px-5 pt-4">
          <Text className="text-sm font-semibold text-text-primary">{mode}</Text>
        </View>
        {PLANES.map((plane) => (
          <PlaneRow key={plane} option={option} mode={mode} plane={plane} />
        ))}
      </View>
    </SurfaceContext.Provider>
  )
}

function OptionUnit({ option, modes }: { option: CheckOption; modes: ThemeMode[] }) {
  return (
    <View
      className="gap-2 rounded-lg border border-hairline p-4"
      testID={`check-option-${option.key}`}
    >
      <Text className="text-base font-semibold text-text-primary">{option.name}</Text>
      <Text className="text-sm text-text-secondary">{option.note}</Text>
      <View className="flex-row flex-wrap gap-2">
        {modes.map((mode) => (
          <View key={mode} className="flex-1" style={{ minWidth: 520 }}>
            <ModeBlock option={option} mode={mode} />
          </View>
        ))}
      </View>
    </View>
  )
}

/**
 * TD-802 Gate 2 batch 16 view: each checked-indicator option as one unit, at the three Checkbox
 * sizes, in the five states, on the two planes a form sits on (level -1 and 0), light beside dark.
 * Each mode block re-declares that mode's `--color-*` properties, so both modes render on one
 * page whatever the toolbar theme is. The focus cell wears the shipped `focus-ring` class.
 */
const meta: Meta<Args> = {
  title: 'Lab/Decisions/Check Indicator',
  tags: ['autodocs', 'status:lab', '!status:review'],
  args: { option: 'all', mode: 'both' },
  argTypes: {
    option: { control: 'inline-radio', options: ['all', ...CHECK_OPTIONS.map((o) => o.key)] },
    mode: { control: 'inline-radio', options: ['both', ...MODES] },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-802, Gate 2 batch 16). Paints the box of ' +
          '[Checkbox](?path=/docs/components-molecules-checkbox--docs) under five checked-indicator ' +
          'options; Checkbox itself is unchanged until the owner picks. The baseline is what main ' +
          'ships; squared radio is the owner’s suggestion; the other three are the shapes the ' +
          'established systems use (research note in the PR). Every option composes existing ' +
          'tokens: brand-primary, on-brand-primary, text-brand, text-primary and border-input. ' +
          'Under each plane: the indicator against what it sits on, the checked box against the ' +
          'plane, and the unchecked border against the plane (WCAG 1.4.11 non-text floor 3:1). ' +
          'A filled box identifies the checked state by its fill, so the box ratio is the binding ' +
          'one there; the indicator ratio says how well the mark itself reads, and is what ' +
          'separates checked from indeterminate.',
      },
    },
  },
  render: function Render({ option, mode }) {
    const options = option === 'all' ? CHECK_OPTIONS : CHECK_OPTIONS.filter((o) => o.key === option)
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
