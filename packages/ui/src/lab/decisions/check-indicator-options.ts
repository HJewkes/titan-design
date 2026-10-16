import { compositeOver, contrast } from '../../theme/color-checks'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'

/**
 * TD-802 Gate 2 batch 16: the owner found the Checkbox tick odd and asked for a squared radio
 * and other options. Each option here is painted from existing semantic tokens only; none adds a
 * colour. `current` reproduces main's indicator: the TD-840 CheckMark on an on-brand chip.
 */
export type ColorToken = keyof ReturnType<typeof getSemanticColors>
export type CheckOptionKey =
  | 'current'
  | 'squaredRadio'
  | 'hollowSquare'
  | 'strokeCheck'
  | 'outlineCheck'
export type IndicatorShape = 'chipMark' | 'square' | 'stroke'

export interface CheckOption {
  key: CheckOptionKey
  name: string
  shape: IndicatorShape
  /** The box is filled with `brand-primary` when checked; otherwise it keeps the plane. */
  isFilled: boolean
  /** Border of the checked box. */
  edge: ColorToken
  /** Colour of the chip, square, check or dash. */
  indicator: ColorToken
  /** Colour of the check drawn on the chip (`chipMark` only). */
  mark?: ColorToken
  note: string
}

export const CHECK_OPTIONS: CheckOption[] = [
  {
    key: 'current',
    name: 'Baseline (main): on-brand chip with the drawn CheckMark',
    shape: 'chipMark',
    isFilled: true,
    edge: 'brand-primary',
    indicator: 'on-brand-primary',
    mark: 'text-brand',
    note:
      'What ships: the box fills brand, an on-brand chip sits 1px inside the border, and the ' +
      'drawn CheckMark (TD-840, 3px brush stroke) sits on the chip in text-brand. TD-840 replaced ' +
      'the font ✓ glyph, so the mark no longer depends on the host font. What remains is a ' +
      'brand-coloured tick on a white tile inside a brand box: three layers in 20px.',
  },
  {
    key: 'squaredRadio',
    name: 'Squared radio: on-brand inner square',
    shape: 'square',
    isFilled: true,
    edge: 'brand-primary',
    indicator: 'on-brand-primary',
    note:
      'The owner’s suggestion. Radio’s inner dot, squared: the box fills brand and an inset ' +
      'on-brand square marks checked. Indeterminate keeps the on-brand dash, so the two states differ ' +
      'by shape as well as by fill.',
  },
  {
    key: 'hollowSquare',
    name: 'Hollow squared radio: text-brand square on the plane',
    shape: 'square',
    isFilled: false,
    edge: 'text-brand',
    indicator: 'text-brand',
    note:
      'The box keeps the plane; checked turns the border text-brand and sets a text-brand square ' +
      'inside. No on-brand pairing, so the indicator clears 3:1 on every plane in both modes.',
  },
  {
    key: 'strokeCheck',
    name: 'Stroke check: the shipped CheckMark on the brand fill, no chip',
    shape: 'stroke',
    isFilled: true,
    edge: 'brand-primary',
    indicator: 'on-brand-primary',
    note:
      'The Material, Carbon, Fluent and shadcn shape: the baseline without its chip, so the ' +
      'CheckMark is drawn straight on the brand fill in on-brand. Shares the baseline’s on-brand ' +
      'pairing.',
  },
  {
    key: 'outlineCheck',
    name: 'Outline check: text-primary CheckMark, no fill',
    shape: 'stroke',
    isFilled: false,
    edge: 'border-input',
    indicator: 'text-primary',
    note:
      'The GOV.UK shape: the box stays as it is unchecked and the CheckMark appears in ' +
      'text-primary. ' +
      'Highest indicator contrast; no brand colour in the checked state.',
  },
]

export const PLANES = ['background-base', 'surface-base'] as const
export type Plane = (typeof PLANES)[number]
/** Elevation level each plane sits on (`ELEVATION_PLANE`). */
export const PLANE_LEVEL: Record<Plane, number> = { 'background-base': -1, 'surface-base': 0 }

export const MODES: ThemeMode[] = ['light', 'dark']
export const SIZES = ['sm', 'md', 'lg'] as const
export type Size = (typeof SIZES)[number]
export const STATES = ['unchecked', 'checked', 'indeterminate', 'disabled', 'focus'] as const
export type State = (typeof STATES)[number]

/** WCAG 1.4.11 non-text floor. */
export const NON_TEXT_FLOOR = 3

export interface CheckMeasurement {
  /** Indicator against what it sits on: the brand fill, or the plane for a hollow box. */
  indicator: number
  /** Checked box edge (fill or border) against the plane. */
  box: number
  /** Unchecked `border-input` border against the plane; the same for every option. */
  unchecked: number
}

const round2 = (ratio: number) => Math.round(ratio * 100) / 100

export function measureCheck(option: CheckOption, mode: ThemeMode, plane: Plane): CheckMeasurement {
  const colors = getSemanticColors(mode)
  const planeHex = colors[plane]
  const fill = option.isFilled ? compositeOver(colors['brand-primary'], planeHex) : planeHex
  const indicator = compositeOver(colors[option.indicator], fill)
  const edge = compositeOver(colors[option.edge], planeHex)
  return {
    indicator: round2(contrast(indicator, fill)),
    box: round2(contrast(edge, planeHex)),
    unchecked: round2(contrast(compositeOver(colors['border-input'], planeHex), planeHex)),
  }
}
