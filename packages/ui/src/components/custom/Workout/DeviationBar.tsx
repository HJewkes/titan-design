// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps, type ViewStyle } from 'react-native'
import { surfaceGradient } from '../../../theme/gradients'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { greyRamp } from '../../../theme/tokens/primitives'
import { liftStyle } from '../../../theme/lift'
import { useSurfaceMode } from '../../ui/surface'

export interface DeviationBarProps extends ViewProps {
  deviation: number
  width?: number
  className?: string
}

function getDotColor(deviation: number, mode: ThemeMode): string {
  const abs = Math.abs(deviation)
  const t = getSemanticColors(mode)
  if (deviation < -0.3) return t['status-success']
  if (abs <= 0.3) return greyRamp[500]
  if (abs <= 0.7) return t['status-warning']
  return t['status-error']
}

function getDeviationDescription(deviation: number): string {
  if (deviation < -0.3) return 'lighter than planned'
  if (deviation > 0.3) return 'harder than planned'
  return 'on plan'
}

export function DeviationBar({ deviation, width, className, ...props }: DeviationBarProps) {
  const mode = useSurfaceMode()
  const clamped = Math.max(-1, Math.min(1, deviation))
  const resolvedWidth = width ?? 40
  const dotPosition = ((clamped + 1) / 2) * resolvedWidth
  const dotSize = 8
  const trackHeight = 6
  const containerHeight = 10
  const valueNow = Math.round(clamped * 100)

  return (
    <View
      className={className}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: containerHeight,
        width: resolvedWidth,
      }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: -100, max: 100, now: valueNow }}
      accessibilityLabel={`Session deviation: ${getDeviationDescription(clamped)}`}
      testID="deviation-bar"
      aria-valuenow={valueNow}
      aria-valuemin={-100}
      aria-valuemax={100}
      {...props}
    >
      <View
        style={
          {
            height: trackHeight,
            width: resolvedWidth,
            borderRadius: 3,
            // react-native-web renders backgroundImage at runtime; not in RN ViewStyle types
            ...surfaceGradient.deviationTrack(mode),
          } as ViewStyle
        }
      />
      <View
        style={{
          position: 'absolute',
          width: dotSize,
          height: dotSize,
          borderRadius: 9999,
          borderWidth: 1.5,
          borderColor: greyRamp[50],
          // The dot is a knob resting on the track: one plane of lift. Its light
          // ring is already the edge, so the lift contributes the shadow alone.
          ...liftStyle(1, mode, { rim: 0 }),
          backgroundColor: getDotColor(clamped, mode),
          left: Math.max(0, Math.min(dotPosition - dotSize / 2, resolvedWidth - dotSize)),
          top: (containerHeight - dotSize) / 2,
        }}
        testID="deviation-dot"
      />
    </View>
  )
}
