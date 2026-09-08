// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { type ViewProps } from 'react-native'
import { Pill, type PillTone } from '../../ui/pill'

// Aliases for spec compatibility: under=behind, maintenance=ontrack, productive=target
export type VolumeStatus = 'untrained' | 'behind' | 'ontrack' | 'target' | 'over'

export interface MuscleGroupChipProps extends ViewProps {
  name: string
  volumeStatus?: VolumeStatus
  onPress?: () => void
  className?: string
}

const dotTone: Record<VolumeStatus, PillTone> = {
  untrained: 'neutral',
  behind: 'brand-secondary',
  ontrack: 'success',
  target: 'brand',
  over: 'error',
}

/**
 * MuscleGroupChip — a `Pill` preset that labels a muscle group with a
 * volume-status dot. The dot tone is the pill's tone; the capsule stays neutral.
 */
export function MuscleGroupChip({
  name,
  volumeStatus,
  onPress,
  className,
  ...props
}: MuscleGroupChipProps) {
  const statusLabel = volumeStatus ?? 'no status'

  return (
    <Pill
      tone={volumeStatus ? dotTone[volumeStatus] : 'neutral'}
      variant="outline"
      size="sm"
      leading="dot"
      onPress={onPress}
      className={['bg-surface-raised border-hairline gap-1.5 px-2 py-0.5', className]
        .filter(Boolean)
        .join(' ')}
      textClassName="font-sans font-medium text-text-secondary"
      accessibilityLabel={`${name}, volume status: ${statusLabel}`}
      testID={onPress ? 'muscle-group-chip-pressable' : 'muscle-group-chip'}
      {...props}
    >
      {name}
    </Pill>
  )
}
