// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { VelocityStrip, type VelocityZoneBandProp } from './VelocityStrip'
import { PlaceholderStrip } from './PlaceholderStrip'
import { WeightBadge } from './WeightBadge'
import { PrBadge } from './PrBadge'
import { TempoDisplay } from './TempoDisplay'
import { SetRow, type SetRowProps } from './SetRow'
import { type SetStripSet } from './SetStrip'
import { SetTableHeader } from './SetTableHeader'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import { type ExerciseIndicatorKind } from './ExerciseIndicator'
import { roundWeight } from '../../../utils/workout-format'
import { resolveColor } from '../../../theme/resolve-color'

export type ExerciseCardState = 'collapsed' | 'expanded' | 'upcoming' | 'rail'

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
  /** Optional velocity-zone bands shared across this exercise's sets (WA bands). */
  velocityZones?: readonly VelocityZoneBandProp[]
  totalPlannedSets?: number
  sets?: SetRowProps[]
  tempo?: [number, number, number, number]
  prescription?: string
  previousBest?: string
  supersetPosition?: 'first' | 'last' | 'middle' | null
  supersetColor?: string
  /** Rail heading representation (`state="rail"`): per-set performance strip data. */
  setStates?: SetStripSet[]
  /** Rail heading representation: a small PR / issue / info chip in the title line. */
  indicator?: ExerciseIndicatorKind
  /** Rail heading strip height in px. Default 8. */
  stripHeight?: number
  /** Rail heading: dim the row (upcoming exercise). */
  dimmed?: boolean
}

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
  return `${summary.sets}\u00D7${summary.reps} @ ${roundWeight(summary.weight)} ${summary.unit}`
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
  velocityZones,
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
        className={pressed ? 'bg-surface-raised' : undefined}
        style={{
          padding: 12,
          paddingHorizontal: 14,
          cursor: 'pointer',
          ...borderRadius,
          ...supersetMargin,
        }}
      >
        <View
          className="flex-row items-center"
          testID="exercise-card-header"
        >
          <Text
            className="text-text-primary"
            style={{
              fontSize: 14,
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: '700',
            }}
            testID="exercise-card-name"
          >
            {name}
          </Text>
          <View className="flex-1" />
          {summary && (
            <Text
              className="text-text-secondary"
              style={{
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                marginRight: 8,
              }}
              testID="exercise-card-summary"
            >
              {formatSummary(summary)}
            </Text>
          )}
          {e1rm && (
            <WeightBadge
              value={roundWeight(e1rm.value)}
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
                zones={velocityZones}
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
  // Summary is the card-level authority for the weight column; fall back to the
  // first set's unit, then lbs. (Mixed per-set units keep the card-level label.)
  const unit = summary?.unit ?? sets?.[0]?.unit ?? 'lbs'

  return (
    <View
      className="bg-surface-elevated border-border"
      style={{
        borderWidth: 1,
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
            borderBottomColor: resolveColor('border-default'),
          }}
        >
          <Text
            className="text-text-primary"
            style={{
              fontSize: 14,
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: '700',
            }}
            testID="exercise-card-name"
          >
            {name}
          </Text>
          <View className="flex-1" />
          {summary && (
            <Text
              className="text-text-secondary"
              style={{
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                marginRight: 8,
              }}
              testID="exercise-card-summary"
            >
              {formatSummary(summary)}
            </Text>
          )}
          {e1rm && (
            <WeightBadge
              value={roundWeight(e1rm.value)}
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

      <SetTableHeader unit={unit} testID="exercise-card-column-headers" />

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
  onToggle,
}: ExerciseCardProps) {
  const borderRadius = getSupersetBorderRadius(supersetPosition)
  const supersetMargin = getSupersetMargin(supersetPosition)

  return (
    <Pressable onPress={onToggle} accessibilityRole="button">
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
          {/* Name never truncates (no numberOfLines); prescription + previousBest ellipsize first. */}
          <Text
            className="text-text-primary"
            style={{
              flexShrink: 0,
              fontSize: 14,
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: '700',
            }}
            testID="exercise-card-name"
          >
            {name}
          </Text>
          {prescription && (
            <Text
              className="text-text-secondary"
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                marginLeft: 8,
              }}
              testID="exercise-card-prescription"
            >
              {prescription}
            </Text>
          )}
          <View className="flex-1" style={{ minWidth: 8 }} />
          {previousBest && (
            <Text
              className="text-text-tertiary"
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontSize: 11,
                fontFamily: 'Inter, sans-serif',
              }}
              testID="exercise-card-previous-best"
            >
              {previousBest}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  )
}

// The session-rail heading representation. Delegates to the standalone
// ExerciseCardHeading molecule (name + indicator, sets/reps/load beside the real
// TempoDisplay, per-set strip); e1RM is intentionally dropped here (a planning /
// live-panel concern). Kept as a thin adapter so the `rail` state stays a valid
// ExerciseCard variant while the heading itself is independently reusable.
function RailCard({
  name,
  onToggle,
  summary,
  tempo,
  indicator,
  setStates,
  stripHeight = 8,
  dimmed,
}: ExerciseCardProps) {
  return (
    <ExerciseCardHeading
      name={name}
      sets={summary?.sets ?? 0}
      reps={summary?.reps ?? 0}
      load={summary?.weight ?? 0}
      unit={summary?.unit ?? 'lbs'}
      tempo={tempo}
      indicator={indicator}
      setStates={setStates ?? []}
      stripHeight={stripHeight}
      dimmed={dimmed}
      onPress={onToggle}
    />
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
    case 'rail':
      return <RailCard {...props} />
  }
}
