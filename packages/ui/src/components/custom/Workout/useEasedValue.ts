import { useEffect, useState } from 'react'
import { Animated, type EasingFunction } from 'react-native'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'

const DURATION_MS = 250

/** An Animated.Value that eases to `target`, or jumps there when reduced motion is preferred. */
export function useEasedValue(target: number, easing?: EasingFunction): Animated.Value {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [value] = useState(() => new Animated.Value(target))

  useEffect(() => {
    if (prefersReducedMotion) {
      value.setValue(target)
      return undefined
    }
    const animation = Animated.timing(value, {
      toValue: target,
      duration: DURATION_MS,
      easing,
      useNativeDriver: false,
    })
    animation.start()
    return () => animation.stop()
  }, [target, value, easing, prefersReducedMotion])

  return value
}
