/**
 * The carousel's arithmetic, free of React and of layout, so every rule the
 * component relies on is a plain function a jsdom or property test can pin.
 */

export interface SlideGeometry {
  /** Width of one slide. */
  slideWidth: number
  /** Distance between the starts of two neighbouring slides. */
  step: number
  /** The largest scroll offset the content allows. */
  maxOffset: number
}

export interface SlideGeometryInput {
  viewportWidth: number
  count: number
  /** How much of the next slide shows at the trailing edge. */
  peek: number
  gap: number
  /** Caps a slide on a wide column, so more of the next one shows. */
  maxSlideWidth?: number
}

/** Slide size and scroll range for a viewport: one slide per view, the next one peeking. */
export function slideGeometry({
  viewportWidth,
  count,
  peek,
  gap,
  maxSlideWidth,
}: SlideGeometryInput): SlideGeometry {
  const viewport = Math.max(0, viewportWidth)
  const room = count > 1 ? viewport - peek - gap : viewport
  const slideWidth = Math.max(0, Math.min(room, maxSlideWidth ?? Infinity))
  const step = slideWidth + gap
  const contentWidth = count * slideWidth + Math.max(0, count - 1) * gap
  return { slideWidth, step, maxOffset: Math.max(0, contentWidth - viewport) }
}

/** Keep an index inside `[0, count - 1]`; an empty set has only index 0. */
export function clampIndex(index: number, count: number): number {
  if (count <= 0 || !Number.isFinite(index)) return 0
  return Math.min(count - 1, Math.max(0, Math.round(index)))
}

/** The scroll offset that shows `index` at the leading edge, or the end of the content. */
export function offsetForIndex(index: number, count: number, geometry: SlideGeometry): number {
  return Math.min(clampIndex(index, count) * geometry.step, geometry.maxOffset)
}

/** Within this many px of the end, the last slide is the current one. */
const END_TOLERANCE_PX = 1

/**
 * The slide an offset shows: the nearest slide start, except that the end of
 * the content always means the last slide (it cannot reach the leading edge).
 */
export function indexAtOffset(offset: number, count: number, geometry: SlideGeometry): number {
  if (count <= 1 || geometry.step <= 0) return 0
  const lastStart = (count - 1) * geometry.step
  if (geometry.maxOffset < lastStart && offset >= geometry.maxOffset - END_TOLERANCE_PX) {
    return count - 1
  }
  return clampIndex(offset / geometry.step, count)
}

/** One step back or forward, stopping at the ends: the cards are peers, not a loop. */
export function stepIndex(index: number, delta: number, count: number): number {
  return clampIndex(index + delta, count)
}

/**
 * The key to show after the slide set changed. The current key wins while it
 * still exists; if it is gone, the slide now at its old position (or the last
 * one) takes over.
 */
export function resolveActiveKey(
  keys: readonly string[],
  activeKey: string | undefined,
  previousIndex: number
): string | undefined {
  if (keys.length === 0) return undefined
  if (activeKey !== undefined && keys.includes(activeKey)) return activeKey
  return keys[clampIndex(previousIndex, keys.length)]
}

/** The counter between the arrows, e.g. "2 of 9". */
export function positionText(index: number, count: number): string {
  return `${String(clampIndex(index, count) + 1)} of ${String(Math.max(count, 1))}`
}

/** A slide's accessible name: its position, then its own label. */
export function slideLabel(index: number, count: number, label: string): string {
  const position = positionText(index, count)
  return label === '' ? position : `${position}: ${label}`
}
