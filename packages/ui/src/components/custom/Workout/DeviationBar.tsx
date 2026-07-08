// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps, type ViewStyle } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

export interface DeviationBarProps extends ViewProps {
  deviation: number
  width?: number
  className?: string
}

function getDotColor(deviation: number): string {
  const abs = Math.abs(deviation)
  if (deviation < -0.3) return t['status-success']
  if (abs <= 0.3) return '#6B7280'
  if (abs <= 0.7) return t['status-warning']
  return t['status-error']
}

function getDeviationDescription(deviation: number): string {
  if (deviation < -0.3) return 'lighter than planned'
  if (deviation > 0.3) return 'harder than planned'
  return 'on plan'
}

export function DeviationBar({
  deviation,
  width,
  className,
  ...props
}: DeviationBarProps) {
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
      style={{ flexDirection: 'row', alignItems: 'center', height: containerHeight, width: resolvedWidth }}
      accessibilityRole="adjustable"
      accessibilityValue={{ min: -100, max: 100, now: valueNow }}
      accessibilityLabel={`Session deviation: ${getDeviationDescription(clamped)}`}
      testID="deviation-bar"
      aria-valuenow={valueNow}
      aria-valuemin={-100}
      aria-valuemax={100}
      {...props}
    >
      <View
        style={{
          height: trackHeight,
          width: resolvedWidth,
          borderRadius: 3,
          // react-native-web renders backgroundImage at runtime; not in RN ViewStyle types
          backgroundImage:
            'linear-gradient(90deg, rgba(46,213,115,0.25) 0%, rgba(107,114,128,0.15) 50%, rgba(249,180,21,0.25) 100%)',
        } as ViewStyle}
      />
      <View
        style={{
          position: 'absolute',
          width: dotSize,
          height: dotSize,
          borderRadius: 9999,
          borderWidth: 1.5,
          borderColor: '#F3F4F6',
          boxShadow: '0 0 4px rgba(0,0,0,0.5)',
          backgroundColor: getDotColor(clamped),
          left: Math.max(0, Math.min(dotPosition - dotSize / 2, resolvedWidth - dotSize)),
          top: (containerHeight - dotSize) / 2,
        }}
        testID="deviation-dot"
      />
    </View>
  )
}
