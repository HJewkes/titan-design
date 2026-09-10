// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { type ReactNode } from 'react'
import { View } from 'react-native'
import { VelocityStrip, type VelocityZoneBandProp } from './VelocityStrip'
import { Typography } from '../Typography'
import { roundWeight, roundRpe } from '../../../utils/workout-format'
import { resolveColor } from '../../../theme/resolve-color'

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

/** Live set — brightest. Done + upcoming share the muted role. */
const TEXT_ACTIVE = 'text-primary'
const TEXT_MUTED = 'text-secondary'

/** Column widths mirror SetTableHeader(showPrevious=false) so cells align under it. */
const COL = { set: 36, reps: 44, load: 56, rpe: 36 } as const

// 13px is off the type scale (TOKENS.md §4); `boldLabel` is the 12px font-sans step
// and `font-semibold` holds the original 600 — Inter is `font-sans` here, per B1.
const CELL_CLASS = 'font-semibold leading-[normal]'

// The set-type chip was `WORKOUT_TOKENS.scale.orange` on a hand-mixed
// rgba(255,165,2,0.12). That pin is `sequentialEffort[3]` — the EFFORT scale, borrowed
// for a label that reads set type, not intensity. It resolves to orange-400, which is
// `brand-primary`, so the chip takes the brand role and the `-subtle` rung its 0.12 wash
// was already reaching for. The wash's own base (255,165,2) is off the orange ramp.
const typeBadgeStyle = {
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

/** The per-row velocity strip: the velocity-height `expanded` spotlight for the live set, the flat `compact` strip otherwise. */
function RowStrip({ set }: { set: SetRowProps }) {
  const zones = set.velocityZones
  if (set.state === 'live') {
    // The active-set spotlight: the bare velocity-height `expanded` chart at 24px,
    // fixed scale, no labels / info (both chrome flags off → the bare strip).
    return (
      <VelocityStrip
        variant="expanded"
        showNumbers={false}
        showInfo={false}
        height={24}
        scale="fixed"
        // Grow the newest rep from the baseline as it lands (the live-set spotlight).
        liveRepIndex={set.velocities.length - 1}
        set={{ type: 'straight', velocities: set.velocities, planned: set.target.reps }}
        zones={zones}
      />
    )
  }
  const velocities = set.state === 'done' ? set.velocities : []
  // Resting (done / todo) → the flat `compact` strip at the 8px SegmentedBar flat-bar language (the
  // static compact bar fills its plot), so the resting per-rep strip matches the set-level segmented
  // bars used elsewhere; the live spotlight above stays taller (24px).
  return (
    <VelocityStrip
      variant="compact"
      height={8}
      hideBaseline
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
  const valueColor = resolveColor(live ? TEXT_ACTIVE : TEXT_MUTED)
  const mutedColor = resolveColor(TEXT_MUTED)
  const rpe = set.state === 'todo' ? null : set.rpe

  return (
    <View
      style={{ paddingVertical: 6, paddingHorizontal: 8 }}
      accessibilityLabel={accessibilityLabel(set)}
      testID="set-row"
    >
      <View className="flex-row items-center" style={{ justifyContent: 'space-between' }}>
        <Cell width={COL.set} testID="set-row-set-number">
          {set.setType ? (
            <Typography
              variant="boldLabel"
              color="inherit"
              className="text-2xs leading-[normal]"
              style={{
                ...typeBadgeStyle,
                color: resolveColor('brand-primary'),
                backgroundColor: resolveColor('brand-primary-subtle'),
              }}
              testID="set-row-type-badge"
            >
              {set.setType}
            </Typography>
          ) : (
            <Typography
              variant="boldLabel"
              color="inherit"
              className={live ? 'font-bold leading-[normal]' : CELL_CLASS}
              style={{ color: valueColor }}
            >
              {set.setNumber}
            </Typography>
          )}
        </Cell>
        <Cell width={COL.reps} testID="set-row-reps">
          <Typography
            variant="boldLabel"
            color="inherit"
            className={CELL_CLASS}
            style={{ color: valueColor }}
          >
            {displayReps(set)}
          </Typography>
        </Cell>
        <Cell width={COL.load} testID="set-row-weight">
          <Typography
            variant="boldLabel"
            color="inherit"
            className={CELL_CLASS}
            style={{ color: valueColor }}
          >
            {roundWeight(displayWeight(set))}
          </Typography>
        </Cell>
        <Cell width={COL.rpe} testID="set-row-rpe">
          <Typography
            variant="boldLabel"
            color="inherit"
            className={CELL_CLASS}
            style={{ color: mutedColor }}
          >
            {rpe != null ? roundRpe(rpe) : '—'}
          </Typography>
        </Cell>
      </View>
      <View style={{ marginTop: live ? 6 : 4 }} testID="set-row-strip">
        <RowStrip set={set} />
      </View>
    </View>
  )
}
