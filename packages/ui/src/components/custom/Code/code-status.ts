import type { ColorToken } from '../../../theme/resolve-color'
import { formatCompact, formatSignedCompact } from '../../../utils/number-format'
import type { IndicatorColor } from '../../ui/indicator'
import type { PillTone } from '../../ui/pill'
import type { TypographyColor } from '../../ui/typography'
import type {
  CodeBudgetBand,
  CodeChangeKind,
  CodeCouplingClass,
  CodeCutoff,
  CodeScoreBand,
} from './types'

// Every word-to-label-and-tone mapping of the family lives here, so no component writes a tone
// literal next to a status word. A status is never colour alone: the word is visible, or the
// accessible name carries it.

export const CODE_CHANGE_META: Record<
  CodeChangeKind,
  { label: string; name: string; tone: PillTone }
> = {
  'crossed-cutoff': { label: 'Crossed cutoff', name: 'Crossed the cutoff', tone: 'error' },
  entered: { label: 'Entered', name: 'Entered the ranking', tone: 'warning' },
  'new-file': { label: 'New', name: 'New file', tone: 'info' },
  worsened: { label: 'Worsened', name: 'Worsened', tone: 'warning' },
  improved: { label: 'Improved', name: 'Improved', tone: 'success' },
  resolved: { label: 'Resolved', name: 'Resolved', tone: 'success' },
}

export const CODE_CHANGE_ORDER: CodeChangeKind[] = [
  'crossed-cutoff',
  'entered',
  'new-file',
  'worsened',
  'improved',
  'resolved',
]

/** The meta tone, except `worsened` over the cutoff, which is `error`. */
export function changeTone(kind: CodeChangeKind, isOverCutoff = false): PillTone {
  if (kind === 'worsened' && isOverCutoff) return 'error'
  return CODE_CHANGE_META[kind].tone
}

function hasDelta(kind: CodeChangeKind, delta?: number): delta is number {
  return (
    (kind === 'worsened' || kind === 'improved') &&
    delta !== undefined &&
    Number.isFinite(delta) &&
    delta !== 0
  )
}

/** The visible text: a signed magnitude for worsened and improved with a delta, else the word. The kind decides the sign. */
export function changeLabel(kind: CodeChangeKind, delta?: number): string {
  if (!hasDelta(kind, delta)) return CODE_CHANGE_META[kind].label
  const magnitude = Math.abs(delta)
  return formatSignedCompact(kind === 'worsened' ? magnitude : -magnitude)
}

/** The accessible name: the kind in words, with the magnitude when there is a delta. */
export function changeName(kind: CodeChangeKind, delta?: number): string {
  const { name } = CODE_CHANGE_META[kind]
  return hasDelta(kind, delta) ? `${name} by ${formatCompact(Math.abs(delta))}` : name
}

function isValidCutoff(cutoff?: CodeCutoff | null): cutoff is CodeCutoff {
  return !!cutoff && Number.isFinite(cutoff.value) && cutoff.value > 0
}

/** `null` for a missing score or no valid cutoff. `over` at or above the cutoff, `elevated` at or above a valid elevated value below it, else `watch`. */
export function scoreBand(
  score: number | null | undefined,
  cutoff?: CodeCutoff | null,
  elevated?: CodeCutoff | null
): CodeScoreBand | null {
  if (score == null || !Number.isFinite(score) || !isValidCutoff(cutoff)) return null
  if (score >= cutoff.value) return 'over'
  const hasElevated =
    !!elevated &&
    Number.isFinite(elevated.value) &&
    elevated.value > 0 &&
    elevated.value < cutoff.value
  return hasElevated && score >= elevated.value ? 'elevated' : 'watch'
}

export const SCORE_BAND_META: Record<
  CodeScoreBand,
  { color: ColorToken; indicator: IndicatorColor }
> = {
  over: { color: 'status-error', indicator: 'error' },
  elevated: { color: 'status-warning', indicator: 'warning' },
  watch: { color: 'status-info', indicator: 'info' },
}

/** A budget that is missing, not finite, zero or negative, and a missing value, are `unbudgeted`. */
export function budgetBand(
  value: number | null | undefined,
  budget?: number,
  nearRatio = 0.75
): CodeBudgetBand {
  if (budget === undefined || !Number.isFinite(budget) || budget <= 0) return 'unbudgeted'
  if (value == null || !Number.isFinite(value)) return 'unbudgeted'
  if (value >= budget) return 'over'
  return value >= budget * nearRatio ? 'near' : 'within'
}

export const BUDGET_BAND_META: Record<
  CodeBudgetBand,
  {
    color: TypographyColor
    word: string | null
    fill: ColorToken
    flagTone: 'error' | 'warning' | null
  }
> = {
  over: { color: 'error', word: 'over budget', fill: 'status-error', flagTone: 'error' },
  near: { color: 'warning', word: 'near budget', fill: 'status-warning', flagTone: 'warning' },
  within: { color: 'primary', word: null, fill: 'text-tertiary', flagTone: null },
  unbudgeted: { color: 'primary', word: null, fill: 'text-tertiary', flagTone: null },
}

export const CODE_COUPLING_CLASS_META: Record<
  CodeCouplingClass,
  { label: string; tone: PillTone }
> = {
  hidden: { label: 'Hidden', tone: 'warning' },
  expected: { label: 'Expected', tone: 'neutral' },
  unverifiable: { label: 'Unverifiable', tone: 'neutral' },
}
