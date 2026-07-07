// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

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
  behind: t['brand-secondary'],
  ontrack: t['status-success'],
  target: t['brand-primary'],
  over: t['status-error'],
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
      className={['bg-surface-raised border-border', className].filter(Boolean).join(' ')}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 9999,
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderWidth: 1,
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
          marginRight: 5,
          flexShrink: 0,
          backgroundColor: dotColor,
        }}
        accessibilityElementsHidden
        testID="muscle-group-chip-dot"
      />
      <Text
        className="text-text-secondary"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          fontSize: 11,
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
