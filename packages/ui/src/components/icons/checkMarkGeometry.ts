/**
 * Geometry of the {@link CheckMark}: a brush stroke that swells at the apex and tapers to a
 * hairline, with its start cut flat on the vertical. Everything is in the 24-unit icon viewBox
 * and every thickness is a multiple of the stroke weight, so the mark is the same shape at any
 * rendered size.
 */

export type CheckMarkPoint = readonly [number, number]

interface Sample {
  point: CheckMarkPoint
  /** Half the stroke's thickness here, in stroke weights. */
  halfWidth: number
}

export const CHECK_MARK_START: CheckMarkPoint = [4.3, 12.5]
export const CHECK_MARK_APEX: CheckMarkPoint = [9.3, 17.6]
export const CHECK_MARK_BEND: CheckMarkPoint = [12.6, 11.4]
export const CHECK_MARK_TIP: CheckMarkPoint = [20.8, 4.4]

const LEAD_SAMPLES = 8
const TAIL_SAMPLES = 24
const START_HALF_WIDTH = 0.5
const APEX_HALF_WIDTH = 0.62
const TAIL_TAPER = 0.54
const TAIL_TAPER_EXPONENT = 1.4

/**
 * The draw-on spine: the skeleton, short leg first, from half a unit before the start to half a
 * unit past the tip. Every outline point lies between those ends, so the spine's butt caps never
 * clip the mark and a fully drawn mask equals the static mark.
 */
export const CHECK_MARK_SPINE = 'M3.95 12.14 L9.3 17.6 Q12.6 11.4 21.18 4.08'

/** The draw-on mask is this many stroke weights wide, enough to cover the swell at the apex. */
export const CHECK_MARK_MASK_WIDTH = 2.6

const lerp = (a: CheckMarkPoint, b: CheckMarkPoint, t: number): CheckMarkPoint => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
]
const quad = (a: CheckMarkPoint, c: CheckMarkPoint, b: CheckMarkPoint, t: number) =>
  lerp(lerp(a, c, t), lerp(c, b, t), t)
const toHundredths = (v: number) => Math.round(v * 100) / 100
const snap = (q: CheckMarkPoint): CheckMarkPoint => [toHundredths(q[0]), toHundredths(q[1])]

/** The centreline: a straight short leg, then a quadratic tail that tapers to the tip. */
function skeleton(): Sample[] {
  const samples: Sample[] = []
  for (let i = 0; i <= LEAD_SAMPLES; i++) {
    const t = i / LEAD_SAMPLES
    samples.push({
      point: lerp(CHECK_MARK_START, CHECK_MARK_APEX, t),
      halfWidth: START_HALF_WIDTH + (APEX_HALF_WIDTH - START_HALF_WIDTH) * t,
    })
  }
  for (let i = 1; i <= TAIL_SAMPLES; i++) {
    const t = i / TAIL_SAMPLES
    samples.push({
      point: quad(CHECK_MARK_APEX, CHECK_MARK_BEND, CHECK_MARK_TIP, t),
      halfWidth: APEX_HALF_WIDTH - TAIL_TAPER * Math.pow(t, TAIL_TAPER_EXPONENT),
    })
  }
  return samples
}

/** Offsets each sample both ways along the normal of its neighbours' chord. */
function offsetSides(weight: number) {
  const samples = skeleton()
  const outer: CheckMarkPoint[] = []
  const inner: CheckMarkPoint[] = []
  samples.forEach(({ point, halfWidth }, i) => {
    const a = samples[Math.max(0, i - 1)].point
    const b = samples[Math.min(samples.length - 1, i + 1)].point
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const nx = -(b[1] - a[1]) / length
    const ny = (b[0] - a[0]) / length
    const h = halfWidth * weight
    outer.push(snap([point[0] + nx * h, point[1] + ny * h]))
    inner.push(snap([point[0] - nx * h, point[1] - ny * h]))
  })
  return { outer, inner }
}

/** Where segments ab and cd cross, or null if they do not. */
function crossing(a: CheckMarkPoint, b: CheckMarkPoint, c: CheckMarkPoint, d: CheckMarkPoint) {
  const denominator = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0])
  if (denominator === 0) return null
  const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / denominator
  const u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / denominator
  return t > 0 && t < 1 && u > 0 && u < 1 ? snap(lerp(a, b, t)) : null
}

/**
 * The inner side overshoots the apex: the leg and the tail each run past the other before turning,
 * so the side crosses itself and winds a small loop inside the stroke. Nonzero fill hides it; an
 * even-odd fill or a stroked outline would show it. This cuts the loop out at the crossing.
 */
function unfold(side: CheckMarkPoint[]): CheckMarkPoint[] {
  for (let i = 0; i + 1 < side.length; i++) {
    for (let j = i + 2; j + 1 < side.length; j++) {
      const hit = crossing(side[i], side[i + 1], side[j], side[j + 1])
      if (hit) return [...side.slice(0, i + 1), hit, ...side.slice(j + 1)]
    }
  }
  return side
}

/**
 * The outline as a simple closed polygon, to hundredths of a unit. The start is cut on the
 * vertical through the inner side's first point: outer points left of it are dropped, and the cut
 * meets the outer side at one new point.
 */
export function checkMarkOutline(weight: number): CheckMarkPoint[] {
  const { outer, inner } = offsetSides(weight)
  const cutX = inner[0][0]
  const firstKept = outer.findIndex((q) => q[0] >= cutX)
  const [a, b] = [outer[firstKept - 1], outer[firstKept]]
  const hit = snap([cutX, a[1] + ((b[1] - a[1]) * (cutX - a[0])) / (b[0] - a[0])])
  return [hit, ...outer.slice(firstKept), ...unfold(inner).reverse()]
}
