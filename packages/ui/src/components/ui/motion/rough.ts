// Seeded hand-drawn strokes: a bowed line and an overshooting ellipse, as measured path models. The approach
// follows roughjs's line and ellipse renderers and rough-notation's use of them, both by Preet Shihn (MIT, see
// LICENSE-rough-notation beside this file); no lines are copied. Every jitter is `random(seed, key, slot)`, so
// equal arguments draw the identical stroke on every render, in any order.
import { serializeOps, type PathModel, type PathOp } from './paths/model'
import type { PathPoint } from './paths/parse'
import { lengthTo, type Segment } from './paths/segment'
import { random } from './random'

/** How rough a stroke is drawn. */
export interface RoughOptions {
  /** Scales every jitter; 0 draws a clean stroke. Default 1. */
  roughness?: number
  /** How far a line bows off its chord, per 100 px of length. Default 1. */
  bowing?: number
}

type Cubic = readonly [PathPoint, PathPoint, PathPoint]

/** The largest endpoint jitter, in px, at roughness 1 (roughjs's `maxRandomnessOffset`). */
const MAX_OFFSET_PX = 2
const ELLIPSE_STEPS = 9
/** Radial jitter of an ellipse point, as a share of its radius, at roughness 1. */
const ELLIPSE_RADIAL_JITTER = 0.04
/** How far an ellipse's second lap drifts outward by its end, as a share of the radius. */
const ELLIPSE_DRIFT = 0.06

/** Long lines jitter less, so a long stroke reads as one confident movement. */
function roughnessGain(length: number): number {
  if (length < 200) return 1
  if (length > 500) return 0.4
  return 1.233334 - 0.0016668 * length
}

/** A value in [-range, range] for `slot` of the stroke `key`. */
function jitter(seed: number | string, key: number, slot: number, range: number): number {
  return (random(seed, key, slot) * 2 - 1) * range
}

function modelOf(start: PathPoint, cubics: readonly Cubic[]): PathModel {
  const ops: PathOp[] = [{ type: 'M', point: start }]
  let from = start
  for (const [c1, c2, to] of cubics) {
    const segment: Segment = [from, c1, c2, to]
    ops.push({ type: 'segment', segment, length: lengthTo(segment), closes: false })
    from = to
  }
  const length = ops.reduce((sum, op) => sum + (op.type === 'segment' ? op.length : 0), 0)
  return { d: serializeOps(ops), length, ops }
}

/**
 * A hand-drawn line from `from` to `to`: one cubic whose ends wander and whose middle bows off the chord.
 * `key` tells apart the strokes that share a seed.
 */
export function roughLine(
  seed: number | string,
  key: number,
  from: PathPoint,
  to: PathPoint,
  { roughness = 1, bowing = 1 }: RoughOptions = {}
): PathModel {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  const spread = roughness * roughnessGain(length)
  const offset = Math.min(MAX_OFFSET_PX, length / 10) * spread
  const bow = (bowing * MAX_OFFSET_PX * spread) / 200
  const bowX = jitter(seed, key, 0, bow * dy)
  const bowY = jitter(seed, key, 1, -bow * dx)
  const diverge = 0.2 + random(seed, key, 2) * 0.2
  const wobble = (slot: number) => jitter(seed, key, slot, offset)
  const at = (share: number, slot: number): PathPoint => ({
    x: from.x + dx * share + bowX + wobble(slot),
    y: from.y + dy * share + bowY + wobble(slot + 1),
  })
  const start = { x: from.x + wobble(3), y: from.y + wobble(4) }
  const end = { x: to.x + wobble(5), y: to.y + wobble(6) }
  return modelOf(start, [[at(diverge, 7), at(2 * diverge, 9), end]])
}

/** Points round the ellipse: one lap, then an overshoot that drifts outward so the ends never meet. */
function ellipsePoints(
  seed: number | string,
  key: number,
  { center, rx, ry, roughness }: { center: PathPoint; rx: number; ry: number; roughness: number }
): PathPoint[] {
  const step = (2 * Math.PI) / ELLIPSE_STEPS
  const startAngle = -Math.PI / 2 - 0.4 + jitter(seed, key, 0, 0.3 * roughness)
  const overshoot = step * (0.6 + 0.6 * random(seed, key, 1))
  const drift = ELLIPSE_DRIFT * roughness * (0.5 + random(seed, key, 2))
  const sweep = 2 * Math.PI + overshoot
  const count = Math.ceil(sweep / step)
  return Array.from({ length: count + 1 }, (_, i) => {
    const share = Math.min(1, (i * step) / sweep)
    const angle = startAngle + share * sweep
    const scale = 1 + jitter(seed, key, 3 + i, ELLIPSE_RADIAL_JITTER * roughness) + drift * share
    return {
      x: center.x + Math.cos(angle) * rx * scale,
      y: center.y + Math.sin(angle) * ry * scale,
    }
  })
}

/** Catmull-Rom through `points` as cubics, with the end tangents taken from the end chords. */
function catmullRom(points: readonly PathPoint[]): Cubic[] {
  const at = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))] as PathPoint
  return points.slice(1).map((to, index) => {
    const [before, from, after] = [at(index - 1), at(index), at(index + 2)]
    return [
      { x: from.x + (to.x - before.x) / 6, y: from.y + (to.y - before.y) / 6 },
      { x: to.x - (after.x - from.x) / 6, y: to.y - (after.y - from.y) / 6 },
      to,
    ] as const
  })
}

/**
 * A hand-drawn ellipse round `center` with radii `rx` and `ry`: one wobbly lap that carries on past its
 * start, as a pen circling a word does.
 */
export function roughEllipse(
  seed: number | string,
  key: number,
  center: PathPoint,
  [rx, ry]: readonly [number, number],
  { roughness = 1 }: RoughOptions = {}
): PathModel {
  const points = ellipsePoints(seed, key, { center, rx, ry, roughness })
  return modelOf(points[0] as PathPoint, catmullRom(points))
}
