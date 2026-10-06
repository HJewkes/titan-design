import type { DimensionValue } from 'react-native'
import { Typography } from '../../typography'
import type { BarListColumnChars, rowTexts } from './bar-list-model'
import { TABULAR } from './shared'

/** A text a row can print after its bar. */
export type BarListReadout = 'value' | 'flag'

export const ALL_READOUTS: BarListReadout[] = ['value', 'flag']

/** True when `readouts` leaves out a readout, so the rows need a tip to show it. */
export function hidesReadout(readouts: readonly BarListReadout[]): boolean {
  return ALL_READOUTS.some((readout) => !readouts.includes(readout))
}

/** Which trailing cells the rows render: a part some shown row has, and that `readouts` shows. */
export interface BarListColumns {
  value: boolean
  secondary: boolean
  flag: boolean
}

export function resolveColumns(
  chars: BarListColumnChars,
  readouts: readonly BarListReadout[]
): BarListColumns {
  return {
    value: chars.value > 0 && readouts.includes('value'),
    secondary: chars.secondary > 0,
    flag: chars.flag > 0 && readouts.includes('flag'),
  }
}

export interface CellsProps {
  texts: ReturnType<typeof rowTexts>
  /** Character width of each trailing cell, the same for every row of a list. */
  columnChars: BarListColumnChars
  columns: BarListColumns
}

// RN's DimensionValue omits `ch`; react-native-web passes it through to CSS. Set on the Text
// itself, `ch` is that text's own font, so the mono column is exact.
const ch = (chars: number) => `${chars}ch` as unknown as DimensionValue
// The caption cells are not monospace, so each is sized a character wider than its text.
const CAPTION_PAD_CHARS = 1

/** The cells after the bar, in the order value, secondary, flag; an absent part leaves its cell empty. */
export function Cells({ texts, columnChars, columns }: CellsProps) {
  return (
    <>
      {columns.value ? (
        <Typography
          variant="mono"
          color="primary"
          align="right"
          style={[TABULAR, { minWidth: ch(columnChars.value) }]}
          testID="bar-list-value"
        >
          {texts.value}
        </Typography>
      ) : null}
      {columns.secondary ? (
        <Typography
          variant="caption"
          color="secondary"
          align="right"
          style={[TABULAR, { width: ch(columnChars.secondary + CAPTION_PAD_CHARS) }]}
          testID="bar-list-secondary"
        >
          {texts.secondary}
        </Typography>
      ) : null}
      {columns.flag ? (
        <Typography
          variant="caption"
          color="inherit"
          className="text-text-error leading-normal"
          style={{ width: ch(columnChars.flag + CAPTION_PAD_CHARS) }}
          testID="bar-list-flag"
        >
          {texts.flag}
        </Typography>
      ) : null}
    </>
  )
}
