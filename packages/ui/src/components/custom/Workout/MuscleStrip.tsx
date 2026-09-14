// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { MuscleGroupChip } from './MuscleGroupChip'
import { MuscleGroup, MUSCLE_DISPLAY_NAMES, type VolumeStatus } from './muscleTaxonomy'

export interface MuscleStripMuscleData {
  /** Completed weekly working sets. */
  sets: number
  /** Weekly set target (e.g. the MAV landmark, or a plan target). */
  target: number
  volumeStatus?: VolumeStatus
}

export interface MuscleStripProps extends ViewProps {
  /** Sets/target/status per muscle group. Every `MuscleGroup` must be present. */
  data: Record<MuscleGroup, MuscleStripMuscleData>
  /** Called with the pressed muscle group's slug. */
  onMusclePress?: (muscle: MuscleGroup) => void
  className?: string
}

/**
 * MuscleStrip — all 15 `MuscleGroupChip`s in one wrapping row, each labeled
 * with its weekly sets against target.
 *
 * Wrap is `flexWrap` via `style` (RNW drops Tailwind flex classNames), so the
 * strip reads as one or two rows depending on the container's width — phone
 * width wraps to several rows, wall width fits one or two. The gap between
 * chips is `gap-inline-md` in `className` — spacing, unlike flex layout,
 * survives as a Tailwind className.
 *
 * @example
 * <MuscleStrip
 *   data={{ [MuscleGroup.CHEST]: { sets: 12, target: 14, volumeStatus: 'ontrack' }, ... }}
 *   onMusclePress={(muscle) => openDetail(muscle)}
 * />
 */
export function MuscleStrip({ data, onMusclePress, className, style, ...props }: MuscleStripProps) {
  return (
    <View
      style={[{ flexDirection: 'row', flexWrap: 'wrap' }, style]}
      className={cn('gap-inline-md', className)}
      testID="muscle-strip"
      {...props}
    >
      {Object.values(MuscleGroup).map((muscle) => {
        const entry = data[muscle]
        return (
          <MuscleGroupChip
            key={muscle}
            name={`${MUSCLE_DISPLAY_NAMES[muscle]} ${entry.sets}/${entry.target}`}
            volumeStatus={entry.volumeStatus}
            onPress={onMusclePress ? () => onMusclePress(muscle) : undefined}
          />
        )
      })}
    </View>
  )
}
