import { useRef, useState, type RefObject } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native'
import { computeWindow, type FixedWindow } from '../../../utils/fixed-window'

/** Rows mounted beyond each edge of the viewport. */
export const TREE_OVERSCAN = 5

export interface TreeWindow extends FixedWindow {
  scrollRef: RefObject<ScrollView>
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  /** Scrolls just far enough to show item `index`, and moves the window with it. */
  reveal: (index: number) => void
}

/** The offset that brings `[top, top + size)` into a viewport at `offset`, or `offset` if it shows. */
function offsetShowing(top: number, size: number, offset: number, viewport: number): number {
  if (top < offset) return top
  if (top + size > offset + viewport) return top + size - viewport
  return offset
}

/**
 * The fixed-height window over `count` items (A1). Without a `height` every item mounts and
 * `reveal` does nothing, since the page scrolls instead (A6).
 */
export function useTreeWindow(
  count: number,
  itemSize: number,
  height: number | undefined
): TreeWindow {
  const scrollRef = useRef<ScrollView>(null)
  const [offset, setOffset] = useState(0)
  const range =
    height === undefined
      ? { start: 0, end: count, padBefore: 0, padAfter: 0 }
      : computeWindow({ offset, viewport: height, itemSize, count, overscan: TREE_OVERSCAN })
  const reveal = (index: number) => {
    if (height === undefined || index < 0) return
    const target = offsetShowing(index * itemSize, itemSize, offset, height)
    if (target === offset) return
    scrollRef.current?.scrollTo({ y: target, animated: false })
    setOffset(target)
  }
  return {
    ...range,
    scrollRef,
    onScroll: (event) => setOffset(event.nativeEvent.contentOffset.y),
    reveal,
  }
}
