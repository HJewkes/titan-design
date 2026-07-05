// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, Pressable } from 'react-native'
import { resolveColor } from '../../../theme/resolve-color'

const BRAND_PRIMARY = '#FF7900'

export interface RestTimerProps {
  totalSeconds: number
  elapsedMs: number
  onSkip: () => void
  onAddTime: () => void
  nextSetInfo?: string
  visible: boolean
}

export function RestTimer({
  totalSeconds,
  elapsedMs,
  onSkip,
  onAddTime,
  nextSetInfo,
  visible,
}: RestTimerProps) {
  if (!visible) return null

  const remainingMs = Math.max(0, totalSeconds * 1000 - elapsedMs)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(remainingSec / 60)
  const seconds = remainingSec % 60
  const timeDisplay = `${minutes}:${String(seconds).padStart(2, '0')}`
  // A zero-duration timer is already complete; guard the 0 / 0 === NaN case
  // that would otherwise emit width:'NaN%'.
  const totalMs = totalSeconds * 1000
  const progressPct = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 100

  return (
    <View
      className="bg-surface-raised"
      style={{
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: resolveColor('border-default'),
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}
      accessibilityRole="timer"
      accessibilityLabel={`Rest timer, ${remainingSec} seconds remaining`}
      testID="rest-timer"
    >
      {/* Top row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
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
              className="text-text-tertiary"
              style={{
                fontSize: 11,
                fontFamily: 'Inter, sans-serif',
                marginTop: 2,
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

      {/* Progress bar */}
      <View
        className="bg-border"
        style={{
          height: 3,
          borderRadius: 2,
          marginBottom: 12,
        }}
        testID="rest-timer-progress-track"
      >
        <View
          style={{
            height: '100%',
            backgroundColor: BRAND_PRIMARY,
            borderRadius: 2,
            width: `${progressPct}%`,
          }}
          testID="rest-timer-progress-fill"
        />
      </View>

      {/* Actions row */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={onAddTime}
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 8,
          }}
          accessibilityRole="button"
          accessibilityLabel="Add 30 seconds"
          testID="rest-timer-add-time"
        >
          <Text
            className="text-text-secondary"
            style={{
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
            }}
          >
            +30s
          </Text>
        </Pressable>
        <Pressable
          onPress={onSkip}
          style={{
            backgroundColor: 'rgba(255,121,0,0.12)',
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 8,
          }}
          accessibilityRole="button"
          accessibilityLabel="Skip rest"
          testID="rest-timer-skip"
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              color: BRAND_PRIMARY,
            }}
          >
            Skip
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
