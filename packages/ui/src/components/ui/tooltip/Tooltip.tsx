import React, { useState, useRef, useEffect } from 'react'
import { View, Text, Pressable, Platform, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

let createPortal: typeof import('react-dom').createPortal | undefined
if (Platform.OS === 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    createPortal = require('react-dom').createPortal
  } catch {
    // react-dom unavailable
  }
}

type PortalPosition = { top: number; left: number; transform: string }

export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right'

export interface TooltipProps extends ViewProps {
  /** Plain-text tooltip content */
  label?: string
  /** Rich tooltip content (takes precedence over label) */
  content?: React.ReactNode
  /** Trigger element */
  children: React.ReactNode
  /** Tooltip placement */
  placement?: TooltipPlacement
  /** Delay before showing (ms) */
  openDelay?: number
  /** Delay before hiding (ms) */
  closeDelay?: number
  /** Whether tooltip has an arrow */
  hasArrow?: boolean
  /** Whether tooltip is disabled */
  isDisabled?: boolean
  /** Additional className for tooltip */
  className?: string
  /** Render tooltip via portal to escape overflow:hidden ancestors (web only) */
  usePortal?: boolean
}

/**
 * Tooltip component for showing additional information on hover/press.
 *
 * Note: On native, tooltips appear on long press. On web, they appear on hover.
 *
 * @example
 * // String-only tooltip
 * <Tooltip label="This is a tooltip">
 *   <Button><ButtonText>Hover me</ButtonText></Button>
 * </Tooltip>
 *
 * // Rich content tooltip
 * <Tooltip content={<View><Text>Bold tip</Text><Text>with details</Text></View>}>
 *   <Button><ButtonText>Hover me</ButtonText></Button>
 * </Tooltip>
 */
export function Tooltip({
  label,
  content,
  children,
  placement = 'top',
  openDelay = 0,
  closeDelay = 0,
  hasArrow = true,
  isDisabled = false,
  className,
  usePortal: usePortalProp = false,
  ...props
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [portalPos, setPortalPos] = useState<PortalPosition | null>(null)
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<View>(null)

  const isPortalMode = usePortalProp && Platform.OS === 'web' && !!createPortal

  useEffect(() => {
    if (!isVisible || !isPortalMode || !triggerRef.current) return
    const node = triggerRef.current as unknown as HTMLElement
    const id = requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect()
      const gap = 8
      const cardinal = placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right'

      const positions: Record<string, PortalPosition> = {
        top: {
          top: rect.top - gap,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, -100%)',
        },
        bottom: {
          top: rect.bottom + gap,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, 0%)',
        },
        left: {
          top: rect.top + rect.height / 2,
          left: rect.left - gap,
          transform: 'translate(-100%, -50%)',
        },
        right: {
          top: rect.top + rect.height / 2,
          left: rect.right + gap,
          transform: 'translate(0%, -50%)',
        },
      }

      setPortalPos(positions[cardinal] ?? positions.top)
    })
    return () => cancelAnimationFrame(id)
  }, [isVisible, isPortalMode, placement])

  const clearTimeouts = () => {
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current)
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
  }

  const show = () => {
    if (isDisabled) return
    clearTimeouts()
    if (openDelay > 0) {
      openTimeoutRef.current = setTimeout(() => setIsVisible(true), openDelay)
    } else {
      setIsVisible(true)
    }
  }

  const hide = () => {
    clearTimeouts()
    if (closeDelay > 0) {
      closeTimeoutRef.current = setTimeout(() => setIsVisible(false), closeDelay)
    } else {
      setIsVisible(false)
    }
  }

  // Arrow positioning. The arrow is a border triangle, so it takes the same surface token as the box.
  const arrowStyles = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-surface-elevated',
    'top-start': 'bottom-0 left-4 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-surface-elevated',
    'top-end': 'bottom-0 right-4 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-surface-elevated',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-surface-elevated',
    'bottom-start': 'top-0 left-4 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-surface-elevated',
    'bottom-end': 'top-0 right-4 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-surface-elevated',
    left: 'right-0 top-1/2 translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-surface-elevated',
    right: 'left-0 top-1/2 -translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-surface-elevated',
  }

  // Tooltip positioning
  const tooltipPositionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    'top-start': 'bottom-full left-0 mb-2',
    'top-end': 'bottom-full right-0 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    'bottom-start': 'top-full left-0 mt-2',
    'bottom-end': 'top-full right-0 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const tooltipContent = (
    <View className="bg-surface-elevated border border-hairline px-3 py-2 rounded-md shadow-lg max-w-xs">
      {content ?? <Text className="text-text-primary text-sm">{label}</Text>}
      {hasArrow && (
        <View
          className={cn(
            'absolute w-0 h-0 border-4',
            arrowStyles[placement]
          )}
        />
      )}
    </View>
  )

  const renderPortalTooltip = () => {
    if (!isVisible || !isPortalMode || !createPortal) return null
    return createPortal(
      <div
        style={{
          position: 'fixed',
          top: portalPos?.top ?? 0,
          left: portalPos?.left ?? 0,
          transform: portalPos?.transform ?? 'translate(-50%, -100%)',
          zIndex: 10000,
          pointerEvents: 'none',
        }}
        data-testid="tooltip-portal"
        className={className}
      >
        {tooltipContent}
      </div>,
      document.body
    )
  }

  return (
    <View className="relative" ref={triggerRef} {...props}>
      <Pressable
        onHoverIn={show}
        onHoverOut={hide}
        onLongPress={show}
        onPressOut={hide}
        delayLongPress={500}
      >
        {children}
      </Pressable>

      {isPortalMode
        ? renderPortalTooltip()
        : isVisible && (
            <View
              className={cn(
                'absolute z-50 web:animate-fade-in',
                tooltipPositionStyles[placement],
                className
              )}
              pointerEvents="none"
            >
              {tooltipContent}
            </View>
          )}
    </View>
  )
}
