import React, { useState, useRef } from 'react'
import { View, Text, Pressable, Modal, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

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
  /** Tooltip content */
  label: string
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
}

/**
 * Tooltip component for showing additional information on hover/press.
 *
 * Note: On native, tooltips appear on long press. On web, they appear on hover.
 *
 * @example
 * <Tooltip label="This is a tooltip">
 *   <Button><ButtonText>Hover me</ButtonText></Button>
 * </Tooltip>
 */
export function Tooltip({
  label,
  children,
  placement = 'top',
  openDelay = 0,
  closeDelay = 0,
  hasArrow = true,
  isDisabled = false,
  className,
  ...props
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
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

  // Arrow positioning
  const arrowStyles = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-neutral-800',
    'top-start': 'bottom-0 left-4 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-neutral-800',
    'top-end': 'bottom-0 right-4 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-neutral-800',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-neutral-800',
    'bottom-start': 'top-0 left-4 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-neutral-800',
    'bottom-end': 'top-0 right-4 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-neutral-800',
    left: 'right-0 top-1/2 translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-neutral-800',
    right: 'left-0 top-1/2 -translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-neutral-800',
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

  return (
    <View className="relative" {...props}>
      <Pressable
        onHoverIn={show}
        onHoverOut={hide}
        onLongPress={show}
        onPressOut={hide}
        delayLongPress={500}
      >
        {children}
      </Pressable>

      {isVisible && (
        <View
          className={cn(
            'absolute z-50',
            tooltipPositionStyles[placement],
            className
          )}
          pointerEvents="none"
        >
          <View className="bg-neutral-800 px-3 py-2 rounded-md shadow-lg max-w-xs">
            <Text className="text-white text-sm">{label}</Text>
            {hasArrow && (
              <View
                className={cn(
                  'absolute w-0 h-0 border-4',
                  arrowStyles[placement]
                )}
              />
            )}
          </View>
        </View>
      )}
    </View>
  )
}
