import type { DimensionValue } from 'react-native'
import { Typography } from '../../typography'
import type { BarListColumnChars, rowTexts } from './bar-list-model'
import { TABULAR } from './shared'

/** Which trailing cells the rows render: a part some shown row has, and that the list shows. */
export interface BarListColumns {
  value: boolean
  secondary: boolean
}

export function resolveColumns(chars: BarListColumnChars, isValueHidden: boolean): BarListColumns {
  return {
    value: chars.value > 0 && !isValueHidden,
    secondary: chars.secondary > 0,
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
// The caption cell is not monospace, so it is sized a character wider than its text.
const CAPTION_PAD_CHARS = 1

/** The cells after the bar, value then secondary; an absent part leaves its cell empty. */
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
    </>
  )
}
