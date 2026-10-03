import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScrollViewProps } from 'react-native'
import type { NetworkGraphState } from './useNetworkGraph'

interface WebFocusEvent {
  target: unknown
  relatedTarget?: unknown
  currentTarget: { focus: () => void; contains: (node: unknown) => boolean }
}

/**
 * Scrolls the active item into view when asked: after a key and when focus enters. A hover never
 * asks, so the graph does not move under the pointer.
 */
function useScrollToActive(activeDomId: string | undefined) {
  const [requests, setRequests] = useState(0)
  const latestId = useRef(activeDomId)
  useEffect(() => {
    latestId.current = activeDomId
  })
  useEffect(() => {
    if (requests === 0 || latestId.current === undefined || typeof document === 'undefined') return
    const target = document.getElementById(latestId.current)
    target?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [requests])
  return useCallback(() => setRequests((count) => count + 1), [])
}

/**
 * Keeps DOM focus on the graph root, the one tab stop, and reports focus entering and leaving it.
 * A pointer that is down tells a press on the canvas from a Tab into it.
 */
function useFocusHandlers(graph: NetworkGraphState, onEntered: () => void) {
  const isPointerDown = useRef(false)
  const setPointer = (isDown: boolean) => () => {
    isPointerDown.current = isDown
  }
  return {
    onPointerDown: setPointer(true),
    onPointerUp: setPointer(false),
    onPointerCancel: setPointer(false),
    onFocus: (event: WebFocusEvent) => {
      if (event.target !== event.currentTarget) return event.currentTarget.focus()
      graph.enter(isPointerDown.current)
      if (!isPointerDown.current) onEntered()
    },
    onBlur: (event: WebFocusEvent) => {
      if (event.currentTarget.contains(event.relatedTarget)) return
      isPointerDown.current = false
      graph.leave()
    },
  }
}

export interface GraphRootOptions {
  /** The root's accessible name: the label and the summary. */
  name: string
  activeDomId: string | undefined
  isDisabled: boolean
  state: NetworkGraphState
}

/** The composite widget's own attributes and handlers, which React Native's types do not carry. */
export function useGraphRoot({ name, activeDomId, isDisabled, state }: GraphRootOptions) {
  const requestScroll = useScrollToActive(activeDomId)
  const focusHandlers = useFocusHandlers(state, requestScroll)
  return {
    role: 'application',
    'aria-roledescription': 'network graph',
    'aria-label': name,
    'aria-activedescendant': activeDomId,
    'aria-disabled': isDisabled || undefined,
    tabIndex: 0,
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      if (!state.handleKey(event.key)) return
      event.preventDefault()
      requestScroll()
    },
    ...focusHandlers,
  } as unknown as ScrollViewProps
}
