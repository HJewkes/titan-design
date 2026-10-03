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

/**
 * Open state for a hover card or tooltip: hover or keyboard focus opens after
 * `openDelay`, hover out or blur closes after `closeDelay`, Escape closes at once.
 * Long press opens and press release closes, for touch. Spread `triggerProps` on
 * the trigger's own Pressable so it adds no tab stop.
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
  const { hovered, show, hide, dismiss } = useTooltipVisibility({
    isDisabled,
    openDelay,
    closeDelay,
    defaultIsOpen,
    onOpenChange,
  })
  useCloseOnEscape(hovered, dismiss)
  return {
    isOpen: hovered,
    triggerProps: {
      onHoverIn: show,
      onHoverOut: hide,
      onFocus: show,
      onBlur: hide,
      onLongPress: show,
      onPressOut: hide,
    },
  }
}
