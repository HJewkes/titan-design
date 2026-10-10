import { Text, View } from 'react-native'
import { primitiveRamps } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import {
  LEVEL_ROLE,
  planesFor,
  readRamp,
  stepName,
  type LevelReading,
  type RampOption,
  type StepVerdict,
} from './elevation-ramps'

// Each column paints its own mode, so text reads that mode's role hexes, not the story theme.
// The dark mark is red[300]: dark `text-error` (red[500]) sits below 4.5:1 on the base plane.
const MARK: Record<ThemeMode, string> = {
  dark: primitiveRamps.red[300],
  light: primitiveRamps.red[700],
}

const VERDICT_TEXT: Record<StepVerdict, string> = {
  up: '',
  shared: 'shares the overlay plane (by design; the lift separates)',
  flat: 'NOT MONOTONIC: same as the level below',
  down: 'NOT MONOTONIC: darker than the level below',
}

const ratio = (n: number | undefined) => (n === undefined ? '—' : n.toFixed(2))

function Swatch({ r, mode, page }: { r: LevelReading; mode: ThemeMode; page: string }) {
  const ink = getSemanticColors(mode)['text-primary']
  return (
    <View
      className="flex-1 gap-1 rounded-lg p-inset-sm"
      style={{ backgroundColor: r.hex, boxShadow: r.lift || 'none' } as object}
    >
      <Text className="text-sm font-semibold" style={{ color: ink }}>
        {`${r.level > 0 ? '+' : ''}${r.level} · ${LEVEL_ROLE[r.level]} · ${stepName(r.hex)} ${r.hex}`}
      </Text>
      <Text className="font-mono text-[10px]" style={{ color: ink }}>
        {`vs below ${ratio(r.vsBelow)} · vs above ${ratio(r.vsAbove)} · on page ${stepName(page)} ${page}: ${ratio(r.vsPage)}`}
      </Text>
      <Text className="font-mono text-[10px]" style={{ color: ink }}>
        {`lift: ${r.lift || 'none (flat)'}`}
      </Text>
      {r.assumed ? (
        <Text className="text-xs italic" style={{ color: ink }}>
          {r.assumed}
        </Text>
      ) : null}
    </View>
  )
}

function Verdict({ step, mode }: { step?: StepVerdict; mode: ThemeMode }) {
  const text = step ? VERDICT_TEXT[step] : ''
  const bad = step === 'flat' || step === 'down'
  const color = bad ? MARK[mode] : getSemanticColors(mode)['text-primary']
  return (
    <Text
      className="w-40 text-xs font-semibold"
      style={{ color }}
      testID={bad ? 'ramp-break' : undefined}
    >
      {text}
    </Text>
  )
}

function RampColumn({ option, mode }: { option: RampOption; mode: ThemeMode }) {
  const page = planesFor(option, mode)[0]
  const ink = getSemanticColors(mode)['text-primary']
  return (
    <View
      className="min-w-[420px] flex-1 gap-5 rounded-lg p-gutter-sm"
      style={{ backgroundColor: page }}
    >
      <Text className="text-sm font-semibold" style={{ color: ink }}>
        {mode === 'dark' ? 'Dark (unchanged in every option)' : 'Light'}
      </Text>
      {readRamp(option, mode).map((r) => (
        <View key={r.level} className="flex-row items-center gap-inline-md">
          <Swatch r={r} mode={mode} page={page} />
          <Verdict step={r.step} mode={mode} />
        </View>
      ))}
    </View>
  )
}

export function RampUnit({ option }: { option: RampOption }) {
  return (
    <View className="gap-stack-sm" testID={`ramp-${option.key}`}>
      <Text className="text-lg font-semibold text-text-primary" accessibilityRole="header">
        {option.title}
      </Text>
      <Text className="text-sm text-text-secondary">{option.summary}</Text>
      <View className="flex-row flex-wrap gap-gutter-sm">
        <RampColumn option={option} mode="dark" />
        <RampColumn option={option} mode="light" />
      </View>
    </View>
  )
}
