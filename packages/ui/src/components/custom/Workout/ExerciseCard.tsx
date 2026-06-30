// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { VelocityStrip } from './VelocityStrip'
import { PlaceholderStrip } from './PlaceholderStrip'
import { WeightBadge } from './WeightBadge'
import { PrBadge } from './PrBadge'
import { TempoDisplay } from './TempoDisplay'
import { SetRow, type SetRowProps } from './SetRow'

export type ExerciseCardState = 'collapsed' | 'expanded' | 'upcoming'

export interface ExerciseCardProps {
  name: string
  state: ExerciseCardState
  onToggle: () => void
  onNavigateDetail?: () => void
  summary?: {
    sets: number
    reps: number | string
    weight: number
    unit: 'lbs' | 'kg'
  }
  e1rm?: { value: number; unit: 'lbs' | 'kg' }
  isPR?: boolean
  setVelocities?: number[][]
  totalPlannedSets?: number
  sets?: SetRowProps[]
  tempo?: [number, number, number, number]
  prescription?: string
  previousBest?: string
  supersetPosition?: 'first' | 'last' | 'middle' | null
  supersetColor?: string
}

const COLORS = {
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  brandPrimary: '#FF7900',
}

const COLUMN_HEADERS = ['SET', 'PREV', 'REPS', 'LBS', 'RPE'] as const

function getSupersetBorderRadius(
  position: ExerciseCardProps['supersetPosition'],
): Record<string, number> {
  switch (position) {
    case 'first':
      return {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
      }
    case 'last':
      return {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
      }
    case 'middle':
      return {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
      }
    default:
      return {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
      }
  }
}

function getSupersetMargin(
  position: ExerciseCardProps['supersetPosition'],
): Record<string, number> {
  if (position === 'first' || position === 'middle') {
    return { marginBottom: 2 }
  }
  return {}
}

function formatSummary(summary: ExerciseCardProps['summary']): string {
  if (!summary) return ''
  return `${summary.sets}\u00D7${summary.reps} @ ${summary.weight} ${summary.unit}`
}

function formatAccessibilityLabel(
  name: string,
  summary: ExerciseCardProps['summary'],
  prescription: ExerciseCardProps['prescription'],
): string {
  if (summary) return `${name}, ${formatSummary(summary)}`
  if (prescription) return `${name}, ${prescription}`
  return name
}

function CollapsedCard({
  name,
  onToggle,
  summary,
  e1rm,
  isPR,
  setVelocities,
  totalPlannedSets,
  supersetPosition,
}: ExerciseCardProps) {
  const [pressed, setPressed] = useState(false)
  const completedSets = setVelocities?.length ?? 0
  const remaining = Math.max(0, (totalPlannedSets ?? 0) - completedSets)
  const borderRadius = getSupersetBorderRadius(supersetPosition)
  const supersetMargin = getSupersetMargin(supersetPosition)

  return (
    <Pressable
      onPress={onToggle}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={formatAccessibilityLabel(name, summary, undefined)}
      testID="exercise-card"
    >
      <View
        style={{
          padding: 12,
          paddingHorizontal: 14,
          cursor: 'pointer',
          backgroundColor: pressed
            ? WORKOUT_TOKENS.surface.raised
            : 'transparent',
          ...borderRadius,
          ...supersetMargin,
        }}
      >
        <View
          className="flex-row items-center"
          testID="exercise-card-header"
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: '700',
              color: COLORS.textPrimary,
            }}
            testID="exercise-card-name"
          >
            {name}
          </Text>
          <View className="flex-1" />
          {summary && (
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                color: COLORS.textSecondary,
                marginRight: 8,
              }}
              testID="exercise-card-summary"
            >
              {formatSummary(summary)}
            </Text>
          )}
          {e1rm && (
            <WeightBadge
              value={e1rm.value}
              unit={e1rm.unit}
              size="sm"
              showIcon={false}
              testID="exercise-card-e1rm"
            />
          )}
          {isPR && (
            <View style={{ marginLeft: 4 }}>
              <PrBadge type="e1rm" compact animate={false} />
            </View>
          )}
        </View>

        {(completedSets > 0 || remaining > 0) && (
          <View
            className="flex-row"
            style={{ marginTop: 6, gap: 4 }}
            testID="exercise-card-strips"
          >
            {setVelocities?.map((velocities, i) => (
              <VelocityStrip
                key={i}
                velocities={velocities}
                variant="mini"
                testID={`exercise-card-velocity-strip-${i}`}
              />
            ))}
            {Array.from({ length: remaining }, (_, i) => (
              <PlaceholderStrip
                key={`placeholder-${i}`}
                testID={`exercise-card-placeholder-${i}`}
              />
            ))}
          </View>
        )}
      </View>
    </Pressable>
  )
}

function ExpandedCard({
  name,
  onToggle,
  summary,
  e1rm,
  isPR,
  sets,
  tempo,
  supersetPosition,
}: ExerciseCardProps) {
  const borderRadius = getSupersetBorderRadius(supersetPosition)
  const supersetMargin = getSupersetMargin(supersetPosition)

  return (
    <View
      style={{
        backgroundColor: WORKOUT_TOKENS.surface.elevated,
        borderWidth: 1,
        borderColor: WORKOUT_TOKENS.border.default,
        ...borderRadius,
        ...supersetMargin,
      }}
      testID="exercise-card"
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={formatAccessibilityLabel(name, summary, undefined)}
        aria-expanded={true}
        testID="exercise-card-header"
      >
        <View
          className="flex-row items-center"
          style={{
            padding: 12,
            paddingHorizontal: 14,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: WORKOUT_TOKENS.border.default,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: '700',
              color: COLORS.textPrimary,
            }}
            testID="exercise-card-name"
          >
            {name}
          </Text>
          <View className="flex-1" />
          {summary && (
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                color: COLORS.textSecondary,
                marginRight: 8,
              }}
              testID="exercise-card-summary"
            >
              {formatSummary(summary)}
            </Text>
          )}
          {e1rm && (
            <WeightBadge
              value={e1rm.value}
              unit={e1rm.unit}
              size="sm"
              showIcon={false}
              testID="exercise-card-e1rm"
            />
          )}
          {isPR && (
            <View style={{ marginLeft: 4 }}>
              <PrBadge type="e1rm" compact animate={false} />
            </View>
          )}
        </View>
      </Pressable>

      {tempo && (
        <View style={{ marginTop: 8, paddingHorizontal: 14 }} testID="exercise-card-tempo">
          <TempoDisplay tempo={tempo} size="sm" />
        </View>
      )}

      <View
        className="flex-row"
        style={{
          paddingVertical: 8,
          paddingHorizontal: 8,
          paddingBottom: 4,
        }}
        testID="exercise-card-column-headers"
      >
        {COLUMN_HEADERS.map((header, i) => {
          const widths = [36, undefined, 44, 56, 36]
          const width = widths[i]
          const isFlex = width === undefined

          return (
            <View
              key={header}
              style={{
                ...(isFlex ? {} : { width }),
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              {...(isFlex ? { className: 'flex-1' } : {})}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  color: COLORS.textTertiary,
                }}
              >
                {header}
              </Text>
            </View>
          )
        })}
      </View>

      {sets && (
        <View testID="exercise-card-sets">
          {sets.map((setProps, i) => (
            <SetRow key={i} {...setProps} />
          ))}
        </View>
      )}
    </View>
  )
}

function UpcomingCard({
  name,
  prescription,
  previousBest,
  supersetPosition,
}: ExerciseCardProps) {
  const borderRadius = getSupersetBorderRadius(supersetPosition)
  const supersetMargin = getSupersetMargin(supersetPosition)

  return (
    <View
      style={{
        opacity: 0.6,
        padding: 12,
        paddingHorizontal: 14,
        ...borderRadius,
        ...supersetMargin,
      }}
      accessibilityLabel={formatAccessibilityLabel(name, undefined, prescription)}
      testID="exercise-card"
    >
      <View className="flex-row items-center">
        <Text
          style={{
            fontSize: 14,
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: '700',
            color: COLORS.textPrimary,
          }}
          testID="exercise-card-name"
        >
          {name}
        </Text>
        {prescription && (
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Inter, sans-serif',
              color: COLORS.textSecondary,
              marginLeft: 8,
            }}
            testID="exercise-card-prescription"
          >
            {prescription}
          </Text>
        )}
        <View className="flex-1" />
        {previousBest && (
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              color: COLORS.textTertiary,
            }}
            testID="exercise-card-previous-best"
          >
            {previousBest}
          </Text>
        )}
      </View>
    </View>
  )
}

export function ExerciseCard(props: ExerciseCardProps) {
  switch (props.state) {
    case 'collapsed':
      return <CollapsedCard {...props} />
    case 'expanded':
      return <ExpandedCard {...props} />
    case 'upcoming':
      return <UpcomingCard {...props} />
  }
}
