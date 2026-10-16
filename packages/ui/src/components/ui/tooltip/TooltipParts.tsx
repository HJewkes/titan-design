import React from 'react'
import { Platform } from 'react-native'
import type { PortalPosition } from './tooltipPosition'

let createPortal: typeof import('react-dom').createPortal | undefined
if (Platform.OS === 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    createPortal = require('react-dom').createPortal
  } catch {
    // react-dom unavailable
  }
}

export const canPortal = Platform.OS === 'web' && !!createPortal

interface TooltipPortalProps {
  isVisible: boolean
  position: PortalPosition | null
  className?: string
  children: React.ReactNode
}

export function TooltipPortal({ isVisible, position, className, children }: TooltipPortalProps) {
  if (!isVisible || !createPortal) return null
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        transform: position?.transform ?? 'translate(-50%, -100%)',
        zIndex: 10000,
        pointerEvents: 'none',
      }}
      data-testid="tooltip-portal"
      className={className}
    >
      {children}
    </div>,
    document.body
  )
}
