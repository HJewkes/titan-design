// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { type ReactNode } from 'react'
import { View, Text } from 'react-native'
import { VelocityStrip, type VelocityZoneBandProp } from './VelocityStrip'
import { roundWeight, roundRpe } from '../../../utils/workout-format'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'

export type SetRowUnit = 'lbs' | 'kg'

/** A set's lifecycle: logged (`done`), being performed now (`live`), or planned (`todo`). */
export type SetRowState = 'done' | 'live' | 'todo'

interface SetRowBase {
  setNumber: number
  unit: SetRowUnit
  /** Optional set-type marker (e.g. "DROP", "AMRAP") shown in the SET cell. */
  setType?: string
  /** Optional velocity-zone bands (WA `VelocityZones.bands`); default scale when absent. */
  velocityZones?: readonly VelocityZoneBandProp[]
}

/**
 * One row of the unified expanded exercise table (SET · REPS · LBS · RPE + a
 * per-row velocity strip), as a lifecycle discriminated union:
 * - `done` — a logged set: recorded reps / weight / rpe, a flat `mini` strip.
 * - `live` — performed right now: shows its TARGET (never "reps-done/target"),
 *   stands out by brightness, and a compact velocity-HEIGHT spotlight strip.
 * - `todo` — planned: shows its target, muted, a flat grey `mini` stub strip.
 *
 * `done` + `todo` share ONE muted treatment; only `live` is brightened. There is
 * no PREV column (dropped in the unified design).
 */
export type SetRowProps =
  | (SetRowBase & {
      state: 'done'
      reps: number
      weight: number
      rpe?: number | null
      /** Per-rep MEAN concentric velocities (m/s). */
      velocities: number[]
    })
  | (SetRowBase & {
      state: 'live'
      /** The prescribed target shown in the REPS / LBS cells (no live "5/10"). */
      target: { reps: number; weight: number }
      /** Reps / weight committed so far (available to hosts; the display shows `target`). */
      reps: number
      weight: number
      rpe?: number | null
      /** Per-rep MEAN concentric velocities logged so far this set. */
      velocities: number[]
      /** Newest rep index — reserved; the compact spotlight strip is static. */
      liveRepIndex?: number
    })
  | (SetRowBase & {
      state: 'todo'
      /** The prescribed target shown in the REPS / LBS cells. */
      target: { reps: number; weight: number }
      /** Planned rep count backing the grey stub strip. Default `target.reps`. */
      planned?: number
    })

const DARK = getSemanticColors('dark')
/** Live set — brightest (neutral 100). Done + upcoming share the muted neutral 400. */
const TEXT_ACTIVE = DARK['text-primary']
const TEXT_MUTED = DARK['text-secondary']

/** Column widths mirror SetTableHeader(showPrevious=false) so cells align under it. */
const COL = { set: 36, reps: 44, load: 56, rpe: 36 } as const
const cellText = { fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: '600' as const }
const typeBadge = {
  fontSize: 10,
  fontWeight: '700' as const,
  fontFamily: 'Inter, sans-serif',
  color: WORKOUT_TOKENS.scale.orange,
  backgroundColor: 'rgba(255,165,2,0.12)',
  paddingVertical: 1,
  paddingHorizontal: 5,
  borderRadius: 3,
  overflow: 'hidden' as const,
}

/** Reps to show: recorded for a `done` set, else the prescribed target. */
function displayReps(set: SetRowProps): number {
  return set.state === 'done' ? set.reps : set.target.reps
}

function displayWeight(set: SetRowProps): number {
  return set.state === 'done' ? set.weight : set.target.weight
}

/** Planned rep count backing the row's strip. */
function plannedReps(set: SetRowProps): number {
  if (set.state === 'done') return set.velocities.length
  if (set.state === 'live') return set.target.reps
  return set.planned ?? set.target.reps
}

function accessibilityLabel(set: SetRowProps): string {
  const base = `Set ${set.setNumber}: ${displayReps(set)} reps at ${roundWeight(displayWeight(set))} ${set.unit}`
  if (set.state === 'live') return `${base}, in progress`
  if (set.state === 'todo') return `${base}, upcoming`
  return base
}

function Cell({
  width,
  children,
  testID,
}: {
  width: number
  children: ReactNode
  testID?: string
}) {
  return (
    <View style={{ width, alignItems: 'center', justifyContent: 'center' }} testID={testID}>
      {children}
    </View>
  )
}

/** The per-row velocity strip: compact spotlight for the live set, flat mini otherwise. */
function RowStrip({ set }: { set: SetRowProps }) {
  const zones = set.velocityZones
  if (set.state === 'live') {
    return (
      <VelocityStrip
        variant="compact"
        set={{ type: 'straight', velocities: set.velocities, planned: set.target.reps }}
        zones={zones}
      />
    )
  }
  const velocities = set.state === 'done' ? set.velocities : []
  return (
    <VelocityStrip
      variant="mini"
      set={{ type: 'straight', velocities, planned: plannedReps(set) }}
      zones={zones}
    />
  )
}

/**
 * ONE set row of the unified expanded exercise table. SET · REPS · LBS · RPE over
 * a per-row {@link VelocityStrip}; `live` stands out by brightness with a compact
 * velocity-height spotlight, `done`/`todo` are muted with a flat mini strip. Its
 * column widths mirror {@link SetTableHeader}(`showPrevious={false}`).
 */
export function SetRow(set: SetRowProps) {
  const live = set.state === 'live'
  const valueColor = live ? TEXT_ACTIVE : TEXT_MUTED
  const rpe = set.state === 'todo' ? null : set.rpe

  return (
    <View
      style={{ paddingVertical: 6, paddingHorizontal: 8 }}
      accessibilityLabel={accessibilityLabel(set)}
      testID="set-row"
    >
      <View className="flex-row items-center">
        <Cell width={COL.set} testID="set-row-set-number">
          {set.setType ? (
            <Text style={typeBadge} testID="set-row-type-badge">
              {set.setType}
            </Text>
          ) : (
            <Text style={{ ...cellText, color: valueColor, fontWeight: live ? '700' : '600' }}>
              {set.setNumber}
            </Text>
          )}
        </Cell>
        <View className="flex-1" style={{ minWidth: 44 }} />
        <Cell width={COL.reps} testID="set-row-reps">
          <Text style={{ ...cellText, color: valueColor }}>{displayReps(set)}</Text>
        </Cell>
        <Cell width={COL.load} testID="set-row-weight">
          <Text style={{ ...cellText, color: valueColor }}>{roundWeight(displayWeight(set))}</Text>
        </Cell>
        <Cell width={COL.rpe} testID="set-row-rpe">
          <Text style={{ ...cellText, color: TEXT_MUTED }}>
            {rpe != null ? roundRpe(rpe) : '—'}
          </Text>
        </Cell>
      </View>
      <View style={{ marginTop: live ? 6 : 4 }} testID="set-row-strip">
        <RowStrip set={set} />
      </View>
    </View>
  )
}
