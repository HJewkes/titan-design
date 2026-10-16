// Domains and ticks every ui chart shares. Ported from the Workout charts (TD-34 S2); the
// GoalTrajectory originals stay in place until S8 rebases them onto this module.

/** A numeric axis domain; `min < max` always holds. */
export interface Domain {
  min: number
  max: number
}

export interface DomainPadding {
  /** Length of the axis in px. */
  extent: number
  /** px kept clear at each end so a mark never sits on the plot edge; at least 1. */
  padding?: number
}

export interface LinearDomainInput extends DomainPadding {
  values: readonly number[]
  /** Values the axis must show although they are not data, such as reference lines. */
  referenceValues?: readonly number[]
  includeZero?: boolean
}

export interface TimeDomainInput extends DomainPadding {
  timestamps: readonly (number | Date)[]
  /** How far a lone timestamp is widened on each side, in ms. Defaults to one day. */
  loneHalfWidth?: number
}

const DEFAULT_PADDING_PX = 8
const DAY_MS = 86_400_000
const EMPTY_DOMAIN: Domain = { min: 0, max: 1 }
// A spread this small relative to the values reads as flat, so floats cannot collapse the padding.
const FLAT_RELATIVE_SPREAD = 1e-6

function finiteExtent(values: readonly number[]): Domain | undefined {
  let min = Infinity
  let max = -Infinity
  for (const value of values) {
    if (!Number.isFinite(value)) continue
    min = Math.min(min, value)
    max = Math.max(max, value)
  }
  return min <= max ? { min, max } : undefined
}

function isFlat({ min, max }: Domain): boolean {
  const magnitude = Math.max(Math.abs(min), Math.abs(max), 1)
  return max - min < magnitude * FLAT_RELATIVE_SPREAD
}

/** Grows `extent` symmetrically to `minSpan`, centred where it was. */
function widenAround(extent: Domain, minSpan: number): Domain {
  const centre = (extent.min + extent.max) / 2
  return { min: centre - minSpan / 2, max: centre + minSpan / 2 }
}

/** Adds `padding` px of domain at each end, measured in the padded axis's own units. */
function padByPixels(
  domain: Domain,
  { extent, padding = DEFAULT_PADDING_PX }: DomainPadding
): Domain {
  const pad = Math.max(padding, 1)
  const usable = Math.max(extent - 2 * pad, 1)
  const perPx = (domain.max - domain.min) / usable
  return { min: domain.min - pad * perPx, max: domain.max + pad * perPx }
}

/**
 * A linear domain holding every finite value, the reference values and, with `includeZero`,
 * zero, padded so no mark sits on an edge. A flat input widens to a span of 10% of its
 * value or 1, whichever is larger; no finite input gives `[0, 1]`.
 */
export function linearDomain(input: LinearDomainInput): Domain {
  const { values, referenceValues = [], includeZero = false } = input
  const extent = finiteExtent([...values, ...referenceValues, ...(includeZero ? [0] : [])])
  if (!extent) return EMPTY_DOMAIN
  const centre = (extent.min + extent.max) / 2
  const flatSpan = Math.max(Math.abs(centre) * 0.1, 1)
  return padByPixels(isFlat(extent) ? widenAround(extent, flatSpan) : extent, input)
}

/**
 * A time domain in epoch ms, padded like `linearDomain`. One timestamp is widened by
 * `loneHalfWidth` on each side, so it sits in the centre rather than on the left edge.
 */
export function timeDomain(input: TimeDomainInput): Domain {
  const { timestamps, loneHalfWidth = DAY_MS } = input
  const extent = finiteExtent(timestamps.map((t) => (t instanceof Date ? t.getTime() : t)))
  if (!extent) return EMPTY_DOMAIN
  const lone = extent.max === extent.min
  return padByPixels(lone ? widenAround(extent, 2 * Math.max(loneHalfWidth, 1)) : extent, input)
}

/**
 * Round-valued ticks, at most one more than asked. d3's step for a count can
 * overshoot it (a 14-unit span at 5 gives 7, at step 2), so the request shrinks
 * until the lines fit; one extra is allowed so a 25-unit span keeps its six
 * lines at step 5 rather than collapsing to three at step 10.
 */
export function cappedTicks(
  scale: { ticks: (count: number) => number[] },
  target: number
): number[] {
  const max = target + 1
  for (let count = target; count > 1; count--) {
    const ticks = scale.ticks(count)
    if (ticks.length <= max) return ticks
  }
  return scale.ticks(1).slice(0, max)
}
