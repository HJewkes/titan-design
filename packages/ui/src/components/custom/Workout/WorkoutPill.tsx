// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import { View, Pressable, Animated, Easing, type ViewProps } from 'react-native'
import { Typography } from '../Typography'
import { resolveColor } from '../../../theme/resolve-color'
import { WORKOUT_PILL_DELOAD } from '../../../theme/extracted-colors-dataviz'
import { alpha } from '../../../utils/colors'

// The deload role has no semantic tokens at all, so its wash and rim are derived from
// the same ramp pin WeekRow reads, at the LADDER'S rungs (0.12 subtle, 0.30 muted)
// rather than the frozen demo's hand-mixed 0.15. FINDING for E3: deload needs the
// wash ladder like every other role — its values already sit on one.
const DELOAD_WASH = alpha(WORKOUT_PILL_DELOAD, 0.12)
const DELOAD_RIM = alpha(WORKOUT_PILL_DELOAD, 0.3)

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

/** A pill's three colours: the wash, the rim a rung above it, and the label. */
interface PillPaint {
  background: string
  border: string
  text: string
}

/**
 * Every status on the wash ladder: `-subtle` (0.12) inside a `-muted` (0.30) rim.
 *
 * Two do not fit a rung exactly. `next` is deliberately the strongest rim — it is
 * the only status with no wash — so it takes `-strong` (0.50) rather than collapsing
 * onto `current`'s 0.30 and losing the distinction; it was 0.4. `missed`'s label was
 * a 0.7 alpha, which no rung expresses; `status-error-dark` composites to within a
 * hair of it on the dark planes and needs no alpha at all.
 */
function paintFor(status: WorkoutPillStatus): PillPaint {
  switch (status) {
    case 'completed':
      return {
        background: resolveColor('status-success-subtle'),
        border: resolveColor('status-success-muted'),
        text: resolveColor('status-success'),
      }
    case 'current':
      return {
        background: resolveColor('brand-primary-subtle'),
        border: resolveColor('brand-primary-muted'),
        text: resolveColor('brand-primary'),
      }
    case 'next':
      return {
        background: 'transparent',
        border: resolveColor('brand-primary-strong'),
        text: resolveColor('brand-primary'),
      }
    case 'upcoming':
      return {
        background: resolveColor('surface-raised'),
        border: resolveColor('hairline-default'),
        text: resolveColor('text-tertiary'),
      }
    case 'missed':
      return {
        background: resolveColor('status-error-subtle'),
        border: resolveColor('status-error-muted'),
        text: resolveColor('status-error-dark'),
      }
    case 'deload':
      return { background: DELOAD_WASH, border: DELOAD_RIM, text: WORKOUT_PILL_DELOAD }
  }
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

/**
 * @deprecated Use `<Pill tone="…" leading="dot">` — removed after AW-127 consumer migration.
 */
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
  const paint = paintFor(status)

  // 11px sat between scale steps. `caption` rounds it UP to the 12px `xs` step, the
  // same call B2 made when MuscleGroupChip became a Pill preset at size md.
  const labelClass = 'font-semibold leading-[normal]'

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
            backgroundColor: paint.background,
            borderWidth: 1,
            borderColor: paint.border,
          },
          highlighted ? { borderWidth: 2, transform: [{ scale: 1.02 }] } : undefined,
        ]}
        accessibilityLabel={onPress ? undefined : `${name} workout, ${status}`}
        {...props}
      >
        {isCompleted && (
          <Typography
            variant="caption"
            color="inherit"
            className={labelClass}
            style={{ color: paint.text, marginRight: 4 }}
            accessibilityElementsHidden
            testID="workout-pill-check"
          >
            {'\u2713'}
          </Typography>
        )}
        {isMissed && (
          <Typography
            variant="caption"
            color="inherit"
            className={labelClass}
            style={{ color: paint.text, marginRight: 4 }}
            accessibilityElementsHidden
            testID="workout-pill-dash"
          >
            {'\u2014'}
          </Typography>
        )}
        <Typography
          variant="caption"
          color="inherit"
          className={labelClass}
          style={{ color: paint.text }}
          accessibilityElementsHidden={onPress != null}
          testID="workout-pill-name"
        >
          {name}
        </Typography>
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
