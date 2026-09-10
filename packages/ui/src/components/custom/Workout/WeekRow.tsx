// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { WorkoutPill, type WorkoutPillStatus } from './WorkoutPill'
import { IntensityBar } from './IntensityBar'
import { Typography } from '../Typography'
import { resolveColor } from '../../../theme/resolve-color'
import { WORKOUT_PILL_DELOAD } from '../../../theme/extracted-colors-dataviz'
import { alpha } from '../../../utils/colors'

// Deload magenta has no semantic token — it is a ramp pin shared with WorkoutPill
// (`extracted-colors-dataviz`). The row wash must track the pill exactly, so it
// is derived from the same pin rather than mixed independently. FINDING for E3:
// the deload role needs a `-subtle` token like every other status.
const DELOAD_ROW_WASH = alpha(WORKOUT_PILL_DELOAD, 0.06)

export interface WeekRowWorkout {
  name: string
  status: WorkoutPillStatus
  onPress?: () => void
}

export interface WeekRowProps extends ViewProps {
  /** Week index within the mesocycle (1-based) */
  weekNumber: number
  /** Total weeks in the mesocycle */
  totalWeeks: number
  /** Workouts scheduled for this week */
  workouts: WeekRowWorkout[]
  /** Planned intensity for the week, 0-1 */
  intensityLevel: number
  /** Optional MRV/overexertion threshold, 0-1 */
  intensityThreshold?: number
  /** Highlights this row as the active week */
  isCurrent?: boolean
  /** Renders this row as a deload week (purple tint, deload pills) */
  isDeload?: boolean
  className?: string
}

/**
 * A single week within a mesocycle, showing the week number, its workout pills,
 * and a right-aligned vertical intensity indicator.
 *
 * @example
 * <WeekRow
 *   weekNumber={1}
 *   totalWeeks={4}
 *   workouts={[
 *     { name: 'Upper', status: 'completed' },
 *     { name: 'Lower', status: 'current' },
 *   ]}
 *   intensityLevel={0.55}
 *   intensityThreshold={0.8}
 *   isCurrent
 * />
 */
export function WeekRow({
  weekNumber,
  totalWeeks,
  workouts,
  intensityLevel,
  intensityThreshold,
  isCurrent = false,
  isDeload = false,
  className,
  ...props
}: WeekRowProps) {
  const brandPrimary = resolveColor('brand-primary')
  const rowStyle: Record<string, unknown> = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  }

  if (isDeload) {
    rowStyle.backgroundColor = DELOAD_ROW_WASH
  }

  // Current wins over deload: the active week keeps the brand rail and wash.
  if (isCurrent) {
    rowStyle.backgroundColor = resolveColor('brand-primary-subtle')
    rowStyle.borderLeftWidth = 2
    rowStyle.borderLeftColor = brandPrimary
  }

  return (
    <View
      className={className}
      style={rowStyle}
      accessibilityLabel={`Week ${weekNumber} of ${totalWeeks}, ${workouts.length} workouts`}
      testID="week-row"
      {...props}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', width: 32, gap: 4 }}
        testID="week-row-number"
      >
        {isCurrent && (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: brandPrimary,
            }}
            accessibilityElementsHidden
            testID="week-row-current-dot"
          />
        )}
        {/* `boldLabel` is 12px/700 Inter — the row-label form. The week number was
            13px, which is off the type scale (TOKENS.md §4). */}
        <Typography
          variant="boldLabel"
          color={isCurrent ? 'inherit' : 'primary'}
          className={isCurrent ? 'text-brand-primary' : undefined}
          accessibilityElementsHidden
        >
          {`W${weekNumber}`}
        </Typography>
      </View>

      <View
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}
        testID="week-row-pills"
      >
        {workouts.map((workout, i) => (
          <WorkoutPill
            key={i}
            name={workout.name}
            status={isDeload ? 'deload' : workout.status}
            onPress={workout.onPress}
          />
        ))}
      </View>

      <View testID="week-row-intensity">
        <IntensityBar
          level={intensityLevel}
          threshold={intensityThreshold}
          orientation="vertical"
          size={24}
          thickness={6}
        />
      </View>
    </View>
  )
}
