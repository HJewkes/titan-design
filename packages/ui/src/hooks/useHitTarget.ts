import { useCallback, useState } from 'react'
import { Platform, type Insets, type LayoutChangeEvent } from 'react-native'
import {
  HIT_TARGET_TEST_ID,
  hitSlopFor,
  hitTargetLayerClass,
  type HitTargetLimit,
} from '../utils/hit-target'

export interface UseHitTargetOptions {
  /** `false` for a size whose face already meets the floor. */
  enabled?: boolean
  /** Set by a row or column of pressables, so hit boxes stop at the neighbour's face. */
  limit?: HitTargetLimit
  /** The consumer's own `onLayout`, called before the face is measured. */
  onLayout?: (event: LayoutChangeEvent) => void
}

export interface UseHitTargetResult {
  /** Native only: the slop that grows the measured face to the floor. */
  hitSlop: Insets | undefined
  onLayout: ((event: LayoutChangeEvent) => void) | undefined
  /** Web only: props for a `View` rendered as the pressable's first child. */
  layerProps: { className: string; testID: string } | null
}

/**
 * A 44px hit box around a pressable whose face stays smaller. Web renders a
 * transparent layer inside the pressable because react-native-web's Pressable
 * ignores `hitSlop`; native measures the face and sets `hitSlop`, because a
 * child outside its parent's bounds receives no touch there.
 */
export function useHitTarget({
  enabled = true,
  limit,
  onLayout,
}: UseHitTargetOptions = {}): UseHitTargetResult {
  const [hitSlop, setHitSlop] = useState<Insets>()
  const measuresFace = enabled && Platform.OS !== 'web'

  const measureFace = useCallback(
    (event: LayoutChangeEvent) => {
      onLayout?.(event)
      setHitSlop(hitSlopFor(event.nativeEvent.layout, limit))
    },
    [onLayout, limit]
  )

  return {
    hitSlop: measuresFace ? hitSlop : undefined,
    onLayout: measuresFace ? measureFace : onLayout,
    layerProps:
      enabled && Platform.OS === 'web'
        ? { className: hitTargetLayerClass(limit), testID: HIT_TARGET_TEST_ID }
        : null,
  }
}
