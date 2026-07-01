import React, { useState, useRef, useCallback, createContext, useContext } from 'react'
import { View, Pressable, Modal, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'

interface PopoverContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  placement: PopoverPlacement
  triggerMode: 'click' | 'hover'
  handleHoverIn: () => void
  handleHoverOut: () => void
}

const PopoverContext = createContext<PopoverContextType>({
  isOpen: false,
  setIsOpen: () => {},
  placement: 'bottom',
  triggerMode: 'click',
  handleHoverIn: () => {},
  handleHoverOut: () => {},
})

export interface PopoverProps extends ViewProps {
  /** Placement of the popover */
  placement?: PopoverPlacement
  /** Controlled open state */
  isOpen?: boolean
  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void
  /** Whether clicking outside closes the popover */
  closeOnClickOutside?: boolean
  /** Trigger mode: 'click' opens on click, 'hover' opens on hover */
  triggerMode?: 'click' | 'hover'
  /** Delay in ms before closing in hover mode (default 150) */
  closeDelay?: number
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Popover component for displaying floating content.
 *
 * @example
 * <Popover>
 *   <PopoverTrigger>
 *     <Button><ButtonText>Open</ButtonText></Button>
 *   </PopoverTrigger>
 *   <PopoverContent>
 *     <Text>Popover content</Text>
 *   </PopoverContent>
 * </Popover>
 */
export function Popover({
  placement = 'bottom',
  isOpen: controlledIsOpen,
  onOpenChange,
  closeOnClickOutside = true,
  triggerMode = 'click',
  closeDelay = 150,
  className,
  children,
  ...props
}: PopoverProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = controlledIsOpen ?? internalIsOpen
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setIsOpen = useCallback((open: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(open)
    }
    onOpenChange?.(open)
  }, [controlledIsOpen, onOpenChange])

  const handleHoverIn = useCallback(() => {
    if (triggerMode !== 'hover') return
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setIsOpen(true)
  }, [triggerMode, setIsOpen])

  const handleHoverOut = useCallback(() => {
    if (triggerMode !== 'hover') return
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false)
      closeTimerRef.current = null
    }, closeDelay)
  }, [triggerMode, closeDelay, setIsOpen])

  return (
    <PopoverContext.Provider
      value={{ isOpen, setIsOpen, placement, triggerMode, handleHoverIn, handleHoverOut }}
    >
      <View className={cn('relative', className)} {...props}>
        {children}
      </View>
    </PopoverContext.Provider>
  )
}

export interface PopoverTriggerProps {
  children: React.ReactNode
  className?: string
}

/**
 * Trigger element for the popover.
 */
export function PopoverTrigger({ children, className }: PopoverTriggerProps) {
  const { isOpen, setIsOpen, triggerMode, handleHoverIn, handleHoverOut } =
    useContext(PopoverContext)

  const hoverProps =
    triggerMode === 'hover'
      ? {
          onHoverIn: handleHoverIn,
          onHoverOut: handleHoverOut,
          onMouseEnter: handleHoverIn,
          onMouseLeave: handleHoverOut,
        }
      : {}

  return (
    <Pressable
      onPress={() => setIsOpen(!isOpen)}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      className={className}
      {...hoverProps}
    >
      {children}
    </Pressable>
  )
}

export interface PopoverContentProps {
  children?: React.ReactNode
  className?: string
}

const SPACER_STYLES: Record<PopoverPlacement, React.CSSProperties> = {
  top: { left: 0, right: 0, bottom: 0, height: 8, transform: 'translateY(100%)' },
  bottom: { left: 0, right: 0, top: 0, height: 8, transform: 'translateY(-100%)' },
  left: { top: 0, bottom: 0, right: 0, width: 8, transform: 'translateX(100%)' },
  right: { top: 0, bottom: 0, left: 0, width: 8, transform: 'translateX(-100%)' },
}

/**
 * Content container for the popover.
 */
export function PopoverContent({ children, className }: PopoverContentProps) {
  const { isOpen, setIsOpen, placement, triggerMode, handleHoverIn, handleHoverOut } =
    useContext(PopoverContext)

  if (!isOpen) return null

  const placementStyles = {
    top: 'bottom-full left-0 mb-2',
    bottom: 'top-full left-0 mt-2',
    left: 'right-full top-0 mr-2',
    right: 'left-full top-0 ml-2',
  }

  const hoverProps =
    triggerMode === 'hover'
      ? {
          onHoverIn: handleHoverIn,
          onHoverOut: handleHoverOut,
          onMouseEnter: handleHoverIn,
          onMouseLeave: handleHoverOut,
        }
      : {}

  return (
    <>
      {/* Backdrop */}
      <Pressable
        onPress={() => setIsOpen(false)}
        className="fixed inset-0 z-40"
        style={{ position: 'absolute' }}
      />
      {/* Content */}
      <View
        className={cn(
          'absolute z-50 min-w-[200px]',
          'bg-surface-elevated rounded-lg shadow-lg border border-border',
          'p-4',
          placementStyles[placement],
          className
        )}
        {...hoverProps}
      >
        {triggerMode === 'hover' && (
          <div
            style={{
              position: 'absolute',
              pointerEvents: 'auto',
              background: 'transparent',
              ...SPACER_STYLES[placement],
            }}
            onMouseEnter={handleHoverIn}
            onMouseLeave={handleHoverOut}
          />
        )}
        {children}
      </View>
    </>
  )
}

export interface PopoverCloseButtonProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Button to close the popover.
 */
export function PopoverCloseButton({ children, className }: PopoverCloseButtonProps) {
  const { setIsOpen } = useContext(PopoverContext)

  return (
    <Pressable
      onPress={() => setIsOpen(false)}
      accessibilityRole="button"
      accessibilityLabel="Close popover"
      className={cn('p-1', className)}
    >
      {children}
    </Pressable>
  )
}
