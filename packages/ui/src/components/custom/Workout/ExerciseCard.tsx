// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState, type ReactNode } from 'react'
import { View, Text, Pressable } from 'react-native'
import { VelocityStrip, type VelocityZoneBandProp } from './VelocityStrip'
import { PlaceholderStrip } from './PlaceholderStrip'
import { WeightBadge } from './WeightBadge'
import { PrBadge } from './PrBadge'
import { type SetRowProps } from './SetRow'
import { type SetStripSet } from './SetStrip'
import { SetTableHeader } from './SetTableHeader'
import { ExerciseCardHeading } from './ExerciseCardHeading'
import { type ExerciseIndicatorKind } from './ExerciseIndicator'
import { roundWeight, roundRpe } from '../../../utils/workout-format'
import { getSemanticColors } from '../../../theme/tokens/semantic'

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
  return `${summary.sets}\u00D7${summary.reps} @ ${roundWeight(summary.weight)} ${summary.unit}`
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
          <View className="flex-row" style={{ marginTop: 6, gap: 4 }} testID="exercise-card-strips">
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

// --- Unified expanded body ---------------------------------------------------
// The expanded card is "one object" with its rail heading: the persistent header
// is the real ExerciseCardHeading, and the revealed body drops PREV, fades done +
// upcoming sets to ONE muted treatment, and spotlights the ACTIVE set by
// brightness. Every per-row strip is the real VelocityStrip (mini for done/todo,
// the compact velocity-height spotlight for the live set).

const DARK = getSemanticColors('dark')
/** Live set — brightest (neutral 100). Done + upcoming share the muted neutral 400. */
const BODY_TEXT_ACTIVE = DARK['text-primary']
const BODY_TEXT_MUTED = DARK['text-secondary']
/** The header↔body seam. */
const BODY_DIVIDER = DARK['border-subtle']

/** Column widths mirror SetTableHeader(showPrevious=false) / SetRow so cells align. */
const COL = { set: 36, reps: 44, load: 56, rpe: 36 } as const
const bodyText = { fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: '600' as const }

type UnifiedRowState = 'done' | 'live' | 'todo'

function rowStateOf(set: SetRowProps): UnifiedRowState {
  if (set.isLive) return 'live'
  if (set.mode === 'completed') return 'done'
  return 'todo'
}

/** Reps to show: the recorded count for a done set, else the TARGET (no live "5/10"). */
function rowReps(set: SetRowProps): number | string {
  const value = set.mode === 'completed' ? set.reps : (set.targets?.reps ?? set.reps)
  return value ?? '—'
}

function rowWeight(set: SetRowProps): number | string {
  const value = set.mode === 'completed' ? set.weight : (set.targets?.weight ?? set.weight)
  return value != null ? roundWeight(value) : '—'
}

/** Planned rep count backing a row's strip / heading state (target, else recorded). */
function rowPlanned(set: SetRowProps): number {
  return (
    set.targets?.reps ?? (typeof set.reps === 'number' ? set.reps : (set.velocities?.length ?? 0))
  )
}

/** Project the set rows onto the heading strip's per-set state (done / active / todo). */
function deriveHeaderSetStates(sets: SetRowProps[]): SetStripSet[] {
  return sets.map((set): SetStripSet => {
    if (set.isLive)
      return { status: 'active', velocities: set.velocities ?? [], planned: rowPlanned(set) }
    if (set.mode === 'completed') return { status: 'done', velocities: set.velocities ?? [] }
    return { status: 'todo', planned: rowPlanned(set) }
  })
}

function Cell({ width, children }: { width: number; children: ReactNode }) {
  return <View style={{ width, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
}

function RowStrip({
  state,
  velocities,
  planned,
  zones,
}: {
  state: UnifiedRowState
  velocities: number[]
  planned: number
  zones?: readonly VelocityZoneBandProp[]
}) {
  if (state === 'live') {
    return (
      <VelocityStrip
        variant="compact"
        set={{ type: 'straight', velocities, planned }}
        zones={zones}
      />
    )
  }
  const done = state === 'done'
  return (
    <VelocityStrip
      variant="mini"
      set={{
        type: 'straight',
        velocities: done ? velocities : [],
        planned: done ? velocities.length : planned,
      }}
      zones={zones}
    />
  )
}

function UnifiedSetRow({
  set,
  zones,
}: {
  set: SetRowProps
  zones?: readonly VelocityZoneBandProp[]
}) {
  const state = rowStateOf(set)
  const live = state === 'live'
  const valueColor = live ? BODY_TEXT_ACTIVE : BODY_TEXT_MUTED

  return (
    <View style={{ paddingVertical: 6, paddingHorizontal: 8 }} testID="exercise-card-set-row">
      <View className="flex-row items-center">
        <Cell width={COL.set}>
          <Text style={{ ...bodyText, color: valueColor, fontWeight: live ? '700' : '600' }}>
            {set.setNumber}
          </Text>
        </Cell>
        <View className="flex-1" style={{ minWidth: 44 }} />
        <Cell width={COL.reps}>
          <Text style={{ ...bodyText, color: valueColor }}>{rowReps(set)}</Text>
        </Cell>
        <Cell width={COL.load}>
          <Text style={{ ...bodyText, color: valueColor }}>{rowWeight(set)}</Text>
        </Cell>
        <Cell width={COL.rpe}>
          <Text style={{ ...bodyText, color: BODY_TEXT_MUTED }}>
            {set.rpe != null ? roundRpe(set.rpe) : '—'}
          </Text>
        </Cell>
      </View>
      <View style={{ marginTop: live ? 6 : 4 }} testID="exercise-card-set-strip">
        <RowStrip
          state={state}
          velocities={set.velocities ?? []}
          planned={rowPlanned(set)}
          zones={zones}
        />
      </View>
    </View>
  )
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
}: ExerciseCardProps) {
  const borderRadius = getSupersetBorderRadius(supersetPosition)
  const supersetMargin = getSupersetMargin(supersetPosition)
  // Summary is the card-level authority for the weight column; fall back to the
  // first set's unit, then lbs. (Mixed per-set units keep the card-level label.)
  const unit = summary?.unit ?? sets?.[0]?.unit ?? 'lbs'
  // The rail heading IS the header: its per-set strip comes from an explicit
  // `setStates` when supplied, else it's derived from the set rows. e1RM is dropped
  // here (a planning concern, per ExerciseCardHeading); a PR still surfaces via the chip.
  const headerStates = setStates ?? (sets ? deriveHeaderSetStates(sets) : [])
  const headerIndicator = indicator ?? (isPR ? 'pr' : undefined)

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
            {sets.map((setProps, i) => (
              <UnifiedSetRow key={i} set={setProps} zones={velocityZones} />
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
