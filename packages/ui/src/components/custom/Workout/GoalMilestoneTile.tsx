// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'

import { cn } from '../../../utils/cn'
import { Indicator } from '../../ui/indicator'
import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import { GOAL_STATUS_TONE } from './GoalLiftCard'
import type { GoalLiftMilestone, GoalLiftStatus } from './GoalLiftCard'
import { GoalMilestoneWeekStrip, type GoalMilestoneTone } from './GoalMilestoneWeekStrip'
import {
  formatMilestoneGap,
  formatMilestoneGapAmount,
  formatMilestoneLoad,
  formatMilestoneWhen,
} from '../../../utils/workout-format'
import {
  GOAL_MILESTONE_STATE_LABEL,
  deriveMilestoneState,
  milestoneGap,
  milestoneProgress,
  type GoalMilestoneSet,
  type GoalMilestoneState,
} from './goalMilestone'

export type GoalMilestoneTileVariant = 'numeric' | 'progress' | 'timeline' | 'gap'
export type GoalMilestoneTileDensity = 'comfortable' | 'compact'

export interface GoalMilestoneTileProps extends ViewProps {
  milestone: GoalLiftMilestone
  variant?: GoalMilestoneTileVariant
  /** The lifter's best set toward the milestone; drives the distance and `hit`. */
  current?: GoalMilestoneSet
  /** Where the goal started; the progress bar measures from here. */
  start?: GoalMilestoneSet
  /** 1-based meso week the lifter is in; drives "in N weeks", `due_this_week` and `missed`. */
  currentWeek?: number
  /** Weeks on the timeline axis. Defaults to the later of the goal and current week. */
  totalWeeks?: number
  /** Overrides the derived state when the read model already knows it. */
  state?: GoalMilestoneState
  /** The goal's pacing status; colours an open milestone. */
  status?: GoalLiftStatus
  /** `comfortable` reads across a room at wall size; `compact` fits a phone column or a card. */
  density?: GoalMilestoneTileDensity
  /** `false` drops the raised card and renders the lowered plane alone, for nesting in a card. */
  framed?: boolean
  label?: string
  className?: string
}

const DENSITY = {
  comfortable: {
    load: 'font-heading text-6xl font-bold leading-none',
    unit: 'font-heading text-2xl font-semibold',
    reps: 'font-heading text-2xl font-semibold',
    bar: 'h-2',
    cell: 10,
  },
  compact: {
    load: 'font-heading text-4xl font-bold leading-none',
    unit: 'font-heading text-base font-semibold',
    reps: 'font-heading text-base font-semibold',
    bar: 'h-1.5',
    cell: 6,
  },
} as const

const TONE_FILL: Record<GoalMilestoneTone, string> = {
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  info: 'bg-status-info',
}

/** Hit is success and missed is warning, as `behind` is; an open milestone takes the goal's pace. */
export function milestoneTone(
  state: GoalMilestoneState,
  status?: GoalLiftStatus
): GoalMilestoneTone {
  if (state === 'hit') return 'success'
  if (state === 'missed') return 'warning'
  const paced = status ? GOAL_STATUS_TONE[status] : 'info'
  return paced === 'success' || paced === 'warning' ? paced : 'info'
}

function StateMark({ state, tone }: { state: GoalMilestoneState; tone: GoalMilestoneTone }) {
  if (state === 'upcoming') return null
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center' }}
      className="gap-inline-sm"
      testID="goal-milestone-state"
    >
      <Indicator color={tone} size="md" />
      <Typography variant="overline" color={tone}>
        {GOAL_MILESTONE_STATE_LABEL[state]}
      </Typography>
    </View>
  )
}

function Header({
  label,
  state,
  tone,
}: {
  label: string
  state: GoalMilestoneState
  tone: GoalMilestoneTone
}) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      className="gap-inline-md"
    >
      <Typography variant="overline" color="tertiary">
        {label}
      </Typography>
      <StateMark state={state} tone={tone} />
    </View>
  )
}

/** Load is the hero; reps sit under it as the unit line. */
function TargetFigure({
  set,
  unit,
  density,
}: {
  set: GoalMilestoneSet
  unit: string
  density: GoalMilestoneTileDensity
}) {
  const d = DENSITY[density]
  return (
    <View className="gap-stack-sm">
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }} className="gap-inline-sm">
        {/* body1 plus the heading face: a heading variant would emit role=heading. */}
        <Typography variant="body1" className={d.load} maxLines={1} testID="goal-milestone-load">
          {formatMilestoneLoad(set.load)}
        </Typography>
        <Typography variant="body1" color="secondary" className={d.unit}>
          {unit}
        </Typography>
      </View>
      <Typography variant="body1" color="secondary" className={d.reps} testID="goal-milestone-reps">
        {`x ${set.reps} ${set.reps === 1 ? 'rep' : 'reps'}`}
      </Typography>
    </View>
  )
}

function Caption({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <Typography variant="caption" color="tertiary" testID={testID}>
      {children}
    </Typography>
  )
}

function ProgressTrack({
  fraction,
  tone,
  density,
}: {
  fraction: number
  tone: GoalMilestoneTone
  density: GoalMilestoneTileDensity
}) {
  const percent = Math.round(fraction * 100)
  return (
    <View
      role="progressbar"
      aria-label="Progress to milestone"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn('w-full rounded-full overflow-hidden bg-hairline-strong', DENSITY[density].bar)}
      testID="goal-milestone-progress"
    >
      <View
        className={cn('h-full rounded-full', TONE_FILL[tone])}
        style={{ width: `${percent}%` }}
      />
    </View>
  )
}

interface ResolvedTile {
  props: GoalMilestoneTileProps
  state: GoalMilestoneState
  tone: GoalMilestoneTone
  density: GoalMilestoneTileDensity
  gapAmount: string | null
  gapText: string | null
  whenText: string
}

function resolveTile(props: GoalMilestoneTileProps): ResolvedTile {
  const { milestone, current, currentWeek, status } = props
  const state = deriveMilestoneState(milestone, { state: props.state, current, currentWeek })
  const gap = current && state !== 'hit' ? milestoneGap(current, milestone) : null
  return {
    props,
    state,
    tone: milestoneTone(state, status),
    density: props.density ?? 'comfortable',
    gapAmount: gap && formatMilestoneGapAmount(gap, milestone.unit),
    gapText: gap && formatMilestoneGap(gap, milestone.unit),
    // A hit milestone is done; counting down to its week would read as still open.
    whenText: formatMilestoneWhen(milestone.goalWeek, state === 'hit' ? undefined : currentWeek),
  }
}

function NumericBody({ props, density, whenText }: ResolvedTile) {
  const { milestone } = props
  return (
    <>
      <TargetFigure set={milestone} unit={milestone.unit} density={density} />
      <Caption testID="goal-milestone-when">{whenText}</Caption>
    </>
  )
}

function ProgressBody(tile: ResolvedTile) {
  const { milestone, current, start } = tile.props
  const fraction = tile.state === 'hit' ? 1 : milestoneProgress(milestone, current, start)
  return (
    <>
      <NumericBody {...tile} />
      {fraction !== null && (
        <ProgressTrack fraction={fraction} tone={tile.tone} density={tile.density} />
      )}
      {tile.gapText && (
        <Typography variant="body2" color="secondary" testID="goal-milestone-gap">
          {tile.gapText}
        </Typography>
      )}
    </>
  )
}

function TimelineBody(tile: ResolvedTile) {
  const { milestone, currentWeek, totalWeeks } = tile.props
  const axis = totalWeeks ?? Math.max(milestone.goalWeek, currentWeek ?? 0)
  return (
    <>
      <NumericBody {...tile} />
      <GoalMilestoneWeekStrip
        totalWeeks={axis}
        goalWeek={milestone.goalWeek}
        currentWeek={currentWeek}
        tone={tile.tone}
        cellHeight={DENSITY[tile.density].cell}
      />
    </>
  )
}

/** The distance is the hero; the target and the best set sit under it as a ledger line. */
function GapBody(tile: ResolvedTile) {
  const { milestone, current } = tile.props
  if (!tile.gapAmount || !current) return <NumericBody {...tile} />
  const d = DENSITY[tile.density]
  return (
    <>
      <Typography variant="body1" className={d.load} maxLines={1} testID="goal-milestone-gap">
        {tile.gapAmount}
      </Typography>
      <Typography variant="body1" color="secondary" className={d.reps}>
        {`to ${milestone.reps} x ${formatMilestoneLoad(milestone.load)} ${milestone.unit}`}
      </Typography>
      <Caption testID="goal-milestone-when">
        {`Best ${current.reps} x ${formatMilestoneLoad(current.load)} · ${tile.whenText}`}
      </Caption>
    </>
  )
}

const BODY: Record<GoalMilestoneTileVariant, (tile: ResolvedTile) => ReactNode> = {
  numeric: NumericBody,
  progress: ProgressBody,
  timeline: TimelineBody,
  gap: GapBody,
}

function accessibleSummary({ props, state, gapText, whenText }: ResolvedTile): string {
  const { milestone } = props
  const target = `${milestone.reps} reps at ${formatMilestoneLoad(milestone.load)} ${milestone.unit}`
  const parts = [`Next milestone ${target}`, whenText]
  if (state !== 'upcoming') parts.push(GOAL_MILESTONE_STATE_LABEL[state])
  if (gapText) parts.push(gapText)
  return parts.join(', ')
}

/**
 * A lifter's NEXT milestone for one goal: the target, when it is due, and how
 * far away the lifter is. Data sits on a lowered plane inside a raised card, and
 * the state is carried by one colour.
 *
 * Composes `Surface` (raised frame, pressed plane), `Indicator`, `Typography`
 * and `GoalMilestoneWeekStrip`. `variant` is the open design question (VW-385
 * unit 3): the Lab/Decisions story shows all four side by side.
 *
 * @example
 * <GoalMilestoneTile
 *   variant="progress"
 *   milestone={{ reps: 8, load: 105, unit: 'lb', goalWeek: 8 }}
 *   current={{ reps: 8, load: 100 }}
 *   start={{ reps: 8, load: 90 }}
 *   currentWeek={5}
 * />
 */
export function GoalMilestoneTile({
  variant = 'numeric',
  framed = true,
  label = 'Next milestone',
  className,
  ...props
}: GoalMilestoneTileProps) {
  const tile = resolveTile(props)
  const Body = BODY[variant]
  const {
    milestone: _m,
    current: _c,
    start: _s,
    currentWeek: _w,
    totalWeeks: _t,
    ...viewProps
  } = props
  const { state: _state, status: _status, density: _density, ...rest } = viewProps
  const pad = tile.density === 'comfortable' ? 'p-inset-lg gap-stack-md' : 'p-inset-md gap-stack-sm'
  const header = <Header label={label} state={tile.state} tone={tile.tone} />
  const plane = (
    <Surface pressed className={pad} testID="goal-milestone-plane">
      {!framed && header}
      <Body {...tile} />
    </Surface>
  )
  const a11y = { role: 'article' as const, 'aria-label': accessibleSummary(tile) }
  if (!framed) {
    return (
      <View className={className} testID="goal-milestone-tile" {...a11y} {...rest}>
        {plane}
      </View>
    )
  }
  return (
    <Surface
      raise={1}
      className={cn(pad, className)}
      testID="goal-milestone-tile"
      {...a11y}
      {...rest}
    >
      {header}
      {plane}
    </Surface>
  )
}
