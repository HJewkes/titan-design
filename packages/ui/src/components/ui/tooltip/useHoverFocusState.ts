import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { useTooltipVisibility } from './useTooltipVisibility'

export interface HoverFocusStateOptions {
  isDisabled?: boolean
  /** Delay before opening on hover or focus (ms) */
  openDelay?: number
  /** Delay before closing on hover out or blur (ms) */
  closeDelay?: number
  /** Initial open state */
  defaultIsOpen?: boolean
  /** Called with `true` on open and `false` on close */
  onOpenChange?: (isOpen: boolean) => void
}

/** On the web, close at once on Escape while open (WCAG 1.4.13, dismissable). */
function useCloseOnEscape(isOpen: boolean, close: () => void) {
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })
  useEffect(() => {
    if (!isOpen || Platform.OS !== 'web' || typeof document === 'undefined') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])
}

interface Visibility {
  show: () => void
  hide: () => void
}

/**
 * Hover and keyboard focus each hold the tip open; it closes once neither does.
 * Focus that a pointer press caused is no hold, and a press closes the tip.
 */
function useHolds(isDisabled: boolean, { show, hide }: Visibility) {
  const holds = useRef({ hover: false, focus: false, pointerDown: false })
  useEffect(() => {
    if (isDisabled) holds.current = { hover: false, focus: false, pointerDown: false }
  }, [isDisabled])
  const hold = (source: 'hover' | 'focus', isHeld: boolean) => {
    holds.current[source] = isHeld
    if (isHeld) show()
    else if (!holds.current.hover && !holds.current.focus) hide()
  }
  return {
    onHoverIn: () => hold('hover', true),
    onHoverOut: () => hold('hover', false),
    onMouseDown: () => {
      holds.current.pointerDown = true
    },
    // The marker covers only the focus its press causes; RNW sends no press-out for some presses.
    onFocus: () => {
      const byPointer = holds.current.pointerDown
      holds.current.pointerDown = false
      if (!byPointer) hold('focus', true)
    },
    onBlur: () => {
      holds.current.pointerDown = false
      hold('focus', false)
    },
    onLongPress: show,
    onPressOut: () => {
      holds.current.pointerDown = false
      hide()
    },
  }
}

/**
 * Open state for a hover card or tooltip: hover or keyboard focus opens after
 * `openDelay` and holds it open; it closes after `closeDelay` once neither holds
 * it, and a press closes it. Escape closes at once. Long press opens, for touch.
 * Spread `triggerProps` on the trigger's own Pressable so it adds no tab stop.
 *
 * @example
 * const { isOpen, triggerProps } = useHoverFocusState({ openDelay: 300 })
 * <Pressable {...triggerProps}>…</Pressable>
 */
export function useHoverFocusState({
  isDisabled = false,
  openDelay = 0,
  closeDelay = 0,
  defaultIsOpen,
  onOpenChange,
}: HoverFocusStateOptions = {}) {
  const visibility = useTooltipVisibility({
    isDisabled,
    openDelay,
    closeDelay,
    defaultIsOpen,
    onOpenChange,
  })
  const triggerProps = useHolds(isDisabled, visibility)
  useCloseOnEscape(visibility.hovered, visibility.dismiss)
  return { isOpen: visibility.hovered, triggerProps }
}
