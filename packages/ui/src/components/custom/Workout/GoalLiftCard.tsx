// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useCallback, useState } from 'react'
import { View, type LayoutChangeEvent, type ViewProps } from 'react-native'

import { Card } from '../../ui/card'
import { GoalMilestoneSummary, type GoalMilestoneSummaryProps } from './GoalMilestoneSummary'
import type { GoalMilestoneReading, GoalWeekEntry } from './goalMilestone'
import { Indicator, type IndicatorColor } from '../../ui/indicator'
import { Pill, type PillTone } from '../../ui/pill'
import { useSurfaceMode } from '../../ui/surface'
import { StarIcon } from '../../icons'
import { Typography } from '../Typography'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { Sparkline } from './Sparkline'

/**
 * The seven words the goals read model may say about a target. Mirrors
 * `GoalProgressStatus` in voltras-mcp's `read-models/goal-progress.ts`.
 */
export type GoalLiftStatus =
  | 'on_track'
  | 'ahead'
  | 'behind'
  | 'tolerated'
  | 'deload_week'
  | 'calibrating'
  | 'stalled'

/** One reading placed on the meso's week axis. */
export interface GoalLiftActual {
  /** 1-based meso week. The consumer drops readings that fall outside the meso. */
  weekIndex: number
  value: number
}

/**
 * The next waypoint, structured. Mirrors `GoalMilestone`'s `reps` / `load` /
 * `unit` / `goalWeek` (voltras-mcp #433) — the card never parses the `label`.
 */
export interface GoalLiftMilestone {
  reps: number
  load: number
  unit: 'lb' | 'kg'
  /** The week this milestone is due; also the chart's right edge. */
  goalWeek: number
}

export type GoalLiftCardDensity = 'comfortable' | 'compact'

export interface GoalLiftCardProps extends ViewProps {
  /** Exercise label, e.g. "BENCH PRESS". Wraps rather than truncating. */
  name: string
  status: GoalLiftStatus
  milestone: GoalLiftMilestone
  /** The target's own fixed numbers, never the band's recomputed edges. */
  committed: number
  stretch: number
  /** Readings oldest first; they occupy only the elapsed part of the chart. */
  actuals: GoalLiftActual[]
  /** Whether any reading in this target is a personal record. */
  isPR?: boolean
  /**
   * One entry per week of the block, aligned to week 1 — the outcome cells under
   * the hero. Omitted, every week reads as one with no matched set.
   */
  weeks?: readonly GoalWeekEntry[]
  /** 1-based. Defaults to the last reading's week. */
  currentWeek?: number
  /**
   * The best matched set. Defaults to the last reading's value at the target's
   * own reps, which is what `top_load_at_reps` measures.
   */
  latest?: GoalMilestoneReading
  density?: GoalLiftCardDensity
  /**
   * Force the status affordance's form. Defaults to width-driven: a pill above
   * `STATUS_COLLAPSE_WIDTH`, its light below. Tests set it explicitly because
   * `onLayout` never fires under jsdom.
   */
  statusForm?: 'pill' | 'dot'
  className?: string
}

/** Shared with `GoalMuscleCard` so one vocabulary covers both cards. */
export const GOAL_STATUS_LABEL: Record<GoalLiftStatus, string> = {
  on_track: 'On track',
  ahead: 'Ahead',
  behind: 'Behind',
  tolerated: 'Tolerated',
  deload_week: 'Deload week',
  calibrating: 'Calibrating',
  stalled: 'Stalled',
}

/**
 * `ahead` is info, never warning-amber — that hue is reserved for the pacing
 * tone itself (REJECTED.md, "Amber holds").
 */
export const GOAL_STATUS_TONE: Record<GoalLiftStatus, PillTone & IndicatorColor> = {
  on_track: 'success',
  ahead: 'info',
  tolerated: 'info',
  calibrating: 'info',
  deload_week: 'info',
  behind: 'warning',
  stalled: 'warning',
}

/**
 * Below this content width the status pill collapses to its light, whatever
 * the density. Driving the collapse off density alone left a narrow
 * comfortable cell rendering a full pill, which shoved the title into a wrap.
 * The mark is never absent; only its form changes.
 */
export const STATUS_COLLAPSE_WIDTH = 320

const DENSITY = {
  comfortable: { pad: 'p-inset-lg', gap: 'gap-stack-lg', chartHeight: 56 },
  compact: { pad: 'p-inset-md', gap: 'gap-stack-md', chartHeight: 42 },
} as const

export function goalLiftStatusLabel(status: GoalLiftStatus): string {
  return GOAL_STATUS_LABEL[status]
}

/** A regressing trend paints `result-degrade` rather than `result-improve`. */
function isRegressing(status: GoalLiftStatus): boolean {
  return status === 'behind' || status === 'stalled'
}

function useMeasuredWidth(): [number, (event: LayoutChangeEvent) => void] {
  const [width, setWidth] = useState(0)
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(Math.round(event.nativeEvent.layout.width))
  }, [])
  return [width, onLayout]
}

/**
 * The card's own props as the milestone block reads them: the target is the
 * milestone, the block runs to its due week, and the best set is the last
 * reading at the target's reps — `top_load_at_reps` is a load AT those reps, so
 * the pair is the reading, not an assumption. A caller with the real set passes
 * `latest`.
 */
export function milestoneBlock({
  milestone,
  actuals,
  status,
  weeks,
  currentWeek,
  latest,
}: Pick<
  GoalLiftCardProps,
  'milestone' | 'actuals' | 'status' | 'weeks' | 'currentWeek' | 'latest'
>): GoalMilestoneSummaryProps {
  const last = actuals[actuals.length - 1]
  const reading = latest ?? (last ? { reps: milestone.reps, load: last.value } : undefined)
  return {
    target: {
      metric: 'top_load_at_reps',
      reps: milestone.reps,
      load: milestone.load,
      unit: milestone.unit,
    },
    weekCount: milestone.goalWeek,
    status,
    ...((currentWeek ?? last?.weekIndex) ? { currentWeek: currentWeek ?? last.weekIndex } : {}),
    ...(reading ? { latest: reading } : {}),
    ...(weeks ? { weeks } : {}),
  }
}

function GoalTrend({
  actuals,
  committed,
  stretch,
  goalWeek,
  unit,
  status,
  height,
}: {
  actuals: GoalLiftActual[]
  committed: number
  stretch: number
  goalWeek: number
  unit: string
  status: GoalLiftStatus
  height: number
}) {
  const [width, onLayout] = useMeasuredWidth()
  const mode = useSurfaceMode()
  const t = getSemanticColors(mode)
  const edge = t['text-tertiary']

  // The y range spans the readings AND both targets, so a target above every
  // reading still lands inside the box. The x range runs to the goal week, so
  // the distance left to close reads as distance.
  const values = [...actuals.map((a) => a.value), committed, stretch]
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pad = (hi - lo || 1) * 0.08

  return (
    <View style={{ height }} onLayout={onLayout} testID="goal-lift-card-trend">
      {width > 0 && actuals.length > 0 && (
        <Sparkline
          data={actuals.map((a) => a.value)}
          xValues={actuals.map((a) => a.weekIndex)}
          domain={{ x: [1, Math.max(goalWeek, 1)], y: [lo - pad, hi + pad] }}
          band={{ from: committed, to: stretch }}
          width={width}
          height={height}
          highlightLast
          referenceLabelPlacement="left"
          color={isRegressing(status) ? t['result-degrade'] : t['result-improve']}
          referenceLines={[
            { value: committed, color: edge, dashed: true, label: `${committed}${unit}` },
            { value: stretch, color: edge, dashed: true, label: `${stretch}${unit}` },
          ]}
        />
      )}
    </View>
  )
}

/**
 * A lift's goal state at card scale: the name, its status and PR mark in the top
 * row, the meso target's own block — what is left to the goal, the week/best/goal
 * facts line, the block's week cells — and the trajectory against the
 * committed/stretch band.
 *
 * Maps 1:1 onto one row of the `#/goals` per-lift table. It replaces a
 * full-width row whose label and data sat at opposite edges of the viewport.
 *
 * The hand-rolled `reps x load` hero and its `in week 8` line are gone (VW-385
 * round 4): `GoalMilestoneSummary` says the same thing and says it the same way
 * the folded `PrimaryGoalCard` does.
 *
 * Composes `Card` (one plane above the page), `Pill` / `Indicator`,
 * `GoalMilestoneSummary`, `Typography`, `StarIcon` and `Sparkline`.
 *
 * @example
 * <GoalLiftCard
 *   name="BENCH PRESS"
 *   status="on_track"
 *   milestone={{ reps: 8, load: 105, unit: 'lb', goalWeek: 8 }}
 *   committed={102.5}
 *   stretch={110}
 *   actuals={[{ weekIndex: 1, value: 92.5 }, { weekIndex: 5, value: 100 }]}
 *   isPR
 * />
 */
export function GoalLiftCard({
  name,
  status,
  milestone,
  committed,
  stretch,
  actuals,
  isPR = false,
  weeks,
  currentWeek,
  latest,
  density = 'comfortable',
  statusForm,
  className,
  ...props
}: GoalLiftCardProps) {
  const d = DENSITY[density]
  const brand = getSemanticColors(useSurfaceMode())['brand-primary']
  const [cardWidth, onCardLayout] = useMeasuredWidth()
  const collapsed =
    statusForm !== undefined
      ? statusForm === 'dot'
      : density === 'compact' || (cardWidth > 0 && cardWidth < STATUS_COLLAPSE_WIDTH)

  return (
    <Card
      elevation={1}
      className={className}
      role="article"
      aria-label={`${name} goal, ${GOAL_STATUS_LABEL[status]}`}
      testID="goal-lift-card"
      {...props}
    >
      <View className={`${d.pad} ${d.gap}`} onLayout={onCardLayout}>
        <View className="gap-stack-sm">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
            className="gap-inline-sm"
          >
            {/* No maxLines: a long exercise name breaks to a second line in a
                narrow cell rather than truncating. */}
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              <Typography variant="overline" color="tertiary" testID="goal-lift-card-name">
                {name}
              </Typography>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
              {isPR && (
                <View
                  accessibilityRole="image"
                  accessibilityLabel="Personal record"
                  testID="goal-lift-card-pr"
                >
                  <StarIcon size={12} color={brand} fill={brand} strokeWidth={2} />
                </View>
              )}
              {collapsed ? (
                <Indicator
                  color={GOAL_STATUS_TONE[status]}
                  size="md"
                  // RNW drops `aria-label` on a View with no role, and axe then
                  // flags the bare attribute as prohibited (gotcha #3). The dot
                  // IS the status here, so it needs the name, so it needs a role.
                  accessibilityRole="image"
                  accessibilityLabel={GOAL_STATUS_LABEL[status]}
                  testID="goal-lift-card-status-dot"
                />
              ) : (
                <Pill
                  tone={GOAL_STATUS_TONE[status]}
                  variant="subtle"
                  size="sm"
                  leading="dot"
                  testID="goal-lift-card-status-pill"
                >
                  {GOAL_STATUS_LABEL[status]}
                </Pill>
              )}
            </View>
          </View>

          <GoalMilestoneSummary
            {...milestoneBlock({ milestone, actuals, status, weeks, currentWeek, latest })}
            scale="phone"
          />
        </View>

        <GoalTrend
          actuals={actuals}
          committed={committed}
          stretch={stretch}
          goalWeek={milestone.goalWeek}
          unit={milestone.unit}
          status={status}
          height={d.chartHeight}
        />
      </View>
    </Card>
  )
}
