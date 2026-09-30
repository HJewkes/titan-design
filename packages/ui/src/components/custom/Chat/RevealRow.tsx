import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Animated, PanResponder, View } from 'react-native'
import { DateTime } from '../DateTime'

/** How far a drag slides the thread, which is the width of the time column. */
export const REVEAL_PX = 64

const HORIZONTAL_SLOP_PX = 8

const RevealContext = createContext<Animated.Value | null>(null)

/** Clamps a leftward drag of `dx` px to the reveal range; rightward drags reveal nothing. */
export function revealOffset(dx: number): number {
  return Math.min(REVEAL_PX, Math.max(0, -dx))
}

/**
 * Drag left to slide the thread and show each message's time, and let go to spring
 * back, the way Messages does. `open` holds it revealed, for stories and tests.
 */
export function useRevealGesture(open: boolean) {
  const [offset] = useState(() => new Animated.Value(open ? REVEAL_PX : 0))
  useEffect(() => offset.setValue(open ? REVEAL_PX : 0), [offset, open])
  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, { dx, dy }) =>
          !open && dx < -HORIZONTAL_SLOP_PX && Math.abs(dx) > Math.abs(dy) * 2,
        onPanResponderMove: (_event, { dx }) => offset.setValue(revealOffset(dx)),
        onPanResponderRelease: () =>
          Animated.spring(offset, { toValue: 0, useNativeDriver: false }).start(),
        onPanResponderTerminate: () =>
          Animated.spring(offset, { toValue: 0, useNativeDriver: false }).start(),
      }).panHandlers,
    [offset, open]
  )
  return { offset, panHandlers }
}

export function RevealProvider({
  offset,
  children,
}: {
  offset: Animated.Value
  children: ReactNode
}) {
  return <RevealContext.Provider value={offset}>{children}</RevealContext.Provider>
}

/**
 * One thread row that slides left with the drag and carries its message time in a column
 * parked past the right edge. The time stays in the tree, so a screen reader still reaches it.
 */
export function RevealRow({ at, children }: { at: string; children: ReactNode }) {
  const offset = useContext(RevealContext)
  const translateX = useMemo(
    () => (offset ? Animated.multiply(offset, -1) : new Animated.Value(0)),
    [offset]
  )
  return (
    <View className="overflow-hidden" testID="chat-reveal-row">
      <Animated.View style={{ transform: [{ translateX }] }}>
        {children}
        <View
          style={{ position: 'absolute', left: '100%', top: 0, bottom: 0, width: REVEAL_PX }}
          className="justify-center pl-inset-sm"
          testID="chat-line-time"
        >
          <DateTime value={at} format="time" variant="caption" color="tertiary" />
        </View>
      </Animated.View>
    </View>
  )
}
