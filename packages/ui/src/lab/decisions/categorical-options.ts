import { contrast, cvdDelta, type CvdKind } from '../../theme/color-checks'
import {
  CATEGORICAL_CVD_SAFE_MAX,
  primitiveColors,
  primitiveRamps as ramp,
  semanticPins,
} from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { CATEGORICAL_HUES, type CategoricalHue } from './categorical-revisit.candidates'

/**
 * TD-759 follow-up: the categorical palette option set for the owner's next round.
 *
 * Nothing here edits a token. Every option is a `primitiveRamps` step per hue, in the canonical
 * slot order (blue, magenta, red, orange, green, cyan, amber), so `Avatar` and the shell accents
 * keep their indexes. O1 and the dark half of O2 read the shipped `dataviz-categorical-*` roles;
 * O3 and O4 read the `*-solid` and `*-subtle` roles and extend them to magenta, the one hue
 * without a solid or subtle token. Planes are the shipped 3b light ramp and the dark ramp.
 */
export type CategoricalOptionId = 'O1-current' | 'O2-bprime' | 'O3-solid' | 'O4-subtle' | 'O5-ink'

export type RampStep = keyof (typeof ramp)['blue']
export type LabelMode = 'white' | 'ink' | 'ramp'

export interface CategoricalOption {
  id: CategoricalOptionId
  title: string
  /** One line: what the set is and the trade-off it makes. */
  rationale: string
  steps: Record<ThemeMode, readonly RampStep[]>
}

/** The planes a categorical fill sits on, rail first. */
export const OPTION_PLANES = [
  { token: 'background-base', role: 'rail' },
  { token: 'surface-base', role: 'chart plane' },
  { token: 'surface-elevated', role: 'top bar' },
  { token: 'surface-raised', role: 'card' },
  { token: 'surface-overlay', role: 'tooltip' },
] as const
export type PlaneToken = (typeof OPTION_PLANES)[number]['token']

/** The shell planes `brands.test.tsx` holds the console and agents accents to 3:1 on. */
export const SHELL_PLANES = ['background-base', 'surface-elevated'] as const

/** Slot each shell brand paints from (`brands.tsx`). */
export const SHELL_ACCENT_SLOTS = { console: 2, agents: 4 } as const

export const LABEL_MODES: readonly LabelMode[] = ['white', 'ink', 'ramp']

/** Ramp steps a per-hue label may take: a light tone for a mid or dark fill, a dark tone for a tint. */
export const RAMP_LABEL_STEPS: readonly RampStep[] = [50, 100, 200, 700, 800, 900, 950]

export const PLANE_FLOOR = 3
export const PLANE_WEAK = 2
export const LABEL_AA = 4.5
export const LABEL_LARGE = 3
export const CVD_FLOOR = 8

const CATEGORICAL_KEYS = CATEGORICAL_HUES.map((_, i) => `dataviz-categorical-${i}`)

/** Light `*-solid` and `*-subtle` tokens by hue; magenta has neither (decision 0004 left it a cell). */
const SOLID_TOKEN: Partial<Record<CategoricalHue, string>> = {
  blue: 'status-info-solid',
  red: 'status-error-solid',
  orange: 'brand-primary-solid',
  green: 'status-success-solid',
  cyan: 'brand-secondary-solid',
  amber: 'status-warning-solid',
}
const SUBTLE_TOKEN: Partial<Record<CategoricalHue, string>> = {
  blue: 'status-info-subtle',
  red: 'status-error-subtle',
  orange: 'brand-primary-subtle',
  green: 'status-success-subtle',
  cyan: 'brand-secondary-subtle',
  amber: 'status-warning-subtle',
}

/** The step of `hue` whose hex is `value`, or undefined when `value` is not a step (an alpha wash). */
export function stepOf(hue: CategoricalHue, value: string): RampStep | undefined {
  const steps = Object.keys(ramp[hue]).map(Number) as RampStep[]
  return steps.find((step) => ramp[hue][step] === value)
}

function shippedSteps(mode: ThemeMode): RampStep[] {
  const colors = getSemanticColors(mode) as Record<string, string>
  return CATEGORICAL_HUES.map((hue, slot) => {
    const step = stepOf(hue, colors[CATEGORICAL_KEYS[slot]])
    if (step === undefined) throw new Error(`${CATEGORICAL_KEYS[slot]} is not a ${hue} step`)
    return step
  })
}

/** Each hue at the step its token uses in `mode`; `fallback` fills the hues without one. */
function tokenSteps(
  tokens: Partial<Record<CategoricalHue, string>>,
  mode: ThemeMode,
  fallback: RampStep
): RampStep[] {
  const colors = getSemanticColors(mode) as Record<string, string>
  return CATEGORICAL_HUES.map((hue) => {
    const token = tokens[hue]
    const step = token ? stepOf(hue, colors[token]) : undefined
    return step ?? fallback
  })
}

export const CATEGORICAL_OPTIONS: readonly CategoricalOption[] = [
  {
    id: 'O1-current',
    title: 'O1 · main today',
    rationale:
      'The shipped roles: dark on the primitive array, light on set B (red[600] and green[600] collide under CVD).',
    steps: { dark: shippedSteps('dark'), light: shippedSteps('light') },
  },
  {
    id: 'O2-bprime',
    title: 'O2 · B′ (PR #794, variant A)',
    rationale:
      'Set B with red[400] and green[700]; restores all-pairs CVD 8 in light. Console accent moves to status-error.',
    steps: { dark: shippedSteps('dark'), light: [500, 600, 400, 400, 700, 400, 600] },
  },
  {
    id: 'O3-solid',
    title: 'O3 · solid-derived',
    rationale:
      'Each hue at the step its *-solid fill uses; magenta takes the ladder step (light 600, dark 500).',
    steps: {
      dark: tokenSteps(SOLID_TOKEN, 'dark', 500),
      light: tokenSteps(SOLID_TOKEN, 'light', 600),
    },
  },
  {
    id: 'O4-subtle',
    title: 'O4 · subtle-derived tints',
    rationale:
      'Each hue at the step its light *-subtle tint uses (ramp 100) under a dark label; dark has no opaque subtle, so it reuses the tints.',
    steps: {
      dark: tokenSteps(SUBTLE_TOKEN, 'light', 100),
      light: tokenSteps(SUBTLE_TOKEN, 'light', 100),
    },
  },
  {
    id: 'O5-ink',
    title: 'O5 · ink tier (TD-757 D9)',
    rationale:
      'The recorded ink sets: light ink-light-B at 3:1 on every plane under one white label, dark ink-dark with amber[500].',
    steps: {
      dark: [500, 500, 500, 400, 300, 300, 500],
      light: [700, 800, 500, 600, 800, 600, 600],
    },
  },
]

export function optionColors(option: CategoricalOption, mode: ThemeMode): string[] {
  return CATEGORICAL_HUES.map((hue, slot) => ramp[hue][option.steps[mode][slot]])
}

export function planeColors(mode: ThemeMode): string[] {
  const colors = getSemanticColors(mode)
  return OPTION_PLANES.map((plane) => colors[plane.token])
}

/**
 * The one colour a label mode paints on every slot of a set, or per slot for `ramp`.
 * `ink` is `on-data-strong`, the label Treemap paints on categorical tiles; light `text-primary`
 * (#121828) measures within 0.1 of it on every fill.
 */
export function labelColors(mode: LabelMode, fills: string[], rampStep: RampStep): string[] {
  if (mode === 'white') return fills.map(() => primitiveColors.white)
  if (mode === 'ink') return fills.map(() => semanticPins.onDataStrong)
  return CATEGORICAL_HUES.map((hue) => ramp[hue][rampStep])
}

export interface LabelMeasurement {
  mode: LabelMode
  /** The ramp step every hue's label takes; only meaningful for `ramp`. */
  rampStep: RampStep
  ratios: number[]
  passAA: number
  passLarge: number
}

function measureLabel(mode: LabelMode, fills: string[], rampStep: RampStep): LabelMeasurement {
  const ratios = fills.map((fill, i) => contrast(labelColors(mode, fills, rampStep)[i], fill))
  return {
    mode,
    rampStep,
    ratios,
    passAA: ratios.filter((r) => r >= LABEL_AA).length,
    passLarge: ratios.filter((r) => r >= LABEL_LARGE).length,
  }
}

/** The ramp step that labels the most slots at AA; ties go to the higher worst ratio. */
export function bestRampStep(fills: string[]): LabelMeasurement {
  return RAMP_LABEL_STEPS.map((step) => measureLabel('ramp', fills, step)).reduce((best, next) =>
    next.passAA > best.passAA ||
    (next.passAA === best.passAA && Math.min(...next.ratios) > Math.min(...best.ratios))
      ? next
      : best
  )
}

export interface CvdMeasurement {
  kind: CvdKind
  /** All-pairs minimum over slots 0-5, the gate's range, with `cvdDelta` unclamped as CI runs it. */
  min: number
  pair: [number, number]
  /** All-pairs minimum over every slot. */
  minAll: number
  pairAll: [number, number]
}

function weakestPair(colors: string[], kind: CvdKind): { min: number; pair: [number, number] } {
  let min = Infinity
  let pair: [number, number] = [0, 1]
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const d = cvdDelta(colors[i], colors[j], [kind])
      if (d < min) {
        min = d
        pair = [i, j]
      }
    }
  }
  return { min, pair }
}

function measureCvd(colors: string[], kind: CvdKind): CvdMeasurement {
  const safe = weakestPair(colors.slice(0, CATEGORICAL_CVD_SAFE_MAX), kind)
  const all = weakestPair(colors, kind)
  return { kind, min: safe.min, pair: safe.pair, minAll: all.min, pairAll: all.pair }
}

export interface ShellAccent {
  brand: keyof typeof SHELL_ACCENT_SLOTS
  hex: string
  /** Contrast on each of `SHELL_PLANES`, in order. */
  planes: number[]
  passes: boolean
}

function measureShell(colors: string[], planes: string[]): ShellAccent[] {
  const shellPlanes = SHELL_PLANES.map(
    (token) => planes[OPTION_PLANES.findIndex((p) => p.token === token)]
  )
  return (Object.keys(SHELL_ACCENT_SLOTS) as ShellAccent['brand'][]).map((brand) => {
    const hex = colors[SHELL_ACCENT_SLOTS[brand]]
    const ratios = shellPlanes.map((plane) => contrast(hex, plane))
    return { brand, hex, planes: ratios, passes: ratios.every((r) => r >= PLANE_FLOOR) }
  })
}

export interface SlotMeasurement {
  hex: string
  step: RampStep
  /** Contrast against each of `OPTION_PLANES`, in order. */
  planes: number[]
  worst: number
}

export interface OptionMeasurement {
  id: CategoricalOptionId
  mode: ThemeMode
  slots: SlotMeasurement[]
  /** Slots under 3:1 and under 2:1 on any plane. */
  under3: number
  under2: number
  labels: Record<LabelMode, LabelMeasurement>
  cvd: Record<CvdKind, CvdMeasurement>
  shell: ShellAccent[]
}

export function measureOption(option: CategoricalOption, mode: ThemeMode): OptionMeasurement {
  const colors = optionColors(option, mode)
  const planes = planeColors(mode)
  const slots = colors.map((hex, i) => {
    const ratios = planes.map((plane) => contrast(hex, plane))
    return { hex, step: option.steps[mode][i], planes: ratios, worst: Math.min(...ratios) }
  })
  const ramp = bestRampStep(colors)
  return {
    id: option.id,
    mode,
    slots,
    under3: slots.filter((slot) => slot.worst < PLANE_FLOOR).length,
    under2: slots.filter((slot) => slot.worst < PLANE_WEAK).length,
    labels: {
      white: measureLabel('white', colors, ramp.rampStep),
      ink: measureLabel('ink', colors, ramp.rampStep),
      ramp,
    },
    cvd: {
      deutan: measureCvd(colors, 'deutan'),
      protan: measureCvd(colors, 'protan'),
      tritan: measureCvd(colors, 'tritan'),
    },
    shell: measureShell(colors, planes),
  }
}

/** `status-error`, the accent variant A hands console when slot 2 misses the shell planes. */
export function statusErrorAccent(mode: ThemeMode): ShellAccent {
  const colors = getSemanticColors(mode) as Record<string, string>
  const ratios = SHELL_PLANES.map((plane) => contrast(colors['status-error'], colors[plane]))
  return {
    brand: 'console',
    hex: colors['status-error'],
    planes: ratios,
    passes: ratios.every((r) => r >= PLANE_FLOOR),
  }
}

export function optionById(id: CategoricalOptionId): CategoricalOption {
  const option = CATEGORICAL_OPTIONS.find((candidate) => candidate.id === id)
  if (!option) throw new Error(`no option ${id}`)
  return option
}
