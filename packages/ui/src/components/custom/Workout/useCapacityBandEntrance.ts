import { useEffect, useState, useMemo } from 'react'
import { Animated, Easing } from 'react-native'

/** Draws the band left to right over 800 ms, then pops the workout dots in, 200 ms apart. */
export function useCapacityBandEntrance(
  bandLength: number,
  workoutCount: number
): { reveal: Animated.Value; dotAnims: Animated.Value[] } {
  const [reveal] = useState(() => new Animated.Value(0))
  const dotAnims = useMemo(
    () => Array.from({ length: workoutCount }, () => new Animated.Value(0)),
    [workoutCount]
  )

  useEffect(() => {
    reveal.setValue(0)
    dotAnims.forEach((a) => a.setValue(0))
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
  }, [reveal, dotAnims, bandLength, workoutCount])

  return { reveal, dotAnims }
}
