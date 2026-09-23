// The arithmetic and the wording behind BodyweightGoalCard and SessionsGoalCard (VW-455).
// Pure: no React, no clock.
import { formatBodyweight, formatSignedRate } from '../../../utils/workout-format'
import type { GoalLiftStatus } from './GoalCard'

/** Which way a bodyweight goal points. `hold` is a corridor to stay inside, not a rate. */
export type WholeBodyDirection = 'up' | 'down' | 'hold'

/** The declared diet phase, as voltras-mcp names it. */
export type WholeBodyDietPhase = 'fat-loss' | 'gain' | 'maintenance' | 'recomposition' | 'unknown'

/** The rate `goal.weekly_review` judges, for the phone's second line. */
export interface WholeBodyRate {
  observedPctPerWeek: number | null
  /** The committed edge's rate. `null` for a hold, which has no target rate. */
  bandLowPctPerWeek: number | null
  /** The stretch edge's rate. */
  bandHighPctPerWeek: number | null
  /** The review held its verdict this week (noise floor, settling window). */
  vetoed: boolean
}

export interface WholeBodyWeightRow {
  status: GoalLiftStatus
  /** One clause: which rule set the status. */
  basis?: string
  unit: 'lb' | 'kg'
  direction: WholeBodyDirection
  phase: { name: WholeBodyDietPhase; slowLoss?: boolean }
  /** `null` until the first weigh-in. */
  latest: { value: number; ts: string } | null
  /** This week of the block and its band. `low` is the committed edge, so a cut's `low` is the higher number. */
  week: { index: number; of: number; low: number; high: number }
  rate: WholeBodyRate | null
}

export interface WholeBodySessionsRow {
  status: GoalLiftStatus
  basis?: string
  /** Training days in the last `windowDays`. */
  counted: number
  committed: number
  /** Training days due by now while the first window fills; equals `committed` once it is full. */
  dueByNow: number
  windowDays: number
  /** Training days that leave the window in the next 7 days. `null` when unknown. */
  agingOutNext7d: number | null
}

/** A card lays out for the wall or for a phone. */
export type WholeBodyScale = 'wall' | 'phone'

/** The narrowest card content box that still takes the wall's type and track sizes. */
export const WHOLE_BODY_WALL_MIN_WIDTH = 560

/** The scale a measured box gets, unless the caller pins one. Unmeasured renders phone, the safe first paint. */
export function wholeBodyScale(width: number | null, pinned?: WholeBodyScale): WholeBodyScale {
  if (pinned) return pinned
  return width !== null && width >= WHOLE_BODY_WALL_MIN_WIDTH ? 'wall' : 'phone'
}

/**
 * One line of detail beside or under a card's main figure. `key` lets a caller
 * choose which one leads. A line that splits into a muted word and a figure
 * carries `label` and `value` too, and the card sets it as a word and a figure.
 */
export interface CaptionLine {
  key: string
  text: string
  label?: string
  value?: string
}

/** The line shown beside the figure, and the lines the detail tip holds. */
export interface LeadCaption {
  lead: CaptionLine | null
  rest: CaptionLine[]
}

/** Leads with the preferred line when it exists, else the first; every other line goes to the tip. */
export function leadCaption(lines: readonly CaptionLine[], preferred: string): LeadCaption {
  const lead = lines.find((line) => line.key === preferred) ?? lines[0] ?? null
  return { lead, rest: lines.filter((line) => line !== lead) }
}

/** The phase's rate band as a range, or one number when both edges agree. */
function rateBandText(rate: WholeBodyRate): string | null {
  const { bandLowPctPerWeek: low, bandHighPctPerWeek: high } = rate
  if (low === null || high === null) return null
  return low === high
    ? formatSignedRate(low)
    : `${formatSignedRate(low)} to ${formatSignedRate(high)}`
}

/** The tip line for a week whose verdict the review held (noise floor, settling window). */
export const VETOED_RATE_NOTE = 'Verdict held this week'

/** What the card says when no rate can be computed yet, and why (owner, round 4: "Just do N/A"). */
export const NO_RATE_VALUE = 'N/A'
export const NO_RATE_REASON = 'Rate shows after a second week of weigh-ins'

/**
 * The rate as the card leads with it: the percent this week alone (owner, round 3),
 * or `null` before the first weigh-in or while there is no rate to judge.
 */
export function rateCaption(row: WholeBodyWeightRow): string | null {
  const observed = row.rate?.observedPctPerWeek ?? null
  if (row.latest === null || observed === null) return null
  return `${formatSignedRate(observed)}%/wk`
}

/** The phase's rate band, which the tip holds because the lead no longer carries it. */
export function rateBandCaption(row: WholeBodyWeightRow): string | null {
  if (row.rate === null || row.rate.vetoed) return null
  const band = rateBandText(row.rate)
  if (band === null) return null
  const phase = row.phase.name === 'unknown' ? 'Target' : PHASE_WORD[row.phase.name]
  return `${phase} band ${band}%/wk`
}

/**
 * The weight card's detail lines: the rate (or N/A and why), this week's band, and
 * the phase's rate band. None before the first weigh-in. The rate leads; the rest
 * sit in the tip.
 */
export function weightCaptions(row: WholeBodyWeightRow): CaptionLine[] {
  if (row.latest === null) return []
  const rate = rateCaption(row)
  const rateBand = rateBandCaption(row)
  const lead: CaptionLine[] =
    rate === null
      ? [
          { key: 'rate', text: NO_RATE_VALUE, label: 'Rate', value: NO_RATE_VALUE },
          { key: 'rateWhy', text: NO_RATE_REASON },
        ]
      : [{ key: 'rate', text: rate, label: 'Rate', value: rate }]
  return [
    ...lead,
    { key: 'band', text: bandCaption(row) },
    ...(rateBand === null ? [] : [{ key: 'rateBand', text: rateBand }]),
    ...(row.rate?.vetoed === true ? [{ key: 'veto', text: VETOED_RATE_NOTE }] : []),
  ]
}

/** Past this many cells a segment is too thin to read at phone width, so the bar falls back. */
export const SESSION_SEGMENT_LIMIT = 20

/** One cell of the sessions bar: a trained day, a day past the commitment, or a day still open. */
export type SessionCell = 'done' | 'extra' | 'open'

/**
 * The sessions bar as cells, or `null` when there are too many to draw and the
 * card falls back to a plain bar. A day past the commitment adds a cell of its
 * own (owner, round 2).
 */
export function sessionCells(row: WholeBodySessionsRow): SessionCell[] | null {
  const extra = Math.max(0, row.counted - row.committed)
  const total = row.committed + extra
  if (total > SESSION_SEGMENT_LIMIT) return null
  return Array.from({ length: total }, (_, i) => {
    if (i >= row.committed) return 'extra'
    return i < row.counted ? 'done' : 'open'
  })
}

/** The due-by-now marker as a 0..1 position along `cellCount` cells, or `null` once the window is full. */
export function dueMarkerPosition(
  row: WholeBodySessionsRow,
  cellCount = row.committed
): number | null {
  if (row.committed <= 0 || cellCount <= 0 || row.dueByNow >= row.committed) return null
  return Math.max(0, row.dueByNow / cellCount)
}

/** The sessions bar's accessible name: the count against the commitment, and what is due while the window fills. */
export function sessionsBarLabel(row: WholeBodySessionsRow): string {
  const count = `${row.counted} of ${row.committed} training days`
  const marker = dueMarkerPosition(row)
  return marker === null ? count : `${count}, ${Math.round(row.dueByNow)} due by now`
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** The sessions card's detail lines: what is due, anything past the commitment, what leaves this week. */
export function sessionCaptions(row: WholeBodySessionsRow): CaptionLine[] {
  const lines: CaptionLine[] = []
  if (row.dueByNow <= 0) lines.push({ key: 'due', text: 'Window started today' })
  else if (row.dueByNow < row.committed) {
    lines.push({
      key: 'due',
      text: `${Math.round(row.dueByNow)} due by now`,
      label: 'Due by now',
      value: `${Math.round(row.dueByNow)}`,
    })
  }
  if (row.counted > row.committed) {
    lines.push({ key: 'over', text: `${row.counted - row.committed} over your commitment` })
  }
  if (row.agingOutNext7d !== null) {
    const text =
      row.agingOutNext7d === 0
        ? 'None leave this week'
        : `${plural(row.agingOutNext7d, 'leaves', 'leave')} this week`
    lines.push({ key: 'leaving', text })
  }
  return lines
}

/**
 * How far past each band edge the track may widen for an outlying weigh-in, in band
 * spans. Beyond it the needle pins to the track's end and the caption carries the gap,
 * so a typo such as 1968 for 196.8 cannot squeeze the band and its labels together.
 */
const BAND_DOMAIN_MAX_SPANS = 3

/** The domain a band track spans: the band in the middle third, widened (up to a cap) so an outlying weigh-in stays on the track. */
export function bandDomain(
  low: number,
  high: number,
  latest: number | null
): { min: number; max: number } {
  const lo = Math.min(low, high)
  const hi = Math.max(low, high)
  const span = Math.max(hi - lo, ((lo + hi) / 2) * 0.01)
  const pad = span * 0.25
  const reach = span * BAND_DOMAIN_MAX_SPANS
  const min = Math.max(lo - reach, Math.min(lo - span, latest === null ? lo : latest - pad))
  const max = Math.min(hi + reach, Math.max(hi + span, latest === null ? hi : latest + pad))
  return { min: round1(min), max: round1(max) }
}

export type BandPosition = 'inside' | 'above' | 'below'

/** Where a value sits along a domain, 0..1, clamped. The track and its labels share it. */
export function trackFraction(value: number, min: number, max: number): number {
  if (max <= min) return 0
  return Math.min(1, Math.max(0, (value - min) / (max - min)))
}

/** Where the weigh-in sits against the week's band, whichever edge is numerically higher. */
export function bandPosition(value: number, low: number, high: number): BandPosition {
  if (value > Math.max(low, high)) return 'above'
  if (value < Math.min(low, high)) return 'below'
  return 'inside'
}

/** The band caption. A hold names its corridor; an outlier says by how much it is out. */
export function bandCaption(row: WholeBodyWeightRow): string {
  const { week, unit, direction } = row
  const lo = Math.min(week.low, week.high)
  const hi = Math.max(week.low, week.high)
  const range =
    lo === hi
      ? `${formatBodyweight(lo)} ${unit}`
      : `${formatBodyweight(lo)} to ${formatBodyweight(hi)} ${unit}`
  const head = direction === 'hold' ? `Hold ${range}` : `Week ${week.index} of ${week.of}: ${range}`
  if (row.latest === null) return head
  const position = bandPosition(row.latest.value, week.low, week.high)
  if (position === 'inside') return head
  const gap = position === 'above' ? row.latest.value - hi : lo - row.latest.value
  const where = direction === 'hold' ? 'the corridor' : 'the band'
  return `${head}. ${formatBodyweight(gap)} ${unit} ${position} ${where}`
}

const PHASE_WORD: Record<WholeBodyDietPhase, string> = {
  'fat-loss': 'Cut',
  gain: 'Gain',
  maintenance: 'Hold',
  recomposition: 'Recomp',
  unknown: 'No phase declared',
}

/**
 * The phase tag's own words. The week is NOT here: it reads off the page's title
 * line, and printing it twice was noise (owner, round 3).
 */
export function phaseLabel(phase: WholeBodyWeightRow['phase']): string {
  if (phase.name === 'unknown') return PHASE_WORD.unknown
  return phase.name === 'recomposition'
    ? `Recomp, ${phase.slowLoss === true ? 'slow loss' : 'hold'}`
    : PHASE_WORD[phase.name]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** A weigh-in's timestamp as `Sep 18`, on the lifter's own calendar: an evening weigh-in keeps its day. */
export function weighInDate(ts: string): string {
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return ''
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
