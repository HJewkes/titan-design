import type { ReactNode } from 'react'
import type { ViewProps } from 'react-native'

/** A subset of the Pill tones; `brand-secondary` is left out because Indicator has no matching colour. */
export const BOARD_TONES = ['neutral', 'brand', 'success', 'warning', 'error', 'info'] as const
export type BoardTone = (typeof BOARD_TONES)[number]

export interface BoardColumn {
  id: string
  label: string
  /** Default `'neutral'`. The only source of a column's colour. */
  tone?: BoardTone
  /** A positive integer; anything else means no limit. */
  limit?: number
  /** Tooltip and accessible description of the header. */
  description?: string
  headerTrailing?: ReactNode
}

export interface BoardLane {
  id: string
  label: string
}

export interface BoardItem<T = unknown> {
  /** Unique across the board. */
  id: string
  columnId: string
  laneId?: string
  /** Accessible name of the card. */
  label: string
  data?: T
}

export interface BoardCardState {
  isActive: boolean
  isHighlighted: boolean
  isDisabled: boolean
}

export interface BoardProps<T = unknown> extends ViewProps {
  /** Array order is display order. */
  columns: BoardColumn[]
  /** Absent or empty: no lanes. */
  lanes?: BoardLane[]
  /** Array order is order inside a cell. */
  items: BoardItem<T>[]
  renderCard: (item: BoardItem<T>, state: BoardCardState) => ReactNode

  activeItemId?: string | null
  defaultActiveItemId?: string
  onActiveItemChange?: (id: string | null) => void

  /** Input only; the consumer clears it. */
  highlightedItemId?: string | null
  onItemPress?: (item: BoardItem<T>) => void

  /** Default 50. */
  maxItemsPerCell?: number
  columnMinWidth?: number
  /** When set, the body scrolls under the header row. */
  height?: number

  /** Accessible text for a column's count. */
  formatCount?: (count: number, limit: number | undefined) => string
  /** Names the lane header column. Default `'Group'`. */
  lanesLabel?: string
  /** Default `'Other'`. */
  unassignedLaneLabel?: string

  isLoading?: boolean
  isDisabled?: boolean
  /** Shown when there are no columns. */
  emptyState?: ReactNode
  /** Shown in a cell with no items. */
  emptyCell?: ReactNode

  /** Required; names the grid. */
  accessibilityLabel: string
  className?: string
}
