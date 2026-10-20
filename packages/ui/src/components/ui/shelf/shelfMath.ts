import { primitiveBreakpoints } from '../../../theme/tokens/primitives'

/** A key of `primitiveBreakpoints`, the scale `itemWidth` maps and `nudgeFrom` read. */
export type ShelfBreakpoint = keyof typeof primitiveBreakpoints

/** One width for every column, or a width per breakpoint of the shelf's own column. */
export type ShelfItemWidth = number | Partial<Record<ShelfBreakpoint, number>>

const BREAKPOINTS_WIDEST_FIRST = (Object.keys(primitiveBreakpoints) as ShelfBreakpoint[]).sort(
  (a, b) => primitiveBreakpoints[b] - primitiveBreakpoints[a]
)

/**
 * The item width for a column `width` wide: the entry of the widest breakpoint the
 * column reaches, falling back to the narrowest entry the map has.
 */
export function resolveItemWidth(itemWidth: ShelfItemWidth, width: number): number {
  if (typeof itemWidth === 'number') return itemWidth
  const reached = BREAKPOINTS_WIDEST_FIRST.find(
    (key) => itemWidth[key] !== undefined && width >= primitiveBreakpoints[key]
  )
  const fallback = [...BREAKPOINTS_WIDEST_FIRST]
    .reverse()
    .find((key) => itemWidth[key] !== undefined)
  const key = reached ?? fallback
  return key === undefined ? 0 : (itemWidth[key] as number)
}

export interface ShelfGeometry {
  /** The scroller's width: the column plus the bleed on both sides. */
  viewport: number
  /** The distance between two item starts. */
  step: number
  /** The furthest the row scrolls. */
  maxOffset: number
  overflows: boolean
}

export interface ShelfGeometryInput {
  /** The width of the column the shelf sits in, without the bleed. */
  column: number
  count: number
  itemWidth: number
  gap: number
  bleed: number
}

export function shelfGeometry({
  column,
  count,
  itemWidth,
  gap,
  bleed,
}: ShelfGeometryInput): ShelfGeometry {
  const viewport = column + bleed * 2
  const content = bleed * 2 + count * itemWidth + Math.max(0, count - 1) * gap
  const maxOffset = Math.max(0, content - viewport)
  return { viewport, step: itemWidth + gap, maxOffset, overflows: maxOffset > 0 }
}

/** The share of the column one nudge moves the row. */
export const NUDGE_SHARE = 0.8

/**
 * Where a nudge lands: forward or back by whole items that fit in 0.8 of the
 * column (at least one), on an item start, never past either end.
 */
export function nudgeTarget(
  offset: number,
  direction: 1 | -1,
  geometry: ShelfGeometry,
  column: number
): number {
  if (geometry.step <= 0) return offset
  const items = Math.max(1, Math.floor((column * NUDGE_SHARE) / geometry.step))
  const current =
    direction > 0 ? Math.floor(offset / geometry.step) : Math.ceil(offset / geometry.step)
  const target = (current + direction * items) * geometry.step
  return clamp(target, 0, geometry.maxOffset)
}

/**
 * Where to scroll so item `index` sits whole inside the column, or `null` when it
 * already does. The item then rests on its snap point, aligned with the column edge.
 */
export function revealTarget(
  index: number,
  offset: number,
  geometry: ShelfGeometry,
  itemWidth: number,
  bleed: number
): number | null {
  const start = bleed + index * geometry.step
  const visibleStart = offset + bleed
  const visibleEnd = offset + geometry.viewport - bleed
  if (start >= visibleStart && start + itemWidth <= visibleEnd) return null
  return clamp(index * geometry.step, 0, geometry.maxOffset)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
