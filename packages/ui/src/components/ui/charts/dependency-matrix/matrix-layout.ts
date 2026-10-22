import type { FixedWindow } from '../../../../utils/fixed-window'
import type { MatrixDensity } from './types'

export const CELL_SIZE: Record<MatrixDensity, number> = { comfortable: 32, dense: 20 }
export const ROW_HEADER_WIDTH = 120
export const COLUMN_HEADER_HEIGHT = 96
export const OVERSCAN = 2

export const extent = (value: number): number => (Number.isFinite(value) ? Math.max(0, value) : 0)

/** The scroll offset that brings item `index` fully into a viewport, moving as little as possible. */
export function revealOffset(
  current: number,
  index: number,
  size: number,
  viewport: number
): number {
  const start = index * size
  if (start < current) return start
  return Math.max(current, start + size - viewport)
}

/** The windowed indexes plus the active one, which stays mounted so the grid keeps its tab stop. */
export function mountedIndexes(window: FixedWindow, active: number): number[] {
  const indexes = Array.from({ length: window.end - window.start }, (_, i) => window.start + i)
  if (active >= 0 && (active < window.start || active >= window.end)) indexes.push(active)
  return indexes
}
