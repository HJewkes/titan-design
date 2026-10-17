// The MesoHeader's pure functions: date and position text, week and block cells, and layout widths.
import type { getSemanticColors } from '../../../theme/tokens/semantic'
import type { SegmentedBarSegment } from './SegmentedBar'
import type {
  MesoHeaderBlock,
  MesoHeaderModel,
  MesoHeaderProps,
  MesoHeaderSchedule,
  MesoHeaderState,
  MesoHeaderWeek,
} from './MesoHeader.types'

/** Below this container width the header takes its phone form, the same width as the live strip's. */
export const MESO_HEADER_PHONE_MAX = 640

export const BAR_HEIGHT = 12
/** Bars and their label rows share one gap, so every label sits under its own cell. */
export const SEGMENT_GAP = 4
const SHORT_CELL = 0.5
const QUIET_CELL = 0.7
const HELD_OPACITY = 0.4
const SPINE_WEEK_WIDTH = 160
const SPINE_MAX_WIDTH = 960
const SPINE_DATE_ALLOWANCE = 120
const SPINE_LEFT_MIN_WIDTH = 560
const MS_PER_DAY = 86_400_000
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export type Palette = ReturnType<typeof getSemanticColors>

/** The internal model every part reads, with the props' defaults applied. */
export function headerModel(props: MesoHeaderProps): MesoHeaderModel {
  return {
    block: props.block,
    schedule: props.schedule,
    priorities: props.priorities ?? [],
    popover: { isOpen: props.isPrioritiesOpen, onOpenChange: props.onPrioritiesOpenChange },
    now: props.now,
    cycle: props.cycle ?? [],
    prioritiesLine: props.prioritiesLine ?? 1,
  }
}

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

/** The block's date range, "Mon 21 Sep - Sun 4 Oct", or "21 Sep - 4 Oct" without weekdays. */
export function rangeLabel(schedule: MesoHeaderSchedule, withWeekday = true): string {
  return `${dayLabel(schedule.startsOn, withWeekday)} - ${dayLabel(schedule.endsOn, withWeekday)}`
}

/** The one line that says where the lifter is in the block. */
export function positionText(
  schedule: MesoHeaderSchedule,
  now: string | undefined,
  compact = false
): string {
  const { state, week, startsOn, endsOn, nextBlock } = schedule
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
  if (!week) return rangeLabel(schedule)
  const position = compact ? `Wk ${week.n} of ${week.of}` : `Week ${week.n} of ${week.of}`
  return week.name && !compact ? `${position} · ${week.name}` : position
}

/** Week number and type for the phone's second line, e.g. "Wk 2 of 2 · Confirm". */
export function phoneWeekText(schedule: MesoHeaderSchedule, now: string | undefined): string {
  const { state, week } = schedule
  if (state !== 'current' || !week?.name) return positionText(schedule, now, true)
  return `${positionText(schedule, now, true)} · ${week.name}`
}

export function blockTitle({ name, order }: MesoHeaderBlock): string {
  return order ? `Block ${order.index} of ${order.count} · ${name}` : name
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

/** One cell per week: past weeks filled, the current one ringed and full height; deloads stay short even when current. */
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
      heightFraction: short ? SHORT_CELL : phase === 'current' ? 1 : QUIET_CELL,
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

/** Where today falls in the block, as a fraction; only while the block is current and today is pinned. */
export function todayPosition(
  schedule: MesoHeaderSchedule,
  now: string | undefined
): number | null {
  const { state, startsOn, endsOn } = schedule
  if (state !== 'current' || now === undefined) return null
  const span = daysBetween(startsOn, endsOn) + 1
  return Math.min(Math.max((daysBetween(startsOn, now) + 0.5) / span, 0), 1)
}

export function spineWeekText(week: MesoHeaderWeek): string {
  const name = week.name ?? (week.isDeload ? 'Deload' : '')
  return name ? `W${week.index} ${name}` : `W${week.index}`
}

/** The left column is wide enough for the spine and its dates, so every priority column lines up. */
export function spineColumnWidth(weekCount: number): number {
  const spine = Math.min(weekCount * SPINE_WEEK_WIDTH, SPINE_MAX_WIDTH)
  return Math.max(SPINE_LEFT_MIN_WIDTH, spine + SPINE_DATE_ALLOWANCE)
}

function currentBlockFill({ state, week }: MesoHeaderSchedule, weeks: number): number {
  if (state === 'ended') return 1
  if (state === 'upcoming' || !week) return 0
  return Math.min(week.n / weeks, 1)
}

/** One segment per block, weighted by its weeks: past filled, current ringed and filled to this week. */
export function cycleSegments(model: MesoHeaderModel, t: Palette): SegmentedBarSegment[] {
  const current = (model.block.order?.index ?? 1) - 1
  return model.cycle.map((block, i) => {
    if (i < current) return { weight: block.weeks, color: t['text-tertiary'] }
    if (i > current) return { weight: block.weeks, color: t['hairline-subtle'] }
    return {
      weight: block.weeks,
      color: t['text-tertiary'],
      fill: currentBlockFill(model.schedule, block.weeks),
      ringColor: t['text-primary'],
    }
  })
}

export function cycleLabel(model: MesoHeaderModel): string {
  const current = model.block.order?.index ?? 1
  const names = model.cycle.map(
    (b, i) => `${b.name}, ${b.weeks} weeks${i + 1 === current ? ' (current)' : ''}`
  )
  return `Program: ${model.cycle.length} blocks: ${names.join('; ')}`
}
