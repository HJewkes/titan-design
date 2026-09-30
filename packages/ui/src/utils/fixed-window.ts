export interface FixedWindowInput {
  /** Scroll offset of the viewport's leading edge, in the same unit as `itemSize`. */
  offset: number
  /** Viewport extent along the scroll axis. */
  viewport: number
  /** Extent of every item along the scroll axis. */
  itemSize: number
  /** Total number of items. */
  count: number
  /** Extra items to render on each side of the visible range. */
  overscan: number
}

export interface FixedWindow {
  /** First rendered index, inclusive. */
  start: number
  /** One past the last rendered index, exclusive. */
  end: number
  /** Spacer extent before the first rendered item: `start * itemSize`. */
  padBefore: number
  /** Spacer extent after the last rendered item: `(count - end) * itemSize`. */
  padAfter: number
}

function assertFinite(field: string, value: number): void {
  if (!Number.isFinite(value))
    throw new RangeError(`${field} must be a finite number, got ${value}`)
}

function assertNonNegativeInteger(field: string, value: number): void {
  assertFinite(field, value)
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative integer, got ${value}`)
  }
}

function validate({ offset, viewport, itemSize, count, overscan }: FixedWindowInput): void {
  assertFinite('offset', offset)
  assertFinite('viewport', viewport)
  assertFinite('itemSize', itemSize)
  if (viewport < 0) throw new RangeError(`viewport must not be negative, got ${viewport}`)
  if (itemSize <= 0) throw new RangeError(`itemSize must be greater than zero, got ${itemSize}`)
  assertNonNegativeInteger('count', count)
  assertNonNegativeInteger('overscan', overscan)
}

const clamp = (value: number, max: number): number => Math.min(Math.max(value, 0), max)

/**
 * Computes which items of a fixed-size list to render for a scroll position.
 *
 * `start` is inclusive and `end` is exclusive, with `0 <= start <= end <= count`. Every item whose
 * range `[i * itemSize, (i + 1) * itemSize)` intersects `[offset, offset + viewport)` lies inside
 * `[start, end)`, and `overscan` adds up to that many extra items on each side, clamped to the list.
 * `padBefore + (end - start) * itemSize + padAfter === count * itemSize`.
 *
 * Edge cases: `count` 0 gives an empty window. A `viewport` of 0 selects no item unless `offset`
 * falls inside one, which it then includes. An `offset` before the list or past its end is clamped,
 * so the window is empty (before overscan) rather than out of bounds. Invalid input throws a
 * `RangeError` naming the field: non-finite numbers, negative `viewport`, `itemSize <= 0`, and a
 * negative or non-integer `count` or `overscan`.
 *
 * Consumers: the TD-31 code viewer, the TD-32 tree view and the TD-33 virtualised table, and the
 * TD-35 dependency matrix, which calls it once per axis.
 */
export function computeWindow(input: FixedWindowInput): FixedWindow {
  validate(input)
  const { offset, viewport, itemSize, count, overscan } = input
  const firstVisible = clamp(Math.floor(offset / itemSize), count)
  const endVisible = Math.max(firstVisible, clamp(Math.ceil((offset + viewport) / itemSize), count))
  const start = Math.max(0, firstVisible - overscan)
  const end = Math.min(count, endVisible + overscan)
  return { start, end, padBefore: start * itemSize, padAfter: (count - end) * itemSize }
}
