import React, { createContext, useContext } from 'react'
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ScrollView,
  type ModalProps as RNModalProps,
} from 'react-native'
import { cn } from '../../../utils/cn'

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
export type ModalScrollBehavior = 'inside' | 'outside'

interface ModalContextType {
  onClose?: () => void
  size: ModalSize
  scrollBehavior: ModalScrollBehavior
}

const ModalContext = createContext<ModalContextType>({ size: 'md', scrollBehavior: 'outside' })

export interface ModalProps extends Omit<RNModalProps, 'visible'> {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose?: () => void
  /** Modal size */
  size?: ModalSize
  /** Where scrolling happens: inside modal body or whole modal */
  scrollBehavior?: ModalScrollBehavior
  /** Whether clicking backdrop closes modal */
  closeOnOverlayClick?: boolean
  /** Whether to blur the backdrop */
  backdropBlur?: boolean
  /** Additional className for backdrop */
  backdropClassName?: string
  /** Animation type */
  animationType?: 'none' | 'fade' | 'slide'
  children?: React.ReactNode
}

const sizeStyles: Record<ModalSize, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full m-4',
}

/**
 * Modal component for dialogs and overlays.
 *
 * @example
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <ModalContent>
 *     <ModalHeader>
 *       <ModalTitle>Modal Title</ModalTitle>
 *       <ModalCloseButton />
 *     </ModalHeader>
 *     <ModalBody>
 *       <Text>Modal content</Text>
 *     </ModalBody>
 *     <ModalFooter>
 *       <Button onPress={() => setIsOpen(false)}>Close</Button>
 *     </ModalFooter>
 *   </ModalContent>
 * </Modal>
 */
export function Modal({
  isOpen,
  onClose,
  size = 'md',
  scrollBehavior = 'outside',
  closeOnOverlayClick = true,
  backdropBlur = false,
  backdropClassName,
  animationType = 'fade',
  children,
  ...props
}: ModalProps) {
  const handleBackdropPress = () => {
    if (closeOnOverlayClick && onClose) {
      onClose()
    }
  }

  const backdropContent = (
    <Pressable
      onPress={handleBackdropPress}
      className={cn(
        'flex-1 items-center justify-center',
        backdropBlur ? 'bg-black/30 web:backdrop-blur-sm' : 'bg-black/50',
        backdropClassName
      )}
    >
      {children}
    </Pressable>
  )

  return (
    <ModalContext.Provider value={{ onClose, size, scrollBehavior }}>
      <RNModal
        visible={isOpen}
        transparent
        animationType={animationType}
        onRequestClose={onClose}
        {...props}
      >
        {scrollBehavior === 'outside' ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            {backdropContent}
          </ScrollView>
        ) : (
          backdropContent
        )}
      </RNModal>
    </ModalContext.Provider>
  )
}

export interface ModalContentProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Container for modal content.
 */
export function ModalContent({ children, className }: ModalContentProps) {
  const { size } = useContext(ModalContext)

  return (
    <Pressable
      // Prevent backdrop click from propagating
      onPress={(e) => e.stopPropagation()}
    >
      <View
        className={cn(
          'bg-surface-elevated rounded-lg shadow-xl w-full',
          sizeStyles[size],
          className
        )}
      >
        {children}
      </View>
    </Pressable>
  )
}

export interface ModalHeaderProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Header section of modal.
 */
export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <View
      className={cn(
        'flex-row items-center justify-between px-6 py-4 border-b border-divider',
        className
      )}
    >
      {children}
    </View>
  )
}

export interface ModalTitleProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Title for modal header.
 */
export function ModalTitle({ children, className }: ModalTitleProps) {
  return (
    <Text
      accessibilityRole="header"
      className={cn('text-lg font-semibold text-text-primary font-heading', className)}
    >
      {children}
    </Text>
  )
}

export interface ModalCloseButtonProps {
  className?: string
}

/**
 * Close button for modal header.
 */
export function ModalCloseButton({ className }: ModalCloseButtonProps) {
  const { onClose } = useContext(ModalContext)

  return (
    <Pressable
      onPress={onClose}
      accessibilityRole="button"
      accessibilityLabel="Close modal"
      className={cn(
        'p-1 rounded-md web:hover:bg-interactive-hover active:bg-interactive-active',
        className
      )}
    >
      <Text className="text-text-secondary text-xl leading-none">×</Text>
    </Pressable>
  )
}

export interface ModalBodyProps {
  children?: React.ReactNode
  /** Maximum height for scrollable content (when scrollBehavior="inside") */
  maxHeight?: number
  className?: string
}

/**
 * Body section of modal.
 */
export function ModalBody({ children, maxHeight, className }: ModalBodyProps) {
  const { scrollBehavior } = useContext(ModalContext)

  if (scrollBehavior === 'inside') {
    return (
      <ScrollView
        className={cn('px-6 py-4', className)}
        style={maxHeight ? { maxHeight } : undefined}
        showsVerticalScrollIndicator
      >
        {children}
      </ScrollView>
    )
  }

  return <View className={cn('px-6 py-4', className)}>{children}</View>
}

export interface ModalFooterProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Footer section of modal.
 */
export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <View
      className={cn(
        'flex-row items-center justify-end gap-2 px-6 py-4 border-t border-divider',
        className
      )}
    >
      {children}
    </View>
  )
}
