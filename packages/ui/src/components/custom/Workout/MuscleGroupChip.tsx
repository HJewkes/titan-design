// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import React from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'

// Aliases for spec compatibility: under=behind, maintenance=ontrack, productive=target
export type VolumeStatus = 'untrained' | 'behind' | 'ontrack' | 'target' | 'over'

export interface MuscleGroupChipProps extends ViewProps {
  name: string
  volumeStatus?: VolumeStatus
  onPress?: () => void
  className?: string
}

const dotColorMap: Record<VolumeStatus, string> = {
  untrained: '#2C2C2C',
  behind: '#406D87',
  ontrack: '#14B8A6',
  target: '#FF7900',
  over: '#D14343',
}

export function MuscleGroupChip({
  name,
  volumeStatus,
  onPress,
  className,
  ...props
}: MuscleGroupChipProps) {
  const dotColor = volumeStatus
    ? dotColorMap[volumeStatus]
    : '#2C2C2C'

  const statusLabel = volumeStatus ?? 'no status'

  const content = (
    <View
      className={className}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 9999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: '#1C1C1C',
        borderWidth: 1,
        borderColor: '#1F1F1F',
      }}
      accessibilityLabel={onPress ? undefined : `${name}, volume status: ${statusLabel}`}
      testID="muscle-group-chip"
      {...props}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 9999,
          marginRight: 6,
          flexShrink: 0,
          backgroundColor: dotColor,
        }}
        accessibilityElementsHidden
        testID="muscle-group-chip-dot"
      />
      <Text
        style={{
          fontFamily: '"Nunito Sans", sans-serif',
          fontWeight: '500',
          fontSize: 10,
          color: '#9CA3AF',
        }}
        accessibilityElementsHidden
      >
        {name}
      </Text>
    </View>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${name}, volume status: ${statusLabel}`}
        testID="muscle-group-chip-pressable"
      >
        {content}
      </Pressable>
    )
  }

  return content
}
