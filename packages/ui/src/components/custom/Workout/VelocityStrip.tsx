// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useEffect, useState } from 'react'
import { View, Text, Pressable, Animated, Easing, type ViewProps } from 'react-native'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { formatVelocity } from '../../../utils/workout-format'

export interface VelocityStripProps extends ViewProps {
  velocities: number[]
  expanded?: boolean
  onToggle?: () => void
  onRepPress?: (index: number, velocity: number) => void
  variant?: 'full' | 'mini'
  showInfo?: boolean
  className?: string
}

// Canonical scale shared with SetRow's RPE color (see theme/workout-tokens.ts).
const VEL_COLORS = WORKOUT_TOKENS.scale

export function getVelocityZoneColor(velocity: number): string {
  if (velocity >= 1.0) return 'vel-green'
  if (velocity >= 0.75) return 'vel-yellow'
  if (velocity >= 0.5) return 'vel-orange'
  return 'vel-red'
}

export function getVelocityZoneName(velocity: number): string {
  if (velocity >= 1.0) return 'Speed'
  if (velocity >= 0.75) return 'Power'
  if (velocity >= 0.5) return 'Strength-Speed'
  return 'Strength'
}

export function calculateVelocityLoss(velocities: number[]): number {
  if (velocities.length < 2) return 0
  const first = velocities[0]
  const last = velocities[velocities.length - 1]
  if (first === 0) return 0
  return Math.round(((first - last) / first) * 100)
}

export function calculateMeanVelocity(velocities: number[]): number {
  if (velocities.length === 0) return 0
  const sum = velocities.reduce((acc, v) => acc + v, 0)
  return sum / velocities.length
}

function getBarColor(zone: string): string {
  switch (zone) {
    case 'vel-green': return VEL_COLORS.green
    case 'vel-yellow': return VEL_COLORS.yellow
    case 'vel-orange': return VEL_COLORS.orange
    case 'vel-red': return VEL_COLORS.red
    default: return VEL_COLORS.green
  }
}

const zoneHexMap: Record<string, string> = {
  'vel-green': VEL_COLORS.green,
  'vel-yellow': VEL_COLORS.yellow,
  'vel-orange': VEL_COLORS.orange,
  'vel-red': VEL_COLORS.red,
}

function getLossStyle(loss: number): Record<string, string> | null {
  if (loss > 25) return { color: VEL_COLORS.red }
  if (loss > 20) return { color: VEL_COLORS.orange }
  return null
}

const ANIMATION_DURATION = 400
const ANIMATION_EASING = Easing.bezier(0.22, 1, 0.36, 1)

export function VelocityStrip({
  velocities,
  expanded = false,
  onToggle,
  onRepPress,
  variant = 'full',
  showInfo = true,
  className,
  ...props
}: VelocityStripProps) {
  const maxVelocity = Math.max(...velocities, 0)
  const meanVelocity = calculateMeanVelocity(velocities)
  const loss = calculateVelocityLoss(velocities)
  const meanZone = getVelocityZoneName(meanVelocity)

  const [heightAnim] = useState(() => new Animated.Value(expanded ? 60 : 3))
  const [labelOpacity] = useState(() => new Animated.Value(expanded ? 1 : 0))
  const [infoOpacity] = useState(() => new Animated.Value(expanded ? 1 : 0))

  useEffect(() => {
    if (variant === 'mini') return

    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: expanded ? 60 : 3,
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING,
        useNativeDriver: false,
      }),
      Animated.timing(labelOpacity, {
        toValue: expanded ? 1 : 0,
        duration: 300,
        delay: expanded ? 150 : 0,
        useNativeDriver: false,
      }),
      Animated.timing(infoOpacity, {
        toValue: expanded ? 1 : 0,
        duration: 300,
        delay: expanded ? 200 : 0,
        useNativeDriver: false,
      }),
    ]).start()
  }, [expanded, variant, heightAnim, labelOpacity, infoOpacity])

  if (variant === 'mini') {
    const { style: externalStyle, ...restProps } = props
    return (
      <View
        className={className}
        style={[{ flexDirection: 'row', height: 3, gap: 2, borderRadius: 2, overflow: 'hidden' }, externalStyle]}
        accessibilityRole="image"
        accessibilityLabel={`Velocity strip, ${velocities.length} reps`}
        testID="velocity-strip-mini"
        {...restProps}
      >
        {velocities.map((v, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor: getBarColor(getVelocityZoneColor(v)),
              borderRadius: 1,
              minWidth: 4,
              height: '100%' as unknown as number,
            }}
            accessibilityElementsHidden
            testID={`velocity-bar-${i}`}
          />
        ))}
      </View>
    )
  }

  const stripLabel = `Velocity chart for set, ${velocities.length} reps, tap to ${expanded ? 'collapse' : 'expand'}`
  // When onToggle wraps the strip or individual reps are interactive, the container itself is not a button
  const hasInteractiveContainer = onToggle != null
  const hasInteractiveReps = onRepPress != null && expanded

  const stripContent = (
    <Animated.View
      className={[className, expanded ? 'bg-surface-raised' : 'bg-transparent']
        .filter(Boolean)
        .join(' ')}
      style={[
        {
          height: heightAnim,
          width: '100%',
          gap: 2,
          borderRadius: expanded ? 6 : 2,
          paddingTop: expanded ? 16 : 0,
          paddingBottom: expanded ? 24 : 0,
          paddingHorizontal: expanded ? 6 : 0,
          paddingVertical: expanded ? undefined : 8,
          overflow: expanded ? 'visible' : 'hidden',
        },
      ]}
      accessibilityRole={hasInteractiveContainer || hasInteractiveReps ? 'none' : 'button'}
      accessibilityLabel={hasInteractiveContainer || hasInteractiveReps ? undefined : stripLabel}
      testID="velocity-strip"
      {...props}
    >
      <View
        style={{ flexDirection: 'row', flex: 1, gap: 2, alignItems: 'flex-end' }}
      >
        {velocities.map((v, i) => {
          const zone = getVelocityZoneColor(v)
          // Guard all-zero velocities (idle / pre-rep): maxVelocity === 0 makes
          // this 0 / 0 === NaN and emits height:'NaN%'. Flatten the bars instead.
          const barHeightPct =
            maxVelocity > 0 ? Math.round((v / (maxVelocity * 1.15)) * 100) : 0

          const bar = (
            <View
              key={i}
              style={{ flex: 1, height: '100%', justifyContent: 'flex-end', position: 'relative' }}
            >
              {expanded && (
                <Animated.View style={{ opacity: labelOpacity, alignItems: 'center', position: 'absolute', top: -13, left: 0, right: 0 }} accessibilityElementsHidden>
                  <Text
                    className="text-text-secondary"
                    style={{ fontSize: 8, fontWeight: '600' }}
                    testID={`velocity-label-${i}`}
                  >
                    {formatVelocity(v)}
                  </Text>
                </Animated.View>
              )}
              <View
                style={
                  expanded
                    ? { height: `${barHeightPct}%`, minHeight: 2, borderTopLeftRadius: 2, borderTopRightRadius: 2, backgroundColor: zoneHexMap[zone] }
                    : {
                        minHeight: '100%' as unknown as number,
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                        backgroundColor: zoneHexMap[zone],
                      }
                }
                testID={`velocity-bar-${i}`}
                accessibilityRole="image"
                accessibilityLabel={`Rep ${i + 1}: ${formatVelocity(v)} meters per second`}
              />
            </View>
          )

          if (onRepPress && expanded) {
            return (
              <Pressable
                key={i}
                style={{ flex: 1, height: '100%' }}
                onPress={() => onRepPress(i, v)}
                accessibilityRole="button"
                accessibilityLabel={`Rep ${i + 1}: ${formatVelocity(v)} meters per second, tap for details`}
                testID={`velocity-bar-pressable-${i}`}
              >
                {bar}
              </Pressable>
            )
          }

          return bar
        })}
      </View>
      {expanded && showInfo && (
        <Animated.View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            opacity: infoOpacity,
            position: 'absolute',
            bottom: 4,
            left: 6,
            right: 6,
          }}
          testID="velocity-info-row"
        >
          <Text
            className="text-text-secondary"
            style={{
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {meanZone} {'\u00B7'} {formatVelocity(meanVelocity)} m/s
          </Text>
          <Text
            className="text-text-secondary"
            style={{
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
              ...getLossStyle(loss),
            }}
          >
            Loss: {loss}%
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  )

  if (onToggle) {
    return (
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={stripLabel}
        testID="velocity-strip-pressable"
      >
        {stripContent}
      </Pressable>
    )
  }

  return stripContent
}
