// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useCallback, useState } from 'react'
import { View, type LayoutChangeEvent, type ViewProps } from 'react-native'

import { Card } from '../../ui/card'
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
  density?: GoalLiftCardDensity
  /**
   * Force the status affordance's form. Defaults to width-driven: a pill above
   * `STATUS_COLLAPSE_WIDTH`, its light below. Tests set it explicitly because
   * `onLayout` never fires under jsdom.
   */
  statusForm?: 'pill' | 'dot'
  className?: string
}

const STATUS_LABEL: Record<GoalLiftStatus, string> = {
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
const STATUS_TONE: Record<GoalLiftStatus, PillTone & IndicatorColor> = {
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
  comfortable: {
    pad: 'p-inset-lg',
    gap: 'gap-stack-lg',
    chartHeight: 56,
    hero: 'font-heading text-2xl font-bold leading-tight',
  },
  compact: {
    pad: 'p-inset-md',
    gap: 'gap-stack-md',
    chartHeight: 42,
    hero: 'font-heading text-xl font-bold leading-tight',
  },
} as const

export function goalLiftStatusLabel(status: GoalLiftStatus): string {
  return STATUS_LABEL[status]
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
 * The PR mark, stacked over the unit with its top on the hero's cap line.
 *
 * Absolutely positioned on purpose: in normal flow it pushes the unit down, and
 * a PR card then sits a line off every non-PR card beside it in a grid row.
 */
function PrMark({ unit, isPR }: { unit: string; isPR: boolean }) {
  const brand = getSemanticColors(useSurfaceMode())['brand-primary']
  return (
    <View style={{ position: 'relative' }}>
      <Typography variant="caption" color="tertiary">
        {unit}
      </Typography>
      {isPR && (
        <View
          accessibilityRole="image"
          accessibilityLabel="Personal record"
          // optical: puts the 10px star's top on the hero's cap line.
          style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', top: -9 }}
          testID="goal-lift-card-pr"
        >
          <StarIcon size={10} color={brand} fill={brand} strokeWidth={2} />
        </View>
      )}
    </View>
  )
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
 * A lift's goal state at card scale: the next milestone as the hero, its status
 * in the upper right, and the trajectory against the committed/stretch band.
 *
 * Maps 1:1 onto one row of the `#/goals` per-lift table. It replaces a
 * full-width row whose label and data sat at opposite edges of the viewport.
 *
 * Composes `Card` (one plane above the page), `Pill` / `Indicator`,
 * `Typography`, `StarIcon` and `Sparkline`.
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
  density = 'comfortable',
  statusForm,
  className,
  ...props
}: GoalLiftCardProps) {
  const d = DENSITY[density]
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
      aria-label={`${name} goal, ${STATUS_LABEL[status]}`}
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
            {collapsed ? (
              <Indicator
                color={STATUS_TONE[status]}
                size="md"
                // RNW drops `aria-label` on a View with no role, and axe then
                // flags the bare attribute as prohibited (gotcha #3). The dot
                // IS the status here, so it needs the name, so it needs a role.
                accessibilityRole="image"
                accessibilityLabel={STATUS_LABEL[status]}
                testID="goal-lift-card-status-dot"
              />
            ) : (
              <Pill
                tone={STATUS_TONE[status]}
                variant="subtle"
                size="sm"
                leading="dot"
                testID="goal-lift-card-status-pill"
              >
                {STATUS_LABEL[status]}
              </Pill>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline' }} className="gap-inline-sm">
            <Typography
              variant="body1"
              className={d.hero}
              maxLines={1}
              testID="goal-lift-card-hero"
            >
              {/* Reps first. `body1` plus the heading face rather than an `h4`:
                  h1-h6 emit accessibilityRole="header", and a milestone number
                  is not a heading. */}
              {`${milestone.reps} x ${milestone.load}`}
            </Typography>
            <PrMark unit={milestone.unit} isPR={isPR} />
          </View>
          <Typography variant="caption" color="tertiary" testID="goal-lift-card-due">
            {`in week ${milestone.goalWeek}`}
          </Typography>
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
