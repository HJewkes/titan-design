// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * The meso target's own content — hero, facts row, week cells — with no plane
 * and no frame of its own. `GoalMilestoneTile` wraps it in the inset plane for
 * the per-lift slot; `PrimaryGoalCard` folds it straight onto the card above the
 * chart, where the week cells line up with the chart's week columns. One copy of
 * the gap, surplus and outcome maths serves both.
 */
import { useState } from 'react'
import { View } from 'react-native'

import { cn } from '../../../utils/cn'
import type { GoalMilestoneGap } from '../../../utils/workout-format'
import {
  formatMilestoneGapAmount,
  formatMilestoneSet,
  formatMilestoneValue,
} from '../../../utils/workout-format'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { useMeasuredWidth } from '../Table/column-fit'
import { Typography } from '../Typography'
import type { GoalDirection, GoalTrajectoryStatus } from './GoalTrajectoryChartGeometry'
import { STATUS_TOKEN } from './GoalTrajectoryPlot'
import { GoalMilestoneWeekStrip, type GoalMilestoneWeekAxis } from './GoalMilestoneWeekStrip'
import {
  deriveMilestoneState,
  isLoadTarget,
  milestoneGap,
  milestoneReach,
  milestoneSurplus,
  type GoalMilestoneReading,
  type GoalMilestoneState,
  type GoalMilestoneTarget,
  type GoalWeekEntry,
} from './goalMilestone'

export type GoalMilestoneTileScale = 'wall' | 'phone'

export interface GoalMilestoneSummaryProps {
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
  /** Pins the summary row's branch; defaults to the measured fit. */
  summaryFit?: 'row' | 'stacked'
  showWeeks?: boolean
  /**
   * Pins the week cells to a chart's columns. Set by the folded card, where the
   * strip sits directly above the plot and each cell heads its own week column.
   */
  axis?: GoalMilestoneWeekAxis
  /** Type scale. Defaults to the measured width: `wall` from `WALL_MIN_WIDTH` up. */
  scale?: GoalMilestoneTileScale
  className?: string
}

/** A tile this wide or wider takes the wall type scale. */
export const WALL_MIN_WIDTH = 420

export const SCALE = {
  wall: {
    hero: 'text-[40px] leading-[44px]',
    pad: 'p-inset-lg',
    gap: 'gap-stack-md',
    cell: 10,
  },
  phone: { hero: 'text-2xl', pad: 'p-inset-md', gap: 'gap-stack-sm', cell: 8 },
} as const

export type Palette = ReturnType<typeof getSemanticColors>

/**
 * Open takes the pace colour the chart's line uses. Hit is success, or the
 * `ahead` blue when the best set went past the target — clearing a goal and
 * beating it are different results and read as different colours. Missed is
 * muted, never red.
 */
export function milestoneToneToken(
  state: GoalMilestoneState,
  status: GoalTrajectoryStatus,
  beyond = false
) {
  if (state === 'hit') return beyond ? STATUS_TOKEN.ahead : ('status-success' as const)
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

export interface ResolvedTile {
  props: GoalMilestoneSummaryProps
  state: GoalMilestoneState
  color: string
  hero: string
  /** The muted words after the hero figure, when it is a distance rather than a verdict. */
  heroSuffix: string | null
  /** True when the best set went past the target, not merely to it. */
  beyond: boolean
  bestText: string | null
  weekText: string | null
}

function gapAmountText(props: GoalMilestoneSummaryProps): string | null {
  const { target, latest, direction } = props
  const gap = latest ? milestoneGap(target, latest, direction) : null
  if (!gap) return null
  return formatMilestoneGapAmount(
    gap,
    target.unit ?? '',
    isLoadTarget(target) ? undefined : target.metric
  )
}

/** Hit reads as what was cleared; anything open reads as what is left. */
function heroFor(
  state: GoalMilestoneState,
  props: GoalMilestoneSummaryProps,
  gap: string | null
): { hero: string; heroSuffix: string | null; beyond: boolean } {
  if (state !== 'hit') {
    return {
      hero: gap ?? targetText(props.target),
      heroSuffix: gap && state === 'upcoming' ? 'to goal' : null,
      beyond: false,
    }
  }
  const { target, latest, direction } = props
  const beyond = latest ? milestoneReach(target, latest, direction) === 'beyond' : false
  const surplus = beyond && latest ? milestoneSurplus(target, latest, direction) : null
  const over = surplus ? surplusText(props, surplus) : null
  return over
    ? { hero: `+${over}`, heroSuffix: 'beyond goal', beyond: true }
    : { hero: 'Reached goal', heroSuffix: null, beyond: false }
}

function surplusText(props: GoalMilestoneSummaryProps, surplus: GoalMilestoneGap): string | null {
  const { target } = props
  return formatMilestoneGapAmount(
    surplus,
    target.unit ?? '',
    isLoadTarget(target) ? undefined : target.metric
  )
}

export function resolveTile(props: GoalMilestoneSummaryProps, t: Palette): ResolvedTile {
  const { target, latest, direction, currentWeek, weekCount } = props
  const met = latest ? milestoneGap(target, latest, direction)?.kind === 'none' : false
  const state = deriveMilestoneState({ state: props.state, met, currentWeek, goalWeek: weekCount })
  const gap = state === 'hit' ? null : gapAmountText(props)
  const heroParts = heroFor(state, props, gap)
  return {
    props,
    state,
    color: t[milestoneToneToken(state, props.status, heroParts.beyond)],
    ...heroParts,
    bestText: latest ? readingText(target, latest) : null,
    weekText:
      currentWeek !== undefined && currentWeek <= weekCount
        ? `Week ${currentWeek} of ${weekCount}`
        : `${weekCount} weeks`,
  }
}

/**
 * The mark reads the same verdict the hero does: clearing the goal is success
 * green, beating it is the `ahead` blue. A green HIT over a blue hero said two
 * different things about one result (VW-385 round 2).
 */
function Hero({ tile, scale }: { tile: ResolvedTile; scale: GoalMilestoneTileScale }) {
  const suffix = tile.heroSuffix
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
      {suffix && (
        <Typography variant="caption" color="tertiary" className="font-body font-normal">
          {`  ${suffix}`}
        </Typography>
      )}
    </Typography>
  )
}

/** One fact: a muted word and its figure, the figure bold and bright. */
function Fact({
  label,
  value,
  align,
}: {
  label: string
  value: string
  align: 'left' | 'center' | 'right'
}) {
  return (
    <Typography variant="caption" color="tertiary" align={align} maxLines={1}>
      {`${label} `}
      <Typography variant="caption" color="primary" className="font-bold">
        {value}
      </Typography>
    </Typography>
  )
}

/** The week reads as one muted phrase, so it takes no bold figure of its own. */
function WeekFact({ text, testID }: { text: string; testID?: string }) {
  return (
    <Typography variant="caption" color="tertiary" maxLines={1} testID={testID}>
      {text}
    </Typography>
  )
}

/** Week, best, goal — in the order they read: where we are, where we got, where we go. */
function FactItems({
  tile,
  spread,
  measuring = false,
}: {
  tile: ResolvedTile
  spread: boolean
  /** The hidden copy carries no test hooks: one row owns them. */
  measuring?: boolean
}) {
  return (
    <>
      <WeekFact
        text={tile.weekText ?? ''}
        testID={measuring ? undefined : 'goal-milestone-week-count'}
      />
      <Fact label="Best" value={tile.bestText ?? '—'} align={spread ? 'center' : 'left'} />
      <Fact label="Goal" value={targetText(tile.props.target)} align={spread ? 'right' : 'left'} />
    </>
  )
}

/**
 * Week left, best centred, goal right — unless the three cannot share a line at
 * this tile's width, in which case they stack left-aligned rather than wrap
 * mid-phrase. The fit is MEASURED: a hidden copy of the row reports its natural
 * width, and the visible row reports the width it has. `onLayout` never fires
 * under jsdom, so `summaryFit` pins the branch for tests.
 */
function SummaryRow({ tile }: { tile: ResolvedTile }) {
  const [natural, setNatural] = useState<number | null>(null)
  const [available, setAvailable] = useState<number | null>(null)
  const measuredStack = natural !== null && available !== null && natural > available
  const stacked = tile.props.summaryFit ? tile.props.summaryFit === 'stacked' : measuredStack

  return (
    <View onLayout={(e) => setAvailable(e.nativeEvent.layout.width)}>
      <View
        // The measuring copy: laid out unconstrained, never shown, never read.
        style={{ position: 'absolute', opacity: 0, flexDirection: 'row', alignSelf: 'flex-start' }}
        className="gap-inline-lg"
        pointerEvents="none"
        accessibilityElementsHidden
        onLayout={(e) => setNatural(e.nativeEvent.layout.width)}
      >
        <FactItems tile={tile} spread={false} measuring />
      </View>
      <View
        style={
          stacked
            ? undefined
            : { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }
        }
        className={stacked ? 'gap-stack-sm' : 'gap-inline-lg'}
        testID="goal-milestone-facts"
      >
        <FactItems tile={tile} spread={!stacked} />
      </View>
    </View>
  )
}

function SummaryBody({ tile, scale }: { tile: ResolvedTile; scale: GoalMilestoneTileScale }) {
  const { props } = tile
  const showWeeks = props.showWeeks ?? true
  return (
    <>
      <Hero tile={tile} scale={scale} />
      <SummaryRow tile={tile} />
      {showWeeks && (
        <GoalMilestoneWeekStrip
          weekCount={props.weekCount}
          currentWeek={props.currentWeek}
          weeks={props.weeks}
          cellHeight={SCALE[scale].cell}
          {...(props.axis ? { axis: props.axis } : {})}
          readingText={(entry) => (entry.reading ? readingText(props.target, entry.reading) : '')}
        />
      )}
    </>
  )
}

export function accessibleSummary(tile: ResolvedTile): string {
  const goal = targetText(tile.props.target)
  const parts = [`Meso target ${goal}`, tile.weekText]
  if (tile.state !== 'upcoming') parts.push(tile.state === 'hit' ? 'Hit' : 'Missed')
  else parts.push(`${tile.hero} to go`)
  return parts.filter(Boolean).join(', ')
}

/**
 * Hero, facts row and week cells, on whatever plane the caller is already on.
 *
 * @example
 * <GoalMilestoneSummary
 *   target={{ metric: 'top_load_at_reps', reps: 8, load: 105, unit: 'lb' }}
 *   weekCount={6}
 *   currentWeek={4}
 *   latest={{ reps: 8, load: 100 }}
 *   status="on_track"
 * />
 */
export function GoalMilestoneSummary(props: GoalMilestoneSummaryProps) {
  const t = getSemanticColors(useSurfaceMode())
  const measured = useMeasuredWidth()
  const scale = props.scale ?? ((measured.width ?? 0) >= WALL_MIN_WIDTH ? 'wall' : 'phone')
  const tile = resolveTile(props, t)
  return (
    <View
      className={cn(SCALE[scale].gap, props.className)}
      onLayout={measured.onLayout}
      testID="goal-milestone-summary"
    >
      <SummaryBody tile={tile} scale={scale} />
    </View>
  )
}
