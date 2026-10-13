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
 * even-odd fill or a stroked outline would show it. This cuts the loop out at the crossing, which
 * becomes the side's joint between leg and tail.
 */
function unfold(side: CheckMarkPoint[]): { side: CheckMarkPoint[]; joint: number } {
  for (let i = 0; i + 1 < side.length; i++) {
    for (let j = i + 2; j + 1 < side.length; j++) {
      const hit = crossing(side[i], side[i + 1], side[j], side[j + 1])
      if (hit) return { side: [...side.slice(0, i + 1), hit, ...side.slice(j + 1)], joint: i + 1 }
    }
  }
  return { side, joint: LEAD_SAMPLES }
}

/**
 * The start is cut on the vertical through the inner side's first point: outer points left of it
 * are dropped, and the cut meets the outer side at one new point.
 */
function cutSides(weight: number) {
  const { outer, inner } = offsetSides(weight)
  const cutX = inner[0][0]
  const firstKept = outer.findIndex((q) => q[0] >= cutX)
  const [a, b] = [outer[firstKept - 1], outer[firstKept]]
  const hit = snap([cutX, a[1] + ((b[1] - a[1]) * (cutX - a[0])) / (b[0] - a[0])])
  return { outer: [hit, ...outer.slice(firstKept)], ...unfold(inner) }
}

/** The outline as a simple closed polygon, to hundredths of a unit. */
export function checkMarkOutline(weight: number): CheckMarkPoint[] {
  const { outer, side } = cutSides(weight)
  return [...outer, ...[...side].reverse()]
}

/** Chord-length parameters of a run of samples, from 0 at its first to 1 at its last. */
function chordParameters(run: CheckMarkPoint[]): number[] {
  const travelled = [0]
  for (let i = 1; i < run.length; i++) {
    travelled.push(
      travelled[i - 1] + Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1])
    )
  }
  return travelled.map((d) => d / travelled[run.length - 1])
}

/**
 * The cubic from a run's first sample to its last whose two handles best fit the samples between,
 * by least squares over chord length. Returns the handles and the end, as a `C` command takes them.
 */
function fitCubic(run: CheckMarkPoint[]): CheckMarkPoint[] {
  const [first, last] = [run[0], run[run.length - 1]]
  let [a11, a12, a22] = [0, 0, 0]
  const [r1, r2] = [
    [0, 0],
    [0, 0],
  ]
  chordParameters(run).forEach((t, i) => {
    const u = 1 - t
    const [b0, b1, b2, b3] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
    a11 += b1 * b1
    a12 += b1 * b2
    a22 += b2 * b2
    for (const axis of [0, 1]) {
      const rest = run[i][axis] - b0 * first[axis] - b3 * last[axis]
      r1[axis] += b1 * rest
      r2[axis] += b2 * rest
    }
  })
  const det = a11 * a22 - a12 * a12
  const solve = (axis: number) => [
    (a22 * r1[axis] - a12 * r2[axis]) / det,
    (a11 * r2[axis] - a12 * r1[axis]) / det,
  ]
  const [x, y] = [solve(0), solve(1)]
  return [snap([x[0], y[0]]), snap([x[1], y[1]]), last]
}

/**
 * The outline as compact path data: the straight cut and leg, the apex corner, then each side of
 * the tail as one cubic fitted to {@link checkMarkOutline}'s samples, a fifth of its size.
 */
export function checkMarkPath(weight: number): string {
  const { outer, side, joint } = cutSides(weight)
  const apex = outer.length - TAIL_SAMPLES - 1
  const innerTail = side.slice(joint).reverse()
  const at = (q: CheckMarkPoint) => `${String(q[0])} ${String(q[1])}`
  const commands = [
    // eslint-disable-next-line titan/no-raw-composition -- icon outline geometry, not chart data; d3-shape has no offset-curve fit
    `M${at(outer[0])}`,
    ...[outer[apex - 1], outer[apex], outer[apex + 1]].map((q) => `L${at(q)}`),
    `C${fitCubic(outer.slice(apex + 1))
      .map(at)
      .join(' ')}`,
    `L${at(innerTail[0])}`,
    `C${fitCubic(innerTail).map(at).join(' ')}`,
    `L${at(side[0])}`,
    'Z',
  ]
  return commands.join(' ')
}
