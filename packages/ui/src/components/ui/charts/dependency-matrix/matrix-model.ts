import type {
  MatrixCell,
  MatrixCellRef,
  MatrixDirection,
  MatrixItem,
  MatrixPosition,
  MatrixScale,
} from './types'

export const DEFAULT_MAX_ITEMS = 60
/** Id of the "+M more" item; it can reach `onActiveCellChange` like any displayed item. */
export const FOLD_ITEM_ID = '\u0000more'
export const STEP_COUNT = 4

export type MatrixStep = 1 | 2 | 3 | 4

export interface MatrixBin {
  step: MatrixStep
  isUnknown: boolean
}

export interface MatrixIndex {
  /** Items with duplicate ids removed; the first occurrence wins. */
  items: MatrixItem[]
  /** Off-diagonal cells keyed by `cellKey`, duplicates merged. */
  cells: Map<string, MatrixCell>
  /** Self-references keyed by item id, kept apart from the grid. */
  diagonal: Map<string, MatrixCell>
  /** Cells dropped because an end names no item. */
  dropped: number
}

export interface GroupBand {
  group: string
  /** First item index, inclusive. */
  start: number
  /** One past the last item index. */
  end: number
}

export const cellKey = (from: string, to: string): string => `${from}\u0000${to}`

/** A weight that is not a finite, non-negative number is unknown. */
const sanitizeValue = (value: number | null): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null

/** Saturates at `Number.MAX_VALUE` so merging huge weights never yields `Infinity`. */
const addValues = (a: number | null, b: number | null): number | null =>
  a === null ? b : b === null ? a : Math.min(a + b, Number.MAX_VALUE)

function mergeInto(map: Map<string, MatrixCell>, key: string, cell: MatrixCell): void {
  const existing = map.get(key)
  const value = sanitizeValue(cell.value)
  const flag = existing?.flag ?? cell.flag
  const merged: MatrixCell = {
    from: cell.from,
    to: cell.to,
    value: existing ? addValues(existing.value, value) : value,
    ...(flag ? { flag } : {}),
  }
  map.set(key, merged)
}

function uniqueItems(items: MatrixItem[]): MatrixItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

/** Validates and indexes cells: drops unknown ids, merges duplicates, separates the diagonal. */
export function indexCells(items: MatrixItem[], cells: MatrixCell[]): MatrixIndex {
  const unique = uniqueItems(items)
  const known = new Set(unique.map((item) => item.id))
  const index: MatrixIndex = { items: unique, cells: new Map(), diagonal: new Map(), dropped: 0 }
  for (const cell of cells) {
    if (!known.has(cell.from) || !known.has(cell.to)) {
      index.dropped += 1
    } else if (cell.from === cell.to) {
      mergeInto(index.diagonal, cell.from, cell)
    } else {
      mergeInto(index.cells, cellKey(cell.from, cell.to), cell)
    }
  }
  return index
}

/** `Infinity` means no limit; `NaN` falls back to the default. */
function normalizeMaxItems(maxItems: number): number {
  if (maxItems === Number.POSITIVE_INFINITY) return maxItems
  return Number.isFinite(maxItems) ? Math.max(0, Math.floor(maxItems)) : DEFAULT_MAX_ITEMS
}

/**
 * Keeps the first `maxItems` items and folds the rest into one "+M more" item whose cells sum the
 * tail. A cell inside the tail becomes the fold item's self-reference. Cells naming an id outside
 * `items` are dropped. Every other weight is preserved, except that a merged sum saturates at
 * `Number.MAX_VALUE` instead of reaching `Infinity`. `maxItems` of `Infinity` folds nothing.
 * Expects unique ids, as `indexCells` returns.
 */
export function foldItems(
  items: MatrixItem[],
  cells: MatrixCell[],
  maxItems: number = DEFAULT_MAX_ITEMS
): { items: MatrixItem[]; cells: MatrixCell[] } {
  const keep = normalizeMaxItems(maxItems)
  const allIds = new Set(items.map((item) => item.id))
  const known = cells.filter((cell) => allIds.has(cell.from) && allIds.has(cell.to))
  if (items.length <= keep) return { items, cells: known }
  const kept = items.slice(0, keep)
  const keptIds = new Set(kept.map((item) => item.id))
  const fold: MatrixItem = { id: FOLD_ITEM_ID, label: `+${items.length - keep} more` }
  const remap = (id: string): string => (keptIds.has(id) ? id : FOLD_ITEM_ID)
  const merged = new Map<string, MatrixCell>()
  for (const cell of known) {
    const from = remap(cell.from)
    const to = remap(cell.to)
    mergeInto(merged, cellKey(from, to), { ...cell, from, to })
  }
  return { items: [...kept, fold], cells: [...merged.values()] }
}

const SCALES: Record<MatrixScale, (value: number) => number> = {
  linear: (value) => value,
  sqrt: Math.sqrt,
  log: Math.log1p,
}

/**
 * Bins a weight into one of four steps relative to `max` on the given scale. An unknown weight
 * lands on step 1 and is marked `isUnknown`; weights above `max` land on step 4.
 */
export function binValue(
  value: number | null,
  max: number,
  scale: MatrixScale = 'sqrt'
): MatrixBin {
  const known = sanitizeValue(value)
  if (known === null) return { step: 1, isUnknown: true }
  const transform = SCALES[scale] ?? SCALES.sqrt
  const top = transform(sanitizeValue(max) ?? 0)
  if (!(top > 0)) return { step: known > 0 ? STEP_COUNT : 1, isUnknown: false }
  const ratio = Math.min(transform(known) / top, 1)
  const step = Math.min(STEP_COUNT, Math.max(1, Math.ceil(ratio * STEP_COUNT))) as MatrixStep
  return { step, isUnknown: false }
}

/** Every pair of distinct items that depend on each other, each pair listed once. */
export function mutualPairs(cells: Iterable<MatrixCell>): [string, string][] {
  const present = new Set<string>()
  for (const cell of cells) present.add(cellKey(cell.from, cell.to))
  const pairs: [string, string][] = []
  const listed = new Set<string>()
  for (const cell of cells) {
    const { from, to } = cell
    if (from === to || !present.has(cellKey(to, from)) || listed.has(cellKey(from, to))) continue
    listed.add(cellKey(from, to))
    listed.add(cellKey(to, from))
    pairs.push([from, to])
  }
  return pairs
}

/** Contiguous runs of items sharing a group. Ungrouped items form no band. */
export function groupBands(items: MatrixItem[]): GroupBand[] {
  const bands: GroupBand[] = []
  items.forEach((item, index) => {
    const last = bands[bands.length - 1]
    if (item.group === undefined) return
    if (last && last.group === item.group && last.end === index) {
      last.end = index + 1
    } else {
      bands.push({ group: item.group, start: index, end: index + 1 })
    }
  })
  return bands
}

/** The cell reference at a grid position: rows are `from` unless the columns are. */
export function refAt(
  items: MatrixItem[],
  position: MatrixPosition,
  direction: MatrixDirection
): MatrixCellRef | null {
  const rowItem = items[position.row]
  const colItem = items[position.col]
  if (!rowItem || !colItem) return null
  return direction === 'row-depends-on-column'
    ? { from: rowItem.id, to: colItem.id }
    : { from: colItem.id, to: rowItem.id }
}

/** The grid position of a cell reference, or `null` when either id is not displayed. */
export function positionOf(
  items: MatrixItem[],
  ref: MatrixCellRef,
  direction: MatrixDirection
): MatrixPosition | null {
  const from = items.findIndex((item) => item.id === ref.from)
  const to = items.findIndex((item) => item.id === ref.to)
  if (from < 0 || to < 0) return null
  return direction === 'row-depends-on-column' ? { row: from, col: to } : { row: to, col: from }
}

function weightText(value: number | null): string {
  if (value === null) return 'weight unknown'
  return value === 1 ? '1 reference' : `${value} references`
}

/**
 * The default accessible name for the cell where `from` depends on `to`. The subject follows
 * `direction`: the row item under `row-depends-on-column`, the column item otherwise.
 */
export function cellLabel(
  from: MatrixItem,
  to: MatrixItem,
  cell: MatrixCell | undefined,
  direction: MatrixDirection
): string {
  const rowFirst = direction === 'row-depends-on-column'
  if (!cell) {
    return rowFirst
      ? `${from.label} has no dependency on ${to.label}`
      : `${to.label} is not a dependency of ${from.label}`
  }
  const sentence = rowFirst
    ? `${from.label} depends on ${to.label}`
    : `${to.label} is a dependency of ${from.label}`
  const flag = cell.flag ? `, ${cell.flag}` : ''
  return `${sentence}, ${weightText(sanitizeValue(cell.value))}${flag}`
}
