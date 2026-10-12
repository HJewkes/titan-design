import {
  cleanValue,
  NO_VALUE_TEXT,
  type BarListModelMarker,
  type BarListRow,
  type BarListValueFormatter,
} from './bar-list-model'

/** What a row's tip prints: the label and value, then the limit when a marker is set, then the flag label. */
export interface BarListTipContent {
  label: string
  valueText: string
  limit: { label: string; valueText: string } | null
  flagLabel: string | null
}

/** The tip's text for one row, a pure function of the row and the caller's formatter. */
export function rowTip(
  row: BarListRow,
  formatValue: BarListValueFormatter,
  marker: BarListModelMarker | null = null
): BarListTipContent {
  const value = cleanValue(row.value)
  return {
    label: row.label,
    valueText: value === null ? NO_VALUE_TEXT : formatValue(value, row),
    limit: marker ? { label: marker.label, valueText: marker.valueText } : null,
    flagLabel: row.flag?.label ?? null,
  }
}
