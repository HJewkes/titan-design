import { useCallback, useState } from 'react'

import { nextCell, positionOf, refAt } from './matrix-model'
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
  /** The active cell, falling back to the first cell when the requested one is not displayed. */
  activeCell: MatrixCellRef | null
  position: MatrixPosition | null
  /** Moves for an APG grid key. Returns `true` when the key is a grid key, so the caller prevents default. */
  handleKey: (key: string, ctrlKey?: boolean) => boolean
  /** Makes a cell active, for a press or focus on it. */
  setActiveCell: (cell: MatrixCellRef) => void
}

function resolvePosition(
  items: MatrixItem[],
  requested: MatrixCellRef | null | undefined,
  direction: MatrixDirection
): MatrixPosition | null {
  if (items.length === 0) return null
  return (requested && positionOf(items, requested, direction)) ?? { row: 0, col: 0 }
}

/** Owns the active cell of a DependencyMatrix and maps grid keys to moves. */
export function useMatrixNavigation(options: UseMatrixNavigationOptions): MatrixNavigation {
  const { items, direction, activeCell, defaultActiveCell, onActiveCellChange, pageRows } = options
  const isControlled = activeCell !== undefined
  const [internal, setInternal] = useState<MatrixCellRef | null>(defaultActiveCell ?? null)
  const position = resolvePosition(items, isControlled ? activeCell : internal, direction)
  const current = position ? refAt(items, position, direction) : null

  const setActiveCell = useCallback(
    (cell: MatrixCellRef) => {
      if (!isControlled) setInternal(cell)
      onActiveCellChange?.(cell)
    },
    [isControlled, onActiveCellChange]
  )

  const row = position?.row ?? -1
  const col = position?.col ?? -1
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
