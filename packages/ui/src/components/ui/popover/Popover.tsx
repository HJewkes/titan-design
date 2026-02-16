import React, { useState, createContext, useContext } from 'react'
import { View, Pressable, Modal, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'

interface PopoverContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  placement: PopoverPlacement
}

const PopoverContext = createContext<PopoverContextType>({
  isOpen: false,
  setIsOpen: () => {},
  placement: 'bottom',
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
  className,
  children,
  ...props
}: PopoverProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = controlledIsOpen ?? internalIsOpen

  const setIsOpen = (open: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(open)
    }
    onOpenChange?.(open)
  }

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen, placement }}>
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
  const { isOpen, setIsOpen } = useContext(PopoverContext)

  return (
    <Pressable
      onPress={() => setIsOpen(!isOpen)}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      className={className}
    >
      {children}
    </Pressable>
  )
}

export interface PopoverContentProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Content container for the popover.
 */
export function PopoverContent({ children, className }: PopoverContentProps) {
  const { isOpen, setIsOpen, placement } = useContext(PopoverContext)

  if (!isOpen) return null

  const placementStyles = {
    top: 'bottom-full left-0 mb-2',
    bottom: 'top-full left-0 mt-2',
    left: 'right-full top-0 mr-2',
    right: 'left-full top-0 ml-2',
  }

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
          'bg-surface-elevated rounded-lg shadow-lg border border-border-default',
          'p-4',
          placementStyles[placement],
          className
        )}
      >
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
