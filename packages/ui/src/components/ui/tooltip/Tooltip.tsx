import React, { useState, useRef, useCallback } from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Surface } from '../surface'
import { TriggerSurface } from '../trigger'
import { arrowStyles, tooltipPositionStyles } from './tooltipPosition'
import { canPortal, TooltipPortal } from './TooltipParts'
import { usePortalPosition } from './usePortalPosition'
import { useTooltipVisibility } from './useTooltipVisibility'

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
  /**
   * Controlled visibility. In this mode the tooltip renders no Pressable of its
   * own, so it can sit inside a pressable row without taking its press; the
   * caller owns hover (see {@link useHoverState}). Needed because RNW ends a
   * wrapper's hover the moment a nested Pressable claims the pointer.
   */
  isOpen?: boolean
}

/** Hover state from pointer enter/leave on any View, for driving a controlled Tooltip. */
export function useHoverState() {
  const [hovered, setHovered] = useState(false)
  const onPointerEnter = useCallback(() => setHovered(true), [])
  const onPointerLeave = useCallback(() => setHovered(false), [])
  return { hovered, hoverProps: { onPointerEnter, onPointerLeave } }
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
  isOpen,
  ...props
}: TooltipProps) {
  const { hovered, show, hide } = useTooltipVisibility({ isDisabled, openDelay, closeDelay })
  const isVisible = isOpen ?? hovered
  const triggerRef = useRef<View>(null)

  const isPortalMode = usePortalProp && canPortal
  const portalPos = usePortalPosition(triggerRef, isVisible && isPortalMode, placement)

  // Floating: overlay plane + lift, no ring.
  const tooltipContent = (
    <Surface elevation={4} rounded={false} className="px-inset-md py-inset-sm rounded-md max-w-xs">
      {content ?? <Text className="text-text-primary text-sm">{label}</Text>}
      {hasArrow && <View className={cn('absolute w-0 h-0 border-4', arrowStyles[placement])} />}
    </Surface>
  )

  return (
    <View className="relative" ref={triggerRef} {...props}>
      {isOpen === undefined ? (
        <TriggerSurface
          handlers={{ onHoverIn: show, onHoverOut: hide, onLongPress: show, onPressOut: hide }}
        >
          {children}
        </TriggerSurface>
      ) : (
        children
      )}

      {isPortalMode ? (
        <TooltipPortal isVisible={isVisible} position={portalPos} className={className}>
          {tooltipContent}
        </TooltipPortal>
      ) : (
        isVisible && (
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
        )
      )}
    </View>
  )
}
