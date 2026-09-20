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
  /** Content inset at both ends, so a centred first and last slide can reach the middle. */
  padding: number
  align: SlideAlign
}

/** Where a slide rests: at the leading edge, or centred with a hint on both sides. */
export type SlideAlign = 'start' | 'center'

export interface SlideGeometryInput {
  viewportWidth: number
  count: number
  /** How much of the neighbouring slide shows. */
  peek: number
  gap: number
  /** Caps a slide on a wide column, so more of the next one shows. */
  maxSlideWidth?: number
  align?: SlideAlign
}

/** Slide size and scroll range for a viewport: one slide per view, the next one peeking. */
export function slideGeometry({
  viewportWidth,
  count,
  peek,
  gap,
  maxSlideWidth,
  align = 'start',
}: SlideGeometryInput): SlideGeometry {
  const viewport = Math.max(0, viewportWidth)
  const hints = align === 'center' ? 2 : 1
  const room = count > 1 ? viewport - hints * (peek + gap) : viewport
  const slideWidth = Math.max(0, Math.min(room, maxSlideWidth ?? Infinity))
  const step = slideWidth + gap
  const padding = align === 'center' ? Math.max(0, (viewport - slideWidth) / 2) : 0
  const contentWidth = count * slideWidth + Math.max(0, count - 1) * gap + 2 * padding
  return { slideWidth, step, maxOffset: Math.max(0, contentWidth - viewport), padding, align }
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

/** Faster than 800 px/s reads as a flick; a deliberate drag runs well under it. */
const FLICK_PX_PER_MS = 0.8

export interface FlickInput {
  /** The slide the drag started on. */
  startIndex: number
  /** Where the scroll rests now. */
  offset: number
  /** Horizontal speed at release, px/ms; positive scrolls towards later slides. */
  velocity: number
  count: number
  geometry: SlideGeometry
}

/**
 * The slide a released drag lands on: a flick moves exactly one slide from where
 * it began, the way `disableIntervalMomentum` does on native; a slow drag lands
 * on whichever slide it was left nearest.
 */
export function flickTarget({ startIndex, offset, velocity, count, geometry }: FlickInput): number {
  if (Math.abs(velocity) > FLICK_PX_PER_MS) {
    return clampIndex(startIndex + Math.sign(velocity), count)
  }
  return indexAtOffset(offset, count, geometry)
}

/** Looping needs a copy of the last slide before the first and of the first after the last. */
export const MIN_SLIDES_TO_CLONE = 3

export interface SlideSlot {
  /** Index of the slide this slot shows. */
  index: number
  /** A copy at one end, there only so the real end has a neighbour to hint at. */
  isClone: boolean
}

/** Whether this many slides can loop with clones without a clone duplicating a visible slide. */
export function canClone(count: number): boolean {
  return count >= MIN_SLIDES_TO_CLONE
}

/** The render order: the last slide, every slide, then the first slide. */
export function slideSlots(count: number, cloned: boolean): SlideSlot[] {
  const real = Array.from({ length: count }, (_, index) => ({ index, isClone: false }))
  if (!cloned || count === 0) return real
  return [{ index: count - 1, isClone: true }, ...real, { index: 0, isClone: true }]
}

/** Where a slide sits in the rendered order. */
export function positionOf(index: number, cloned: boolean): number {
  return cloned ? index + 1 : index
}

/** The real slide a rendered position shows; a clone reports the slide it copies. */
export function indexAtPosition(position: number, count: number, cloned: boolean): number {
  if (count === 0) return 0
  if (!cloned) return clampIndex(position, count)
  if (position <= 0) return count - 1
  if (position >= count + 1) return 0
  return position - 1
}

/** True when the rendered position is one of the two copies. */
export function isClonePosition(position: number, count: number, cloned: boolean): boolean {
  return cloned && (position <= 0 || position >= count + 1)
}

/** One step with wrapping: forward from the last slide lands on the first. */
export function wrapIndex(index: number, delta: number, count: number): number {
  if (count <= 0) return 0
  return (((index + delta) % count) + count) % count
}
