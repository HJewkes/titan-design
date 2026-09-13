// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View } from 'react-native'
import { type VelocityZoneBandProp } from './VelocityStrip'
import { SetRow, type SetRowProps } from './SetRow'
import { type SetStripSet } from './SetStrip'
import { SetTableHeader } from './SetTableHeader'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import { type ExerciseIndicatorKind } from './ExerciseIndicator'
import { resolveColor } from '../../../theme/resolve-color'

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
  /**
   * Collapsed glance: per-set logged velocities. Projected onto `setStates` for the
   * row's `SetStrip` — pass `setStates` directly for anything richer than done/todo.
   */
  setVelocities?: number[][]
  /** Velocity-zone bands shared across this exercise's sets (WA bands). Expanded body only. */
  velocityZones?: readonly VelocityZoneBandProp[]
  /** Collapsed glance: total planned sets (todo bars fill the remainder). */
  totalPlannedSets?: number
  /** The row the user has chosen — a persistent wash on the collapsed / upcoming row. */
  isSelected?: boolean
  /** This exercise is being performed right now — the name takes the live tone. */
  isLive?: boolean
  /** Expanded body: the per-set rows (done / live / todo). */
  sets?: SetRowProps[]
  tempo?: [number, number, number, number]
  prescription?: string
  previousBest?: string
  supersetPosition?: 'first' | 'last' | 'middle' | null
  supersetColor?: string
  /**
   * Per-set strip override for the collapsed and expanded rows; derived from
   * `setVelocities` (collapsed) or `sets` (expanded) when omitted.
   */
  setStates?: SetStripSet[]
  /** A small PR / issue / info chip in the title line. */
  indicator?: ExerciseIndicatorKind
  /** Row strip height in px. Default 8. */
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

/** The chrome a card wraps its row in: superset corner radii + the inter-card margin. */
function supersetChrome(position: ExerciseCardProps['supersetPosition']): Record<string, number> {
  return { ...getSupersetBorderRadius(position), ...getSupersetMargin(position) }
}

/** Project the collapsed glance's velocities + planned total onto the strip's per-set states. */
function deriveCollapsedSetStates(
  setVelocities: number[][] | undefined,
  totalPlannedSets: number | undefined,
  plannedReps: number
): SetStripSet[] {
  const done = (setVelocities ?? []).map(
    (velocities): SetStripSet => ({ status: 'done', velocities })
  )
  const remaining = Math.max(0, (totalPlannedSets ?? 0) - done.length)
  return [
    ...done,
    ...Array.from(
      { length: remaining },
      (): SetStripSet => ({ status: 'todo', planned: plannedReps })
    ),
  ]
}

function CollapsedCard({
  name,
  onToggle,
  summary,
  isPR,
  indicator,
  setVelocities,
  setStates,
  totalPlannedSets,
  stripHeight,
  supersetPosition,
  isSelected,
  isLive,
}: CardBodyProps) {
  const plannedReps = typeof summary?.reps === 'number' ? summary.reps : 0
  const row = {
    density: 'compact' as const,
    name,
    indicator: indicator ?? (isPR ? ('pr' as const) : undefined),
    setStates: setStates ?? deriveCollapsedSetStates(setVelocities, totalPlannedSets, plannedReps),
    stripHeight,
    isSelected,
    isLive,
    onPress: onToggle,
    style: supersetChrome(supersetPosition),
  }

  // Two call shapes, not a conditional spread: the prescription union only narrows
  // when every field of a member is present at the call site.
  return summary ? (
    <ExerciseCardHeading
      {...row}
      sets={summary.sets}
      reps={summary.reps}
      load={summary.weight}
      unit={summary.unit}
    />
  ) : (
    <ExerciseCardHeading {...row} />
  )
}

// --- Unified expanded card ---------------------------------------------------
// The expanded card is "one object" with its rail heading: the persistent header
// is the real ExerciseCardHeading, and the revealed body drops PREV and renders
// one real SetRow per set (muted done/todo, brightened live spotlight).

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
  isLive,
}: CardBodyProps) {
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
      style={{ borderWidth: 1, ...supersetChrome(supersetPosition) }}
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
        isLive={isLive}
        onPress={onToggle}
        testID="exercise-card-heading"
      />

      {/* The header↔body seam. */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: resolveColor('hairline-subtle'),
          paddingBottom: 6,
        }}
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
  indicator,
  supersetPosition,
  isSelected,
  onToggle,
}: CardBodyProps) {
  const row = {
    density: 'upcoming' as const,
    name,
    previousBest,
    indicator,
    isSelected,
    onPress: onToggle,
    style: supersetChrome(supersetPosition),
  }

  return prescription !== undefined ? (
    <ExerciseCardHeading {...row} prescription={prescription} />
  ) : (
    <ExerciseCardHeading {...row} />
  )
}

/**
 * The data-contract exercise card, in three representations — all three now ONE
 * {@link ExerciseCardHeading}, selected by its `density`, rather than three hand-rolled
 * heads:
 * - `upcoming` — a dimmed, not-yet-reached row (`density="upcoming"`).
 * - collapsed — a glance: name + prescription + the per-set strip (`density="compact"`).
 * - expanded — the `rail` heading over the SET · REPS · LBS · RPE body (one
 *   {@link SetRow} per set).
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
