import { formatVelocityLoss } from '../../../utils/workout-format'
import type { StatusGlyphTone } from '../../ui/status-glyph'

/** What a set was for: working sets are scored; warm-up and other (technique) sets draw narrow and grey. */
export type SetLossPurpose = 'working' | 'warmup' | 'other'

/** Reps against the set's target: over draws an up triangle, under a down triangle. */
export type SetRepMark = 'over' | 'under'

/** One set column of {@link SetLossStrip}. */
export interface SetLossStripSet {
  /** The set number. `markedIndex` and `bestE1rmIndex` name a set by this, not by array position. */
  index: number
  /** Replaces the `#index` column label, e.g. `#1 L` for one side of a bilateral set. */
  label?: string
  /** Velocity loss (%) across the set. `null` is no data and draws the hatch, never a zero bar. */
  lossPct: number | null
  purpose: SetLossPurpose
  /** `false` draws the bar hollow: the set was logged but not scored. Defaults to `true`. */
  scored?: boolean
  reps: number
  repMark?: SetRepMark | null
  /** The load as the consumer formats it, unit included (`100lb`). */
  loadLabel: string
  /** Estimated one-rep max for the set; `null` or omitted leaves the cell empty. */
  e1rm?: number | null
}

/** Column size: `phone` for the card, `wall` for the session-complete wall. */
export type SetLossStripScale = 'phone' | 'wall'

export type SetLossMarkTone = StatusGlyphTone

/** Fixed per-scale geometry, so every strip on a page shares one column width and one height. */
export const SET_LOSS_GEOMETRY: Record<
  SetLossStripScale,
  { column: number; plot: number; gutter: number }
> = {
  phone: { column: 44, plot: 96, gutter: 52 },
  wall: { column: 60, plot: 144, gutter: 60 },
}

/** The loss (%) a full-height bar shows. Fixed, so a bar's height reads the same in every strip. */
export const DEFAULT_LOSS_CEILING_PCT = 40

/** A warm-up or other bar is this fraction of a working bar's width (the second encoding). */
export const MUTED_BAR_WIDTH_RATIO = 0.5

/** The smallest drawn height (px) of a measured loss, so 0% still reads as a bar, not as missing. */
const MIN_BAR_PX = 2

/** Pixels up from the baseline for a loss on the fixed scale; clamped to 0..ceiling. */
export function lossToPx(lossPct: number, ceilingPct: number, plotPx: number): number {
  if (ceilingPct <= 0) return 0
  return (Math.min(Math.max(lossPct, 0), ceilingPct) / ceilingPct) * plotPx
}

/** The drawn bar height (px) for a measured loss. */
export function barHeightPx(lossPct: number, ceilingPct: number, plotPx: number): number {
  return Math.max(MIN_BAR_PX, lossToPx(lossPct, ceilingPct, plotPx))
}

/** The column label: the override, else `#index`. */
export function setName(set: SetLossStripSet): string {
  return set.label ?? `#${String(set.index)}`
}

function describeSet(set: SetLossStripSet): string {
  const parts = [setName(set)]
  if (set.purpose === 'warmup') parts.push('warm-up')
  if (set.purpose === 'other') parts.push('other')
  if (set.scored === false) parts.push('not scored')
  parts.push(set.lossPct == null ? 'no data' : formatVelocityLoss(set.lossPct))
  return parts.join(' ')
}

/** The strip's accessible name: every set's loss in order, then the marked set. */
export function setLossAccessibilityLabel(
  sets: readonly SetLossStripSet[],
  marked?: { index: number; label?: string }
): string {
  const losses = `Velocity loss by set: ${sets.map(describeSet).join(', ')}.`
  const markedSet = marked ? sets.find((s) => s.index === marked.index) : undefined
  if (!markedSet) return losses
  const word = marked?.label ? `, ${marked.label}` : ''
  return `${losses} ${setName(markedSet)} marked${word}.`
}
