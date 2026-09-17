import { useCallback, useEffect, useRef, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native'
import type { ChatMessage } from '@titan-design/chat-protocol'

/** Within this many px of the end the list counts as "at the newest message". */
export const PIN_THRESHOLD_PX = 48

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>

function distanceFromEnd({ contentOffset, contentSize, layoutMeasurement }: NativeScrollEvent) {
  return contentSize.height - (contentOffset.y + layoutMeasurement.height)
}

function countUnseen(messages: readonly ChatMessage[], anchor: number | null, viewerId: string) {
  if (anchor === null) return 0
  return messages.slice(anchor).filter((message) => message.authorId !== viewerId).length
}

/**
 * Keeps a non-inverted list on its newest message: it follows appends while the
 * reader is at the end, and counts them instead once the reader has scrolled up.
 * A message the viewer sent always pulls the list back down.
 */
export function useStickToBottom(messages: readonly ChatMessage[], viewerId: string) {
  const scrollRef = useRef<ScrollView>(null)
  const pinnedRef = useRef(true)
  const mountedRef = useRef(false)
  const lengthRef = useRef(messages.length)
  // Message count when the reader left the end; null while they are at it.
  const [anchor, setAnchor] = useState<number | null>(null)

  const scrollToEnd = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: mountedRef.current })
  }, [])

  const jumpToNewest = useCallback(() => {
    pinnedRef.current = true
    setAnchor(null)
    scrollToEnd()
  }, [scrollToEnd])

  useEffect(() => {
    const added = messages.length > lengthRef.current
    lengthRef.current = messages.length
    if (added && messages[messages.length - 1]?.authorId === viewerId) {
      pinnedRef.current = true
      scrollToEnd()
    }
  }, [messages, viewerId, scrollToEnd])

  const onScroll = useCallback((event: ScrollEvent) => {
    const atEnd = distanceFromEnd(event.nativeEvent) <= PIN_THRESHOLD_PX
    pinnedRef.current = atEnd
    setAnchor((current) => (atEnd ? null : (current ?? lengthRef.current)))
  }, [])

  const onContentSizeChange = useCallback(() => {
    if (pinnedRef.current) scrollToEnd()
    mountedRef.current = true
  }, [scrollToEnd])

  useEffect(scrollToEnd, [scrollToEnd])

  const unseen = countUnseen(messages, anchor, viewerId)
  return { scrollRef, onScroll, onContentSizeChange, unseen, jumpToNewest }
}
