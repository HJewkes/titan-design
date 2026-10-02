// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'

import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useMeasuredWidth } from '../../../hooks/useMeasuredWidth'
import { cn } from '../../../utils/cn'
import { InfoIcon } from '../../icons'
import { Pill } from '../../ui/pill'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { useSurfaceMode } from '../../ui/surface'
import { TipTrigger } from '../../ui/tooltip'
import { Typography } from '../../ui/typography'
import { GoalPriorityIndex, type GoalPriorityIndexEntry } from './GoalPriorityIndex'
import { SegmentedBar, type SegmentedBarSegment } from './SegmentedBar'

export type MesoHeaderState = 'upcoming' | 'current' | 'ended'

/** Round-only: the decision story picks the variant; slice 4 of VW-466 deletes the prop. */
export type MesoHeaderShape = 'band'

export interface MesoHeaderWeek {
  index: number
  isDeload: boolean
  name?: string
  /** `hold` kept the calendar and skipped the plan week; `extend` added this week off. */
  skipped?: 'hold' | 'extend' | null
}

export interface MesoHeaderCurrentWeek {
  n: number
  of: number
  isDeload: boolean
  name?: string
}

export interface MesoHeaderProps extends ViewProps {
  programName?: string
  blockName: string
  focus?: string | null
  block?: { index: number; count: number }
  /** ISO date of the block's first day. */
  startsOn: string
  /** ISO date of the block's last day, inclusive. */
  endsOn: string
  state: MesoHeaderState
  week?: MesoHeaderCurrentWeek | null
  weeks: readonly MesoHeaderWeek[]
  nextBlock?: { name: string; startsOn: string } | null
  priorities?: readonly GoalPriorityIndexEntry[]
  isPrioritiesOpen?: boolean
  onPrioritiesOpenChange?: (open: boolean) => void
  /** Pins the measured layout, for stories and tests. */
  layout?: 'wall' | 'phone'
  /** ISO date standing in for today, so "in 2 days" can be pinned; the header never reads the clock. */
  now?: string
  shape?: MesoHeaderShape
  className?: string
}

/** Below this container width the header takes its phone form, the same width as the live strip's. */
export const MESO_HEADER_PHONE_MAX = 640

const WALL_CELL_WIDTH = 24
const WALL_BAR_MAX_WIDTH = 320
const BAR_HEIGHT = 12
const SHORT_CELL = 0.5
const QUIET_CELL = 0.7
const HELD_OPACITY = 0.4
const MS_PER_DAY = 86_400_000
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type Palette = ReturnType<typeof getSemanticColors>

/** "Mon 21 Sep", or "21 Sep" without the weekday, read in UTC; slice 4 moves it to utils/workout-format.ts. */
export function dayLabel(iso: string, withWeekday = true): string {
  const date = new Date(`${iso}T00:00:00Z`)
  const day = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
  return withWeekday ? `${WEEKDAYS[date.getUTCDay()]} ${day}` : day
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / MS_PER_DAY
  )
}

function inDays(days: number): string {
  if (days <= 0) return 'today'
  return days === 1 ? 'tomorrow' : `in ${days} days`
}

/** The one line that says where the lifter is in the block. */
export function positionText(
  props: Pick<MesoHeaderProps, 'state' | 'week' | 'startsOn' | 'endsOn' | 'nextBlock' | 'now'>,
  compact = false
): string {
  const { state, week, startsOn, endsOn, nextBlock, now } = props
  if (state === 'upcoming') {
    const starts = `Starts ${dayLabel(startsOn)}`
    return now === undefined ? starts : `${starts} · ${inDays(daysBetween(now, startsOn))}`
  }
  if (state === 'ended') {
    const next = nextBlock
      ? `Next: ${nextBlock.name}, ${dayLabel(nextBlock.startsOn)}`
      : 'next block not planned'
    return `Ended ${dayLabel(endsOn)} · ${next}`
  }
  if (!week) return `${dayLabel(startsOn)} - ${dayLabel(endsOn)}`
  const position = compact ? `Wk ${week.n} of ${week.of}` : `Week ${week.n} of ${week.of}`
  return week.name && !compact ? `${position} · ${week.name}` : position
}

function blockTitle(blockName: string, block: MesoHeaderProps['block']): string {
  return block ? `Block ${block.index} of ${block.count} · ${blockName}` : blockName
}

function cellPhase(
  week: MesoHeaderWeek,
  state: MesoHeaderState,
  current: number | undefined
): 'past' | 'current' | 'future' {
  if (state === 'ended') return 'past'
  if (state === 'upcoming' || current === undefined) return 'future'
  if (week.index === current) return 'current'
  return week.index < current ? 'past' : 'future'
}

/** One cell per week: past weeks filled, the current one ringed and full height, deloads short. */
export function weekCells(
  weeks: readonly MesoHeaderWeek[],
  state: MesoHeaderState,
  current: number | undefined,
  t: Palette
): SegmentedBarSegment[] {
  return weeks.map((week) => {
    const phase = cellPhase(week, state, current)
    const base = phase === 'future' ? t['hairline-subtle'] : t['text-tertiary']
    const color = week.isDeload ? t['status-deload'] : base
    const short = week.isDeload || week.skipped === 'extend'
    return {
      color,
      outline: week.skipped === 'extend',
      opacity: week.skipped === 'hold' ? HELD_OPACITY : undefined,
      ringColor: phase === 'current' ? t['text-primary'] : undefined,
      heightFraction: phase === 'current' ? 1 : short ? SHORT_CELL : QUIET_CELL,
    }
  })
}

function weekLabel(week: MesoHeaderWeek): string {
  const parts = [`Week ${week.index}`]
  if (week.name) parts.push(week.name)
  if (week.isDeload) parts.push('deload')
  if (week.skipped === 'hold') parts.push('held')
  if (week.skipped === 'extend') parts.push('extended, time off')
  return parts.join(', ')
}

/** The bar's accessible name: how many weeks, which is current, and every marked week. */
export function weeksLabel(weeks: readonly MesoHeaderWeek[], current: number | undefined): string {
  const marked = weeks.filter((w) => w.isDeload || w.skipped || w.index === current)
  const head = `${weeks.length} ${weeks.length === 1 ? 'week' : 'weeks'}`
  if (marked.length === 0) return head
  const notes = marked.map((w) =>
    w.index === current ? `${weekLabel(w)} (current)` : weekLabel(w)
  )
  return `${head}: ${notes.join('; ')}`
}

interface WeekBarProps {
  weeks: readonly MesoHeaderWeek[]
  state: MesoHeaderState
  current: number | undefined
  width?: number
}

function WeekBar({ weeks, state, current, width }: WeekBarProps) {
  const t = getSemanticColors(useSurfaceMode())
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={weeksLabel(weeks, current)}
      style={{ width, flexGrow: width === undefined ? 1 : 0, minWidth: 0 }}
      testID="meso-header-weeks"
    >
      <SegmentedBar segments={weekCells(weeks, state, current, t)} height={BAR_HEIGHT} />
    </View>
  )
}

function StatePill({ state, isDeload }: { state: MesoHeaderState; isDeload: boolean }) {
  if (state === 'upcoming') return <Pill size="xs">Upcoming</Pill>
  if (state === 'ended') return <Pill size="xs">Ended</Pill>
  return isDeload ? <Pill size="xs">Deload</Pill> : null
}

function FocusTip({ focus }: { focus: string }) {
  return (
    <TipTrigger
      label="Block focus"
      content={<Typography variant="body2">{focus}</Typography>}
      placement="bottom"
      testID="meso-header-focus"
    >
      <InfoIcon size={14} />
    </TipTrigger>
  )
}

function PrioritiesSlot({ priorities }: { priorities: readonly GoalPriorityIndexEntry[] }) {
  if (priorities.length === 0) {
    return (
      <Typography variant="body2" color="tertiary" testID="meso-header-no-priorities">
        No priorities declared
      </Typography>
    )
  }
  return <GoalPriorityIndex priorities={priorities} />
}

type BandProps = MesoHeaderProps & { priorities: readonly GoalPriorityIndexEntry[] }

function WallBand(props: BandProps) {
  const { blockName, block, focus, startsOn, endsOn, state, week, weeks, priorities } = props
  const barWidth = Math.min(weeks.length * WALL_CELL_WIDTH, WALL_BAR_MAX_WIDTH)
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}
      className="gap-x-inline-xl gap-y-stack-sm"
      testID="meso-header-wall"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
        <Typography variant="overline">{blockTitle(blockName, block)}</Typography>
        {focus ? <FocusTip focus={focus} /> : null}
      </View>
      <Typography variant="body2" color="secondary">
        {`${dayLabel(startsOn)} - ${dayLabel(endsOn)}`}
      </Typography>
      <WeekBar weeks={weeks} state={state} current={week?.n} width={barWidth} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
        <Typography variant="body2" testID="meso-header-position">
          {positionText(props)}
        </Typography>
        <StatePill state={state} isDeload={week?.isDeload ?? false} />
      </View>
      <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
        <PrioritiesSlot priorities={priorities} />
      </View>
    </View>
  )
}

function PrioritiesTrigger(props: BandProps) {
  const { priorities, isPrioritiesOpen, onPrioritiesOpenChange } = props
  if (priorities.length === 0) return null
  return (
    <Popover isOpen={isPrioritiesOpen} onOpenChange={onPrioritiesOpenChange} placement="bottom">
      <PopoverTrigger>
        <Pill size="sm" variant="outline" testID="meso-header-priorities-trigger">
          {`Priorities · ${priorities.length}`}
        </Pill>
      </PopoverTrigger>
      <PopoverContent className="left-auto right-0 max-w-[280px]">
        <GoalPriorityIndex priorities={priorities} />
      </PopoverContent>
    </Popover>
  )
}

function PhoneBand(props: BandProps) {
  const { blockName, startsOn, endsOn, state, week, weeks } = props
  return (
    <View className="gap-stack-sm" testID="meso-header-phone">
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <Typography variant="overline" truncate>
            {blockName}
          </Typography>
        </View>
        <Typography variant="body2" testID="meso-header-position" style={{ flexShrink: 0 }}>
          {positionText(props, true)}
        </Typography>
        <StatePill state={state} isDeload={week?.isDeload ?? false} />
        <View style={{ marginLeft: 'auto' }}>
          <PrioritiesTrigger {...props} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-md">
        <WeekBar weeks={weeks} state={state} current={week?.n} />
        <Typography variant="caption" color="secondary" style={{ flexShrink: 0 }}>
          {`${dayLabel(startsOn, false)} - ${dayLabel(endsOn, false)}`}
        </Typography>
      </View>
    </View>
  )
}

/** The header's own data apart from the props its root View takes. */
function splitProps(
  props: MesoHeaderProps
): [BandProps, Pick<MesoHeaderProps, 'layout' | 'className'> & ViewProps] {
  const {
    programName,
    blockName,
    focus,
    block,
    startsOn,
    endsOn,
    state,
    week,
    weeks,
    nextBlock,
    priorities = [],
    isPrioritiesOpen,
    onPrioritiesOpenChange,
    now,
    shape,
    ...rest
  } = props
  const band = {
    ...{ programName, blockName, focus, block, startsOn, endsOn, state, week, weeks, nextBlock },
    ...{ priorities, isPrioritiesOpen, onPrioritiesOpenChange, now, shape },
  }
  return [band, rest]
}

/**
 * The pinned header of the goals page: which block, the dates it runs, where the lifter is in
 * it, and what it is for. One band on the wall; two lines on a phone with the priorities behind
 * a "Priorities · N" popover. Switches form by its own width, at the live strip's threshold.
 *
 * VW-466 round-1 specimen (shape A). No loading, error or disabled state: the page owns the
 * fetch, and with no dated block the consumer renders a note instead of this header.
 */
export function MesoHeader(props: MesoHeaderProps) {
  const [band, { layout, className, ...viewProps }] = splitProps(props)
  const { width, onLayout } = useMeasuredWidth()
  const measured = width !== null && width < MESO_HEADER_PHONE_MAX ? 'phone' : 'wall'
  const form = layout ?? measured
  return (
    <View
      onLayout={onLayout}
      className={cn('bg-surface-base px-inset-lg py-inset-md', className)}
      testID="meso-header"
      {...viewProps}
    >
      {form === 'phone' ? <PhoneBand {...band} /> : <WallBand {...band} />}
    </View>
  )
}
