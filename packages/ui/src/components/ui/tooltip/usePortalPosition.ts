import { useState, useEffect, type RefObject } from 'react'
import type { View } from 'react-native'
import type { TooltipPlacement } from './Tooltip'
import { portalPosition, type PortalPosition } from './tooltipPosition'

/** Measures the trigger on the next frame while a portalled tooltip is visible. */
export function usePortalPosition(
  triggerRef: RefObject<View | null>,
  isActive: boolean,
  placement: TooltipPlacement
) {
  const [portalPos, setPortalPos] = useState<PortalPosition | null>(null)

  useEffect(() => {
    if (!isActive || !triggerRef.current) return
    const node = triggerRef.current as unknown as HTMLElement
    const id = requestAnimationFrame(() => {
      setPortalPos(portalPosition(node.getBoundingClientRect(), placement))
    })
    return () => cancelAnimationFrame(id)
  }, [isActive, placement, triggerRef])

  return portalPos
}
