import type { RepVelocityCurve } from './fatigue-model'
import { formatVelocity } from '../../../utils/workout-format'

export type GhostSparkSummaryInput =
  | { curves: RepVelocityCurve[] }
  | { left: RepVelocityCurve[]; right: RepVelocityCurve[] }

/** Peak velocity of a rep in m/s, or `null` when it has no finite sample. */
function peakMps(curve: RepVelocityCurve | undefined): number | null {
  const finite = (curve?.samples ?? []).map((s) => s.velocityMps).filter(Number.isFinite)
  return finite.length > 0 ? Math.max(...finite) : null
}

const fmt = (v: number) => `${formatVelocity(v)} m/s`

function peakPhrase(prefix: string, curve: RepVelocityCurve | undefined): string | null {
  const peak = peakMps(curve)
  return peak == null ? null : `${prefix}${fmt(peak)}`
}

function repPhrase(curves: RepVelocityCurve[]): string {
  const cur = curves[curves.length - 1]
  const total = curves.length
  return Number.isFinite(cur.repNumber) ? `Rep ${cur.repNumber} of ${total}` : `${total} reps`
}

/**
 * Screen-reader text for the ghost sparkline: the current rep, its peak velocity, and for
 * the dual each side's peak. Pure so the wording lives in one place; a value that cannot
 * be computed is left out rather than printed as `NaN`.
 */
export function ghostSparkSummary(input: GhostSparkSummaryInput): string {
  if ('curves' in input) {
    if (input.curves.length === 0) return 'No reps recorded yet'
    const cur = input.curves[input.curves.length - 1]
    return [repPhrase(input.curves), peakPhrase('peak ', cur)].filter(Boolean).join(', ')
  }
  const { left, right } = input
  const longer = left.length >= right.length ? left : right
  if (longer.length === 0) return 'No reps recorded yet'
  return [
    repPhrase(longer),
    peakPhrase('left peak ', left[left.length - 1]),
    peakPhrase('right peak ', right[right.length - 1]),
  ]
    .filter(Boolean)
    .join(', ')
}

/** The wrapper props that make a spark a labelled image; an explicit label wins. */
export function ghostSparkA11y(label: string | undefined, input: GhostSparkSummaryInput) {
  return {
    accessibilityRole: 'image' as const,
    accessibilityLabel: label ?? ghostSparkSummary(input),
  }
}
