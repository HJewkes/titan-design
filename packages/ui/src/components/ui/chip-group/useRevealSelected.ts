import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native'
import { revealOffset } from './chipGroupModel'

// Enough room past the selected chip that part of the next one shows.
const PEEK = 32

export interface RevealSelected {
  scrollRef: RefObject<ScrollView>
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onViewportLayout: (event: LayoutChangeEvent) => void
  onItemLayout: (index: number, event: LayoutChangeEvent) => void
}

/**
 * Keeps the selected chip of a scrolling row in view: on load, once its layout is known,
 * and whenever the selection changes. `selectedIndex` counts the pinned chip, which is
 * outside the scroller and never reports a layout here; -1 turns the hook off.
 */
export function useRevealSelected(selectedIndex: number): RevealSelected {
  const scrollRef = useRef<ScrollView>(null)
  const items = useRef(new Map<number, LayoutRectangle>())
  const scrollX = useRef(0)
  const viewportWidth = useRef(0)
  const selected = useRef(selectedIndex)

  const reveal = useCallback(() => {
    const item = items.current.get(selected.current)
    if (!item) return
    const x = revealOffset({
      itemX: item.x,
      itemWidth: item.width,
      scrollX: scrollX.current,
      viewportWidth: viewportWidth.current,
      margin: PEEK,
    })
    if (x !== null) scrollRef.current?.scrollTo({ x, animated: false })
  }, [])

  useEffect(() => {
    selected.current = selectedIndex
    reveal()
  }, [selectedIndex, reveal])

  return {
    scrollRef,
    onScroll: useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollX.current = event.nativeEvent.contentOffset.x
    }, []),
    onViewportLayout: useCallback(
      (event: LayoutChangeEvent) => {
        viewportWidth.current = event.nativeEvent.layout.width
        reveal()
      },
      [reveal]
    ),
    onItemLayout: useCallback(
      (index: number, event: LayoutChangeEvent) => {
        items.current.set(index, event.nativeEvent.layout)
        if (index === selected.current) reveal()
      },
      [reveal]
    ),
  }
}
