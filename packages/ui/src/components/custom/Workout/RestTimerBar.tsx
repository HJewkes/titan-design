// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { resolveColor } from '../../../theme/resolve-color'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'

function RestBarReadout({
  timeDisplay,
  nextSetInfo,
}: {
  timeDisplay: string
  nextSetInfo?: string
}) {
  return (
    <View className="flex-row justify-between items-center mb-stack-md">
      {/* Left side */}
      <View style={{ flexDirection: 'column' }}>
        <Text
          className="text-text-secondary"
          style={{
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
          testID="rest-timer-label"
        >
          REST
        </Text>
        {nextSetInfo != null && (
          <Text
            className="text-text-tertiary mt-0.5"
            style={{
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
            }}
            testID="rest-timer-next-set"
          >
            {nextSetInfo}
          </Text>
        )}
      </View>

      {/* Right side - time display */}
      <Text
        className="text-text-primary"
        style={{
          fontSize: 28,
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: '700',
          fontVariant: ['tabular-nums'],
          letterSpacing: -0.5,
        }}
        testID="rest-timer-time"
      >
        {timeDisplay}
      </Text>
    </View>
  )
}

/** The `bar` render: the compact linear card, with the controls passed in as `actions`. */
export function RestTimerBar({
  timeDisplay,
  remainingSec,
  progressPct,
  nextSetInfo,
  actions,
}: {
  timeDisplay: string
  remainingSec: number
  progressPct: number
  nextSetInfo?: string
  actions?: ReactNode
}) {
  const brandPrimary = getSemanticColors(useSurfaceMode())['brand-primary']
  return (
    <View
      className="bg-surface-raised w-full py-inset-md px-gutter-sm"
      style={{
        borderTopWidth: 1,
        borderTopColor: resolveColor('hairline-default'),
      }}
      accessibilityRole="timer"
      accessibilityLabel={`Rest timer, ${remainingSec} seconds remaining`}
      testID="rest-timer"
    >
      <RestBarReadout timeDisplay={timeDisplay} nextSetInfo={nextSetInfo} />

      {/* Progress bar */}
      <View
        className="bg-hairline mb-3"
        style={{
          height: 3,
          borderRadius: 2,
        }}
        testID="rest-timer-progress-track"
      >
        <View
          style={{
            height: '100%',
            backgroundColor: brandPrimary,
            borderRadius: 2,
            width: `${progressPct}%`,
          }}
          testID="rest-timer-progress-fill"
        />
      </View>

      {actions}
    </View>
  )
}
