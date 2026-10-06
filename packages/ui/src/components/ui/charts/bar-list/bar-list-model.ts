import type { ColorToken } from '../../../../theme/resolve-color'
import { formatCompact } from '../../../../utils/number-format'
import {
  buildMarker,
  cleanMarker,
  markerFraction,
  markerSentence,
  reachesMarker,
  type BarListMarker,
  type BarListModelMarker,
} from './bar-list-marker'

export { buildMarker, cleanMarker, markerFraction, reachesMarker }
export type { BarListMarker, BarListModelMarker }

/** One row of a BarList. */
export interface BarListRow {
  /** Identifies the row. Duplicates are kept and keyed with their position. */
  id: string
  /** The row's name, shown before the bar. */
  label: string
  /** Sizes the bar. A null, NaN or infinite value is missing and draws no bar. */
  value: number | null
  /** A second number shown beside the value; it does not size the bar. */
  secondaryValue?: number | null
  /** A line under the label, stacked layout only. */
  description?: string
  /** Marks the row: its bar turns red and `label` says why, in view and in the accessible name. */
  flag?: { tone: 'warning' | 'error'; label: string }
  /** Overrides the bar fill for this row, flagged or not. */
  color?: ColorToken
}

/** Formats a row's value, or the total of the rows past the cap when called without a row. */
export type BarListValueFormatter = (value: number, row?: BarListRow) => string

export interface BarListModelRow {
  row: BarListRow
  /** Position in the input, used with the id to key duplicate ids. */
  index: number
  rank: number
  fraction: number
  reachesMarker: boolean
}

export interface BarListModel {
  rows: BarListModelRow[]
  inputCount: number
  shownCount: number
  hiddenCount: number
  hiddenTotal: number
  /** The hidden total in the caller's value format, for the overflow row and the summary. */
  hiddenTotalText: string
  max: number
  sort: 'descending' | 'none'
  largest: { label: string; valueText: string } | null
  /** Character width of the widest values cell, so every inline row gives its values the same width. */
  valuesChars: number
  marker: BarListModelMarker | null
}

export interface BarListModelOptions {
  referenceMarker?: BarListMarker
  max?: number
  sort?: 'descending' | 'none'
  maxRows?: number
  formatValue?: BarListValueFormatter
  formatSecondary?: (value: number, row: BarListRow) => string
}

export interface RowFormatters {
  formatValue: BarListValueFormatter
  formatSecondary: (value: number, row: BarListRow) => string
}

export const DEFAULT_MAX_ROWS = 10
export const NO_VALUE_TEXT = 'No value'

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** A null, NaN or infinite value is missing: it draws no bar and never sets the maximum. */
export function cleanValue(value: number | null | undefined): number | null {
  return isFiniteNumber(value) ? value : null
}

export function resolveMax(rows: BarListRow[], max?: number): number {
  if (isFiniteNumber(max) && max > 0) return max
  let largest = 0
  for (const row of rows) {
    const value = cleanValue(row.value)
    if (value !== null && value > largest) largest = value
  }
  return largest > 0 ? largest : 1
}

export function barFraction(value: number | null, max: number): number {
  const clean = cleanValue(value)
  if (clean === null || clean <= 0) return 0
  return Math.min(1, clean / max)
}

export function normalizeMaxRows(maxRows: number | undefined): number {
  if (maxRows === undefined || Number.isNaN(maxRows)) return DEFAULT_MAX_ROWS
  return Math.max(1, Math.floor(maxRows))
}

interface Ranked {
  shown: { row: BarListRow; index: number }[]
  hidden: BarListRow[]
}

export function rankRows(
  rows: BarListRow[],
  sort: 'descending' | 'none',
  maxRows: number | undefined
): Ranked {
  const indexed = rows.map((row, index) => ({ row, index }))
  if (sort === 'descending') {
    const key = (row: BarListRow) => cleanValue(row.value) ?? -Infinity
    indexed.sort((a, b) => {
      const ka = key(a.row)
      const kb = key(b.row)
      return ka > kb ? -1 : ka < kb ? 1 : 0
    })
  }
  const cap = normalizeMaxRows(maxRows)
  return { shown: indexed.slice(0, cap), hidden: indexed.slice(cap).map((r) => r.row) }
}

export function buildBarListModel(
  rows: BarListRow[],
  {
    max,
    referenceMarker,
    sort = 'descending',
    maxRows,
    formatValue = formatCompact,
    formatSecondary = formatCompact,
  }: BarListModelOptions = {}
): BarListModel {
  const resolved = resolveMax(rows, max)
  const { shown, hidden } = rankRows(rows, sort, maxRows)
  const marker = buildMarker(referenceMarker, rows, resolved)
  const modelRows = shown.map(({ row, index }, i) => ({
    row,
    index,
    rank: i + 1,
    fraction: barFraction(row.value, resolved),
    reachesMarker: marker !== null && reachesMarker(row.value, marker.value),
  }))
  const hiddenTotal = hidden.reduce((sum, row) => sum + (cleanValue(row.value) ?? 0), 0)
  const first = modelRows[0]
  const firstValue = first ? cleanValue(first.row.value) : null
  const largest =
    sort === 'descending' && first && firstValue !== null
      ? { label: first.row.label, valueText: formatValue(firstValue, first.row) }
      : null
  return {
    rows: modelRows,
    inputCount: rows.length,
    shownCount: modelRows.length,
    hiddenCount: hidden.length,
    hiddenTotal,
    hiddenTotalText: formatValue(hiddenTotal),
    max: resolved,
    sort,
    largest,
    valuesChars: valuesChars(modelRows, { formatValue, formatSecondary }),
    marker,
  }
}

const CELL_GAP_CHARS = 1

/** The widest values cell (flag, secondary and value, with their gaps) among the shown rows. */
export function valuesChars(rows: BarListModelRow[], formatters: RowFormatters): number {
  const widths = rows.map(({ row }) => {
    const value = cleanValue(row.value)
    const secondary = cleanValue(row.secondaryValue)
    const parts = [
      row.flag?.label,
      secondary === null ? undefined : formatters.formatSecondary(secondary, row),
      value === null ? NO_VALUE_TEXT : formatters.formatValue(value, row),
    ].filter((part): part is string => part !== undefined)
    const text = parts.reduce((sum, part) => sum + part.length, 0)
    return text + CELL_GAP_CHARS * (parts.length - 1)
  })
  return Math.max(0, ...widths)
}

export function overflowLabel(model: BarListModel): string {
  return `${model.hiddenCount} more · ${model.hiddenTotalText}`
}

export interface RowLabelContext {
  row: BarListRow
  rank: number
  shownCount: number
  sort: 'descending' | 'none'
  /** Label of the reference marker the row is at or above; absent or null when it reaches none. */
  reachedMarker?: string | null
}

/**
 * The row's accessible name: every visible part, in words, so the bar and colour add nothing.
 * A list in input order is not ranked, so its rows carry no rank.
 */
export function rowLabel(
  { row, rank, shownCount, sort, reachedMarker = null }: RowLabelContext,
  { formatValue, formatSecondary }: RowFormatters
): string {
  const value = cleanValue(row.value)
  const secondary = cleanValue(row.secondaryValue)
  const parts = [
    `${row.label}: ${value === null ? NO_VALUE_TEXT : formatValue(value, row)}`,
    secondary === null ? null : formatSecondary(secondary, row),
    row.flag?.label ?? null,
    reachedMarker === null ? null : `at or above ${reachedMarker}`,
    sort === 'descending' ? `rank ${rank} of ${shownCount}` : null,
  ]
  return parts.filter((part): part is string => part !== null).join(', ')
}

const plural = (count: number): string => `${count} ${count === 1 ? 'item' : 'items'}`

export function summarizeBarList(model: BarListModel): string {
  if (model.inputCount === 0) return 'No data.'
  const marker = markerSentence(model.marker, plural(model.inputCount))
  if (model.inputCount === 1) {
    const only = model.rows[0].row
    return `1 item: ${only.label}${model.largest ? `, ${model.largest.valueText}` : ''}.${marker}`
  }
  const shown =
    model.sort === 'descending'
      ? `Top ${model.shownCount} of ${plural(model.inputCount)} by value.`
      : `First ${model.shownCount} of ${plural(model.inputCount)}, in order.`
  const largest = model.largest
    ? ` Largest: ${model.largest.label}, ${model.largest.valueText}.`
    : ''
  const hidden =
    model.hiddenCount > 0
      ? ` ${model.hiddenCount} more not shown, totalling ${model.hiddenTotalText}.`
      : ''
  return `${shown}${largest}${hidden}${marker}`
}

/** The list's accessible name: the caller's label, then the summary. */
export function readoutName(label: string, model: BarListModel): string {
  return `${label}. ${summarizeBarList(model)}`
}
