// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState, useCallback } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { roundTempo } from '../../../utils/workout-format'

export interface TempoDisplayProps extends ViewProps {
  /** Tempo values: [eccentric, pauseBottom, concentric, pauseTop] in seconds */
  tempo: [number, number, number, number]
  size?: 'sm' | 'md'
  /** Colored phases or mono (all gray) */
  colored?: boolean
  /** Show info tooltip on press */
  showInfo?: boolean
  onPress?: () => void
  className?: string
}

const INTER = 'Inter, sans-serif'
const TEXT_TERTIARY = '#6B7280'

// Phase colors: [eccentric, pauseBottom, concentric, pauseTop]
const phaseColors = {
  eccentric: '#FFB020', // status-warning (amber)
  pauseBottom: TEXT_TERTIARY,
  concentric: '#14B8A6', // status-success (teal)
  pauseTop: TEXT_TERTIARY,
  dash: TEXT_TERTIARY,
}

function TempoValue({
  value,
  color,
  fontSize,
}: {
  value: number
  color: string
  fontSize: number
}) {
  return (
    <Text
      style={{
        fontFamily: INTER,
        fontSize,
        color,
        fontWeight: '600',
        letterSpacing: 1,
      }}
    >
      {value}
    </Text>
  )
}

function TempoSeparator({ color, fontSize }: { color: string; fontSize: number }) {
  return (
    <Text
      style={{
        fontFamily: INTER,
        fontSize,
        color,
        fontWeight: '600',
        letterSpacing: 1,
      }}
    >
      -
    </Text>
  )
}

export function TempoDisplay({
  tempo,
  size = 'md',
  colored = true,
  showInfo = true,
  onPress,
  className,
  ...props
}: TempoDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  // Round exact (unrounded) tempo seconds to the 1-dp display granularity.
  const [eccentric, pauseBottom, concentric, pauseTop] = roundTempo(tempo)
  const isSm = size === 'sm'
  const fontSize = isSm ? 9 : 11
  const monoColor = TEXT_TERTIARY

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress()
    }
    if (showInfo) {
      setShowTooltip((prev) => !prev)
    }
  }, [onPress, showInfo])

  const content = (
    <View
      className={className}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1C',
        paddingHorizontal: isSm ? 6 : 8,
        paddingVertical: 3,
        borderRadius: 4,
      }}
      {...props}
    >
      <Text
        style={{
          fontFamily: INTER,
          fontSize: 9,
          fontWeight: '500',
          color: TEXT_TERTIARY,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginRight: 6,
        }}
      >
        TEMPO
      </Text>
      <View style={{ flexDirection: 'row' }} testID="tempo-value">
        {colored ? (
          <>
            <TempoValue value={eccentric} color={phaseColors.eccentric} fontSize={fontSize} />
            <TempoSeparator color={phaseColors.dash} fontSize={fontSize} />
            <TempoValue value={pauseBottom} color={phaseColors.pauseBottom} fontSize={fontSize} />
            <TempoSeparator color={phaseColors.dash} fontSize={fontSize} />
            <TempoValue value={concentric} color={phaseColors.concentric} fontSize={fontSize} />
            <TempoSeparator color={phaseColors.dash} fontSize={fontSize} />
            <TempoValue value={pauseTop} color={phaseColors.pauseTop} fontSize={fontSize} />
          </>
        ) : (
          <Text
            style={{
              fontFamily: INTER,
              fontSize,
              color: monoColor,
              fontWeight: '600',
              letterSpacing: 1,
            }}
          >
            {eccentric}-{pauseBottom}-{concentric}-{pauseTop}
          </Text>
        )}
      </View>
    </View>
  )

  return (
    <Pressable
      accessibilityLabel={`Tempo: ${eccentric} second eccentric, ${pauseBottom} second pause, ${concentric} second concentric, ${pauseTop} second pause`}
      accessibilityRole="button"
      onPress={handlePress}
      testID="tempo-display"
    >
      {content}
      {showTooltip && (
        <View
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: [{ translateX: '-50%' as unknown as number }],
            marginBottom: 8,
            zIndex: 20,
            alignItems: 'center',
          }}
          testID="tempo-tooltip"
        >
          <View
            style={{
              backgroundColor: '#191919',
              borderRadius: 6,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: '#2C2C2C',
            }}
          >
            <Text style={{ fontSize: 10, lineHeight: 16, color: '#9CA3AF', fontFamily: INTER }}>
              Eccentric: {eccentric}s
            </Text>
            <Text style={{ fontSize: 10, lineHeight: 16, color: '#9CA3AF', fontFamily: INTER }}>
              Pause (bottom): {pauseBottom}s
            </Text>
            <Text style={{ fontSize: 10, lineHeight: 16, color: '#9CA3AF', fontFamily: INTER }}>
              Concentric: {concentric}s
            </Text>
            <Text style={{ fontSize: 10, lineHeight: 16, color: '#9CA3AF', fontFamily: INTER }}>
              Pause (top): {pauseTop}s
            </Text>
          </View>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 5,
              borderRightWidth: 5,
              borderTopWidth: 5,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: '#2C2C2C',
            }}
          />
        </View>
      )}
    </Pressable>
  )
}
