import type { ReactNode } from 'react'
import type { ViewProps } from 'react-native'

export interface MatrixItem {
  id: string
  label: string
  group?: string
}

export type MatrixFlag = 'cycle' | 'violation'

/** One dependency: `from` depends on `to`. `value` is its weight, or `null` when unknown. */
export interface MatrixCell {
  from: string
  to: string
  value: number | null
  flag?: MatrixFlag
}

/** Names a cell by its two items whether or not it carries data. */
export interface MatrixCellRef {
  from: string
  to: string
}

export type MatrixScale = 'linear' | 'sqrt' | 'log'

export type MatrixDirection = 'row-depends-on-column' | 'column-depends-on-row'

export type MatrixDensity = 'comfortable' | 'dense'

/** Zero-based row and column of a cell in the displayed grid. */
export interface MatrixPosition {
  row: number
  col: number
}

export interface MatrixSize {
  rows: number
  cols: number
}

export interface DependencyMatrixProps extends ViewProps {
  items: MatrixItem[]
  cells: MatrixCell[]
  scale?: MatrixScale
  direction?: MatrixDirection
  showValues?: boolean
  maxItems?: number
  width: number
  height: number
  density?: MatrixDensity
  activeCell?: MatrixCellRef | null
  defaultActiveCell?: MatrixCellRef
  onActiveCellChange?: (cell: MatrixCellRef | null) => void
  onCellPress?: (cell: MatrixCell | MatrixCellRef) => void
  onHeaderPress?: (itemId: string) => void
  formatCellLabel?: (from: MatrixItem, to: MatrixItem, value: number | null) => string
  isLoading?: boolean
  isDisabled?: boolean
  emptyState?: ReactNode
  accessibilityLabel: string
  className?: string
}
