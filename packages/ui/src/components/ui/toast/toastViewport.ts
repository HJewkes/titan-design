import { bodyOverlayZIndex } from '../../../utils/overlay-z-index'

export type ToastPosition =
  | 'top'
  | 'top-right'
  | 'top-left'
  | 'bottom'
  | 'bottom-right'
  | 'bottom-left'

export const positionStyles: Record<ToastPosition, string> = {
  top: 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  bottom: 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
}

// The viewport sits beside an open Modal on the body, so it must stack above that layer.
export const viewportStyle = { zIndex: bodyOverlayZIndex('toast') }
