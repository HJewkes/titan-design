export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right'

export type PortalPosition = { top: number; left: number; transform: string }

export type TriggerRect = Pick<DOMRect, 'top' | 'left' | 'bottom' | 'right' | 'width' | 'height'>

const PORTAL_GAP = 8

/** Fixed position for a portalled tooltip; it honours only the cardinal half of a placement. */
export function portalPosition(rect: TriggerRect, placement: TooltipPlacement): PortalPosition {
  const cardinal = placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right'

  const positions: Record<string, PortalPosition> = {
    top: {
      top: rect.top - PORTAL_GAP,
      left: rect.left + rect.width / 2,
      transform: 'translate(-50%, -100%)',
    },
    bottom: {
      top: rect.bottom + PORTAL_GAP,
      left: rect.left + rect.width / 2,
      transform: 'translate(-50%, 0%)',
    },
    left: {
      top: rect.top + rect.height / 2,
      left: rect.left - PORTAL_GAP,
      transform: 'translate(-100%, -50%)',
    },
    right: {
      top: rect.top + rect.height / 2,
      left: rect.right + PORTAL_GAP,
      transform: 'translate(0%, -50%)',
    },
  }

  return positions[cardinal] ?? positions.top
}

// The arrow is a border triangle, so it takes the same surface token as the box.
export const arrowStyles: Record<TooltipPlacement, string> = {
  top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-surface-overlay',
  'top-start':
    'bottom-0 left-4 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-surface-overlay',
  'top-end':
    'bottom-0 right-4 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-surface-overlay',
  bottom:
    'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-surface-overlay',
  'bottom-start':
    'top-0 left-4 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-surface-overlay',
  'bottom-end':
    'top-0 right-4 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-surface-overlay',
  left: 'right-0 top-1/2 translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-surface-overlay',
  right:
    'left-0 top-1/2 -translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-surface-overlay',
}

export const tooltipPositionStyles: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  'top-start': 'bottom-full left-0 mb-2',
  'top-end': 'bottom-full right-0 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  'bottom-start': 'top-full left-0 mt-2',
  'bottom-end': 'top-full right-0 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}
