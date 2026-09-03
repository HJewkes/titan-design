import { useSyncExternalStore } from 'react'

/**
 * Utility function to detect the current theme.
 * Checks for the 'light' class on the html element (set by Storybook's theme addon).
 *
 * NOTE: This function reads the theme at call time. For reactive theme detection
 * that re-renders when the theme changes, use the `useTheme` hook instead.
 *
 * @returns 'light' if light theme is active, 'dark' otherwise
 */
export function getTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('light') ? 'light' : 'dark'
}

// Subscribers for theme changes
let listeners: Array<() => void> = []

function subscribe(listener: () => void) {
  listeners = [...listeners, listener]

  // Set up MutationObserver to watch for class changes on html element
  if (typeof document !== 'undefined' && listeners.length === 1) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // Notify all listeners when class changes
          listeners.forEach((l) => l())
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    // Store observer for cleanup
    ;(subscribe as any)._observer = observer
  }

  return () => {
    listeners = listeners.filter((l) => l !== listener)

    // Clean up observer when no more listeners
    if (listeners.length === 0 && (subscribe as any)._observer) {
      ;(subscribe as any)._observer.disconnect()
      ;(subscribe as any)._observer = null
    }
  }
}

function getSnapshot(): 'light' | 'dark' {
  return getTheme()
}

function getServerSnapshot(): 'light' | 'dark' {
  return 'dark'
}

/**
 * React hook for reactive theme detection.
 * Automatically re-renders when the theme changes (via class changes on html element).
 *
 * Uses useSyncExternalStore for proper React 18 concurrent mode support.
 *
 * @returns 'light' if light theme is active, 'dark' otherwise
 */
export function useTheme(): 'light' | 'dark' {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
