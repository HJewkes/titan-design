import { useEffect, useState } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'

function getReducedMotionPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function subscribeWeb(onChange: (reduced: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const handler = () => onChange(mq.matches)
  handler()
  mq.addEventListener?.('change', handler)
  return () => mq.removeEventListener?.('change', handler)
}

function subscribeNative(onChange: (reduced: boolean) => void): () => void {
  let live = true
  void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
    if (live) onChange(reduced)
  })
  const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', onChange)
  return () => {
    live = false
    subscription.remove()
  }
}

/**
 * Track the OS "reduce motion" preference; falls back to `false` (jsdom/SSR).
 * Web reads the media query directly, so tests can stub `matchMedia` after import;
 * native asks `AccessibilityInfo`.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getReducedMotionPreference)
  useEffect(
    () => (Platform.OS === 'web' ? subscribeWeb(setReduced) : subscribeNative(setReduced)),
    []
  )
  return reduced
}
