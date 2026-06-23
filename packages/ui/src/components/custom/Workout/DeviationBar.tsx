// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import React from 'react'
import { View, type ViewProps } from 'react-native'

export interface DeviationBarProps extends ViewProps {
  deviation: number
  width?: number
  className?: string
}

function getDotColor(deviation: number): string {
  const abs = Math.abs(deviation)
  if (deviation < -0.3) return '#14B8A6'
  if (abs <= 0.3) return '#6B7280'
  if (abs <= 0.7) return '#FFB020'
  return '#D14343'
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
  const dotSize = 6
  const trackHeight = 4
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
        style={{ height: trackHeight, backgroundColor: '#333333', width: resolvedWidth, borderRadius: 9999 }}
      />
      <View
        style={{
          position: 'absolute',
          width: dotSize,
          height: dotSize,
          borderRadius: 9999,
          backgroundColor: getDotColor(clamped),
          left: Math.max(0, Math.min(dotPosition - dotSize / 2, resolvedWidth - dotSize)),
          top: (containerHeight - dotSize) / 2,
        }}
        testID="deviation-dot"
      />
    </View>
  )
}
