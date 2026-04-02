// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import React, { useState, useCallback } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'

export interface TempoDisplayProps extends ViewProps {
  concentric: number
  hold: number
  eccentric: number
  idle: number
  size?: 'sm' | 'md'
  /** Colored phases or mono (all gray) */
  colored?: boolean
  onPress?: () => void
  className?: string
}

const phaseColors = {
  concentric: '#FF7900',
  hold: '#2196F3',
  eccentric: '#14B8A6',
  idle: '#9CA3AF',
  dash: '#9CA3AF',
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
        fontFamily: '"Nunito Sans", sans-serif',
        fontSize,
        color,
        fontWeight: '600',
        letterSpacing: 2,
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
        fontFamily: '"Nunito Sans", sans-serif',
        fontSize,
        color,
        fontWeight: '600',
        letterSpacing: 2,
      }}
    >
      -
    </Text>
  )
}

export function TempoDisplay({
  concentric,
  hold,
  eccentric,
  idle,
  size = 'md',
  colored = true,
  onPress,
  className,
  ...props
}: TempoDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const isSm = size === 'sm'
  const fontSize = isSm ? 9 : 11
  const monoColor = '#9CA3AF'

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress()
    }
    setShowTooltip((prev) => !prev)
  }, [onPress])

  const content = (
    <View
      className={className}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1C',
        paddingHorizontal: isSm ? 6 : 8,
        paddingVertical: 2,
        borderRadius: 2,
      }}
      {...props}
    >
      <View style={{ flexDirection: 'row' }} testID="tempo-value">
        {colored ? (
          <>
            <TempoValue value={concentric} color={phaseColors.concentric} fontSize={fontSize} />
            <TempoSeparator color={phaseColors.dash} fontSize={fontSize} />
            <TempoValue value={hold} color={phaseColors.hold} fontSize={fontSize} />
            <TempoSeparator color={phaseColors.dash} fontSize={fontSize} />
            <TempoValue value={eccentric} color={phaseColors.eccentric} fontSize={fontSize} />
            <TempoSeparator color={phaseColors.dash} fontSize={fontSize} />
            <TempoValue value={idle} color={phaseColors.idle} fontSize={fontSize} />
          </>
        ) : (
          <Text
            style={{
              fontFamily: '"Nunito Sans", sans-serif',
              fontSize,
              color: monoColor,
              fontWeight: '600',
              letterSpacing: 2,
            }}
          >
            {concentric}-{hold}-{eccentric}-{idle}
          </Text>
        )}
      </View>
    </View>
  )

  return (
    <Pressable
      accessibilityLabel={`Tempo: ${concentric} second concentric, ${hold} second hold, ${eccentric} second eccentric, ${idle} second idle`}
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
            <Text style={{ fontSize: 10, lineHeight: 16, color: '#9CA3AF', fontFamily: '"Nunito Sans", sans-serif' }}>
              Concentric: {concentric}s
            </Text>
            <Text style={{ fontSize: 10, lineHeight: 16, color: '#9CA3AF', fontFamily: '"Nunito Sans", sans-serif' }}>
              Hold: {hold}s
            </Text>
            <Text style={{ fontSize: 10, lineHeight: 16, color: '#9CA3AF', fontFamily: '"Nunito Sans", sans-serif' }}>
              Eccentric: {eccentric}s
            </Text>
            <Text style={{ fontSize: 10, lineHeight: 16, color: '#9CA3AF', fontFamily: '"Nunito Sans", sans-serif' }}>
              Idle: {idle}s
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
