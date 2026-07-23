// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { SessionRail, type SessionRailExercise } from './SessionRail'
import type { MetricTileData } from './MetricTiles'

// Same row-divider pin SessionRail uses between exercise rows, reused here between
// the two device columns so the seam reads consistently across the rail family.
const DIVIDER = primitiveColors.charcoal[300] // #2C2C2C

export interface DualSessionRailSlot {
  /** Slot identity (e.g. "Left Arm" / "Right Arm") — rendered as this column's rail title. */
  label: string
  exercises: SessionRailExercise[]
  /** Fractional sets completed for THIS slot only — devices progress independently. */
  setsDone?: number
  /** Live stat tiles (Volume / Load / Fatigue) for THIS slot only. */
  metrics?: MetricTileData[]
}

export interface DualSessionRailProps extends ViewProps {
  /** Exactly two device slots, rendered left-to-right in array order. */
  slots: [DualSessionRailSlot, DualSessionRailSlot]
  /** Shared session clock — both devices run against the same wall-clock timer. */
  elapsedMs?: number
  /** Optional shared time budget in ms. */
  budgetMs?: number
  /** Shared elapsed-readout live state. Default true (live). */
  running?: boolean
  /** When set → both columns render the UPCOMING glance. */
  next?: number | Date
  /** Heading strip height in px, forwarded to each column. Default 8. */
  stripHeight?: number
  /** Per-slot rail width in px. Default 246 (matches {@link SessionRail}). */
  width?: number
  onExercisePress?: (slotIndex: 0 | 1, exercise: SessionRailExercise, index: number) => void
  className?: string
}

/**
 * The dual-Voltra session rail: two independent {@link SessionRail} columns side
 * by side, one per device slot (e.g. "Left Arm" / "Right Arm"), separated by a
 * hairline divider. Each slot owns its OWN exercise list, set progress
 * (`setsDone`), stat tiles, and set markers — only the session clock
 * (`elapsedMs`/`budgetMs`/`running`/`next`) is shared, since both devices run the
 * same wall-clock set. A thin composition, not a new organism: no new set-marker
 * vocabulary is introduced, {@link SetStrip}/{@link SetBar} render exactly as they
 * do in the single-device rail.
 */
export function DualSessionRail({
  slots,
  elapsedMs,
  budgetMs,
  running,
  next,
  stripHeight = 8,
  width = 246,
  onExercisePress,
  className,
  style,
  ...props
}: DualSessionRailProps) {
  return (
    <View
      className={className}
      style={[{ flexDirection: 'row' }, style]}
      testID="dual-session-rail"
      {...props}
    >
      {slots.map((slot, i) => (
        <View
          key={slot.label}
          style={{
            borderRightWidth: i === 0 ? 1 : 0,
            borderRightColor: DIVIDER,
          }}
        >
          <SessionRail
            testID={`dual-session-rail-slot-${i}`}
            title={slot.label}
            exercises={slot.exercises}
            setsDone={slot.setsDone}
            elapsedMs={elapsedMs}
            budgetMs={budgetMs}
            running={running}
            metrics={slot.metrics}
            next={next}
            stripHeight={stripHeight}
            width={width}
            onExercisePress={(exercise, index) => {
              const slotIndex = i as 0 | 1
              onExercisePress?.(slotIndex, exercise, index)
            }}
          />
        </View>
      ))}
    </View>
  )
}
