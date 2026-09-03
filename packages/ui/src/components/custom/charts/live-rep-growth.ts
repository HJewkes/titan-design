// The newest-rep grow-from-bottom entrance, shared by SetBarChart (hero / dual / ROM)
// and VelocityStrip's framed + bare expanded charts. Promoted out of VelocityStrip so
// every value-height bar family animates the live rep identically instead of re-rolling
// the hook.
import { useEffect, useState } from 'react'
import { Animated, Easing } from 'react-native'

const ANIMATION_EASING = Easing.bezier(0.22, 1, 0.36, 1)

/**
 * Growth-factor overshoot for a new-peak bar: it grows past its full height then
 * settles back to 1 (a small bounce), rather than the plain 0→1 grow every other
 * bar gets. Modest (12%) since it stretches actual bar HEIGHT, not a uniform scale
 * — a large overshoot here reads as a much bigger jump than the same factor did
 * against the old whole-bar scale pop.
 */
const PEAK_OVERSHOOT = 1.12

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

/**
 * The newest-rep entrance shared by SetBarChart and the framed / bare `expanded` charts:
 * the bar GROWS UP FROM THE BASELINE (0 → full height), reading as though it's tracking
 * the rep as it lands. A new set peak overshoots past full height then settles (a small
 * bounce) instead of the plain grow. Honors reduced motion (jumps straight to full
 * height, no animation). Returns a 0→1(+overshoot) growth-factor `Animated.Value`;
 * callers interpolate it against their own target height. Inert while `active` is
 * false or no live rep is present.
 */
export function useLiveRepGrowth(
  active: boolean,
  liveRepIndex: number | undefined,
  liveVelocity: number | undefined,
  isNewPeak: boolean
): Animated.Value {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [liveGrowth] = useState(() => new Animated.Value(1))
  useEffect(() => {
    if (!active || liveRepIndex == null || liveVelocity == null) return
    if (prefersReducedMotion) {
      liveGrowth.setValue(1)
      return
    }
    liveGrowth.setValue(0)
    if (isNewPeak) {
      Animated.sequence([
        Animated.timing(liveGrowth, {
          toValue: PEAK_OVERSHOOT,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.spring(liveGrowth, {
          toValue: 1,
          friction: 5,
          tension: 140,
          useNativeDriver: false,
        }),
      ]).start()
    } else {
      // Plain entrance: a clean ease-out grow with no overshoot (ANIMATION_EASING has
      // no control point above y=1) — it reads as tracking the rep, not bouncing.
      Animated.timing(liveGrowth, {
        toValue: 1,
        duration: 300,
        easing: ANIMATION_EASING,
        useNativeDriver: false,
      }).start()
    }
  }, [active, liveRepIndex, liveVelocity, isNewPeak, prefersReducedMotion, liveGrowth])
  return liveGrowth
}

export { ANIMATION_EASING }
