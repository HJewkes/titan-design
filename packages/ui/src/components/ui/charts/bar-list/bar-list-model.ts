import type { ColorToken } from '../../../../theme/resolve-color'
import { formatCompact } from '../../../../utils/number-format'

export interface BarListRow {
  id: string
  label: string
  value: number | null
  secondaryValue?: number | null
  description?: string
  flag?: { tone: 'warning' | 'error'; label: string }
  color?: ColorToken
}

export interface BarListRowContext {
  rank: number
  shownCount: number
  fraction: number
}

export interface BarListModelRow {
  row: BarListRow
  /** Position in the input, used with the id to key duplicate ids. */
  index: number
  rank: number
  fraction: number
}

export interface BarListModel {
  rows: BarListModelRow[]
  inputCount: number
  shownCount: number
  hiddenCount: number
  hiddenTotal: number
  max: number
  sort: 'descending' | 'none'
  largest: { label: string; valueText: string } | null
}

export interface BarListModelOptions {
  max?: number
  sort?: 'descending' | 'none'
  maxRows?: number
  formatValue?: (value: number, row: BarListRow) => string
}

export interface RowFormatters {
  formatValue: (value: number, row: BarListRow) => string
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
  { max, sort = 'descending', maxRows, formatValue = formatCompact }: BarListModelOptions = {}
): BarListModel {
  const resolved = resolveMax(rows, max)
  const { shown, hidden } = rankRows(rows, sort, maxRows)
  const modelRows = shown.map(({ row, index }, i) => ({
    row,
    index,
    rank: i + 1,
    fraction: barFraction(row.value, resolved),
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
    max: resolved,
    sort,
    largest,
  }
}

export function defaultOverflowLabel(hiddenCount: number, hiddenTotal: number): string {
  return `${hiddenCount} more · ${formatCompact(hiddenTotal)}`
}

/** The row's accessible name: every visible part, in words, so the bar and colour add nothing. */
export function rowLabel(
  { row, rank, shownCount }: { row: BarListRow } & BarListRowContext,
  { formatValue, formatSecondary }: RowFormatters
): string {
  const value = cleanValue(row.value)
  const secondary = cleanValue(row.secondaryValue)
  const parts = [
    `${row.label}: ${value === null ? NO_VALUE_TEXT : formatValue(value, row)}`,
    secondary === null ? null : formatSecondary(secondary, row),
    row.flag?.label ?? null,
    `rank ${rank} of ${shownCount}`,
  ]
  return parts.filter((part): part is string => part !== null).join(', ')
}

const plural = (count: number): string => `${count} ${count === 1 ? 'item' : 'items'}`

export function summarizeBarList(model: BarListModel): string {
  if (model.inputCount === 0) return 'No data.'
  if (model.inputCount === 1) {
    const only = model.rows[0].row
    return `1 item: ${only.label}${model.largest ? `, ${model.largest.valueText}` : ''}.`
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
      ? ` ${model.hiddenCount} more not shown, totalling ${formatCompact(model.hiddenTotal)}.`
      : ''
  return `${shown}${largest}${hidden}`
}

/** The list's accessible name: the caller's label, then the summary (the caller's or the default). */
export function readoutName(
  label: string,
  model: BarListModel,
  summarize: (model: BarListModel) => string = summarizeBarList
): string {
  return `${label}. ${summarize(model)}`
}
