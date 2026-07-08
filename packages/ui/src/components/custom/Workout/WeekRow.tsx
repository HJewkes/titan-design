// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps } from 'react-native'
import { WorkoutPill, type WorkoutPillStatus } from './WorkoutPill'
import { IntensityBar } from './IntensityBar'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const BRAND_PRIMARY = getSemanticColors('dark')['brand-primary']

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
  const rowStyle: Record<string, unknown> = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  }

  if (isDeload) {
    rowStyle.backgroundColor = 'rgba(147,51,234,0.06)'
  }

  if (isCurrent) {
    rowStyle.backgroundColor = 'rgba(255,121,0,0.04)'
    rowStyle.borderLeftWidth = 2
    rowStyle.borderLeftColor = BRAND_PRIMARY
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
              backgroundColor: BRAND_PRIMARY,
            }}
            accessibilityElementsHidden
            testID="week-row-current-dot"
          />
        )}
        <Text
          className={isCurrent ? undefined : 'text-text-primary'}
          style={{
            fontSize: 13,
            fontWeight: '700',
            fontFamily: 'Inter, sans-serif',
            color: isCurrent ? BRAND_PRIMARY : undefined,
          }}
          accessibilityElementsHidden
        >
          {`W${weekNumber}`}
        </Text>
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
