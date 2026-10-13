// Pure layout for Timeline: every position is a fraction of the visible span, so the
// component places marks with percentages and never measures itself.
import { scaleLinear } from 'd3-scale'

/** The colour of an event's dot; the label always stays secondary text. */
export type TimelineTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info'

/** One event on a Timeline. */
export interface TimelineItem {
  /** Unique within the timeline; the React key and the mark's test id. */
  id: string
  /** When the event happens: a number on the caller's axis (seconds, frames) or a date. */
  at: number | Date
  /** One line under or over the dot, truncated past 96 px. */
  label: string
  /** The dot's colour. Defaults to `neutral`. */
  tone?: TimelineTone
}

/** A [start, end] pair, as axis values or as fractions of the domain. */
export type TimelineRange<T = number> = readonly [T, T]

export interface TimelineLayoutInput {
  items: readonly TimelineItem[]
  /** The axis span. Defaults to the items' extent. */
  domain?: TimelineRange<number | Date>
  /** Playhead as a fraction of the domain, 0..1. */
  playhead?: number
  /** The visible part of the domain, as fractions 0..1. Defaults to [0, 1]. */
  window?: TimelineRange
}

export interface TimelineMark {
  item: TimelineItem
  /** Position along the visible span, 0..1. */
  position: number
  /** Alternates 0, 1, 0 … so neighbouring labels sit on opposite sides of the track. */
  lane: 0 | 1
}

export interface TimelineLayout {
  /** The items inside the window, in time order. */
  marks: TimelineMark[]
  /** Playhead position along the visible span, or null when unset or outside the window. */
  playhead: number | null
}

const FULL_WINDOW: TimelineRange = [0, 1]
// Floats from the window division must not drop an item sitting exactly on an edge.
const EDGE_EPSILON = 1e-9

const toNumber = (value: number | Date) => (value instanceof Date ? value.getTime() : value)

const clampUnit = (value: number) => Math.min(1, Math.max(0, value))

/** The axis span as numbers; a single instant widens by 1 on each side so it sits centred. */
export function timelineDomain(
  items: readonly TimelineItem[],
  domain?: TimelineRange<number | Date>
): TimelineRange {
  const values = domain ? domain.map(toNumber) : items.map((item) => toNumber(item.at))
  const finite = values.filter(Number.isFinite)
  if (finite.length === 0) return [0, 1]
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  return min === max ? [min - 1, max + 1] : [min, max]
}

/** The window clamped to [0, 1]; an empty or inverted window falls back to the whole domain. */
export function normalizeWindow(window: TimelineRange = FULL_WINDOW): TimelineRange {
  const start = clampUnit(window[0])
  const end = clampUnit(window[1])
  return end > start ? [start, end] : FULL_WINDOW
}

const isVisible = (position: number) => position >= -EDGE_EPSILON && position <= 1 + EDGE_EPSILON

/** Places items and the playhead along the visible span of the window. */
export function layoutTimeline({
  items,
  domain,
  playhead,
  window,
}: TimelineLayoutInput): TimelineLayout {
  const [start, end] = normalizeWindow(window)
  const toFraction = scaleLinear().domain(timelineDomain(items, domain)).range([0, 1])
  const toView = (fraction: number) => (fraction - start) / (end - start)

  const marks = [...items]
    .filter((item) => Number.isFinite(toNumber(item.at)))
    .sort((a, b) => toNumber(a.at) - toNumber(b.at))
    .map((item) => ({ item, position: toView(toFraction(toNumber(item.at))) }))
    .filter(({ position }) => isVisible(position))
    .map(({ item, position }, index) => ({ item, position, lane: (index % 2) as 0 | 1 }))

  const head = playhead === undefined || !Number.isFinite(playhead) ? null : toView(playhead)
  return { marks, playhead: head !== null && isVisible(head) ? head : null }
}
