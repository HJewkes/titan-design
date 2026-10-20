/** The keys that move the selection through a radio group, in either orientation. */
const STEPS: Record<string, 1 | -1> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

/** The next enabled index from `from`, wrapping at either end; -1 when none is enabled. */
export function nextEnabledIndex(enabled: readonly boolean[], from: number, step: 1 | -1): number {
  const count = enabled.length
  for (let offset = 1; offset <= count; offset++) {
    const index = (((from + step * offset) % count) + count) % count
    if (enabled[index]) return index
  }
  return -1
}

/** The index a key press selects, or undefined for a key the group does not handle. */
export function indexForKey(key: string, enabled: readonly boolean[], from: number) {
  if (key === 'Home') return enabled.indexOf(true)
  if (key === 'End') return enabled.lastIndexOf(true)
  const step = STEPS[key]
  return step === undefined ? undefined : nextEnabledIndex(enabled, from, step)
}

/**
 * The one chip that takes Tab focus: the selected chip, or the first enabled one when
 * the selected chip is disabled or missing.
 */
export function tabStopIndex(enabled: readonly boolean[], selectedIndex: number): number {
  return enabled[selectedIndex] ? selectedIndex : enabled.indexOf(true)
}

export interface RevealInput {
  /** The item's left edge inside the scrolled content. */
  itemX: number
  itemWidth: number
  scrollX: number
  viewportWidth: number
  /** Room kept beside the item, so the next chip peeks. */
  margin: number
}

/** The scroll offset that brings the item fully into view, or null when it already is. */
export function revealOffset({ itemX, itemWidth, scrollX, viewportWidth, margin }: RevealInput) {
  if (viewportWidth <= 0) return null
  const start = itemX - margin
  const end = itemX + itemWidth + margin
  if (start < scrollX) return Math.max(0, start)
  if (end > scrollX + viewportWidth) return end - viewportWidth
  return null
}
