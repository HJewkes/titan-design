/**
 * Pure filter, facet and range functions for the Table (TD-33). No React and no side effects, so
 * mutation testing reaches them (`*-model.ts`). `useTableState` composes them.
 */

/** A set filter holds the selected values (OR within the field); a text filter holds a search term. */
export type TableFilterValue = readonly string[] | string
export type TableFilters = Readonly<Record<string, TableFilterValue>>

export interface TableFilterColumn<T> {
  key: string
  /** Reads the filtered value; defaults to `row[key]`. Called at most once per row per active filter. */
  accessor?: (row: T) => unknown
}

export interface FacetOption {
  value: string
  count: number
  isSelected: boolean
}

/** Half-open row range: `start` included, `end` excluded. */
export interface RowRange {
  start: number
  end: number
}

export const MAX_BLOCK_ROWS = 500
export const DEFAULT_BLOCK_ROWS = 100

const isTextFilter = (value: TableFilterValue): value is string => typeof value === 'string'

const termOf = (value: string): string => value.trim().toLowerCase()

const isActive = (value: TableFilterValue): boolean =>
  isTextFilter(value) ? termOf(value) !== '' : value.length > 0

const ownValue = (filters: TableFilters, field: string): TableFilterValue | undefined =>
  Object.prototype.hasOwnProperty.call(filters, field) ? filters[field] : undefined

const readCell = (row: unknown, column: TableFilterColumn<never>): unknown =>
  column.accessor
    ? (column.accessor as (row: unknown) => unknown)(row)
    : (row as Record<string, unknown> | null | undefined)?.[column.key]

const asText = (cell: unknown): string => (cell === null || cell === undefined ? '' : String(cell))

interface ActiveFilter {
  column: TableFilterColumn<never>
  matches: (cell: unknown) => boolean
}

function activeFilters<T>(
  filters: TableFilters,
  columns: readonly TableFilterColumn<T>[]
): ActiveFilter[] {
  const result: ActiveFilter[] = []
  for (const column of columns) {
    const value = ownValue(filters, column.key)
    if (value === undefined || !isActive(value)) continue
    const matches = isTextFilter(value)
      ? (cell: unknown) => asText(cell).toLowerCase().includes(termOf(value))
      : (cell: unknown) => cell !== null && cell !== undefined && value.includes(asText(cell))
    result.push({ column: column as TableFilterColumn<never>, matches })
  }
  return result
}

/**
 * The rows that pass every active filter, in input order. Set filters are OR within a field, all
 * filters AND across fields; a text filter is a case-insensitive, trimmed contains. A filter on a
 * column not in `columns` is ignored. With nothing active the input array itself comes back.
 */
export function filterRows<T>(
  rows: readonly T[],
  filters: TableFilters,
  columns: readonly TableFilterColumn<T>[]
): readonly T[] {
  const active = activeFilters(filters, columns)
  if (active.length === 0) return rows
  return rows.filter((row) => active.every(({ column, matches }) => matches(readCell(row, column))))
}

/** Adds `value` to the field's selection, or removes it when already selected; an empty field is dropped. */
export function toggleSetFilter(filters: TableFilters, field: string, value: string): TableFilters {
  const current = ownValue(filters, field)
  const selected = Array.isArray(current) ? (current as readonly string[]) : []
  const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
  const { [field]: _dropped, ...rest } = filters
  return next.length === 0 ? rest : { ...rest, [field]: next }
}

/** Every filter cleared, or only `field`'s when given. */
export function clearFilters(filters: TableFilters, field?: string): TableFilters {
  if (field === undefined) return {}
  const { [field]: _dropped, ...rest } = filters
  return rest
}

/** How many fields have an active filter. Fields not in `columns` do not count. */
export function activeFilterCount<T>(
  filters: TableFilters,
  columns: readonly TableFilterColumn<T>[]
): number {
  return activeFilters(filters, columns).length
}

const toCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0

/**
 * A facet's options: the source counts in source order, then any selected value the source no longer
 * lists, with count 0, so a selected chip never vanishes. Counts that are not finite read as 0.
 */
export function facetOptions(
  counts: Readonly<Record<string, number>> | undefined,
  selected: readonly string[] = []
): FacetOption[] {
  const chosen = new Set(selected)
  const listed = Object.entries(counts ?? {}).map(([value, count]) => ({
    value,
    count: toCount(count),
    isSelected: chosen.has(value),
  }))
  const known = new Set(listed.map((option) => option.value))
  const missing = [...chosen].filter((value) => !known.has(value))
  return [...listed, ...missing.map((value) => ({ value, count: 0, isSelected: true }))]
}

/** How many rows hold each value of `column`, read as `filterRows` reads it. Blank cells are not counted. */
export function facetCounts<T>(
  rows: readonly T[],
  column: TableFilterColumn<T>
): Record<string, number> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const cell = readCell(row, column as TableFilterColumn<never>)
    if (cell === null || cell === undefined) continue
    const value = asText(cell)
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return Object.fromEntries(counts)
}

const toIndex = (value: number): number => toCount(value)

const toBlock = (block: number): number => Math.min(Math.max(toCount(block), 1), MAX_BLOCK_ROWS)

/**
 * `range` widened to whole blocks and clipped to `0..rowCount` and to `MAX_BLOCK_ROWS` rows. A request
 * wider than the cap is answered with its first blocks; `missingRanges` asks for the rest.
 */
export function alignRange(
  range: RowRange,
  rowCount: number,
  block: number = DEFAULT_BLOCK_ROWS
): RowRange {
  const size = toBlock(block)
  const total = toIndex(rowCount)
  const start = Math.floor(Math.min(toIndex(range.start), total) / size) * size
  const wanted = Math.ceil(Math.max(toIndex(range.end), start) / size) * size
  const cap = start + Math.floor(MAX_BLOCK_ROWS / size) * size
  return { start, end: Math.min(wanted, cap, total) }
}

/** The aligned blocks of `range` that hold at least one row `isLoaded` reports missing. */
export function missingRanges(
  range: RowRange,
  rowCount: number,
  isLoaded: (index: number) => boolean,
  block: number = DEFAULT_BLOCK_ROWS
): RowRange[] {
  const size = toBlock(block)
  const total = toIndex(rowCount)
  const start = Math.min(toIndex(range.start), total)
  const end = Math.min(Math.max(toIndex(range.end), start), total)
  const blocks: RowRange[] = []
  for (let from = Math.floor(start / size) * size; from < end; from += size) {
    const to = Math.min(from + size, total)
    const missing = Array.from({ length: to - from }, (_, i) => from + i).some((i) => !isLoaded(i))
    if (missing) blocks.push({ start: from, end: to })
  }
  return blocks
}

/** The slots of `range` inside `0..rowCount`; a row not loaded yet is `undefined`. */
export function windowSlice<T>(
  getRow: (index: number) => T | undefined,
  range: RowRange,
  rowCount: number
): (T | undefined)[] {
  const total = toIndex(rowCount)
  const start = Math.min(toIndex(range.start), total)
  const end = Math.min(Math.max(toIndex(range.end), start), total)
  return Array.from({ length: end - start }, (_, i) => getRow(start + i))
}
