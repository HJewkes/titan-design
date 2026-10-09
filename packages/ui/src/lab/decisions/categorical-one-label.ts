import { contrast, cvdDelta, minPairwise, simulateCvd } from '../../theme/color-checks'
import { CATEGORICAL_CVD_SAFE_MAX, primitiveRamps as ramp } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { CATEGORICAL_HUES, CATEGORICAL_SETS } from './categorical-revisit.candidates'
import { WHITE, greyStep, nameOf, type RampStep, type Swatch } from './surface-family'

/**
 * Surface-system plan S3 (D3, D4): categorical sets under the one-label rule. Each option is one
 * set, one label colour for every slot in its mode, and where the label sits. Nothing here edits a
 * token; B′ and the dark set are read from `categorical-revisit.candidates.ts`.
 */
export type LabelPlacement = 'in-fill' | 'outside'

export interface LabelOption {
  id: string
  mode: ThemeMode
  title: string
  summary: string
  /** Slots 0-6 in canonical order (blue, magenta, red, orange, green, cyan, amber). */
  steps: readonly RampStep[]
  label: Swatch
  placement: LabelPlacement
  /** The ratio every in-fill label must clear; under 4.5 the labels are set as large text. */
  floor: number
}

const stepsOf = (id: string) => {
  const set = CATEGORICAL_SETS.find((s) => s.id === id)
  if (!set) throw new Error(`no categorical set ${id}`)
  return set.steps as readonly RampStep[]
}

const B_PRIME = stepsOf('L-fix-vivid')
const DARK = stepsOf('current-dark')
const ON_DATA_STRONG: Swatch = {
  hex: getSemanticColors('light')['on-data-strong'],
  label: 'on-data-strong',
}

export const D3_OPTIONS: readonly LabelOption[] = [
  {
    id: 'w2',
    mode: 'light',
    title: 'L-a · W2 with white labels (default)',
    summary:
      'Deep steps 600-900. One white label clears AA on every slot; the price is a dark, muddy palette with a near-black green.',
    steps: [700, 800, 600, 700, 900, 600, 600],
    label: WHITE,
    placement: 'in-fill',
    floor: 4.5,
  },
  {
    id: 'bprime-floor',
    mode: 'light',
    title: 'L-b · B′ (#794) with on-data-strong at a 3:1 floor',
    summary:
      'Vivid. Its best single label is on-data-strong, which reaches only 3:1 on green[700] and magenta[600], so in-fill labels must be large text (20px bold here).',
    steps: B_PRIME,
    label: ON_DATA_STRONG,
    placement: 'in-fill',
    floor: 3,
  },
  {
    id: 'bprime-outside',
    mode: 'light',
    title: 'L-c · B′ (#794) with no in-fill labels',
    summary:
      'Vivid. Labels sit beside the fill in text-primary, so no label rides a fill; Treemap and Avatar would need a scrim or a neutral disc.',
    steps: B_PRIME,
    label: { hex: getSemanticColors('light')['text-primary'], label: 'text-primary' },
    placement: 'outside',
    floor: 4.5,
  },
]

const DARK_ON_DATA_STRONG: Swatch = {
  hex: getSemanticColors('dark')['on-data-strong'],
  label: 'on-data-strong',
}

export const D4_OPTIONS: readonly LabelOption[] = [
  {
    id: 'dark-on-data-strong',
    mode: 'dark',
    title: 'on-data-strong on the shipped dark set (default)',
    summary: 'Already a token and the same hex in both modes; every slot clears AA.',
    steps: DARK,
    label: DARK_ON_DATA_STRONG,
    placement: 'in-fill',
    floor: 4.5,
  },
  {
    id: 'dark-grey950',
    mode: 'dark',
    title: 'grey[950] (text-inverse) on the shipped dark set',
    summary: 'magenta[500] misses AA by a hair; shown as swatches, not live labels.',
    steps: DARK,
    label: greyStep(950),
    placement: 'in-fill',
    floor: 4.5,
  },
  {
    id: 'dark-grey950-magenta400',
    mode: 'dark',
    title: 'grey[950] with magenta[400] in slot 1',
    summary:
      'The swap that lets grey[950] clear AA on every slot. Measured, it drops all-pairs CVD under the gate of 8.',
    steps: [DARK[0], 400, ...DARK.slice(2)],
    label: greyStep(950),
    placement: 'in-fill',
    floor: 4.5,
  },
]

export interface SlotReading {
  name: string
  hex: string
  /** Label on the fill (normal vision). */
  label: number
  /** Label on the fill, both simulated for deuteranopia. */
  labelDeutan: number
  /** Fill against the chart plane (surface-base). */
  plane: number
}

export interface OptionReading {
  slots: SlotReading[]
  /** All-pairs worst deutan/protan ΔE over slots 0-5, the CI gate's convention (floor 8). */
  cvd: number
  /** The two slots that set `cvd`. */
  cvdPair: string
  tritan: number
  worstLabel: number
  plane: string
}

export const optionColors = (o: LabelOption) =>
  CATEGORICAL_HUES.map((hue, slot) => ramp[hue][o.steps[slot]])

const redGreen = (a: string, b: string) => cvdDelta(a, b, ['deutan', 'protan'])

function worstPair(slots: SlotReading[], cvd: number): string {
  for (const [i, a] of slots.entries()) {
    const b = slots.slice(i + 1).find((other) => redGreen(a.hex, other.hex) === cvd)
    if (b) return `${a.name} / ${b.name}`
  }
  return ''
}

export function readOption(o: LabelOption): OptionReading {
  const plane = getSemanticColors(o.mode)['surface-base']
  const colors = optionColors(o)
  const deutanLabel = simulateCvd(o.label.hex, 'deutan')
  const slots = colors.map((hex, slot) => ({
    name: `${CATEGORICAL_HUES[slot]}[${o.steps[slot]}]`,
    hex,
    label: contrast(o.label.hex, hex),
    labelDeutan: contrast(deutanLabel, simulateCvd(hex, 'deutan')),
    plane: contrast(hex, plane),
  }))
  const safe = colors.slice(0, CATEGORICAL_CVD_SAFE_MAX)
  const cvd = minPairwise(safe, redGreen)
  return {
    slots,
    cvd,
    cvdPair: worstPair(slots.slice(0, CATEGORICAL_CVD_SAFE_MAX), cvd),
    tritan: minPairwise(safe, (a, b) => cvdDelta(a, b, ['tritan'])),
    worstLabel: Math.min(...slots.slice(0, CATEGORICAL_CVD_SAFE_MAX).map((s) => s.label)),
    plane: nameOf(plane),
  }
}

/** Whether a slot's label may be painted live: it clears the option's floor in that vision. */
export const isLive = (o: LabelOption, ratio: number) =>
  o.placement === 'in-fill' && ratio >= o.floor
