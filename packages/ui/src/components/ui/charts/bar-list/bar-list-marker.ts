import { formatCompact } from '../../../../utils/number-format'

/** One labelled line on a BarList's value axis: a cutoff, a budget, a target. */
export interface BarListMarker {
  /** Position on the value axis, in the rows' unit. */
  value: number
  /** Names the marker in the legend, the row names and the summary. */
  label: string
  /** Formats `value` for the legend and the summary. Default `formatCompact`. */
  formatValue?: (value: number) => string
}

export interface BarListModelMarker {
  label: string
  value: number
  valueText: string
  /** value / max when the line is drawn (above 0, at most 1); otherwise null. */
  fraction: number | null
  /** Rows, shown or hidden, with a finite value at or above the marker. */
  reachedCount: number
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const DEFAULT_MARKER_LABEL = 'Reference'

/** A marker with no finite value above zero is ignored; a blank label becomes "Reference". */
export function cleanMarker(marker: BarListMarker | undefined): BarListMarker | null {
  if (!marker || !isFiniteNumber(marker.value) || marker.value <= 0) return null
  return { ...marker, label: marker.label?.trim() || DEFAULT_MARKER_LABEL }
}

export function markerFraction(value: number, max: number): number | null {
  const fraction = value / max
  return fraction > 0 && fraction <= 1 ? fraction : null
}

export function reachesMarker(rowValue: number | null | undefined, markerValue: number): boolean {
  return isFiniteNumber(rowValue) && rowValue >= markerValue
}

export function buildMarker(
  referenceMarker: BarListMarker | undefined,
  rows: { value: number | null }[],
  max: number
): BarListModelMarker | null {
  const marker = cleanMarker(referenceMarker)
  if (!marker) return null
  const format = marker.formatValue ?? formatCompact
  return {
    label: marker.label,
    value: marker.value,
    valueText: format(marker.value),
    fraction: markerFraction(marker.value, max),
    reachedCount: rows.filter((row) => reachesMarker(row.value, marker.value)).length,
  }
}

export function markerSentence(marker: BarListModelMarker | null, items: string): string {
  if (!marker) return ''
  return ` ${marker.label}: ${marker.valueText}. ${marker.reachedCount} of ${items} at or above.`
}
