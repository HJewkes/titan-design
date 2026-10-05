import { useEffect, useRef } from 'react'
import type { NativeSyntheticEvent, TargetedEvent, View } from 'react-native'
import type { TreeRow } from './types'

export interface RovingFocus {
  /** A key was handled: move DOM focus to the focused row once it is on screen. */
  follow: () => void
  /** Wraps a row's host element callback. */
  elementFor: (id: string) => (element: View | null) => void
  onFocusIn: () => void
  onBlur: (event: NativeSyntheticEvent<TargetedEvent>) => void
}

type Focusable = { focus?: (options?: { preventScroll?: boolean }) => void }

const pageHasNoFocus = () =>
  typeof document !== 'undefined' &&
  (document.activeElement === null || document.activeElement === document.body)

/**
 * Keeps DOM focus on the hook's focused row. After a key, or when the focused row unmounted under
 * focus (a collapse from outside), it scrolls the row into the window first, then focuses it on the
 * commit that mounts it (R3).
 */
export function useRovingFocus(
  rows: readonly TreeRow[],
  focusedId: string | null,
  reveal: (index: number) => void
): RovingFocus {
  const elements = useRef(new Map<string, Focusable>())
  const following = useRef(false)
  const within = useRef(false)
  useEffect(() => {
    if (focusedId === null || !(following.current || (within.current && pageHasNoFocus()))) return
    reveal(rows.findIndex((row) => row.id === focusedId))
    const element = elements.current.get(focusedId)
    if (element === undefined) return
    element.focus?.({ preventScroll: true })
    following.current = false
  })
  const isRow = (target: unknown) => [...elements.current.values()].some((el) => el === target)
  return {
    follow: () => {
      following.current = true
    },
    elementFor: (id) => (element) => {
      if (element === null) elements.current.delete(id)
      else elements.current.set(id, element as unknown as Focusable)
    },
    onFocusIn: () => {
      within.current = true
    },
    onBlur: (event) => {
      // On the web `nativeEvent` is the DOM FocusEvent, which names where focus went.
      const { relatedTarget } = event.nativeEvent as { relatedTarget?: unknown }
      if (relatedTarget != null && !isRow(relatedTarget)) within.current = false
    },
  }
}
