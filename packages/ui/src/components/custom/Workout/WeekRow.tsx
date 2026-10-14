// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { IntensityBar } from './IntensityBar'
import { Pill, type PillTone, type PillVariant } from '../../ui/pill'
import { Typography } from '../../ui/typography'
import { resolveColor } from '../../../theme/resolve-color'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { cn } from '../../../utils/cn'
import { useSurfaceMode } from '../../ui/surface'

export interface WeekRowWorkout {
  name: string
  status: 'completed' | 'current' | 'upcoming' | 'deload' | 'next' | 'missed'
  onPress?: () => void
}

type WeekRowWorkoutStatus = WeekRowWorkout['status']

/** Deload has no Pill tone; its pill is painted from `status-deload` below. */
const pillPaint: Record<
  Exclude<WeekRowWorkoutStatus, 'deload'>,
  { tone: PillTone; variant: PillVariant }
> = {
  completed: { tone: 'success', variant: 'subtle' },
  current: { tone: 'brand', variant: 'subtle' },
  next: { tone: 'brand', variant: 'outline' },
  upcoming: { tone: 'neutral', variant: 'outline' },
  missed: { tone: 'error', variant: 'subtle' },
}

const statusGlyph: Partial<Record<WeekRowWorkoutStatus, { glyph: string; testID: string }>> = {
  completed: { glyph: '\u2713', testID: 'workout-pill-check' },
  missed: { glyph: '\u2014', testID: 'workout-pill-dash' },
}

function StatusGlyph({ status }: { status: WeekRowWorkoutStatus }) {
  const mark = statusGlyph[status]
  if (!mark) return null
  return (
    <Typography
      variant="caption"
      color="inherit"
      className="font-semibold leading-[normal] text-inherit"
      accessibilityElementsHidden
      testID={mark.testID}
    >
      {mark.glyph}
    </Typography>
  )
}

/** One workout as a Pill. The label is 12px Nunito, the step `caption` rounds 11px up to. */
function WorkoutStatusPill({ name, status, onPress }: WeekRowWorkout) {
  const deload = getSemanticColors(useSurfaceMode())['status-deload']
  const isDeload = status === 'deload'
  const paint = isDeload
    ? { tone: 'neutral' as const, variant: 'subtle' as const }
    : pillPaint[status]
  return (
    <Pill
      tone={paint.tone}
      variant={paint.variant}
      size="md"
      rounded={false}
      leading={<StatusGlyph status={status} />}
      onPress={onPress}
      className={isDeload ? 'text-status-deload' : undefined}
      style={isDeload ? { backgroundColor: alpha(deload, 0.12) } : undefined}
      textClassName="font-body leading-[normal]"
      accessibilityLabel={`${name} workout, ${status}`}
      testID="workout-pill"
    >
      {name}
    </Pill>
  )
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
  const deload = getSemanticColors(useSurfaceMode())['status-deload']
  const rowStyle: Record<string, unknown> = {}

  if (isDeload) {
    rowStyle.backgroundColor = alpha(deload, 0.06)
  }

  // Current wins over deload: the active week keeps the brand rail and wash.
  if (isCurrent) {
    rowStyle.backgroundColor = resolveColor('brand-primary-subtle')
    rowStyle.borderLeftWidth = 2
    rowStyle.borderLeftColor = brandPrimary
  }

  return (
    <View
      className={cn('flex-row items-center px-inset-md py-2.5 gap-inline-lg', className)}
      style={rowStyle}
      accessibilityLabel={`Week ${weekNumber} of ${totalWeeks}, ${workouts.length} workouts`}
      testID="week-row"
      {...props}
    >
      <View
        className="flex-row items-center gap-inline-sm"
        style={{ width: 32 }}
        testID="week-row-number"
      >
        {!!isCurrent && (
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

      <View className="flex-1 flex-row items-center flex-wrap gap-1.5" testID="week-row-pills">
        {workouts.map((workout, i) => (
          <WorkoutStatusPill
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
