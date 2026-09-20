// The OS "reduce motion" preference, read once and then watched. Lives in `hooks/` so
// `ui/`-tier components can honour it without importing `custom/` (the tier order in
// CLAUDE.md, Placement); it was promoted out of `custom/charts/live-rep-growth`.
import { useEffect, useState } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'

function getReducedMotionPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Web reads the media query directly, so a test can stub `matchMedia` after import. */
function subscribeWeb(onChange: (reduced: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const handler = () => onChange(mq.matches)
  handler()
  mq.addEventListener?.('change', handler)
  return () => mq.removeEventListener?.('change', handler)
}

/** iOS and Android have no media query; the same preference is an AccessibilityInfo read. */
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

/** Track the OS "reduce motion" preference; falls back to `false` (jsdom/SSR). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getReducedMotionPreference)
  useEffect(
    () => (Platform.OS === 'web' ? subscribeWeb(setReduced) : subscribeNative(setReduced)),
    []
  )
  return reduced
}
