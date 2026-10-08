import React, { createContext, useContext, useState, useCallback } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Surface } from '../surface'
import { statusStyles, iconColors, toastRole, type ToastStatus } from './toastStatus'
import { useAutoDismiss } from './useAutoDismiss'

export type { ToastStatus }
export type ToastPosition =
  | 'top'
  | 'top-right'
  | 'top-left'
  | 'bottom'
  | 'bottom-right'
  | 'bottom-left'

export interface ToastConfig {
  /** Unique ID for the toast */
  id: string
  /** Title text */
  title: string
  /** Description text */
  description?: string
  /** Status/type of the toast */
  status?: ToastStatus
  /** Duration in milliseconds (0 = no auto-dismiss) */
  duration?: number
  /** Whether the toast can be dismissed */
  isClosable?: boolean
  /** Callback when toast is closed */
  onClose?: () => void
}

interface ToastContextType {
  toasts: ToastConfig[]
  addToast: (config: Omit<ToastConfig, 'id'>) => string
  removeToast: (id: string) => void
  removeAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | null>(null)

let toastIdCounter = 0

export interface ToastProviderProps {
  /** Position of toasts on screen */
  position?: ToastPosition
  /** Default duration for toasts */
  defaultDuration?: number
  /** Maximum number of visible toasts */
  maxToasts?: number
  children?: React.ReactNode
}

const positionStyles: Record<ToastPosition, string> = {
  top: 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  bottom: 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
}

/**
 * Provider component for the toast notification system.
 *
 * @example
 * // Wrap your app with ToastProvider
 * <ToastProvider position="top-right">
 *   <App />
 * </ToastProvider>
 *
 * // Then use the useToast hook in any component
 * const { addToast } = useToast()
 * addToast({ title: 'Success!', status: 'success' })
 */
export function ToastProvider({
  position = 'top-right',
  defaultDuration = 5000,
  maxToasts = 5,
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastConfig[]>([])

  const addToast = useCallback(
    (config: Omit<ToastConfig, 'id'>) => {
      const id = `toast-${++toastIdCounter}`
      const newToast: ToastConfig = {
        id,
        duration: defaultDuration,
        isClosable: true,
        status: 'info',
        ...config,
      }

      setToasts((prev) => {
        const updated = [newToast, ...prev]
        return updated.slice(0, maxToasts)
      })

      return id
    },
    [defaultDuration, maxToasts]
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const removeAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, removeAllToasts }}>
      {children}
      {/* Toast Container */}
      <View
        className={cn('fixed z-[9999] flex flex-col gap-2', positionStyles[position])}
        pointerEvents="box-none"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            {...toast}
            onClose={() => {
              removeToast(toast.id)
              toast.onClose?.()
            }}
          />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

/**
 * Hook to access toast functions.
 *
 * @example
 * const { addToast, removeAllToasts } = useToast()
 *
 * // Show a success toast
 * addToast({
 *   title: 'Saved!',
 *   description: 'Your changes have been saved.',
 *   status: 'success'
 * })
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastItemProps extends ToastConfig {
  onClose: () => void
}

function ToastItem({
  id: _id,
  title,
  description,
  status = 'info',
  duration = 5000,
  isClosable = true,
  onClose,
}: ToastItemProps) {
  const { bg, border, icon } = statusStyles[status]

  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  useAutoDismiss(duration, isHovered || isFocused, onClose)

  return (
    <Surface
      elevation={5}
      rounded={false}
      className={cn('min-w-[280px] max-w-[400px] rounded-lg border-l-4', border)}
      role={toastRole(status)}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <View className={cn('flex-row items-start p-inset-md', bg)}>
        {/* Icon */}
        <View className={cn('w-6 h-6 items-center justify-center mr-3')}>
          <Text aria-hidden className={cn('text-lg', iconColors[status])}>
            {icon}
          </Text>
        </View>

        {/* Content */}
        <View className="flex-1 gap-stack-sm">
          <Text className="text-sm font-semibold text-text-primary">{title}</Text>
          {description && <Text className="text-sm text-text-secondary">{description}</Text>}
        </View>

        {/* Close button */}
        {isClosable && (
          <Pressable
            onPress={onClose}
            className="p-1 -m-1 rounded web:hover:bg-interactive-hover"
            accessibilityRole="button"
            accessibilityLabel="Close toast"
          >
            <Text aria-hidden className="text-text-tertiary text-lg">
              ×
            </Text>
          </Pressable>
        )}
      </View>
    </Surface>
  )
}

export interface ToastProps extends ViewProps {
  /** Title text */
  title: string
  /** Description text */
  description?: string
  /** Status/type of the toast */
  status?: ToastStatus
  /** Whether to show the icon */
  showIcon?: boolean
  /** Whether the toast can be dismissed */
  isClosable?: boolean
  /** Callback when close button is clicked */
  onClose?: () => void
  /** Additional className */
  className?: string
}

/**
 * Standalone Toast component (for static rendering without provider).
 *
 * @example
 * <Toast
 *   title="Success!"
 *   description="Your changes have been saved."
 *   status="success"
 * />
 */
export function Toast({
  title,
  description,
  status = 'info',
  showIcon = true,
  isClosable = false,
  onClose,
  className,
  ...props
}: ToastProps) {
  const { bg, border, icon } = statusStyles[status]

  return (
    <Surface
      elevation={5}
      rounded={false}
      className={cn('min-w-[280px] max-w-[400px] rounded-lg border-l-4', border, className)}
      role={toastRole(status)}
      {...props}
    >
      <View className={cn('flex-row items-start p-inset-md', bg)}>
        {/* Icon */}
        {showIcon && (
          <View className="w-6 h-6 items-center justify-center mr-3">
            <Text aria-hidden className={cn('text-lg', iconColors[status])}>
              {icon}
            </Text>
          </View>
        )}

        {/* Content */}
        <View className="flex-1 gap-stack-sm">
          <Text className="text-sm font-semibold text-text-primary">{title}</Text>
          {description && <Text className="text-sm text-text-secondary">{description}</Text>}
        </View>

        {/* Close button */}
        {isClosable && onClose && (
          <Pressable
            onPress={onClose}
            className="p-1 -m-1 rounded web:hover:bg-interactive-hover"
            accessibilityRole="button"
            accessibilityLabel="Close toast"
          >
            <Text aria-hidden className="text-text-tertiary text-lg">
              ×
            </Text>
          </Pressable>
        )}
      </View>
    </Surface>
  )
}
