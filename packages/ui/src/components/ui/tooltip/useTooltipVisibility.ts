import { useEffect, useRef } from 'react'
import { useControllableState } from '../../../hooks/useControllableState'

export interface TooltipVisibilityInput {
  isDisabled: boolean
  openDelay: number
  closeDelay: number
  defaultIsOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

/** Uncontrolled hover state, opened and closed after their delays. */
export function useTooltipVisibility({
  isDisabled,
  openDelay,
  closeDelay,
  defaultIsOpen = false,
  onOpenChange,
}: TooltipVisibilityInput) {
  const [hovered, setHovered] = useControllableState({
    value: undefined,
    defaultValue: defaultIsOpen && !isDisabled,
    onChange: onOpenChange,
  })
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimeouts = () => {
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current)
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
  }

  const show = () => {
    if (isDisabled) return
    clearTimeouts()
    if (openDelay > 0) {
      openTimeoutRef.current = setTimeout(() => setHovered(true), openDelay)
    } else {
      setHovered(true)
    }
  }

  const hide = () => {
    clearTimeouts()
    if (closeDelay > 0) {
      closeTimeoutRef.current = setTimeout(() => setHovered(false), closeDelay)
    } else {
      setHovered(false)
    }
  }

  const dismiss = () => {
    clearTimeouts()
    setHovered(false)
  }

  const dismissRef = useRef(dismiss)
  useEffect(() => {
    dismissRef.current = dismiss
  })
  useEffect(() => {
    if (isDisabled) dismissRef.current()
  }, [isDisabled])
  // A pending timer must not report onOpenChange after the trigger is gone.
  useEffect(() => clearTimeouts, [])

  return { hovered, show, hide, dismiss }
}
