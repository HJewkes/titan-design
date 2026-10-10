// Lab only (TD-482, Gate 2 round after batch 5 round 2): the solid Alert label options the
// owner asked to see side by side, each with its measured contrast. Never published.
import { Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { useSurfaceMode } from '../../components/ui/surface'
import { contrast } from '../../theme/color-checks'
import { debossLabel, paperFill } from '../../theme/materials'
import { greyRamp, primitiveRamps } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'

export type Tone = 'success' | 'info' | 'warning' | 'error'
export const TONES: readonly Tone[] = ['success', 'info', 'warning', 'error']

/** Where the label and glyph colour comes from. */
export type LabelSource = 'on-status' | 'ramp-light' | 'ramp-dark' | 'grey-950'
/** What the `-solid` fill is made of. */
export type Material = 'paper' | 'paper-deboss' | 'flat'

export type OptionKey =
  | 'white-paper'
  | 'ramp-light-paper'
  | 'ramp-dark-paper'
  | 'ramp-dark-paper-deboss'
  | 'dark-flat'

export interface Option {
  title: string
  label: LabelSource
  material: Material
}

/** The brief's numbering; option 1 is what the component ships. */
export const OPTIONS: Record<OptionKey, Option> = {
  'white-paper': {
    title: '1. Picked and shipped: on-status label and glyph (white in light), paper grain',
    label: 'on-status',
    material: 'paper',
  },
  'ramp-light-paper': {
    title: "2. Light rung (50) of the tone's own ramp, like a subtle badge, paper grain",
    label: 'ramp-light',
    material: 'paper',
  },
  'ramp-dark-paper': {
    title: "3a. Dark end (900) of the tone's own ramp, paper grain",
    label: 'ramp-dark',
    material: 'paper',
  },
  'ramp-dark-paper-deboss': {
    title: "3b. Dark end (900) of the tone's own ramp, paper grain, debossed",
    label: 'ramp-dark',
    material: 'paper-deboss',
  },
  'dark-flat': {
    title: '4. Dark text (grey 950) on the flat fill, no grain',
    label: 'grey-950',
    material: 'flat',
  },
}

const RAMP: Record<Tone, keyof typeof primitiveRamps> = {
  success: 'green',
  info: 'blue',
  warning: 'amber',
  error: 'red',
}

const FILL_CLASS: Record<Tone, string> = {
  success: 'bg-status-success-solid',
  info: 'bg-status-info-solid',
  warning: 'bg-status-warning-solid',
  error: 'bg-status-error-solid',
}

const GLYPH: Record<Tone, string> = { success: '✓', info: 'ℹ', warning: '⚠', error: '✕' }

export function labelHex(source: LabelSource, tone: Tone, mode: ThemeMode): string {
  if (source === 'on-status') return getSemanticColors(mode)[`on-status-${tone}`]
  if (source === 'ramp-light') return primitiveRamps[RAMP[tone]][50]
  if (source === 'ramp-dark') return primitiveRamps[RAMP[tone]][900]
  return greyRamp[950]
}

export type Verdict = 'AA' | 'large text only' | 'below 3:1'

/** The 14px label needs 4.5:1; the 20px bold glyph is large text and needs 3:1. */
export function verdictFor(ratio: number): Verdict {
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'large text only'
  return 'below 3:1'
}

export interface Measurement {
  tone: Tone
  labelHex: string
  fillHex: string
  ratio: number
  verdict: Verdict
}

/** One row per tone: the label hex, the `-solid` fill hex and their WCAG ratio. */
export function measureOption(option: Option, mode: ThemeMode): Measurement[] {
  const colors = getSemanticColors(mode)
  return TONES.map((tone) => {
    const fillHex = colors[`status-${tone}-solid`]
    const label = labelHex(option.label, tone, mode)
    const ratio = contrast(label, fillHex)
    return { tone, labelHex: label, fillHex, ratio, verdict: verdictFor(ratio) }
  })
}

export function formatMeasurement(m: Measurement): string {
  return `${m.labelHex} on ${m.fillHex} · ${m.ratio.toFixed(2)}:1 · ${m.verdict}`
}

function fillStyle(material: Material, fillHex: string): ViewStyle | undefined {
  return material === 'flat' ? undefined : paperFill(fillHex)
}

function textStyle(material: Material, color: string): TextStyle {
  return material === 'paper-deboss' ? { color, ...debossLabel } : { color }
}

interface RowProps {
  option: Option
  measurement: Measurement
}

function OptionRow({ option, measurement }: RowProps) {
  const { tone, fillHex, labelHex: color } = measurement
  const text = textStyle(option.material, color)
  return (
    <View className="gap-1" testID={`alert-option-${tone}`}>
      <View
        accessibilityRole="alert"
        className={`flex-row items-start p-inset-lg rounded-lg ${FILL_CLASS[tone]}`}
        style={fillStyle(option.material, fillHex)}
      >
        <View className="mr-3">
          <Text className="text-xl leading-5 font-bold" style={text}>
            {GLYPH[tone]}
          </Text>
        </View>
        <View className="flex-1 gap-stack-sm">
          <Text className="font-semibold leading-5" style={text}>
            {tone[0].toUpperCase() + tone.slice(1)} solid alert
          </Text>
          <Text className="text-sm" style={text}>
            The description reads the same colour as the title.
          </Text>
        </View>
      </View>
      <Text className="text-xs font-mono text-text-secondary">
        {formatMeasurement(measurement)}
      </Text>
    </View>
  )
}

export interface AlertSolidOptionsProps {
  option: OptionKey
}

/** The four solid tones under one option, each captioned with its measured contrast. */
export function AlertSolidOptions({ option }: AlertSolidOptionsProps) {
  const mode = useSurfaceMode()
  const spec = OPTIONS[option]
  return (
    <View className="gap-stack-md max-w-xl" testID="alert-solid-options">
      <Text className="text-sm font-semibold text-text-primary">{spec.title}</Text>
      {measureOption(spec, mode).map((measurement) => (
        <OptionRow key={measurement.tone} option={spec} measurement={measurement} />
      ))}
    </View>
  )
}
