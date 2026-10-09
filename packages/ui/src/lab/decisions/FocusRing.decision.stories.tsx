import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Text, View, type ViewStyle } from 'react-native'
import { ActivityIcon } from '../../components/icons'
import { Button, ButtonText } from '../../components/ui/button'
import { Chip } from '../../components/ui/chip'
import { Input } from '../../components/ui/input'
import { SurfaceContext } from '../../components/ui/surface/SurfaceContext'
import { DateSeparator } from '../../components/custom/Chat'
import { NavItem } from '../../components/shell/NavItem'
import type { ThemeMode } from '../../theme/tokens/semantic'
import {
  FOCUS_OPTIONS,
  MODES,
  NON_TEXT_FLOOR,
  PLANES,
  SAMPLE_KEYS,
  measureRing,
  modeColorProperties,
  type FocusOption,
  type FocusOptionKey,
  type Plane,
  type SampleKey,
} from './focus-ring-options'

interface Args {
  option: FocusOptionKey | 'all'
  mode: ThemeMode | 'both'
}

const FIXED_NOW = '2026-10-08T12:00:00Z'

interface SampleSpec {
  label: string
  radius: number
  width?: number
  render: () => ReactNode
}

const SAMPLES: Record<SampleKey, SampleSpec> = {
  button: {
    label: 'Button',
    radius: 6,
    render: () => (
      <Button size="sm">
        <ButtonText>Save</ButtonText>
      </Button>
    ),
  },
  input: {
    label: 'Input',
    radius: 6,
    width: 150,
    render: () => <Input placeholder="Search" accessibilityLabel="Search" />,
  },
  chip: { label: 'Chip', radius: 6, render: () => <Chip onPress={() => {}}>Filter</Chip> },
  navItem: {
    label: 'NavItem',
    radius: 0,
    render: () => <NavItem icon={<ActivityIcon />} label="Train" onPress={() => {}} />,
  },
  dateSeparator: {
    label: 'Chat date separator',
    radius: 0,
    width: 170,
    render: () => <DateSeparator date={FIXED_NOW} now={FIXED_NOW} onPress={() => {}} />,
  },
}

const PLANE_CLASS: Record<Plane, string> = {
  'background-base': 'bg-background-base',
  'surface-base': 'bg-surface-base',
  'surface-elevated': 'bg-surface-elevated',
}

/** The ring as the focused state would paint it; a static story cannot hold :focus-visible. */
function ringStyle(option: FocusOption, plane: Plane, spec: SampleSpec): ViewStyle {
  const ring = `var(--color-${option.ring})`
  const paint = option.isTwoTone
    ? { boxShadow: `0 0 0 2px var(--color-${plane}), 0 0 0 4px ${ring}` }
    : { outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2, outlineColor: ring }
  return { ...paint, borderRadius: spec.radius, width: spec.width } as ViewStyle
}

function verdict(ratio: number | null) {
  if (ratio === null) return 'none'
  return `${ratio.toFixed(2)}${ratio >= NON_TEXT_FLOOR ? '' : ' (below 3)'}`
}

function SampleCell(props: {
  option: FocusOption
  mode: ThemeMode
  plane: Plane
  sample: SampleKey
}) {
  const { option, mode, plane, sample } = props
  const spec = SAMPLES[sample]
  const measured = measureRing(option, mode, plane, sample)
  return (
    <View className="items-start gap-2" style={{ width: 180 }}>
      <View className="self-start" style={ringStyle(option, plane, spec)}>
        {spec.render()}
      </View>
      <Text className="font-mono text-xs text-text-secondary">
        {spec.label}
        {'\n'}plane {verdict(measured.plane)}
        {'\n'}component {verdict(measured.component)}
      </Text>
    </View>
  )
}

function PlaneRow({ option, mode, plane }: { option: FocusOption; mode: ThemeMode; plane: Plane }) {
  return (
    <View className={`${PLANE_CLASS[plane]} gap-3 p-5`}>
      <Text className="font-mono text-xs text-text-secondary">{plane}</Text>
      <View className="flex-row flex-wrap gap-6">
        {SAMPLE_KEYS.map((sample) => (
          <SampleCell key={sample} option={option} mode={mode} plane={plane} sample={sample} />
        ))}
      </View>
    </View>
  )
}

function ModeBlock({ option, mode }: { option: FocusOption; mode: ThemeMode }) {
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

function OptionUnit({ option, modes }: { option: FocusOption; modes: ThemeMode[] }) {
  return (
    <View
      className="gap-2 rounded-lg border border-hairline p-4"
      testID={`focus-option-${option.key}`}
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
 * TD-765 Gate 2 view: each focus-ring option as one unit, painted on a real Button, Input,
 * Chip, NavItem and Chat date separator, on the three planes they sit on, in light and dark.
 * Each mode block re-declares that mode's `--color-*` properties from `getSemanticColors`,
 * so both modes render on one page whatever the toolbar theme is.
 */
const meta: Meta<Args> = {
  title: 'Lab/Decisions/Focus Ring',
  tags: ['autodocs', 'status:lab', '!status:review'],
  args: { option: 'all', mode: 'both' },
  argTypes: {
    option: { control: 'inline-radio', options: ['all', ...FOCUS_OPTIONS.map((o) => o.key)] },
    mode: { control: 'inline-radio', options: ['both', ...MODES] },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-765). Composes [Button](?path=/docs/components-atoms-button--docs), ' +
          '[Input](?path=/docs/components-atoms-input--docs), [Chip](?path=/docs/components-atoms-chip--docs), ' +
          '[NavItem](?path=/docs/shell-navitem--docs) and the Chat DateSeparator. Keyboard focus is ' +
          'the global `*:focus-visible` outline (2px `border-focus`, 2px offset); each option swaps ' +
          'the ring for another existing token. Under each sample: the ring against the plane and ' +
          'against the component edge (WCAG 1.4.11 / 2.4.11 non-text floor 3:1). With the offset ' +
          'or the painted gap the ring touches only the plane, so the plane ratio is the binding ' +
          'one; the component ratio says how well the ring reads against the control itself.',
      },
    },
  },
  render: function Render({ option, mode }) {
    const options = option === 'all' ? FOCUS_OPTIONS : FOCUS_OPTIONS.filter((o) => o.key === option)
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
