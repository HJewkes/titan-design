// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'

import { getSemanticColors } from '../../../theme/tokens/semantic'
import { InfoIcon } from '../../icons'
import { Pill } from '../../ui/pill'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { useSurfaceMode } from '../../ui/surface'
import { TipTrigger } from '../../ui/tooltip'
import { Typography } from '../../ui/typography'
import { GoalPriorityIndex, type GoalPriorityIndexEntry } from './GoalPriorityIndex'
import { SegmentedBar, type SegmentedBarSegment } from './SegmentedBar'

export type MesoHeaderState = 'upcoming' | 'current' | 'ended'

/**
 * Round-only, deleted in slice 4 of VW-466: `band` is shape A (one band), `cycle` is B (A plus
 * the program's blocks as a bar), `spine` is C (labelled week cells as the header).
 */
export type MesoHeaderShape = 'band' | 'cycle' | 'spine'

/** Round-only, for shape B: one of the program's blocks. Not on the goals payload today. */
export interface MesoHeaderCycleBlock {
  name: string
  weeks: number
}

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
  /** Round-only, shape B: the program's blocks in order; `block.index` marks the current one. */
  cycle?: readonly MesoHeaderCycleBlock[]
  className?: string
}

/** Below this container width the header takes its phone form, the same width as the live strip's. */
export const MESO_HEADER_PHONE_MAX = 640

export const BAR_HEIGHT = 12
const SHORT_CELL = 0.5
const QUIET_CELL = 0.7
const HELD_OPACITY = 0.4
const MS_PER_DAY = 86_400_000
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export type Palette = ReturnType<typeof getSemanticColors>

/** "Mon 21 Sep", or "21 Sep" without the weekday, read in UTC; slice 4 moves it to utils/workout-format.ts. */
export function dayLabel(iso: string, withWeekday = true): string {
  const date = new Date(`${iso}T00:00:00Z`)
  const day = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
  return withWeekday ? `${WEEKDAYS[date.getUTCDay()]} ${day}` : day
}

export function daysBetween(fromIso: string, toIso: string): number {
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

export function blockTitle(blockName: string, block: MesoHeaderProps['block']): string {
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
  gap?: number
  /** Shape C's "today" line, as a fraction of the block. */
  marker?: { position: number; color: string } | null
}

export function WeekBar({ weeks, state, current, width, gap, marker }: WeekBarProps) {
  const t = getSemanticColors(useSurfaceMode())
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={weeksLabel(weeks, current)}
      style={{ width, flexGrow: width === undefined ? 1 : 0, minWidth: 0 }}
      testID="meso-header-weeks"
    >
      {/* Without a renderSegment the slot flexes to full height and ignores heightFraction. */}
      <SegmentedBar
        segments={weekCells(weeks, state, current, t)}
        height={BAR_HEIGHT}
        gap={gap}
        marker={marker}
        renderSegment={(slot) => slot}
      />
    </View>
  )
}

export function StatePill({ state, isDeload }: { state: MesoHeaderState; isDeload: boolean }) {
  if (state === 'upcoming') return <Pill size="xs">Upcoming</Pill>
  if (state === 'ended') return <Pill size="xs">Ended</Pill>
  return isDeload ? <Pill size="xs">Deload</Pill> : null
}

export function FocusTip({ focus }: { focus: string }) {
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

export function PrioritiesSlot({ priorities }: { priorities: readonly GoalPriorityIndexEntry[] }) {
  if (priorities.length === 0) {
    return (
      <Typography variant="body2" color="tertiary" testID="meso-header-no-priorities">
        No priorities declared
      </Typography>
    )
  }
  return <GoalPriorityIndex priorities={priorities} />
}

export type BandProps = MesoHeaderProps & { priorities: readonly GoalPriorityIndexEntry[] }

export function PrioritiesTrigger(props: BandProps) {
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

export interface SegmentLabel {
  text: string
  weight: number
  isCurrent: boolean
}

/** One label under each bar segment, on the same flex weights and gap, so each sits under its cell. */
export function SegmentLabels({ labels, gap }: { labels: readonly SegmentLabel[]; gap: number }) {
  return (
    <View style={{ flexDirection: 'row', gap }} testID="meso-header-segment-labels">
      {labels.map((label, i) => (
        <View key={i} style={{ flex: label.weight, minWidth: 0 }}>
          <Typography variant="caption" color={label.isCurrent ? 'primary' : 'tertiary'} truncate>
            {label.text}
          </Typography>
        </View>
      ))}
    </View>
  )
}

/** The phone form's first line: block name, the compact position, and the priorities trigger. */
export function PhoneTitleRow(props: BandProps & { showPosition?: boolean }) {
  const { blockName, state, week, showPosition = true } = props
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
      <View style={{ flexShrink: 1, minWidth: 0 }}>
        <Typography variant="overline" truncate>
          {blockName}
        </Typography>
      </View>
      {showPosition ? (
        <Typography variant="body2" testID="meso-header-position" style={{ flexShrink: 0 }}>
          {positionText(props, true)}
        </Typography>
      ) : null}
      <StatePill state={state} isDeload={week?.isDeload ?? false} />
      <View style={{ marginLeft: 'auto' }}>
        <PrioritiesTrigger {...props} />
      </View>
    </View>
  )
}
