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
  /**
   * The visible part of the domain, as fractions of it. Defaults to [0, 1]. It may run past either
   * end, so a window that follows the playhead keeps the playhead at the same place on screen.
   */
  window?: TimelineRange
}

export interface TimelineMark {
  item: TimelineItem
  /** Position along the visible span, 0..1. */
  position: number
  /**
   * Alternates 0, 1, 0 … across every item in time order, so neighbouring labels sit on opposite
   * sides of the track and a label never changes side as the window pans.
   */
  lane: 0 | 1
  /** 1 inside the window, falling to 0 across the edge fade just outside it. */
  opacity: number
}

export interface TimelineLayout {
  /** The items inside the window or its edge fade, in time order. */
  marks: TimelineMark[]
  /** Playhead position along the visible span, or null when unset or outside the window. */
  playhead: number | null
  /** The part of the visible span the domain covers, [from, to] in 0..1, or null if none. */
  track: TimelineRange | null
}

const FULL_WINDOW: TimelineRange = [0, 1]
// Floats from the window division must not drop an item sitting exactly on an edge.
const EDGE_EPSILON = 1e-9
/**
 * How far past a window edge a mark keeps fading out, as a share of the visible span: a pan
 * crossing the plot spends 8% of its time on each fade. Timeline clips anything that fades past
 * its own box, so on a wide timeline the fade ends at the component's edge.
 */
export const EDGE_FADE = 0.08

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

/**
 * The window as given, which may run past the domain ends; an empty, inverted or non-finite window
 * falls back to the whole domain.
 */
export function normalizeWindow(window: TimelineRange = FULL_WINDOW): TimelineRange {
  const [start, end] = window
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? [start, end] : FULL_WINDOW
}

/**
 * A window `width` of the domain wide, centred on `playhead`, for a zoomed timeline whose playhead
 * stays fixed at the centre while the events scroll behind it. Near the ends it runs past the
 * domain rather than stopping, so the playhead never moves off centre. A width outside (0, 1]
 * gives the whole domain.
 */
export function followWindow(playhead: number, width: number): TimelineRange {
  if (!Number.isFinite(playhead) || !(width > 0 && width <= 1)) return FULL_WINDOW
  return [playhead - width / 2, playhead + width / 2]
}

/** Where the domain [0, 1] lies on the visible span, clipped to it. */
function visibleTrack(toView: (fraction: number) => number): TimelineRange | null {
  const from = clampUnit(toView(0))
  const to = clampUnit(toView(1))
  return to > from ? [from, to] : null
}

const isVisible = (position: number) => position >= -EDGE_EPSILON && position <= 1 + EDGE_EPSILON

/** 1 inside [0, 1], falling linearly to 0 at `EDGE_FADE` beyond either edge. */
export function edgeOpacity(position: number): number {
  const overshoot = Math.max(-position, position - 1, 0)
  return overshoot <= EDGE_EPSILON ? 1 : clampUnit(1 - overshoot / EDGE_FADE)
}

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
    // The lane comes from the item's place in the whole timeline, before the window filters it,
    // so a label keeps its side of the track as the window pans.
    .map((item, index) => ({
      item,
      position: toView(toFraction(toNumber(item.at))),
      lane: (index % 2) as 0 | 1,
    }))
    .map((mark) => ({ ...mark, opacity: edgeOpacity(mark.position) }))
    .filter(({ opacity }) => opacity > 0)

  const head = playhead === undefined || !Number.isFinite(playhead) ? null : toView(playhead)
  return {
    marks,
    playhead: head !== null && isVisible(head) ? head : null,
    track: visibleTrack(toView),
  }
}
