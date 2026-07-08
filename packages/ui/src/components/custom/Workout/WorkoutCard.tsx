// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, ScrollView, Pressable, type ViewProps } from 'react-native'
import { Card } from '../../ui/card'
import { ExerciseCard, type ExerciseCardProps } from './ExerciseCard'
import {
  MuscleGroupChip,
  type VolumeStatus,
} from './MuscleGroupChip'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

export type WorkoutStatus = 'completed' | 'today' | 'upcoming'

/** Spec volume-status vocabulary; mapped to MuscleGroupChip's VolumeStatus internally. */
export type WorkoutMuscleVolumeStatus =
  | 'under'
  | 'maintenance'
  | 'productive'
  | 'over'

export interface WorkoutMuscleGroup {
  /** Muscle group identifier (free-form to match plan data). */
  group: string
  /** Display label, may be abbreviated. */
  label: string
  /** Volume status relative to landmarks. */
  volumeStatus?: WorkoutMuscleVolumeStatus
}

export interface WorkoutCardProps extends ViewProps {
  name: string
  date: string
  /** e.g. "45 min" */
  duration?: string
  status: WorkoutStatus
  muscleGroups: WorkoutMuscleGroup[]
  totalSets: number
  /** Total lbs/kg moved across the workout. */
  totalVolume?: number
  unit: 'lbs' | 'kg'
  exercises?: ExerciseCardProps[]
  expanded?: boolean
  onToggle?: () => void
  className?: string
}

const COLORS = {
  statusSuccess: t['status-success'],
  brandPrimary: t['brand-primary'],
  borderDefault: '#1F1F1F',
  brandPrimarySubtle: 'rgba(255,121,0,0.06)',
}

const statusBorderColors: Record<WorkoutStatus, string> = {
  completed: COLORS.statusSuccess,
  today: COLORS.brandPrimary,
  upcoming: COLORS.borderDefault,
}

/** Maps the spec's volume-status vocabulary onto MuscleGroupChip's enum. */
const volumeStatusMap: Record<WorkoutMuscleVolumeStatus, VolumeStatus> = {
  under: 'behind',
  maintenance: 'ontrack',
  productive: 'target',
  over: 'over',
}

function formatStats(
  totalSets: number,
  totalVolume: number | undefined,
  unit: 'lbs' | 'kg',
  duration: string | undefined,
): string {
  const parts = [`${totalSets} sets`]
  if (totalVolume != null) parts.push(`${totalVolume} ${unit}`)
  if (duration) parts.push(duration)
  return parts.join(' · ')
}

/**
 * A workout within a week: name, date, duration, muscle-group pills, and a
 * stats summary. When expandable it renders contained ExerciseCards on expand.
 * Status drives a colored left border, today adds a brand tint, and upcoming
 * is dimmed.
 *
 * @example
 * <WorkoutCard
 *   name="Upper A"
 *   date="Mon, Jun 23"
 *   duration="45 min"
 *   status="today"
 *   muscleGroups={[{ group: 'chest', label: 'Chest', volumeStatus: 'productive' }]}
 *   totalSets={18}
 *   totalVolume={12450}
 *   unit="lbs"
 *   expanded
 *   onToggle={() => {}}
 *   exercises={exercises}
 * />
 */
export function WorkoutCard({
  name,
  date,
  duration,
  status,
  muscleGroups,
  totalSets,
  totalVolume,
  unit,
  exercises,
  expanded = false,
  onToggle,
  className,
  ...props
}: WorkoutCardProps) {
  const isExpandable = onToggle != null
  const isUpcoming = status === 'upcoming'
  const isToday = status === 'today'

  const summary = (
    <View style={{ padding: 14 }} testID="workout-card-body">
      <View className="flex-row items-center" testID="workout-card-header">
        <Text
          className="text-text-primary"
          style={{
            fontSize: 15,
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: '700',
          }}
          testID="workout-card-name"
        >
          {name}
        </Text>
        <View className="flex-1" />
        <Text
          className="text-text-tertiary"
          style={{
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
          }}
          testID="workout-card-date"
        >
          {date}
        </Text>
      </View>

      <Text
        className="text-text-secondary"
        style={{
          marginTop: 4,
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
        }}
        testID="workout-card-stats"
      >
        {formatStats(totalSets, totalVolume, unit, duration)}
      </Text>

      {muscleGroups.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 5 }}
          style={{ marginTop: 8 }}
          testID="workout-card-muscle-groups"
        >
          {muscleGroups.map((muscle) => (
            <MuscleGroupChip
              key={muscle.group}
              name={muscle.label}
              volumeStatus={
                muscle.volumeStatus
                  ? volumeStatusMap[muscle.volumeStatus]
                  : undefined
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  )

  return (
    <Card
      variant="accent"
      elevation={1}
      accentColor={statusBorderColors[status]}
      bgColor={isToday ? COLORS.brandPrimarySubtle : undefined}
      className={className}
      style={isUpcoming ? { opacity: 0.6 } : undefined}
      testID="workout-card"
      {...props}
    >
      {isExpandable ? (
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`${name} workout, ${date}, ${status}`}
          aria-expanded={expanded}
          testID="workout-card-toggle"
        >
          {summary}
        </Pressable>
      ) : (
        <View
          accessibilityLabel={`${name} workout, ${date}, ${status}`}
          testID="workout-card-static"
        >
          {summary}
        </View>
      )}

      {expanded && exercises && exercises.length > 0 && (
        <View
          style={{ paddingHorizontal: 8, paddingBottom: 8, gap: 6 }}
          testID="workout-card-exercises"
        >
          {exercises.map((exercise, i) => (
            <ExerciseCard key={i} {...exercise} />
          ))}
        </View>
      )}
    </Card>
  )
}
