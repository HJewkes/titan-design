// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { cn } from '../../../utils/cn'
import { alpha } from '../../../utils/colors'
import {
  formatMilestoneGapAmount,
  formatMilestoneSet,
  formatMilestoneValue,
} from '../../../utils/workout-format'
import { LIFT_RIM_ALPHA } from '../../../theme/lift'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { Indicator } from '../../ui/indicator'
import { Surface, useSurfaceMode } from '../../ui/surface'
import { Metric } from '../Metric'
import { useMeasuredWidth } from '../Table/column-fit'
import { Typography } from '../Typography'
import type { GoalDirection, GoalTrajectoryStatus } from './GoalTrajectoryChartGeometry'
import { STATUS_TOKEN } from './GoalTrajectoryPlot'
import { GoalMilestoneWeekStrip } from './GoalMilestoneWeekStrip'
import {
  deriveMilestoneState,
  isLoadTarget,
  milestoneGap,
  type GoalMilestoneReading,
  type GoalMilestoneState,
  type GoalMilestoneTarget,
  type GoalWeekEntry,
} from './goalMilestone'

export type GoalMilestoneTileScale = 'wall' | 'phone'
export type GoalMilestoneTileLayout = 'full' | 'compact'

export interface GoalMilestoneTileProps {
  /** The block's committed value, due in its last week. */
  target: GoalMilestoneTarget
  weekCount: number
  /** 1-based; past `weekCount` once the block has ended. */
  currentWeek?: number
  /** The latest matched reading, in the target's shape. */
  latest?: GoalMilestoneReading
  /** `down` for a loss goal. */
  direction?: GoalDirection
  /** Overrides the derived state when the read model already knows it. */
  state?: GoalMilestoneState
  /** The goal's pace; colours the hero while the target is open. */
  status: GoalTrajectoryStatus
  /** One entry per week of the block, aligned to week 1. */
  weeks?: readonly GoalWeekEntry[]
  /** `compact` drops the header; the week cells stay unless `showWeeks` says otherwise. */
  layout?: GoalMilestoneTileLayout
  showWeeks?: boolean
  /** Type scale. Defaults to the measured width: `wall` from `WALL_MIN_WIDTH` up. */
  scale?: GoalMilestoneTileScale
  /** Defaults to a raised card for `full` and the bare plane for `compact`. */
  framed?: boolean
  label?: string
  className?: string
}

/** A tile this wide or wider takes the wall type scale. */
export const WALL_MIN_WIDTH = 420

const SCALE = {
  wall: {
    hero: 'text-[40px] leading-[44px]',
    pad: 'p-inset-lg gap-stack-md',
    cell: 10,
    // `sm`, not `md`: at wall size a 32px metric value fought the 40px hero.
    metric: 'sm' as const,
  },
  phone: { hero: 'text-2xl', pad: 'p-inset-md gap-stack-sm', cell: 8, metric: 'sm' as const },
} as const

type Palette = ReturnType<typeof getSemanticColors>

/** Open takes the pace colour the chart's line uses; hit is success; missed is muted, never red. */
export function milestoneToneToken(state: GoalMilestoneState, status: GoalTrajectoryStatus) {
  if (state === 'hit') return 'status-success' as const
  if (state === 'missed') return 'text-tertiary' as const
  return STATUS_TOKEN[status]
}

function targetText(target: GoalMilestoneTarget): string {
  if (isLoadTarget(target)) return formatMilestoneSet(target.reps, target.load, target.unit)
  return formatMilestoneValue(target.metric, target.value, target.unit)
}

function readingText(target: GoalMilestoneTarget, reading: GoalMilestoneReading): string {
  if (isLoadTarget(target) && 'load' in reading) {
    return formatMilestoneSet(reading.reps, reading.load, target.unit)
  }
  if (!isLoadTarget(target) && 'value' in reading) {
    return formatMilestoneValue(target.metric, reading.value, target.unit)
  }
  return ''
}

interface ResolvedTile {
  props: GoalMilestoneTileProps
  state: GoalMilestoneState
  color: string
  hero: string
  bestText: string | null
  weekText: string | null
}

function gapAmountText(props: GoalMilestoneTileProps): string | null {
  const { target, latest, direction } = props
  const gap = latest ? milestoneGap(target, latest, direction) : null
  if (!gap) return null
  return formatMilestoneGapAmount(
    gap,
    target.unit ?? '',
    isLoadTarget(target) ? undefined : target.metric
  )
}

function resolveTile(props: GoalMilestoneTileProps, t: Palette): ResolvedTile {
  const { target, latest, direction, currentWeek, weekCount } = props
  const met = latest ? milestoneGap(target, latest, direction)?.kind === 'none' : false
  const state = deriveMilestoneState({ state: props.state, met, currentWeek, goalWeek: weekCount })
  const gap = state === 'hit' ? null : gapAmountText(props)
  return {
    props,
    state,
    color: t[milestoneToneToken(state, props.status)],
    hero: gap ?? targetText(target),
    bestText: latest ? readingText(target, latest) : null,
    weekText:
      currentWeek !== undefined && currentWeek <= weekCount
        ? `Week ${currentWeek} of ${weekCount}`
        : `${weekCount} weeks`,
  }
}

function StateMark({ state }: { state: GoalMilestoneState }) {
  if (state === 'upcoming') return null
  const hit = state === 'hit'
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center' }}
      className="gap-inline-sm"
      testID="goal-milestone-state"
    >
      <Indicator color={hit ? 'success' : 'default'} size="md" />
      <Typography variant="overline" color={hit ? 'success' : 'tertiary'}>
        {hit ? 'Hit' : 'Missed'}
      </Typography>
    </View>
  )
}

function Header({ label, state }: { label: string; state: GoalMilestoneState }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      className="gap-inline-md"
    >
      <Typography variant="overline" color="tertiary">
        {label}
      </Typography>
      <StateMark state={state} />
    </View>
  )
}

function Hero({ tile, scale }: { tile: ResolvedTile; scale: GoalMilestoneTileScale }) {
  return (
    // body1 plus the heading face: a heading variant would emit role=heading.
    <Typography
      variant="body1"
      color="inherit"
      className={cn('font-heading font-bold', SCALE[scale].hero)}
      style={{ color: tile.color }}
      maxLines={1}
      testID="goal-milestone-hero"
    >
      {tile.hero}
    </Typography>
  )
}

/** Best and goal, read together, on the hero's line. */
function TargetMetrics({ tile, scale }: { tile: ResolvedTile; scale: GoalMilestoneTileScale }) {
  return (
    <View
      style={{ flexDirection: 'row' }}
      className="gap-inline-lg"
      testID="goal-milestone-metrics"
    >
      <Metric label="BEST" value={tile.bestText ?? '—'} size={SCALE[scale].metric} />
      <Metric label="GOAL" value={targetText(tile.props.target)} size={SCALE[scale].metric} />
    </View>
  )
}

/**
 * The gap leads, with the week count under it, and best and goal sit on the same
 * line to its right. They wrap under the hero when the tile is too narrow.
 */
function HeadRow({ tile, scale }: { tile: ResolvedTile; scale: GoalMilestoneTileScale }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}
      className="gap-inline-lg"
    >
      <View className="gap-stack-sm">
        <Hero tile={tile} scale={scale} />
        <Typography variant="caption" color="tertiary" testID="goal-milestone-week-count">
          {tile.weekText}
        </Typography>
      </View>
      <TargetMetrics tile={tile} scale={scale} />
    </View>
  )
}

function PlaneBody({ tile, scale }: { tile: ResolvedTile; scale: GoalMilestoneTileScale }) {
  const { props } = tile
  const showWeeks = props.showWeeks ?? true
  return (
    <>
      <HeadRow tile={tile} scale={scale} />
      {showWeeks && (
        <GoalMilestoneWeekStrip
          weekCount={props.weekCount}
          currentWeek={props.currentWeek}
          weeks={props.weeks}
          cellHeight={SCALE[scale].cell}
          readingText={(entry) => (entry.reading ? readingText(props.target, entry.reading) : '')}
        />
      )}
    </>
  )
}

/** The plane's bottom lip: the card rim's white, as the chart's inset plane wears it. */
function Plane({ children, pad }: { children: ReactNode; pad: string }) {
  const mode = useSurfaceMode()
  const lip = {
    borderBottomWidth: 1,
    borderBottomColor: alpha(primitiveColors.white, LIFT_RIM_ALPHA[mode]),
  }
  return (
    <Surface pressed className={pad} style={lip} testID="goal-milestone-plane">
      {children}
    </Surface>
  )
}

function accessibleSummary(tile: ResolvedTile): string {
  const goal = targetText(tile.props.target)
  const parts = [`Meso target ${goal}`, tile.weekText]
  if (tile.state !== 'upcoming') parts.push(tile.state === 'hit' ? 'Hit' : 'Missed')
  else parts.push(`${tile.hero} to go`)
  return parts.filter(Boolean).join(', ')
}

/**
 * The goal's meso target — the block's committed value, due in its last week —
 * led by what is still short. The gap leads with the week count beneath it, and
 * best and goal sit on its line; under them the block's weeks are cells on the
 * same `SegmentedBar` atom the rep and set strips use, each with a tip card.
 * The hero's colour is the goal's pace: success once hit, muted once missed.
 *
 * @example
 * <GoalMilestoneTile
 *   target={{ metric: 'top_load_at_reps', reps: 8, load: 105, unit: 'lb' }}
 *   weekCount={6}
 *   currentWeek={4}
 *   latest={{ reps: 8, load: 100 }}
 *   status="on_track"
 *   weeks={[{ outcome: 'on_track', reading: { reps: 8, load: 97.5 } }]}
 * />
 */
export function GoalMilestoneTile(allProps: GoalMilestoneTileProps) {
  const { layout = 'full', framed = layout === 'full', label = 'Meso target', className } = allProps
  const t = getSemanticColors(useSurfaceMode())
  const measured = useMeasuredWidth()
  const scale = allProps.scale ?? ((measured.width ?? 0) >= WALL_MIN_WIDTH ? 'wall' : 'phone')
  const tile = resolveTile(allProps, t)
  const pad = SCALE[scale].pad
  const a11y = { role: 'article' as const, 'aria-label': accessibleSummary(tile) }
  const body = <PlaneBody tile={tile} scale={scale} />
  if (!framed) {
    return (
      <View
        className={className}
        onLayout={measured.onLayout}
        testID="goal-milestone-tile"
        {...a11y}
      >
        <Plane pad={pad}>{body}</Plane>
      </View>
    )
  }
  return (
    <Surface
      raise={1}
      className={cn(pad, className)}
      onLayout={measured.onLayout}
      testID="goal-milestone-tile"
      {...a11y}
    >
      <Header label={label} state={tile.state} />
      <Plane pad={pad}>{body}</Plane>
    </Surface>
  )
}
