import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { View, Platform } from 'react-native'
import { cn } from '../../../utils/cn'
import { Toast, type ToastStatus } from './Toast'

let createPortal: typeof import('react-dom').createPortal | undefined
if (Platform.OS === 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    createPortal = require('react-dom').createPortal
  } catch {
    // react-dom unavailable
  }
}

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export type ToastProviderPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center'

export interface ToastOptions {
  /** Title text (required) */
  title: string
  /** Optional description */
  description?: string
  /** Visual variant */
  variant?: ToastVariant
  /** Auto-dismiss duration in ms (0 = persistent) */
  duration?: number
  /** Callback when toast is dismissed */
  onDismiss?: () => void
}

interface ToastEntry extends Required<Pick<ToastOptions, 'title' | 'variant'>> {
  id: string
  description?: string
  duration: number
  isExiting: boolean
  onDismiss?: () => void
}

interface ToastContextValue {
  show: (options: ToastOptions) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let idCounter = 0
function generateId(): string {
  return `titan-toast-${++idCounter}`
}

const positionClasses: Record<ToastProviderPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
}

const EXIT_DURATION = 300

export interface ToastProviderV2Props {
  children: React.ReactNode
  /** Position on screen */
  position?: ToastProviderPosition
  /** Maximum number of visible toasts */
  maxToasts?: number
  /** Default auto-dismiss duration in ms */
  defaultDuration?: number
}

/**
 * Provider for the imperative toast system.
 *
 * Renders toasts in a portal with enter/exit animations and auto-dismiss.
 * Uses the existing titan Toast card component for rendering.
 *
 * @example
 * <ToastProvider position="top-right" maxToasts={5}>
 *   <App />
 * </ToastProvider>
 */
export function ToastProviderV2({
  children,
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 4000,
}: ToastProviderV2Props) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeFromDom = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const startExit = useCallback(
    (id: string) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
      )
      const exitTimer = setTimeout(() => {
        removeFromDom(id)
      }, EXIT_DURATION)
      timersRef.current.set(`exit-${id}`, exitTimer)
    },
    [removeFromDom]
  )

  const clearTimersForId = useCallback((id: string) => {
    const autoTimer = timersRef.current.get(id)
    if (autoTimer) {
      clearTimeout(autoTimer)
      timersRef.current.delete(id)
    }
    const exitTimer = timersRef.current.get(`exit-${id}`)
    if (exitTimer) {
      clearTimeout(exitTimer)
      timersRef.current.delete(`exit-${id}`)
    }
  }, [])

  const dismiss = useCallback(
    (id: string) => {
      clearTimersForId(id)
      setToasts((prev) => {
        const toast = prev.find((t) => t.id === id)
        if (!toast || toast.isExiting) return prev
        toast.onDismiss?.()
        return prev.map((t) =>
          t.id === id ? { ...t, isExiting: true } : t
        )
      })
      const exitTimer = setTimeout(() => {
        removeFromDom(id)
      }, EXIT_DURATION)
      timersRef.current.set(`exit-${id}`, exitTimer)
    },
    [clearTimersForId, removeFromDom]
  )

  const dismissAll = useCallback(() => {
    setToasts((prev) => {
      for (const toast of prev) {
        clearTimersForId(toast.id)
        toast.onDismiss?.()
      }
      return prev.map((t) => ({ ...t, isExiting: true }))
    })
    setTimeout(() => {
      setToasts([])
    }, EXIT_DURATION)
  }, [clearTimersForId])

  const show = useCallback(
    (options: ToastOptions): string => {
      const id = generateId()
      const duration = options.duration ?? defaultDuration
      const entry: ToastEntry = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant ?? 'info',
        duration,
        isExiting: false,
        onDismiss: options.onDismiss,
      }

      setToasts((prev) => {
        const updated = [entry, ...prev]
        if (updated.length > maxToasts) {
          const overflow = updated.slice(maxToasts)
          for (const t of overflow) {
            clearTimersForId(t.id)
            t.onDismiss?.()
          }
          return updated.slice(0, maxToasts)
        }
        return updated
      })

      if (duration > 0) {
        const timer = setTimeout(() => {
          startExit(id)
        }, duration)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [defaultDuration, maxToasts, clearTimersForId, startExit]
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer)
      }
      timers.clear()
    }
  }, [])

  const contextValue: ToastContextValue = { show, dismiss, dismissAll }

  const toastContainer = (
    <View
      className={cn(
        'fixed z-[9999] flex flex-col gap-2',
        positionClasses[position]
      )}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <ToastAnimatedItem
          key={toast.id}
          entry={toast}
          onClose={() => dismiss(toast.id)}
        />
      ))}
    </View>
  )

  const portalContent =
    Platform.OS === 'web' && createPortal
      ? createPortal(toastContainer, document.body)
      : toastContainer

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {portalContent}
    </ToastContext.Provider>
  )
}

interface ToastAnimatedItemProps {
  entry: ToastEntry
  onClose: () => void
}

const variantToStatus: Record<ToastVariant, ToastStatus> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
}

function ToastAnimatedItem({ entry, onClose }: ToastAnimatedItemProps) {
  return (
    <View
      className={cn(
        'transition-all duration-300 pointer-events-auto',
        entry.isExiting
          ? 'opacity-0 translate-x-12 scale-95'
          : 'animate-[slideInRight_0.3s_ease-out]'
      )}
    >
      <Toast
        title={entry.title}
        description={entry.description}
        status={variantToStatus[entry.variant]}
        isClosable
        onClose={onClose}
      />
    </View>
  )
}

/**
 * Hook to show/dismiss toasts imperatively.
 *
 * @example
 * const toast = useToastV2()
 * toast.show({ title: 'Saved', variant: 'success' })
 * toast.show({ title: 'Error', variant: 'error', duration: 5000 })
 */
export function useToastV2(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastV2 must be used within a ToastProviderV2')
  }
  return context
}
