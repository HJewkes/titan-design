import { useEffect, useState } from 'react'
import { Animated, Platform, View } from 'react-native'
import type { Participant } from '@titan-design/chat-protocol'
import { cn } from '../../../utils/cn'
import { Indicator } from '../../ui/indicator'
import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'

export interface TypingIndicatorProps {
  /** Who is composing. Renders nothing when empty. */
  participants: readonly Participant[]
  /** Hide the "… is typing" caption and keep only the dots. */
  dotsOnly?: boolean
  className?: string
}

const DOT_COUNT = 3
const STEP_MS = 180
const DIM = 0.3

export function typingLabel(participants: readonly Participant[]): string {
  const names = participants.map((participant) => participant.displayName)
  if (names.length === 1) return `${names[0]} is typing`
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`
  return `${names.length} people are typing`
}

function useStaggeredPulse(index: number): Animated.Value {
  const [opacity] = useState(() => new Animated.Value(DIM))
  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web'
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(index * STEP_MS),
        Animated.timing(opacity, { toValue: 1, duration: STEP_MS, useNativeDriver }),
        Animated.timing(opacity, { toValue: DIM, duration: STEP_MS, useNativeDriver }),
        Animated.delay((DOT_COUNT - index) * STEP_MS),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [index, opacity])
  return opacity
}

// Style only: NativeWind drops className on Animated.View.
function PulsingDot({ index }: { index: number }) {
  const opacity = useStaggeredPulse(index)
  return (
    <Animated.View style={{ opacity }}>
      <Indicator size="md" color="default" />
    </Animated.View>
  )
}

/** Three staggered dots in a small bubble, plus who is composing. Composes Surface + Indicator + Typography. */
export function TypingIndicator({
  participants,
  dotsOnly = false,
  className,
}: TypingIndicatorProps) {
  if (participants.length === 0) return null
  const label = typingLabel(participants)
  return (
    <View
      className={cn('flex-row items-center gap-inline-md', className)}
      accessibilityLiveRegion="polite"
      testID="chat-typing-indicator"
    >
      <Surface raise={1} className="flex-row items-center gap-inline-sm px-inset-md py-inset-sm">
        {Array.from({ length: DOT_COUNT }, (_, index) => (
          <PulsingDot key={index} index={index} />
        ))}
      </Surface>
      {dotsOnly ? null : (
        <Typography variant="caption" color="tertiary">
          {label}
        </Typography>
      )}
    </View>
  )
}
