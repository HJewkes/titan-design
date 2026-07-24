// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import { View, Text, Pressable, Animated, Easing, type ViewProps } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { WORKOUT_PILL_DELOAD } from '../../../theme/extracted-colors-dataviz'

const t = getSemanticColors('dark')

/**
 * Spec statuses: completed | current | upcoming | deload.
 * `next` and `missed` are additive extras supported by this implementation.
 */
export type WorkoutPillStatus = 'completed' | 'current' | 'upcoming' | 'deload' | 'next' | 'missed'

export interface WorkoutPillProps extends ViewProps {
  name: string
  status: WorkoutPillStatus
  /** Force pulsing animation. Defaults to pulsing only on `current` status. */
  pulse?: boolean
  onPress?: () => void
  highlighted?: boolean
  className?: string
}

const statusBgColors: Record<WorkoutPillStatus, string> = {
  completed: 'rgba(46,213,115,0.15)',
  current: 'rgba(255,121,0,0.15)',
  next: 'transparent',
  upcoming: t['surface-raised'],
  missed: 'rgba(209,67,67,0.1)',
  deload: 'rgba(186,41,150,0.15)',
}

const statusBorderStyles: Record<WorkoutPillStatus, Record<string, unknown>> = {
  completed: { borderWidth: 1, borderColor: 'rgba(46,213,115,0.3)' },
  current: { borderWidth: 1, borderColor: 'rgba(255,121,0,0.3)' },
  next: { borderWidth: 1, borderColor: 'rgba(255,121,0,0.4)' },
  upcoming: { borderWidth: 1, borderColor: '#1F1F1F' },
  missed: { borderWidth: 1, borderColor: 'rgba(209,67,67,0.25)' },
  deload: { borderWidth: 1, borderColor: 'rgba(186,41,150,0.3)' },
}

const textColors: Record<WorkoutPillStatus, string> = {
  completed: t['status-success'],
  current: t['brand-primary'],
  next: t['brand-primary'],
  upcoming: '#6B7280',
  missed: 'rgba(209,67,67,0.7)',
  deload: WORKOUT_PILL_DELOAD,
}

function usePulse(enabled: boolean) {
  const [opacity] = useState(() => new Animated.Value(1))

  useEffect(() => {
    if (!enabled) {
      opacity.setValue(1)
      return
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()

    return () => animation.stop()
  }, [enabled, opacity])

  return opacity
}

export function WorkoutPill({
  name,
  status,
  pulse,
  onPress,
  highlighted = false,
  className,
  ...props
}: WorkoutPillProps) {
  const shouldPulse = pulse ?? status === 'current'
  const pulseOpacity = usePulse(shouldPulse)
  const isCompleted = status === 'completed'
  const isMissed = status === 'missed'

  const pill = (
    <Animated.View
      style={shouldPulse ? { opacity: pulseOpacity } : undefined}
      testID="workout-pill"
    >
      <View
        className={className}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: statusBgColors[status],
          },
          statusBorderStyles[status] as Record<string, unknown>,
          highlighted ? { borderWidth: 2, transform: [{ scale: 1.02 }] } : undefined,
        ]}
        accessibilityLabel={onPress ? undefined : `${name} workout, ${status}`}
        {...props}
      >
        {isCompleted && (
          <Text
            style={{
              fontWeight: '600',
              fontFamily: '"Nunito Sans", sans-serif',
              fontSize: 11,
              color: textColors[status],
              marginRight: 4,
            }}
            accessibilityElementsHidden
            testID="workout-pill-check"
          >
            {'\u2713'}
          </Text>
        )}
        {isMissed && (
          <Text
            style={{
              fontWeight: '600',
              fontFamily: '"Nunito Sans", sans-serif',
              fontSize: 11,
              color: textColors[status],
              marginRight: 4,
            }}
            accessibilityElementsHidden
            testID="workout-pill-dash"
          >
            {'\u2014'}
          </Text>
        )}
        <Text
          style={{
            fontWeight: '600',
            fontFamily: '"Nunito Sans", sans-serif',
            fontSize: 11,
            color: textColors[status],
          }}
          accessibilityElementsHidden={onPress != null}
          testID="workout-pill-name"
        >
          {name}
        </Text>
      </View>
    </Animated.View>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${name} workout, ${status}`}
        testID="workout-pill-pressable"
      >
        {pill}
      </Pressable>
    )
  }

  return pill
}
