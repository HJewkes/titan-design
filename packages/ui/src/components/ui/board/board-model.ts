import type { BoardColumn, BoardItem, BoardLane } from './types'

/** Id of the trailing lane that holds items with a missing or unknown `laneId`. */
export const UNASSIGNED_LANE_ID = '\u0000unassigned'

export type BoardProblemKind =
  | 'duplicate-item'
  | 'duplicate-column'
  | 'duplicate-lane'
  | 'unknown-column'

export interface BoardProblem {
  kind: BoardProblemKind
  id: string
}

export interface BoardCell<T> {
  columnId: string
  laneId: string | null
  items: BoardItem<T>[]
}

export interface BoardRow<T> {
  /** `null` when the board has no lanes. */
  laneId: string | null
  cells: BoardCell<T>[]
  count: number
}

export interface BoardModel<T> {
  columns: BoardColumn[]
  /** Declared lanes after duplicates are dropped; the catch-all lane is only a row. */
  lanes: BoardLane[]
  rows: BoardRow<T>[]
  columnCounts: Map<string, number>
  keptCount: number
  problems: BoardProblem[]
}

function uniqueById<E extends { id: string }>(
  entries: E[],
  kind: BoardProblemKind,
  problems: BoardProblem[]
): E[] {
  const seen = new Set<string>()
  return entries.filter((entry) => {
    if (seen.has(entry.id)) {
      problems.push({ kind, id: entry.id })
      return false
    }
    seen.add(entry.id)
    return true
  })
}

function rowIdFor(item: BoardItem, laneIds: Set<string>, hasLanes: boolean): string | null {
  if (!hasLanes) return null
  return item.laneId !== undefined && laneIds.has(item.laneId) ? item.laneId : UNASSIGNED_LANE_ID
}

function emptyRow<T>(laneId: string | null, columns: BoardColumn[]): BoardRow<T> {
  return {
    laneId,
    count: 0,
    cells: columns.map((column) => ({ columnId: column.id, laneId, items: [] })),
  }
}

/**
 * Sorts items into a lane-by-column grid. Later duplicate ids are dropped, an unknown `columnId` drops
 * the item, and a missing or unknown `laneId` goes to a trailing catch-all row. Every drop is reported.
 */
export function buildBoardModel<T>(
  columnsIn: BoardColumn[],
  lanesIn: BoardLane[] | undefined,
  itemsIn: BoardItem<T>[]
): BoardModel<T> {
  const problems: BoardProblem[] = []
  const columns = uniqueById(columnsIn, 'duplicate-column', problems)
  const lanes = uniqueById(lanesIn ?? [], 'duplicate-lane', problems)
  const items = uniqueById(itemsIn, 'duplicate-item', problems)

  const hasLanes = lanes.length > 0
  const laneIds = new Set(lanes.map((lane) => lane.id))
  const columnIndex = new Map(columns.map((column, index) => [column.id, index]))
  const rowMap = new Map<string | null, BoardRow<T>>(
    (hasLanes ? lanes.map((lane) => lane.id) : [null]).map((id) => [id, emptyRow<T>(id, columns)])
  )
  const columnCounts = new Map(columns.map((column) => [column.id, 0]))

  let keptCount = 0
  for (const item of items) {
    const index = columnIndex.get(item.columnId)
    if (index === undefined) {
      problems.push({ kind: 'unknown-column', id: item.id })
      continue
    }
    const rowId = rowIdFor(item, laneIds, hasLanes)
    let row = rowMap.get(rowId)
    if (!row) {
      row = emptyRow<T>(rowId, columns)
      rowMap.set(rowId, row)
    }
    row.cells[index].items.push(item)
    row.count += 1
    columnCounts.set(item.columnId, (columnCounts.get(item.columnId) ?? 0) + 1)
    keptCount += 1
  }

  return { columns, lanes, rows: [...rowMap.values()], columnCounts, keptCount, problems }
}

export type LimitStatus = 'none' | 'under' | 'at' | 'over'

/** Anything but a positive integer limit reads as `'none'`. */
export function limitStatus(count: number, limit: number | undefined): LimitStatus {
  if (limit === undefined || !Number.isInteger(limit) || limit <= 0) return 'none'
  if (count > limit) return 'over'
  return count === limit ? 'at' : 'under'
}

export interface FoldedCell<T> {
  visible: BoardItem<T>[]
  hidden: number
}

/** Keeps the first `max` items plus any pinned item past that point. A NaN `max` folds nothing. */
export function foldCell<T>(
  items: BoardItem<T>[],
  max: number,
  pinnedIds: ReadonlySet<string>
): FoldedCell<T> {
  if (Number.isNaN(max)) return { visible: items, hidden: 0 }
  const cap = Math.max(0, Math.floor(max))
  const visible = items.filter((item, index) => index < cap || pinnedIds.has(item.id))
  return { visible, hidden: items.length - visible.length }
}

export type BoardKey =
  | 'Down'
  | 'Up'
  | 'Left'
  | 'Right'
  | 'Home'
  | 'End'
  | 'CtrlHome'
  | 'CtrlEnd'
  | 'PageDown'
  | 'PageUp'

export interface BoardFold {
  maxItemsPerCell: number
  pinnedIds: ReadonlySet<string>
}

const PAGE_SIZE = 10

type Grid = string[][][]
interface Pos {
  r: number
  c: number
  i: number
}

function visibleGrid<T>(model: BoardModel<T>, fold: BoardFold, activeId: string | null): Grid {
  const pinned = new Set(fold.pinnedIds)
  if (activeId !== null) pinned.add(activeId)
  return model.rows.map((row) =>
    row.cells.map((cell) =>
      foldCell(cell.items, fold.maxItemsPerCell, pinned).visible.map((item) => item.id)
    )
  )
}

function locate(grid: Grid, id: string): Pos | null {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const i = grid[r][c].indexOf(id)
      if (i >= 0) return { r, c, i }
    }
  }
  return null
}

function firstPos(grid: Grid): Pos | null {
  for (let r = 0; r < grid.length; r++) {
    const c = grid[r].findIndex((cell) => cell.length > 0)
    if (c >= 0) return { r, c, i: 0 }
  }
  return null
}

const lastIndex = (cell: string[]): number => cell.length - 1

function vertical(grid: Grid, { r, c, i }: Pos, step: 1 | -1): Pos | null {
  const inside = i + step
  if (inside >= 0 && inside < grid[r][c].length) return { r, c, i: inside }
  for (let r2 = r + step; r2 >= 0 && r2 < grid.length; r2 += step) {
    const cell = grid[r2][c]
    if (cell.length > 0) return { r: r2, c, i: step === 1 ? 0 : lastIndex(cell) }
  }
  return null
}

function horizontal(grid: Grid, { r, c, i }: Pos, step: 1 | -1): Pos | null {
  for (let c2 = c + step; c2 >= 0 && c2 < grid[r].length; c2 += step) {
    const cell = grid[r][c2]
    if (cell.length > 0) return { r, c: c2, i: Math.min(i, lastIndex(cell)) }
  }
  return null
}

function column(grid: Grid, c: number): Pos[] {
  return grid.flatMap((row, r) => row[c].map((_, i) => ({ r, c, i })))
}

function page({ r, c, i }: Pos, grid: Grid, step: 1 | -1): Pos {
  const cards = column(grid, c)
  const at = cards.findIndex((pos) => pos.r === r && pos.i === i)
  return cards[Math.min(Math.max(at + step * PAGE_SIZE, 0), cards.length - 1)]
}

function corner(grid: Grid, edge: 'first' | 'last'): Pos | null {
  const columns = grid[0]?.map((_, c) => c).filter((c) => column(grid, c).length > 0) ?? []
  if (columns.length === 0) return null
  const cards = column(grid, edge === 'first' ? columns[0] : columns[columns.length - 1])
  return edge === 'first' ? cards[0] : cards[cards.length - 1]
}

function move(grid: Grid, at: Pos, key: BoardKey): Pos | null {
  switch (key) {
    case 'Down':
      return vertical(grid, at, 1)
    case 'Up':
      return vertical(grid, at, -1)
    case 'Right':
      return horizontal(grid, at, 1)
    case 'Left':
      return horizontal(grid, at, -1)
    case 'Home':
      return { ...at, i: 0 }
    case 'End':
      return { ...at, i: lastIndex(grid[at.r][at.c]) }
    case 'CtrlHome':
      return corner(grid, 'first')
    case 'CtrlEnd':
      return corner(grid, 'last')
    case 'PageDown':
      return page(at, grid, 1)
    case 'PageUp':
      return page(at, grid, -1)
  }
}

/**
 * The id the key moves to, never wrapping and never landing on a folded or empty card. An unknown or
 * null `activeId` enters the board at its first card. The id is `null` only when nothing is visible.
 */
export function nextItem<T>(
  model: BoardModel<T>,
  activeId: string | null,
  key: BoardKey,
  fold: BoardFold
): string | null {
  const grid = visibleGrid(model, fold, activeId)
  const at = activeId === null ? null : locate(grid, activeId)
  const target = at ? (move(grid, at, key) ?? at) : firstPos(grid)
  return target ? grid[target.r][target.c][target.i] : null
}
