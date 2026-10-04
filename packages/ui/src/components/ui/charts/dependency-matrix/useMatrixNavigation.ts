import { useCallback, useEffect, useRef, useState } from 'react'

import { nextCell } from '../../../../utils/grid-navigation'
import { positionOf, refAt } from './matrix-model'
import type { MatrixCellRef, MatrixDirection, MatrixItem, MatrixPosition } from './types'

export interface UseMatrixNavigationOptions {
  /** Displayed items, after folding. Rows and columns share them. */
  items: MatrixItem[]
  direction: MatrixDirection
  /** Controlled active cell. `undefined` leaves the hook uncontrolled. */
  activeCell?: MatrixCellRef | null
  defaultActiveCell?: MatrixCellRef
  onActiveCellChange?: (cell: MatrixCellRef | null) => void
  /** Rows one Page Up or Page Down moves; one viewport of rows. */
  pageRows: number
}

export interface MatrixNavigation {
  /**
   * The active cell. When the requested one is no longer displayed it is the nearest cell to where
   * the active cell last was, and `onActiveCellChange` reports the replacement.
   */
  activeCell: MatrixCellRef | null
  position: MatrixPosition | null
  /** Moves for an APG grid key. Returns `true` when the key is a grid key, so the caller prevents default. */
  handleKey: (key: string, ctrlKey?: boolean) => boolean
  /** Makes a cell active, for a press or focus on it. */
  setActiveCell: (cell: MatrixCellRef) => void
}

const FIRST_CELL: MatrixPosition = { row: 0, col: 0 }

function nearestPosition(last: MatrixPosition | null, count: number): MatrixPosition {
  if (!last) return FIRST_CELL
  return { row: Math.min(last.row, count - 1), col: Math.min(last.col, count - 1) }
}

/** Owns the active cell of a DependencyMatrix and maps grid keys to moves. */
export function useMatrixNavigation(options: UseMatrixNavigationOptions): MatrixNavigation {
  const { items, direction, activeCell, defaultActiveCell, onActiveCellChange, pageRows } = options
  const isControlled = activeCell !== undefined
  const [internal, setInternal] = useState<MatrixCellRef | null>(defaultActiveCell ?? null)
  const [lastPosition, setLastPosition] = useState<MatrixPosition | null>(null)
  const requested = isControlled ? activeCell : internal
  const found = requested ? positionOf(items, requested, direction) : null
  const fallback = requested ? nearestPosition(lastPosition, items.length) : FIRST_CELL
  const position = items.length === 0 ? null : (found ?? fallback)
  const current = position ? refAt(items, position, direction) : null
  const row = position?.row ?? -1
  const col = position?.col ?? -1
  if (row >= 0 && (lastPosition?.row !== row || lastPosition?.col !== col)) {
    setLastPosition({ row, col })
  }

  const setActiveCell = useCallback(
    (cell: MatrixCellRef) => {
      if (!isControlled) setInternal(cell)
      onActiveCellChange?.(cell)
    },
    [isControlled, onActiveCellChange]
  )

  const report = useRef(setActiveCell)
  useEffect(() => {
    report.current = setActiveCell
  })
  const staleFrom = requested && !found ? current?.from : undefined
  const staleTo = requested && !found ? current?.to : undefined
  useEffect(() => {
    if (staleFrom !== undefined && staleTo !== undefined) {
      report.current({ from: staleFrom, to: staleTo })
    }
  }, [staleFrom, staleTo])

  const handleKey = useCallback(
    (key: string, ctrlKey = false): boolean => {
      if (row < 0) return false
      const size = { rows: items.length, cols: items.length }
      const next = nextCell({ key, ctrlKey, position: { row, col }, size, pageRows })
      if (!next) return false
      const ref = refAt(items, next, direction)
      if (ref && (next.row !== row || next.col !== col)) setActiveCell(ref)
      return true
    },
    [row, col, items, pageRows, direction, setActiveCell]
  )

  return { activeCell: current, position, handleKey, setActiveCell }
}
