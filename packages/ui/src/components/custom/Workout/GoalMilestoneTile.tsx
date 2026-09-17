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
import { useMeasuredWidth } from '../Table/column-fit'
import { Typography } from '../Typography'
import type { GoalDirection, GoalTrajectoryStatus } from './GoalTrajectoryChartGeometry'
import { STATUS_TOKEN } from './GoalTrajectoryPlot'
import { GoalMilestoneWeekStrip, type GoalWeekOutcomeStyle } from './GoalMilestoneWeekStrip'
import {
  deriveMilestoneState,
  isLoadTarget,
  milestoneGap,
  milestoneProgress,
  type GoalMilestoneReading,
  type GoalMilestoneState,
  type GoalMilestoneTarget,
  type GoalWeekOutcome,
} from './goalMilestone'

export type GoalMilestoneTileScale = 'wall' | 'phone'
export type GoalMilestoneTileLayout = 'full' | 'compact'

export interface GoalMilestoneTileProps {
  /** The block's committed value. */
  target: GoalMilestoneTarget
  /** The block's last week, when the target is due. */
  goalWeek: number
  weekCount: number
  /** 1-based; past `goalWeek` once the block has ended. */
  currentWeek?: number
  /** The latest matched reading, in the target's shape. */
  latest?: GoalMilestoneReading
  /** The block-start value or the first matched reading; the bar measures from here. */
  start?: GoalMilestoneReading
  /** `down` for a loss goal. */
  direction?: GoalDirection
  /** Overrides the derived state when the read model already knows it. */
  state?: GoalMilestoneState
  /** The goal's pace; colours the hero and bar while the target is open. */
  status: GoalTrajectoryStatus
  /** One verdict per week of the block, aligned to week 1. */
  weekOutcomes?: readonly GoalWeekOutcome[]
  outcomeStyle?: GoalWeekOutcomeStyle
  /** `compact` is hero, one line and the bar, for the per-lift card slot. */
  layout?: GoalMilestoneTileLayout
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
    line: 'text-lg',
    pad: 'p-inset-lg gap-stack-md',
    cell: 8,
  },
  phone: { hero: 'text-2xl', line: 'text-base', pad: 'p-inset-md gap-stack-sm', cell: 6 },
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
  line: string
  gapText: string | null
}

function gapAmountText(props: GoalMilestoneTileProps): string | null {
  const { target, latest, direction } = props
  const gap = latest ? milestoneGap(target, latest, direction) : null
  if (!gap) return null
  const unit = target.unit ?? ''
  return formatMilestoneGapAmount(gap, unit, isLoadTarget(target) ? undefined : target.metric)
}

function copyFor(state: GoalMilestoneState, props: GoalMilestoneTileProps, gap: string | null) {
  const goal = targetText(props.target)
  const best = props.latest ? readingText(props.target, props.latest) : ''
  if (state === 'hit') return { hero: goal, line: best ? `Reached · best ${best}` : 'Reached' }
  if (state === 'missed') {
    return { hero: gap ?? goal, line: `short of ${goal} at week ${props.goalWeek}` }
  }
  return { hero: gap ?? goal, line: `${gap ? 'to ' : ''}${goal} by week ${props.goalWeek}` }
}

function resolveTile(props: GoalMilestoneTileProps, t: Palette): ResolvedTile {
  const { target, latest, direction, currentWeek, goalWeek } = props
  const met = latest ? milestoneGap(target, latest, direction)?.kind === 'none' : false
  const state = deriveMilestoneState({ state: props.state, met, currentWeek, goalWeek })
  const gapText = state === 'hit' ? null : gapAmountText(props)
  const color = t[milestoneToneToken(state, props.status)]
  return { props, state, color, gapText, ...copyFor(state, props, gapText) }
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

function ProgressTrack({
  fraction,
  color,
  scale,
}: {
  fraction: number
  color: string
  scale: GoalMilestoneTileScale
}) {
  const percent = Math.round(fraction * 100)
  return (
    <View
      role="progressbar"
      aria-label="Progress to the meso target"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn(
        'w-full rounded-full overflow-hidden bg-hairline-strong',
        scale === 'wall' ? 'h-2' : 'h-1.5'
      )}
      testID="goal-milestone-progress"
    >
      <View
        className="h-full rounded-full"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </View>
  )
}

function Hero({ tile, scale }: { tile: ResolvedTile; scale: GoalMilestoneTileScale }) {
  const s = SCALE[scale]
  return (
    <View className="gap-stack-sm">
      {/* body1 plus the heading face: a heading variant would emit role=heading. */}
      <Typography
        variant="body1"
        color="inherit"
        className={cn('font-heading font-bold', s.hero)}
        style={{ color: tile.color }}
        maxLines={1}
        testID="goal-milestone-hero"
      >
        {tile.hero}
      </Typography>
      <Typography
        variant="body1"
        color="secondary"
        className={cn('font-heading font-semibold', s.line)}
        testID="goal-milestone-line"
      >
        {tile.line}
      </Typography>
    </View>
  )
}

function bestText({ props, state }: ResolvedTile): string | null {
  // A hit tile already names its best set on the line above.
  if (state === 'hit') return null
  return props.latest ? `Best ${readingText(props.target, props.latest)}` : 'No matched set yet'
}

function BestCaption({ tile }: { tile: ResolvedTile }) {
  const { currentWeek, weekCount } = tile.props
  const parts = [
    bestText(tile),
    currentWeek !== undefined && currentWeek <= weekCount
      ? `${bestText(tile) ? 'week' : 'Week'} ${currentWeek} of ${weekCount}`
      : null,
  ]
  return (
    <Typography variant="caption" color="tertiary" testID="goal-milestone-best">
      {parts.filter(Boolean).join(' · ')}
    </Typography>
  )
}

function PlaneBody({
  tile,
  scale,
  layout,
}: {
  tile: ResolvedTile
  scale: GoalMilestoneTileScale
  layout: GoalMilestoneTileLayout
}) {
  const { props } = tile
  const fraction =
    tile.state === 'hit'
      ? 1
      : milestoneProgress(props.target, props.latest, props.start, props.direction)
  return (
    <>
      <Hero tile={tile} scale={scale} />
      {layout === 'full' && <BestCaption tile={tile} />}
      {fraction !== null && <ProgressTrack fraction={fraction} color={tile.color} scale={scale} />}
      {layout === 'full' && (
        <GoalMilestoneWeekStrip
          weekCount={props.weekCount}
          goalWeek={props.goalWeek}
          currentWeek={props.currentWeek}
          weekOutcomes={props.weekOutcomes}
          outcomeStyle={props.outcomeStyle}
          goalColor={tile.color}
          cellHeight={SCALE[scale].cell}
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
  const parts = [`Meso target ${goal} by week ${tile.props.goalWeek}`]
  if (tile.state !== 'upcoming') parts.push(tile.state === 'hit' ? 'Hit' : 'Missed')
  if (tile.gapText) parts.push(`${tile.gapText} to go`)
  return parts.join(', ')
}

/**
 * The goal's meso target (the block's committed value, due in its last week)
 * led by what is still short. A progress bar runs from the block's start to the
 * target, and a thin week strip shows where the lifter is and how past weeks
 * went. Open targets take the goal's pace colour; hit is success; missed is
 * muted. Data sits on a lowered plane inside a raised card.
 *
 * Composes `Surface`, `Indicator`, `Typography` and `GoalMilestoneWeekStrip`,
 * and takes its pace colours from the chart's `STATUS_TOKEN`.
 *
 * @example
 * <GoalMilestoneTile
 *   target={{ metric: 'top_load_at_reps', reps: 8, load: 105, unit: 'lb' }}
 *   goalWeek={6}
 *   weekCount={6}
 *   currentWeek={4}
 *   latest={{ reps: 8, load: 100 }}
 *   start={{ reps: 8, load: 95 }}
 *   status="on_track"
 *   weekOutcomes={['on_track', 'ahead', 'missed']}
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
  const header = <Header label={label} state={tile.state} />
  const body = <PlaneBody tile={tile} scale={scale} layout={layout} />
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
      {header}
      <Plane pad={pad}>{body}</Plane>
    </Surface>
  )
}
