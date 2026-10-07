import { useEffect, useState, useMemo } from 'react'
import { Animated, Easing } from 'react-native'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'

/**
 * Draws the band left to right over 800 ms, then pops the workout dots in, 200 ms apart.
 * Under reduced motion every value starts and stays at 1: the final frame, no animation.
 */
export function useCapacityBandEntrance(
  bandLength: number,
  workoutCount: number
): { reveal: Animated.Value; dotAnims: Animated.Value[] } {
  const reduced = usePrefersReducedMotion()
  const start = reduced ? 1 : 0
  const [reveal] = useState(() => new Animated.Value(start))
  const dotAnims = useMemo(
    () => Array.from({ length: workoutCount }, () => new Animated.Value(start)),
    [workoutCount, start]
  )

  useEffect(() => {
    reveal.setValue(start)
    dotAnims.forEach((a) => a.setValue(start))
    if (reduced) return
    const draw = Animated.timing(reveal, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    })
    const pops = dotAnims.map((a) =>
      Animated.timing(a, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      })
    )
    const animation = Animated.sequence([draw, Animated.stagger(200, pops)])
    animation.start()
    return () => animation.stop()
  }, [reveal, dotAnims, bandLength, workoutCount, reduced, start])

  return { reveal, dotAnims }
}
