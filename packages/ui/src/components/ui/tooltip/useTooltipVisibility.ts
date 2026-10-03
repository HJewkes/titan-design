import { useState, useRef } from 'react'

export interface TooltipVisibilityInput {
  isDisabled: boolean
  openDelay: number
  closeDelay: number
}

/** Uncontrolled hover state, opened and closed after their delays. */
export function useTooltipVisibility({
  isDisabled,
  openDelay,
  closeDelay,
}: TooltipVisibilityInput) {
  const [hovered, setHovered] = useState(false)
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

  return { hovered, show, hide }
}
