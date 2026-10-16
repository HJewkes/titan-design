import { contrast } from '../../theme/color-checks'
import { greyRamp, primitiveColors } from '../../theme/tokens/primitives'
import { getSemanticColors } from '../../theme/tokens/semantic'

export type NeutralDarkKey =
  | 'nd-grey50-d'
  | 'nd-grey100-d'
  | 'nd-grey200-d'
  | 'nd-grey300-d'
  | 'nd-grey700-d'

export interface NeutralDarkOption {
  key: NeutralDarkKey
  title: string
  note: string
  fill: string
  label: string
}

const DARK_LABEL = greyRamp[950]

export const NEUTRAL_DARK_OPTIONS: NeutralDarkOption[] = [
  {
    key: 'nd-grey50-d',
    title: 'grey[50] + grey[950]',
    note: 'as built',
    fill: greyRamp[50],
    label: DARK_LABEL,
  },
  {
    key: 'nd-grey100-d',
    title: 'grey[100] + grey[950]',
    note: 'owner suggestion',
    fill: greyRamp[100],
    label: DARK_LABEL,
  },
  {
    key: 'nd-grey200-d',
    title: 'grey[200] + grey[950]',
    note: 'warm silver',
    fill: greyRamp[200],
    label: DARK_LABEL,
  },
  {
    key: 'nd-grey300-d',
    title: 'grey[300] + grey[950]',
    note: 'one rung lower',
    fill: greyRamp[300],
    label: DARK_LABEL,
  },
  {
    key: 'nd-grey700-d',
    title: 'grey[700] + white',
    note: 'mirror of light',
    fill: greyRamp[700],
    label: primitiveColors.white,
  },
]

export const NEUTRAL_DARK_PLANES = [
  { token: 'surface-base', className: 'surface-base' },
  { token: 'surface-raised', className: 'surface-raised' },
] as const

export type NeutralDarkPlane = (typeof NEUTRAL_DARK_PLANES)[number]['token']

/** Plane hex from the dark semantic map. */
export function planeHex(plane: NeutralDarkPlane): string {
  return getSemanticColors('dark')[plane]
}

/** The label-on-fill ratio and the fill-on-plane ratio (3:1 non-text floor), measured from primitives. */
export function measureNeutralDark(option: NeutralDarkOption, plane: NeutralDarkPlane) {
  return {
    label: contrast(option.label, option.fill),
    fill: contrast(option.fill, planeHex(plane)),
  }
}

export const FILL_FLOOR = 3
