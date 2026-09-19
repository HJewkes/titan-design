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
  weeksOutsideBand: number
  /** The review held its verdict this week (noise floor, settling window). */
  vetoed: boolean
}

export interface WholeBodyWeightRow {
  status: GoalLiftStatus
  /** One clause: which rule set the status. */
  basis?: string
  unit: 'lb' | 'kg'
  direction: WholeBodyDirection
  phase: { name: WholeBodyDietPhase; weeksInPhase: number; slowLoss?: boolean }
  /** `null` until the first weigh-in. */
  latest: { value: number; ts: string } | null
  readingCount: number
  /** This week of the block and its band. `low` is the committed edge, so a cut's `low` is the higher number. */
  week: { index: number; of: number; low: number; high: number }
  committed: number
  stretch: number
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

/** One line of detail under a card's main figure. `key` lets a caller choose which one leads. */
export interface CaptionLine {
  key: string
  text: string
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

/** Which weight caption leads. Round-2 comparison (VW-455). */
export type WeightCaptionKey = 'band' | 'rate'

/** The weight card's detail lines: this week's band, then the rate. None before the first weigh-in. */
export function weightCaptions(row: WholeBodyWeightRow): CaptionLine[] {
  if (row.latest === null) return []
  const rate = rateCaption(row)
  return [
    { key: 'band', text: bandCaption(row) },
    ...(rate === null ? [] : [{ key: 'rate', text: rate }]),
  ]
}

/** Past this many cells a segment is too thin to read at phone width, so the bar falls back. */
export const SESSION_SEGMENT_LIMIT = 20

/** How days past the commitment are drawn. Round-2 comparison (VW-455). */
export type SessionsPastCommitment = 'append' | 'cap'

/** One cell of the sessions bar: a trained day, a day past the commitment, or a day still open. */
export type SessionCell = 'done' | 'extra' | 'open'

/**
 * The sessions bar as cells, or `null` when there are too many to draw and the
 * card falls back to a plain bar. `append` adds a cell per day past the
 * commitment; `cap` stops at the commitment.
 */
export function sessionCells(
  row: WholeBodySessionsRow,
  pastCommitment: SessionsPastCommitment
): SessionCell[] | null {
  const extra = pastCommitment === 'append' ? Math.max(0, row.counted - row.committed) : 0
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

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Which sessions caption leads. Round-2 comparison (VW-455). */
export type SessionsCaptionKey = 'due' | 'leaving'

/** The sessions card's detail lines: what is due, anything past the commitment, what leaves this week. */
export function sessionCaptions(row: WholeBodySessionsRow): CaptionLine[] {
  const lines: CaptionLine[] = []
  if (row.dueByNow <= 0) lines.push({ key: 'due', text: 'Window started today' })
  else if (row.dueByNow < row.committed) {
    lines.push({ key: 'due', text: `${Math.round(row.dueByNow)} due by now` })
  }
  if (row.counted > row.committed) {
    lines.push({ key: 'over', text: `${row.counted - row.committed} over your commitment` })
  }
  if (row.agingOutNext7d !== null) {
    const text =
      row.agingOutNext7d === 0
        ? 'None leave the window this week'
        : `${plural(row.agingOutNext7d, 'day leaves', 'days leave')} the window this week`
    lines.push({ key: 'leaving', text })
  }
  return lines
}

/** The domain a band track spans: the band in the middle third, widened so an outlying weigh-in stays on the track. */
export function bandDomain(
  low: number,
  high: number,
  latest: number | null
): { min: number; max: number } {
  const lo = Math.min(low, high)
  const hi = Math.max(low, high)
  const span = Math.max(hi - lo, ((lo + hi) / 2) * 0.01)
  const pad = span * 0.25
  const min = Math.min(lo - span, latest === null ? lo : latest - pad)
  const max = Math.max(hi + span, latest === null ? hi : latest + pad)
  return { min: round1(min), max: round1(max) }
}

export type BandPosition = 'inside' | 'above' | 'below'

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

/** The phase tag: the phase in one word, and how long it has run. */
export function phaseLabel(phase: WholeBodyWeightRow['phase']): string {
  if (phase.name === 'unknown') return PHASE_WORD.unknown
  const word =
    phase.name === 'recomposition'
      ? `Recomp, ${phase.slowLoss === true ? 'slow loss' : 'hold'}`
      : PHASE_WORD[phase.name]
  return phase.weeksInPhase > 0 ? `${word} · week ${phase.weeksInPhase}` : word
}

const PHASE_NOUN: Record<WholeBodyDietPhase, string> = {
  'fat-loss': 'a cut',
  gain: 'a gain',
  maintenance: 'a hold',
  recomposition: 'this recomp',
  unknown: 'this phase',
}

/** The rate line: the observed %/wk against the phase's rate, or why there is none yet. */
export function rateCaption(row: WholeBodyWeightRow): string | null {
  const rate = row.rate
  if (row.latest === null) return null
  if (rate === null || rate.observedPctPerWeek === null) {
    return 'Rate shows after a second week of weigh-ins'
  }
  const observed = `${formatSignedRate(rate.observedPctPerWeek)} %/wk`
  if (rate.vetoed) return `${observed}, not judged this week`
  if (rate.bandLowPctPerWeek === null || rate.bandHighPctPerWeek === null) {
    return `${observed}, no target rate for ${PHASE_NOUN[row.phase.name]}`
  }
  const band =
    rate.bandLowPctPerWeek === rate.bandHighPctPerWeek
      ? formatSignedRate(rate.bandLowPctPerWeek)
      : `${formatSignedRate(rate.bandLowPctPerWeek)} to ${formatSignedRate(rate.bandHighPctPerWeek)}`
  return `${observed} against ${band} for ${PHASE_NOUN[row.phase.name]}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `2026-09-18T07:10:00Z` as `Sep 18`, in UTC so a fixture renders the same on every machine. */
export function weighInDate(ts: string): string {
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return ''
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
