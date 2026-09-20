import { AUTO_FALLBACK_HEIGHT } from '../src/sections.ts'

export { AUTO_FALLBACK_HEIGHT }

export const MIN_FRAME_HEIGHT = 120

/** Breathing room around the story, matching Storybook's own padded and centered layouts. */
export const STORY_GUTTER = 32

/** A re-measure this close to the applied height is ignored, so a story that fills its
 * own frame cannot pump the frame taller one gutter at a time. */
export const HEIGHT_HYSTERESIS = 8

interface Box {
  top: number
  bottom: number
}

export interface MeasurableElement {
  children: ArrayLike<{ getBoundingClientRect: () => Box }>
  scrollHeight: number
}

export interface MeasurableDoc {
  getElementById: (id: string) => MeasurableElement | null
}

/**
 * The height of what the story actually drew, measured from the story's own elements
 * rather than from `#storybook-root`, whose box is the frame we are trying to size.
 * Null when the frame cannot be inspected (cross-origin) or has not rendered yet.
 */
export function storyContentHeight(doc: MeasurableDoc | null): number | null {
  const root = doc?.getElementById('storybook-root')
  if (!root) return null
  const children = Array.from(root.children)
  if (children.length === 0) return root.scrollHeight > 0 ? root.scrollHeight + STORY_GUTTER : null
  const boxes = children.map((child) => child.getBoundingClientRect())
  const height = Math.max(...boxes.map((b) => b.bottom)) - Math.min(...boxes.map((b) => b.top))
  return height > 0 ? Math.ceil(height) + STORY_GUTTER : null
}

/** What the frame should be after a measurement: the applied height when nothing changed. */
export function nextFrameHeight(applied: number, measured: number | null, max: number): number {
  if (measured === null) return applied
  const clamped = Math.min(Math.max(measured, MIN_FRAME_HEIGHT), max)
  return Math.abs(clamped - applied) <= HEIGHT_HYSTERESIS ? applied : clamped
}
