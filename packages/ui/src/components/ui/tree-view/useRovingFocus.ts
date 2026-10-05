import { useEffect, useRef } from 'react'
import type { NativeSyntheticEvent, TargetedEvent, View } from 'react-native'
import type { TreeRow } from './types'

export interface RovingFocus {
  /** A key was handled: move DOM focus to the focused row once it is on screen. */
  follow: () => void
  /** Wraps a row's host element callback; a pinned row sits outside the window. */
  elementFor: (id: string, isPinned: boolean) => (element: View | null) => void
  onFocusIn: () => void
  onBlur: (event: NativeSyntheticEvent<TargetedEvent>) => void
}

type Focusable = { focus?: () => void }

interface RowElement {
  element: Focusable
  isPinned: boolean
}

const pageHasNoFocus = () =>
  typeof document !== 'undefined' &&
  (document.activeElement === null || document.activeElement === document.body)

/**
 * Keeps DOM focus on the hook's focused row. After a key, or when a collapse from outside moved
 * focus off an unmounted row, it scrolls the row into the window first, then focuses it on the
 * commit that brings it into the window (R3), not while it is still pinned outside it. A row the
 * user scrolls away is never followed: the shell keeps the focused row mounted outside the window,
 * so it keeps DOM focus and the tab stop.
 */
export function useRovingFocus(
  rows: readonly TreeRow[],
  focusedId: string | null,
  reveal: (index: number) => void
): RovingFocus {
  const elements = useRef(new Map<string, RowElement>())
  const following = useRef(false)
  const within = useRef(false)
  const lastFocusedId = useRef(focusedId)
  useEffect(() => {
    const moved = focusedId !== lastFocusedId.current
    lastFocusedId.current = focusedId
    if (moved && within.current && pageHasNoFocus()) following.current = true
    if (focusedId === null || !following.current) return
    reveal(rows.findIndex((row) => row.id === focusedId))
    const row = elements.current.get(focusedId)
    // A pinned row's position settles once the window reaches it; focusing it earlier leaves
    // the browser no chance to correct for scroll anchoring moving the window.
    if (row === undefined || row.isPinned) return
    // No preventScroll: the browser's own scroll corrects for scroll anchoring moving the window.
    row.element.focus?.()
    following.current = false
  })
  const isRow = (target: unknown) =>
    [...elements.current.values()].some((row) => row.element === target)
  return {
    follow: () => {
      following.current = true
    },
    elementFor: (id, isPinned) => (element) => {
      if (element === null) elements.current.delete(id)
      else elements.current.set(id, { element: element as unknown as Focusable, isPinned })
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

/** Scrolls `revealId` into the window once per new value, as soon as its row is visible. */
export function useScrollToReveal(
  rows: readonly TreeRow[],
  revealId: string | undefined,
  reveal: (index: number) => void
) {
  const revealed = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (revealId === undefined || revealId === revealed.current) return
    const index = rows.findIndex((row) => row.id === revealId)
    if (index < 0) return
    revealed.current = revealId
    reveal(index)
  })
}
