import { compositeOver, contrast } from '../../theme/color-checks'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { colorsAsJudged } from './light-as-judged'

/**
 * TD-765: the focus-ring options the owner picked from. The pick, two-tone, is applied: the
 * global `*:focus-visible` rule in `global.css` paints a 2px `--color-text-brand` outline at a
 * 2px offset, the offset leaving the plane showing as the gap. Before that it was the same
 * outline in `--color-border-focus`. Every option is an existing semantic token.
 */
export type ColorToken = keyof ReturnType<typeof getSemanticColors>
export type FocusOptionKey = 'current' | 'neutral' | 'brand' | 'twoTone'
export type SampleKey = 'button' | 'input' | 'chip' | 'navItem' | 'dateSeparator'

export interface FocusOption {
  key: FocusOptionKey
  name: string
  ring: ColorToken
  /** Separate the ring from the control with a 2px plane-coloured gap. */
  isTwoTone: boolean
  /** The option `global.css` ships. */
  isApplied: boolean
  note: string
}

export const FOCUS_OPTIONS: FocusOption[] = [
  {
    key: 'current',
    name: 'Current: border-focus',
    ring: 'border-focus',
    isTwoTone: false,
    isApplied: false,
    note: 'Blue 600 in light, the indigo pin in dark.',
  },
  {
    key: 'neutral',
    name: 'Neutral: text-primary',
    ring: 'text-primary',
    isTwoTone: false,
    isApplied: false,
    note: 'The text colour as the ring: no hue, highest contrast on every plane.',
  },
  {
    key: 'brand',
    name: 'Brand: text-brand',
    ring: 'text-brand',
    isTwoTone: false,
    isApplied: false,
    note: 'Orange 700 in light, orange 400 in dark: the brand rung that clears 4.5:1 as text.',
  },
  {
    key: 'twoTone',
    name: 'Applied. Two-tone: text-brand over a plane-coloured gap',
    ring: 'text-brand',
    isTwoTone: true,
    isApplied: true,
    note:
      'The owner’s pick, shipped in global.css: a 2px gap showing the plane, then the 2px ring. ' +
      'The gap keeps the orange off the orange Button.',
  },
]

export const PLANES = ['background-base', 'surface-base', 'surface-elevated'] as const
export type Plane = (typeof PLANES)[number]

export const MODES: ThemeMode[] = ['light', 'dark']

/** The colour at each sample's outer edge, which the ring sits next to. NavItem paints none. */
export const SAMPLE_EDGE: Record<SampleKey, ColorToken | null> = {
  button: 'brand-primary-solid',
  input: 'border-input',
  chip: 'hairline-subtle',
  navItem: null,
  dateSeparator: 'hairline-default',
}

export const SAMPLE_KEYS = Object.keys(SAMPLE_EDGE) as SampleKey[]

/** WCAG 1.4.11 / 2.4.11 non-text floor. */
export const NON_TEXT_FLOOR = 3

export interface RingMeasurement {
  /** Ring against the plane it sits on. */
  plane: number
  /** Ring against the sample's edge colour, or null when the sample paints no edge. */
  component: number | null
}

const round2 = (ratio: number) => Math.round(ratio * 100) / 100

export function measureRing(
  option: FocusOption,
  mode: ThemeMode,
  plane: Plane,
  sample: SampleKey
): RingMeasurement {
  const colors = colorsAsJudged(mode)
  const planeHex = colors[plane]
  const ring = compositeOver(colors[option.ring], planeHex)
  const edgeToken = SAMPLE_EDGE[sample]
  const edge = edgeToken ? compositeOver(colors[edgeToken], planeHex) : null
  return {
    plane: round2(contrast(ring, planeHex)),
    component: edge ? round2(contrast(ring, edge)) : null,
  }
}

/** Every `--color-*` property for one mode, so a subtree can render that mode's tokens. */
export function modeColorProperties(mode: ThemeMode): Record<string, string> {
  return Object.fromEntries(
    Object.entries(getSemanticColors(mode)).map(([token, value]) => [`--color-${token}`, value])
  )
}
