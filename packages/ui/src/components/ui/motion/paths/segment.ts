// Line and cubic segment geometry. The approach (cubic arc length by Gauss-Legendre quadrature, cuts by
// de Casteljau) is ported from @remotion/paths (MIT, (c) 2023 JonnyBurger) at commit 4d9ff70e1f,
// helpers/bezier-functions.ts and cut-instruction.ts, which credit rveciana/svg-path-properties. The
// quadrature nodes are computed here rather than tabled; see ./LICENSE.
import type { PathPoint } from './parse'

/** Two points for a line, four for a cubic. */
export type Segment = readonly PathPoint[]

const QUADRATURE_ORDER = 24

function legendreNodes(n: number): { nodes: number[]; weights: number[] } {
  const nodes: number[] = []
  const weights: number[] = []
  for (let i = 1; i <= n; i++) {
    let x = Math.cos((Math.PI * (i - 0.25)) / (n + 0.5))
    let slope = 1
    for (let step = 0; step < 100; step++) {
      let [p0, p1] = [1, x]
      for (let j = 2; j <= n; j++) [p0, p1] = [p1, ((2 * j - 1) * x * p1 - (j - 1) * p0) / j]
      slope = (n * (x * p1 - p0)) / (x * x - 1)
      const dx = p1 / slope
      x -= dx
      if (Math.abs(dx) < 1e-15) break
    }
    nodes.push(x)
    weights.push(2 / ((1 - x * x) * slope * slope))
  }
  return { nodes, weights }
}

const { nodes: NODES, weights: WEIGHTS } = legendreNodes(QUADRATURE_ORDER)

const lerp = (a: PathPoint, b: PathPoint, t: number): PathPoint => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})

/** The point at curve parameter `t` in [0, 1]. */
export function pointAt(segment: Segment, t: number): PathPoint {
  const [p0, p1, p2, p3] = segment as [PathPoint, PathPoint, PathPoint?, PathPoint?]
  if (!p2 || !p3) return lerp(p0, p1, t)
  const ab = lerp(lerp(p0, p1, t), lerp(p1, p2, t), t)
  const bc = lerp(lerp(p1, p2, t), lerp(p2, p3, t), t)
  return lerp(ab, bc, t)
}

function derivative(segment: Segment, t: number): PathPoint {
  const [p0, p1, p2, p3] = segment as [PathPoint, PathPoint, PathPoint?, PathPoint?]
  if (!p2 || !p3) return { x: p1.x - p0.x, y: p1.y - p0.y }
  const u = 1 - t
  const [a, b, c] = [3 * u * u, 6 * u * t, 3 * t * t]
  return {
    x: a * (p1.x - p0.x) + b * (p2.x - p1.x) + c * (p3.x - p2.x),
    y: a * (p1.y - p0.y) + b * (p2.y - p1.y) + c * (p3.y - p2.y),
  }
}

function speed(segment: Segment, t: number): number {
  const d = derivative(segment, t)
  return Math.hypot(d.x, d.y)
}

/** Arc length from the start to parameter `t`. */
export function lengthTo(segment: Segment, t = 1): number {
  if (segment.length === 2)
    return Math.hypot(segment[1]!.x - segment[0]!.x, segment[1]!.y - segment[0]!.y) * t
  const half = t / 2
  let sum = 0
  for (let i = 0; i < QUADRATURE_ORDER; i++)
    sum += WEIGHTS[i]! * speed(segment, half * NODES[i]! + half)
  return half * sum
}

/** The parameter at arc length `s`, by Newton steps kept inside a shrinking bisection bracket. */
export function parameterAt(segment: Segment, s: number, total = lengthTo(segment)): number {
  if (total === 0 || s <= 0) return 0
  if (s >= total) return 1
  if (segment.length === 2) return s / total
  let [lo, hi, t] = [0, 1, s / total]
  for (let step = 0; step < 40; step++) {
    const error = lengthTo(segment, t) - s
    if (Math.abs(error) < 1e-10 * total) break
    if (error > 0) hi = t
    else lo = t
    const next = t - error / speed(segment, t)
    t = next > lo && next < hi ? next : (lo + hi) / 2
  }
  return t
}

/** Unit tangent at parameter `t`; a stationary point (a collapsed control point) reads its neighbourhood. */
export function tangentAt(segment: Segment, t: number): PathPoint {
  let d = derivative(segment, t)
  if (Math.hypot(d.x, d.y) < 1e-12) {
    const [a, b] = [
      pointAt(segment, Math.max(0, t - 1e-4)),
      pointAt(segment, Math.min(1, t + 1e-4)),
    ]
    d = { x: b.x - a.x, y: b.y - a.y }
  }
  const norm = Math.hypot(d.x, d.y)
  return norm === 0 ? { x: 0, y: 0 } : { x: d.x / norm, y: d.y / norm }
}

/** The part of the segment from its start to parameter `t` (de Casteljau). */
export function headOf(segment: Segment, t: number): Segment {
  const [p0, p1, p2, p3] = segment as [PathPoint, PathPoint, PathPoint?, PathPoint?]
  if (!p2 || !p3) return [p0, lerp(p0, p1, t)]
  const [a, b, c] = [lerp(p0, p1, t), lerp(p1, p2, t), lerp(p2, p3, t)]
  const [ab, bc] = [lerp(a, b, t), lerp(b, c, t)]
  return [p0, a, ab, lerp(ab, bc, t)]
}

/** The part of the segment from parameter `t` to its end. */
export function tailOf(segment: Segment, t: number): Segment {
  return [...headOf([...segment].reverse(), 1 - t)].reverse()
}
