// The OS "reduce motion" preference, read once and then watched. Lives in `hooks/` so
// `ui/`-tier components can honour it without importing `custom/` (the tier order in
// CLAUDE.md, Placement); it was promoted out of `custom/charts/live-rep-growth`.
import { useEffect, useState } from 'react'

function getReducedMotionPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Track the OS "reduce motion" preference; falls back to `false` (jsdom/SSR). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getReducedMotionPreference)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setReduced(mq.matches)
    handler()
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return reduced
}
