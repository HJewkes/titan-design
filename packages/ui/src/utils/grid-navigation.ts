/** Zero-based row and column of a cell in a grid. */
export interface GridPosition {
  row: number
  col: number
}

export interface GridSize {
  rows: number
  cols: number
}

export interface NextCellInput {
  key: string
  ctrlKey?: boolean
  position: GridPosition
  size: GridSize
  /** Rows one Page Up or Page Down moves. */
  pageRows: number
}

const clampTo = (value: number, count: number): number =>
  Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 0), Math.max(count - 1, 0)) : 0

const toCount = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0

type Move = (p: GridPosition, last: GridPosition, page: number) => GridPosition

const MOVES: Record<string, Move> = {
  ArrowUp: (p) => ({ row: p.row - 1, col: p.col }),
  ArrowDown: (p) => ({ row: p.row + 1, col: p.col }),
  ArrowLeft: (p) => ({ row: p.row, col: p.col - 1 }),
  ArrowRight: (p) => ({ row: p.row, col: p.col + 1 }),
  Home: (p) => ({ row: p.row, col: 0 }),
  End: (p, last) => ({ row: p.row, col: last.col }),
  PageUp: (p, _last, page) => ({ row: p.row - page, col: p.col }),
  PageDown: (p, _last, page) => ({ row: p.row + page, col: p.col }),
}

const CTRL_MOVES: Record<string, Move> = {
  Home: () => ({ row: 0, col: 0 }),
  End: (_p, last) => last,
}

/**
 * The position an APG grid key moves to, or `null` for a key the grid does not handle. Moves clamp
 * at the edges and never wrap. An empty grid answers `{ row: 0, col: 0 }`.
 */
export function nextCell({
  key,
  ctrlKey,
  position,
  size,
  pageRows,
}: NextCellInput): GridPosition | null {
  const move = (ctrlKey ? CTRL_MOVES[key] : undefined) ?? MOVES[key]
  if (!move) return null
  const rows = toCount(size.rows)
  const cols = toCount(size.cols)
  const current = { row: clampTo(position.row, rows), col: clampTo(position.col, cols) }
  const last = { row: Math.max(rows - 1, 0), col: Math.max(cols - 1, 0) }
  const page = Number.isFinite(pageRows) ? Math.max(1, Math.trunc(pageRows)) : 1
  const target = move(current, last, page)
  return { row: clampTo(target.row, rows), col: clampTo(target.col, cols) }
}
