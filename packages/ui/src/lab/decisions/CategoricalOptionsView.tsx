import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { simulateCvd, type CvdKind } from '../../theme/color-checks'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { CATEGORICAL_HUES } from './categorical-revisit.candidates'
import {
  CVD_FLOOR,
  LABEL_AA,
  LABEL_LARGE,
  LABEL_MODES,
  OPTION_PLANES,
  PLANE_FLOOR,
  PLANE_WEAK,
  SHELL_PLANES,
  labelColors,
  measureOption,
  optionColors,
  planeColors,
  statusErrorAccent,
  type CategoricalOption,
  type LabelMeasurement,
  type OptionMeasurement,
} from './categorical-options'

/**
 * Each card paints its own mode from the semantic map, so both modes sit on one page whatever the
 * toolbar theme is. Fills, labels and planes go on as inline style: they are the hexes under test.
 */
interface Ink {
  frame: string
  primary: string
  secondary: string
}

function modeInk(mode: ThemeMode): Ink {
  const colors = getSemanticColors(mode)
  return {
    frame: colors['background-base'],
    primary: colors['text-primary'],
    secondary: colors['text-secondary'],
  }
}

const CVD_KINDS: readonly CvdKind[] = ['deutan', 'protan', 'tritan']
const SURFACE_BASE = OPTION_PLANES.findIndex((plane) => plane.token === 'surface-base')

interface SwatchProps {
  fill: string
  caption: string
  ink: Ink
  label?: string
}

function Swatch({ fill, caption, ink, label }: SwatchProps) {
  return (
    <View className="w-16 items-center gap-0.5">
      <View
        className="h-8 w-14 items-center justify-center rounded-sm"
        style={{ backgroundColor: fill }}
      >
        {label ? (
          <Text className="text-xs font-semibold" style={{ color: label }}>
            Aa
          </Text>
        ) : null}
      </View>
      <Text className="font-mono text-[10px]" style={{ color: ink.secondary }}>
        {caption}
      </Text>
    </View>
  )
}

interface StripProps {
  label: string
  plane: string
  ink: Ink
  children: ReactNode
}

function Strip({ label, plane, ink, children }: StripProps) {
  return (
    <View className="flex-row items-center gap-2">
      <Text className="w-44 font-mono text-[10px]" style={{ color: ink.secondary }}>
        {label}
      </Text>
      <View className="flex-row gap-1 rounded-md p-1.5" style={{ backgroundColor: plane }}>
        {children}
      </View>
    </View>
  )
}

interface RowsProps {
  option: CategoricalOption
  mode: ThemeMode
  measured: OptionMeasurement
  ink: Ink
}

const planeMark = (ratio: number) => (ratio < PLANE_WEAK ? ' ✗✗' : ratio < PLANE_FLOOR ? ' ✗' : '')

function PlaneRows({ mode, measured, ink }: RowsProps) {
  const planes = planeColors(mode)
  return OPTION_PLANES.map((plane, p) => (
    <Strip key={plane.token} label={`${plane.token} (${plane.role})`} plane={planes[p]} ink={ink}>
      {measured.slots.map((slot, i) => (
        <Swatch
          key={i}
          fill={slot.hex}
          caption={`${slot.planes[p].toFixed(2)}${planeMark(slot.planes[p])}`}
          ink={ink}
        />
      ))}
    </Strip>
  ))
}

const labelMark = (ratio: number) => (ratio >= LABEL_AA ? 'AA' : ratio >= LABEL_LARGE ? 'lg' : '✗')

function labelTitle({ mode, rampStep, passAA, passLarge }: LabelMeasurement): string {
  const name =
    mode === 'ramp' ? `ramp[${rampStep}]` : mode === 'ink' ? 'ink (on-data-strong)' : 'white'
  return `label ${name} · AA ${passAA}/7 · lg ${passLarge}/7`
}

function LabelRows({ option, mode, measured, ink }: RowsProps) {
  const fills = optionColors(option, mode)
  const plane = planeColors(mode)[SURFACE_BASE]
  return LABEL_MODES.map((labelMode) => {
    const label = measured.labels[labelMode]
    const colors = labelColors(labelMode, fills, label.rampStep)
    return (
      <Strip key={labelMode} label={labelTitle(label)} plane={plane} ink={ink}>
        {fills.map((fill, i) => (
          <Swatch
            key={i}
            fill={fill}
            label={colors[i]}
            caption={`${label.ratios[i].toFixed(2)} ${labelMark(label.ratios[i])}`}
            ink={ink}
          />
        ))}
      </Strip>
    )
  })
}

function CvdRows({ mode, measured, ink }: RowsProps) {
  const plane = planeColors(mode)[SURFACE_BASE]
  return CVD_KINDS.map((kind) => {
    const { min, pair } = measured.cvd[kind]
    const mark = min < CVD_FLOOR ? ' ✗' : ''
    return (
      <Strip
        key={kind}
        label={`${kind} · min ΔE ${min.toFixed(1)}${mark} (${pair[0]}↔${pair[1]})`}
        plane={plane}
        ink={ink}
      >
        {measured.slots.map((slot, i) => (
          <Swatch key={i} fill={simulateCvd(slot.hex, kind)} caption={`${i}`} ink={ink} />
        ))}
      </Strip>
    )
  })
}

function ShellRows({ mode, measured, ink }: RowsProps) {
  const colors = getSemanticColors(mode)
  const accents = [
    ...measured.shell,
    { ...statusErrorAccent(mode), brand: 'console (status-error)' },
  ]
  return SHELL_PLANES.map((token, p) => (
    <Strip key={token} label={`shell accents on ${token}`} plane={colors[token]} ink={ink}>
      {accents.map((accent) => (
        <Swatch
          key={accent.brand}
          fill={accent.hex}
          caption={`${accent.brand.split(' ')[0]} ${accent.planes[p].toFixed(2)}${planeMark(accent.planes[p])}`}
          ink={ink}
        />
      ))}
    </Strip>
  ))
}

function stepsLine(option: CategoricalOption, mode: ThemeMode): string {
  const hexes = optionColors(option, mode)
  return CATEGORICAL_HUES.map((hue, i) => `${hue}[${option.steps[mode][i]}] ${hexes[i]}`).join(
    ' · '
  )
}

function numbersLine(m: OptionMeasurement): string {
  const cvd = CVD_KINDS.map((kind) => `${kind} ${m.cvd[kind].min.toFixed(1)}`).join(', ')
  const shell = m.shell.map((s) => `${s.brand} ${s.passes ? '✓' : '✗'}`).join(', ')
  return [
    `planes: ${m.under3} slot(s) under 3:1, ${m.under2} under 2:1`,
    `CVD all-pairs 0-5: ${cvd}`,
    `shell 3:1: ${shell}`,
  ].join(' · ')
}

export function OptionCard({ option, mode }: { option: CategoricalOption; mode: ThemeMode }) {
  const measured = measureOption(option, mode)
  const ink = modeInk(mode)
  const rows = { option, mode, measured, ink }
  return (
    <View
      testID={`option-${option.id}-${mode}`}
      className="gap-2 rounded-md p-3"
      style={{ backgroundColor: ink.frame }}
    >
      <Text className="text-sm font-semibold" style={{ color: ink.primary }}>
        {`${option.title} · ${mode}`}
      </Text>
      <Text className="text-xs" style={{ color: ink.secondary }}>
        {option.rationale}
      </Text>
      <Text className="font-mono text-[10px]" style={{ color: ink.secondary }}>
        {stepsLine(option, mode)}
      </Text>
      <Text className="font-mono text-[11px]" style={{ color: ink.primary }}>
        {numbersLine(measured)}
      </Text>
      <PlaneRows {...rows} />
      <LabelRows {...rows} />
      <CvdRows {...rows} />
      <ShellRows {...rows} />
    </View>
  )
}
