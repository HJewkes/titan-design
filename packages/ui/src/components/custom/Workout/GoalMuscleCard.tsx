// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'

import { Card } from '../../ui/card'
import { Indicator } from '../../ui/indicator'
import { Pill } from '../../ui/pill'
import { useSurfaceMode } from '../../ui/surface'
import { Typography } from '../Typography'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { MuscleGlyph } from './MuscleGlyph'
import type { MuscleGroup } from './muscleTaxonomy'
import {
  GOAL_STATUS_LABEL,
  GOAL_STATUS_TONE,
  type GoalLiftCardDensity,
  type GoalLiftStatus,
} from './GoalLiftCard'

/**
 * One lift contributing to a muscle priority.
 *
 * `goalWeek` is this TARGET's own due week, not the meso's current week — two
 * lifts under one muscle can be due in different weeks, which is the only
 * reason a row carries one at all.
 */
export interface GoalMuscleLift {
  name: string
  status: GoalLiftStatus
  reps: number
  load: number
  unit: 'lb' | 'kg'
  goalWeek: number
}

export interface GoalMuscleCardProps extends ViewProps {
  /** Muscle label, e.g. "BACK". */
  name: string
  /** Drives the figure's highlighted slugs via `MUSCLE_TO_SVG_SLUGS`. */
  muscle: MuscleGroup
  /** Which face of the figure shows this muscle. */
  side: 'front' | 'back'
  /** The rollup's own status, not any one lift's. */
  status: GoalLiftStatus
  liftsOnTrack: number
  liftsTotal: number
  /**
   * The week most of this muscle's lifts are due. A row prints its own week
   * only when it differs from this one.
   */
  commonGoalWeek: number
  lifts: GoalMuscleLift[]
  density?: GoalLiftCardDensity
  className?: string
}

const DENSITY = {
  comfortable: { pad: 'p-inset-lg', gap: 'gap-stack-lg' },
  compact: { pad: 'p-inset-md', gap: 'gap-stack-md' },
} as const

/**
 * A contributing lift's text. The week shows ONLY when this lift's goal week
 * differs from the muscle's common one: it is per-target and usually identical,
 * so printing it on every row was noise that read as if it meant something.
 */
export function goalMuscleLiftText(lift: GoalMuscleLift, commonGoalWeek: number): string {
  const base = `${lift.reps} x ${lift.load} ${lift.unit}`
  return lift.goalWeek === commonGoalWeek ? base : `${base} · wk ${lift.goalWeek}`
}

/** A resolved goal-status colour, for the figure's fill. */
function useStatusColor(status: GoalLiftStatus): string {
  const t = getSemanticColors(useSurfaceMode())
  const tone = GOAL_STATUS_TONE[status]
  if (tone === 'success') return t['status-success']
  if (tone === 'warning') return t['status-warning']
  return t['status-info']
}

function LiftRow({ lift, commonGoalWeek }: { lift: GoalMuscleLift; commonGoalWeek: number }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center' }}
      className="gap-inline-sm"
      testID="goal-muscle-card-lift"
    >
      <Indicator
        color={GOAL_STATUS_TONE[lift.status]}
        size="sm"
        accessibilityRole="image"
        accessibilityLabel={GOAL_STATUS_LABEL[lift.status]}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" maxLines={1}>
          {lift.name}
        </Typography>
      </View>
      <Typography variant="caption" color="tertiary" className="text-3xs leading-[normal]">
        {goalMuscleLiftText(lift, commonGoalWeek)}
      </Typography>
    </View>
  )
}

/**
 * A muscle priority's goal state at card scale: the figure with this muscle lit
 * by its status, the lifts-on-track count beneath it as a label, and every
 * contributing lift listed to its right.
 *
 * Maps 1:1 onto one row of the `#/goals` muscle-rollup panel plus the targets
 * under that priority. It is a SIBLING of `GoalLiftCard` rather than a variant
 * of it: the two share only `name` and `status`, so a single component would
 * need every other prop keyed off a discriminator, and this one pulls
 * `react-native-body-highlighter` — which lives behind the `/bodymap` subpath
 * precisely so the root barrel stays free of it.
 *
 * Composes `Card`, `Pill` / `Indicator`, `Typography` and `MuscleGlyph`.
 *
 * @example
 * <GoalMuscleCard
 *   name="BACK"
 *   muscle={MuscleGroup.UPPER_BACK}
 *   side="back"
 *   status="ahead"
 *   liftsOnTrack={3}
 *   liftsTotal={3}
 *   commonGoalWeek={5}
 *   lifts={[{ name: 'Barbell row', status: 'on_track', reps: 10, load: 100, unit: 'lb', goalWeek: 5 }]}
 * />
 */
export function GoalMuscleCard({
  name,
  muscle,
  side,
  status,
  liftsOnTrack,
  liftsTotal,
  commonGoalWeek,
  lifts,
  density = 'comfortable',
  className,
  ...props
}: GoalMuscleCardProps) {
  const d = DENSITY[density]
  const litColor = useStatusColor(status)

  return (
    <Card
      elevation={1}
      className={className}
      role="article"
      aria-label={`${name} goal rollup, ${GOAL_STATUS_LABEL[status]}`}
      testID="goal-muscle-card"
      {...props}
    >
      <View className={`${d.pad} ${d.gap}`}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
          className="gap-inline-sm"
        >
          <View style={{ flexShrink: 1, minWidth: 0 }}>
            <Typography variant="overline" color="tertiary" testID="goal-muscle-card-name">
              {name}
            </Typography>
          </View>
          {density === 'compact' ? (
            <Indicator
              color={GOAL_STATUS_TONE[status]}
              size="md"
              accessibilityRole="image"
              accessibilityLabel={GOAL_STATUS_LABEL[status]}
              testID="goal-muscle-card-status-dot"
            />
          ) : (
            <Pill
              tone={GOAL_STATUS_TONE[status]}
              variant="subtle"
              size="sm"
              leading="dot"
              testID="goal-muscle-card-status-pill"
            >
              {GOAL_STATUS_LABEL[status]}
            </Pill>
          )}
        </View>

        {/* Rows are TOP-aligned against the figure column (locked 2026-09-15).
            Centred left the figure floating mid-card whenever a muscle had one
            contributing lift — see REJECTED.md. */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} className="gap-inline-lg">
          <View
            style={{ alignItems: 'center' }}
            className="gap-stack-sm"
            testID="goal-muscle-card-figure"
          >
            <MuscleGlyph muscle={muscle} side={side} litColor={litColor} />
            {/* A label, not a top-line value. */}
            <Typography variant="caption" color="tertiary" testID="goal-muscle-card-count">
              {`${liftsOnTrack}/${liftsTotal} on track`}
            </Typography>
          </View>

          <View style={{ flex: 1, minWidth: 0 }} className="gap-stack-md">
            {lifts.map((lift) => (
              <LiftRow key={lift.name} lift={lift} commonGoalWeek={commonGoalWeek} />
            ))}
          </View>
        </View>
      </View>
    </Card>
  )
}
