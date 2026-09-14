// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { Pill } from '../../ui/pill'
import { useSurfaceMode } from '../../ui/surface/SurfaceContext'
import { cn } from '../../../utils/cn'
import { volumeStatusDotColor, type VolumeStatus } from './muscleTaxonomy'

// The one status, shared with the BodyMap figure (VW-333). Re-exported so the
// root barrel keeps publishing `VolumeStatus` from where it always has.
export type { VolumeStatus }

export interface MuscleGroupChipProps extends ViewProps {
  name: string
  volumeStatus?: VolumeStatus
  onPress?: () => void
  className?: string
}

/**
 * MuscleGroupChip — a `Pill` preset that labels a muscle group with a
 * volume-status dot. The dot carries the status; the capsule stays neutral.
 *
 * Since VW-333 the dot paints the same `dataviz-diverging-*` scale as the
 * BodyMap figure, so one muscle reads as one colour in both places.
 *
 * @example
 * <MuscleGroupChip name="Quads" volumeStatus="approaching" />
 */
export function MuscleGroupChip({
  name,
  volumeStatus,
  onPress,
  className,
  ...props
}: MuscleGroupChipProps) {
  const statusLabel = volumeStatus ?? 'no status'
  const testID = onPress ? 'muscle-group-chip-pressable' : 'muscle-group-chip'
  // Resolved at render from the nearest Surface, never frozen at module scope.
  const dotColor = volumeStatusDotColor(volumeStatus, useSurfaceMode())

  return (
    <Pill
      tone="neutral"
      variant="subtle"
      size="md"
      // The dot is an explicit node rather than `leading="dot"` because its
      // colour is a dataviz role, not a tone. `Pill`'s own dot would derive the
      // testID; this keeps the same name the parity layer targets.
      leading={
        <View
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
          accessibilityElementsHidden
          testID={`${testID}-dot`}
        />
      }
      onPress={onPress}
      // Borderless, like every other tone: the tinted fill carries the capsule.
      // `md` keeps the chip at its shipped ~24px height with 12px text.
      className={cn('gap-1.5', className)}
      textClassName="font-sans font-medium text-text-secondary"
      accessibilityLabel={`${name}, volume status: ${statusLabel}`}
      testID={testID}
      {...props}
    >
      {name}
    </Pill>
  )
}
