// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { VelocityStrip, type VelocityZoneBandProp } from './VelocityStrip'
import { PlaceholderStrip } from './PlaceholderStrip'
import { PrBadge } from './PrBadge'
import { SetRow, type SetRowProps } from './SetRow'
import { type SetStripSet } from './SetStrip'
import { SetTableHeader } from './SetTableHeader'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import { type ExerciseIndicatorKind } from './ExerciseIndicator'
import { roundWeight } from '../../../utils/workout-format'
import { getSemanticColors } from '../../../theme/tokens/semantic'

export interface ExerciseCardProps {
  name: string
  /**
   * The dimmed, not-yet-reached representation (prescription + previous-best line).
   * Overrides the expand state — an upcoming card never expands.
   */
  upcoming?: boolean
  /** Controlled expand state. Omit to run uncontrolled (see {@link defaultExpanded}). */
  expanded?: boolean
  /** Uncontrolled initial expand state. Default false. Ignored when `expanded` is set. */
  defaultExpanded?: boolean
  /** Notified when the user toggles the card between collapsed and expanded. */
  onExpandedChange?: (expanded: boolean) => void
  onNavigateDetail?: () => void
  summary?: {
    sets: number
    reps: number | string
    weight: number
    unit: 'lbs' | 'kg'
  }
  isPR?: boolean
  /** Collapsed glance: per-set logged velocities (drives the mini strips). */
  setVelocities?: number[][]
  /** Optional velocity-zone bands shared across this exercise's sets (WA bands). */
  velocityZones?: readonly VelocityZoneBandProp[]
  /** Collapsed glance: total planned sets (placeholder strips fill the remainder). */
  totalPlannedSets?: number
  /** Expanded body: the per-set rows (done / live / todo). */
  sets?: SetRowProps[]
  tempo?: [number, number, number, number]
  prescription?: string
  previousBest?: string
  supersetPosition?: 'first' | 'last' | 'middle' | null
  supersetColor?: string
  /** Expanded header per-set strip override; derived from `sets` when omitted. */
  setStates?: SetStripSet[]
  /** A small PR / issue / info chip in the title line (expanded header). */
  indicator?: ExerciseIndicatorKind
  /** Expanded header strip height in px. Default 8. */
  stripHeight?: number
}

/** The sub-card render props: everything but the expand-control surface, plus a resolved toggle. */
type CardBodyProps = Omit<
  ExerciseCardProps,
  'upcoming' | 'expanded' | 'defaultExpanded' | 'onExpandedChange'
> & { onToggle: () => void }

function getSupersetBorderRadius(
  position: ExerciseCardProps['supersetPosition']
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
  position: ExerciseCardProps['supersetPosition']
): Record<string, number> {
  if (position === 'first' || position === 'middle') {
    return { marginBottom: 2 }
  }
  return {}
}

function formatSummary(summary: ExerciseCardProps['summary']): string {
  if (!summary) return ''
  return `${summary.sets}×${summary.reps} @ ${roundWeight(summary.weight)} ${summary.unit}`
}

function formatAccessibilityLabel(
  name: string,
  summary: ExerciseCardProps['summary'],
  prescription: ExerciseCardProps['prescription']
): string {
  if (summary) return `${name}, ${formatSummary(summary)}`
  if (prescription) return `${name}, ${prescription}`
  return name
}

function CollapsedCard({
  name,
  onToggle,
  summary,
  isPR,
  setVelocities,
  velocityZones,
  totalPlannedSets,
  supersetPosition,
}: CardBodyProps) {
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
        <View className="flex-row items-center" testID="exercise-card-header">
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
          {isPR && (
            <View style={{ marginLeft: 4 }}>
              <PrBadge type="e1rm" compact animate={false} />
            </View>
          )}
        </View>

        {(completedSets > 0 || remaining > 0) && (
          <View className="flex-row" style={{ marginTop: 6, gap: 4 }} testID="exercise-card-strips">
            {setVelocities?.map((velocities, i) => (
              <VelocityStrip
                key={i}
                velocities={velocities}
                zones={velocityZones}
                variant="compact"
                height={8}
                hideBaseline
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

// --- Unified expanded card ---------------------------------------------------
// The expanded card is "one object" with its rail heading: the persistent header
// is the real ExerciseCardHeading, and the revealed body drops PREV and renders
// one real SetRow per set (muted done/todo, brightened live spotlight).

const DARK = getSemanticColors('dark')
/** The header↔body seam. */
const BODY_DIVIDER = DARK['hairline-subtle']

/** Project the set rows onto the heading strip's per-set state (done / active / todo). */
function deriveHeaderSetStates(sets: SetRowProps[]): SetStripSet[] {
  return sets.map((set): SetStripSet => {
    switch (set.state) {
      case 'live':
        return { status: 'active', velocities: set.velocities, planned: set.target.reps }
      case 'done':
        return { status: 'done', velocities: set.velocities }
      case 'todo':
        return { status: 'todo', planned: set.planned ?? set.target.reps }
    }
  })
}

function ExpandedCard({
  name,
  onToggle,
  summary,
  isPR,
  sets,
  tempo,
  indicator,
  setStates,
  stripHeight = 8,
  velocityZones,
  supersetPosition,
}: CardBodyProps) {
  const borderRadius = getSupersetBorderRadius(supersetPosition)
  const supersetMargin = getSupersetMargin(supersetPosition)
  // Summary is the card-level authority for the weight column; fall back to the
  // first set's unit, then lbs. (Mixed per-set units keep the card-level label.)
  const unit = summary?.unit ?? sets?.[0]?.unit ?? 'lbs'
  // The rail heading IS the header: its per-set strip comes from an explicit
  // `setStates` when supplied, else it's derived from the set rows. e1RM is dropped
  // entirely; a PR surfaces via the chip.
  const headerStates = setStates ?? (sets ? deriveHeaderSetStates(sets) : [])
  const headerIndicator = indicator ?? (isPR ? 'pr' : undefined)

  return (
    <View
      className="bg-surface-elevated border-hairline"
      style={{
        borderWidth: 1,
        ...borderRadius,
        ...supersetMargin,
      }}
      testID="exercise-card"
    >
      <ExerciseCardHeading
        name={name}
        sets={summary?.sets ?? sets?.length ?? 0}
        reps={summary?.reps ?? 0}
        load={summary?.weight ?? 0}
        unit={unit}
        tempo={tempo}
        indicator={headerIndicator}
        setStates={headerStates}
        stripHeight={stripHeight}
        onPress={onToggle}
        testID="exercise-card-heading"
      />

      <View
        style={{ borderTopWidth: 1, borderTopColor: BODY_DIVIDER, paddingBottom: 6 }}
        testID="exercise-card-body"
      >
        <SetTableHeader unit={unit} showPrevious={false} testID="exercise-card-column-headers" />

        {sets && (
          <View testID="exercise-card-sets">
            {sets.map((set, i) => (
              <SetRow key={i} {...set} velocityZones={set.velocityZones ?? velocityZones} />
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

function UpcomingCard({
  name,
  prescription,
  previousBest,
  supersetPosition,
  onToggle,
}: CardBodyProps) {
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

/**
 * The data-contract exercise card, in three representations:
 * - `upcoming` — a dimmed, not-yet-reached row (prescription + previous best).
 * - collapsed — a glance: name + summary + per-set velocity strips.
 * - expanded — the unified card: the real {@link ExerciseCardHeading} header over
 *   the SET · REPS · LBS · RPE body (one {@link SetRow} per set).
 *
 * Expand is controlled (`expanded` + `onExpandedChange`) or uncontrolled
 * (`defaultExpanded`, internal state). `upcoming` overrides expand.
 */
export function ExerciseCard({
  upcoming,
  expanded,
  defaultExpanded,
  onExpandedChange,
  ...rest
}: ExerciseCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded ?? false)
  const isControlled = expanded !== undefined
  const isExpanded = isControlled ? expanded : internalExpanded

  const onToggle = () => {
    const next = !isExpanded
    onExpandedChange?.(next)
    if (!isControlled) setInternalExpanded(next)
  }

  if (upcoming) return <UpcomingCard {...rest} onToggle={onToggle} />
  return isExpanded ? (
    <ExpandedCard {...rest} onToggle={onToggle} />
  ) : (
    <CollapsedCard {...rest} onToggle={onToggle} />
  )
}
