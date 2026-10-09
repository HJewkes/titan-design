import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text, View } from 'react-native'
import { Card } from '../../components/ui/card'
import { Surface } from '../../components/ui/surface'
import { ZoneTrack } from '../../components/custom/Workout/ZoneTrack'
import { WHOLE_BODY_WEIGHT as W } from '../../components/custom/Workout/wholeBody-fixture'
import { bandDomain } from '../../components/custom/Workout/wholeBody'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { BAND_OPTIONS, readBand, type BandOption, type BandOptionKey } from './bodyweight-band'

interface Args {
  option: 'all' | BandOptionKey
}

const WEIGH_IN = W.cut.latest?.value ?? (W.cut.week.low + W.cut.week.high) / 2

const ratio = (n: number) => n.toFixed(2)

function BandColumn({ option, mode }: { option: BandOption; mode: ThemeMode }) {
  const reading = readBand(option, mode)
  const ink = getSemanticColors(mode)['text-primary']
  const { low, high } = W.cut.week
  const { min, max } = bandDomain(low, high, WEIGH_IN)
  return (
    <Surface level="base" theme={mode} className="min-w-[320px] flex-1 p-gutter-sm">
      <Card elevation={1} className="gap-stack-md p-inset-lg" testID={`band-${option.key}-${mode}`}>
        <Text className="text-sm font-semibold" style={{ color: ink }}>
          {mode === 'dark' ? 'Dark' : 'Light'}
        </Text>
        <ZoneTrack
          min={min}
          max={max}
          zones={[{ upTo: max, color: 'transparent' }]}
          band={{ from: Math.min(low, high), to: Math.max(low, high), color: reading.color }}
          ticks={[{ value: Math.min(low, high) }, { value: Math.max(low, high) }]}
          marker={{ type: 'needle', value: WEIGH_IN, color: ink }}
          accessibilityLabel={`${option.title}, ${mode}`}
        />
        <Text className="font-mono text-[10px]" style={{ color: ink }}>
          {reading.stepLabel}
        </Text>
        <Text className="font-mono text-[10px]" style={{ color: ink }}>
          {`bar vs track ${ratio(reading.barVsTrack)} · bar vs plane ${ratio(reading.barVsPlane)}`}
        </Text>
      </Card>
    </Surface>
  )
}

function Bands({ option }: Args) {
  const shown = option === 'all' ? BAND_OPTIONS : BAND_OPTIONS.filter((o) => o.key === option)
  return (
    <View className="gap-section-md bg-background-base p-gutter-md">
      {shown.map((o) => (
        <View key={o.key} className="gap-stack-sm" testID={`band-option-${o.key}`}>
          <Text className="text-lg font-semibold text-text-primary" accessibilityRole="header">
            {o.title}
          </Text>
          <View className="flex-row flex-wrap gap-gutter-sm">
            <BandColumn option={o} mode="dark" />
            <BandColumn option={o} mode="light" />
          </View>
        </View>
      ))}
    </View>
  )
}

const meta: Meta<Args> = {
  title: 'Lab/Decisions/Bodyweight Band',
  tags: ['autodocs', 'status:lab', '!status:review'],
  args: { option: 'all' },
  argTypes: {
    option: { control: 'inline-radio', options: ['all', ...BAND_OPTIONS.map((o) => o.key)] },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-325). The middle of the BodyweightGoalCard bar is a translucent ' +
          'overlay, not a lighter ramp step: `brand-secondary` (cyan 500 dark, 600 light) at 28% ' +
          'over the track. Each option keeps that 28% and moves the cyan one or two ramp steps ' +
          'more intense (brighter on dark, deeper on light). Each unit shows dark and light, the ' +
          'ramp step, and the band-over-track against the track and against the card plane. ' +
          'No token changes.',
      },
    },
  },
  render: (args) => <Bands {...args} />,
}
export default meta
type Story = StoryObj<Args>

export const Default: Story = {}
