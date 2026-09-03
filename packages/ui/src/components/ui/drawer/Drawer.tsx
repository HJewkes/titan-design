import React from 'react'
import { View, Text, Pressable, Modal, ScrollView, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface DrawerProps extends ViewProps {
  /** Whether the drawer is open */
  isOpen: boolean
  /** Callback when drawer should close */
  onClose: () => void
  /** Placement of the drawer */
  placement?: DrawerPlacement
  /** Size of the drawer */
  size?: DrawerSize
  /** Whether clicking the backdrop closes the drawer */
  closeOnOverlayClick?: boolean
  /** Whether to show the close button */
  showCloseButton?: boolean
  /** Title for the drawer header */
  title?: string
  /** Additional className for the drawer content */
  className?: string
  children?: React.ReactNode
}

const sizeStyles: Record<DrawerPlacement, Record<DrawerSize, string>> = {
  left: {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
    xl: 'w-[480px]',
    full: 'w-full',
  },
  right: {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
    xl: 'w-[480px]',
    full: 'w-full',
  },
  top: {
    sm: 'h-32',
    md: 'h-48',
    lg: 'h-64',
    xl: 'h-96',
    full: 'h-full',
  },
  bottom: {
    sm: 'h-32',
    md: 'h-48',
    lg: 'h-64',
    xl: 'h-96',
    full: 'h-full',
  },
}

const placementStyles: Record<DrawerPlacement, string> = {
  left: 'left-0 top-0 bottom-0 h-full',
  right: 'right-0 top-0 bottom-0 h-full',
  top: 'top-0 left-0 right-0 w-full',
  bottom: 'bottom-0 left-0 right-0 w-full',
}

/**
 * Drawer component for side panel overlays.
 *
 * @example
 * <Drawer
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Settings"
 *   placement="right"
 * >
 *   <DrawerBody>
 *     <Text>Drawer content</Text>
 *   </DrawerBody>
 * </Drawer>
 */
export function Drawer({
  isOpen,
  onClose,
  placement = 'right',
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  title,
  className,
  children,
  ...props
}: DrawerProps) {
  if (!isOpen) return null

  const handleOverlayPress = () => {
    if (closeOnOverlayClick) {
      onClose()
    }
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* Backdrop */}
        <Pressable
          onPress={handleOverlayPress}
          className="absolute inset-0 bg-black/50"
        />

        {/* Drawer Panel */}
        <View
          className={cn(
            'absolute bg-surface-elevated shadow-2xl',
            placementStyles[placement],
            sizeStyles[placement][size],
            className
          )}
          accessibilityRole={'dialog' as any}
          {...props}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-hairline">
              {title && (
                <Text className="text-lg font-semibold text-text-primary">
                  {title}
                </Text>
              )}
              {showCloseButton && (
                <Pressable
                  onPress={onClose}
                  className="p-2 -m-2 rounded-full web:hover:bg-interactive-hover"
                  accessibilityLabel="Close drawer"
                >
                  <Text className="text-text-secondary text-xl">×</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Content */}
          <View className="flex-1">
            {children}
          </View>
        </View>
      </View>
    </Modal>
  )
}

export interface DrawerHeaderProps extends ViewProps {
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Header section for the drawer.
 */
export function DrawerHeader({ className, children, ...props }: DrawerHeaderProps) {
  return (
    <View
      className={cn('px-4 py-3 border-b border-hairline', className)}
      {...props}
    >
      {children}
    </View>
  )
}

export interface DrawerBodyProps extends ViewProps {
  /** Whether the body should scroll */
  scrollable?: boolean
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Body/content section for the drawer.
 */
export function DrawerBody({ scrollable = true, className, children, ...props }: DrawerBodyProps) {
  if (scrollable) {
    return (
      <ScrollView
        className={cn('flex-1 p-4', className)}
        {...props}
      >
        {children}
      </ScrollView>
    )
  }

  return (
    <View className={cn('flex-1 p-4', className)} {...props}>
      {children}
    </View>
  )
}

export interface DrawerFooterProps extends ViewProps {
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Footer section for the drawer, typically for action buttons.
 */
export function DrawerFooter({ className, children, ...props }: DrawerFooterProps) {
  return (
    <View
      className={cn(
        'flex-row items-center justify-end gap-3',
        'px-4 py-3 border-t border-hairline',
        className
      )}
      {...props}
    >
      {children}
    </View>
  )
}
