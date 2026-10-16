// Path measurement: length, point, tangent and cut by arc length. Ported from @remotion/paths (MIT, (c) 2023
// JonnyBurger) at commit 4d9ff70e1f: get-length.ts, get-point-at-length.ts, get-tangent-at-length.ts,
// cut-path.ts and reduce-instructions.ts, whose helpers credit rveciana/svg-path-properties; see ./LICENSE.
// Reshaped around a cached model so repeated reads of one `d` parse it once.
import { arcToCubics } from './arc'
import { parsePath, type PathCommand, type PathPoint } from './parse'
import { headOf, lengthTo, parameterAt, pointAt, tangentAt, type Segment } from './segment'

/** One step of a reduced path: a moveto, or a line or cubic segment (`closes` marks a `Z`). */
export type PathOp =
  | { type: 'M'; point: PathPoint }
  | { type: 'segment'; segment: readonly PathPoint[]; length: number; closes: boolean }

/** A parsed and measured path. Build one with `pathModel(d)` and pass it wherever a `d` string is accepted. */
export interface PathModel {
  /** The source path data. */
  readonly d: string
  /** Total arc length. */
  readonly length: number
  /** The path reduced to movetos, lines and cubics, with each segment's length. */
  readonly ops: readonly PathOp[]
}

function segmentOp(segment: Segment, closes = false): PathOp {
  return { type: 'segment', segment, length: lengthTo(segment), closes }
}

function reduceCommand(command: PathCommand, from: PathPoint, start: PathPoint): PathOp[] {
  switch (command.type) {
    case 'M':
      return [{ type: 'M', point: { x: command.x, y: command.y } }]
    case 'L':
      return [segmentOp([from, { x: command.x, y: command.y }])]
    case 'Z':
      return [segmentOp([from, start], true)]
    case 'C':
      return [
        segmentOp([
          from,
          { x: command.x1, y: command.y1 },
          { x: command.x2, y: command.y2 },
          command,
        ]),
      ]
    case 'Q': {
      // Degree elevation: a quadratic is the cubic with controls two thirds of the way to its control point.
      const c = { x: command.x1, y: command.y1 }
      const to = { x: command.x, y: command.y }
      return [segmentOp([from, lerpPoint(from, c, 2 / 3), lerpPoint(to, c, 2 / 3), to])]
    }
    case 'A': {
      const to = { x: command.x, y: command.y }
      const cubics = arcToCubics({ ...command, from, to })
      if (!cubics) return [segmentOp([from, to])]
      return cubics.map((tail, i) => segmentOp([i === 0 ? from : cubics[i - 1]![2], ...tail]))
    }
  }
}

function lerpPoint(a: PathPoint, b: PathPoint, t: number): PathPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function reduce(commands: readonly PathCommand[]): PathOp[] {
  const ops: PathOp[] = []
  let current: PathPoint = { x: 0, y: 0 }
  let start = current
  for (const command of commands) {
    ops.push(...reduceCommand(command, current, start))
    if (command.type === 'Z') current = start
    else current = { x: command.x, y: command.y }
    if (command.type === 'M') start = current
  }
  return ops
}

function buildModel(d: string): PathModel {
  const ops = reduce(parsePath(d))
  const length = ops.reduce((sum, op) => sum + (op.type === 'segment' ? op.length : 0), 0)
  return { d, length, ops }
}

const CACHE_LIMIT = 64
const cache = new Map<string, PathModel>()

/** Parses and measures `d` once; later calls with the same string reuse the model. */
export function pathModel(d: string): PathModel {
  const hit = cache.get(d)
  if (hit) return hit
  const model = buildModel(d)
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  cache.set(d, model)
  return model
}

const modelOf = (path: string | PathModel): PathModel =>
  typeof path === 'string' ? pathModel(path) : path

/** Total arc length of a path. `pathLength('M0 0 L3 4')` is 5. */
export function pathLength(path: string | PathModel): number {
  return modelOf(path).length
}

interface Located {
  segment: Segment
  t: number
}

function locate(model: PathModel, at: number): Located | null {
  const s = Math.min(model.length, Math.max(0, at))
  let walked = 0
  let last: Located | null = null
  for (const op of model.ops) {
    if (op.type !== 'segment' || op.length === 0) continue
    if (walked + op.length >= s)
      return { segment: op.segment, t: parameterAt(op.segment, s - walked, op.length) }
    walked += op.length
    last = { segment: op.segment, t: 1 }
  }
  return last
}

function firstPoint(model: PathModel): PathPoint {
  const first = model.ops[0]
  if (!first) return { x: 0, y: 0 }
  return first.type === 'M' ? first.point : first.segment[0]!
}

/** The point at arc length `at`, clamped to the path. A path with no length gives its first point. */
export function pointAtLength(path: string | PathModel, at: number): PathPoint {
  const model = modelOf(path)
  const found = locate(model, at)
  return found ? pointAt(found.segment, found.t) : firstPoint(model)
}

/** The unit tangent at arc length `at`, clamped to the path; `{ x: 0, y: 0 }` for a path with no length. */
export function tangentAtLength(path: string | PathModel, at: number): PathPoint {
  const found = locate(modelOf(path), at)
  return found ? tangentAt(found.segment, found.t) : { x: 0, y: 0 }
}

const num = (n: number): string => String(Math.round(n * 1e6) / 1e6)

function serializeOp(op: PathOp): string {
  // eslint-disable-next-line titan/no-raw-composition -- the path toolkit is the serialiser path consumers build on
  if (op.type === 'M') return `M${num(op.point.x)} ${num(op.point.y)}`
  if (op.closes) return 'Z'
  const points = op.segment.slice(1).map((p) => `${num(p.x)} ${num(p.y)}`)
  return `${op.segment.length === 2 ? 'L' : 'C'}${points.join(' ')}`
}

/** Path data for reduced ops, in absolute `M L C Z`. */
export function serializeOps(ops: readonly PathOp[]): string {
  return ops.map(serializeOp).join('')
}

/**
 * The first `length` of the path as path data in absolute `M L C Z` (arcs and quadratics come back as cubics).
 * A cut inside a `Z` ends with the line toward the subpath start.
 */
export function cutPath(path: string | PathModel, length: number): string {
  const kept: PathOp[] = []
  let walked = 0
  for (const op of modelOf(path).ops) {
    if (op.type === 'M') {
      if (kept.length > 0 && walked >= length) break
      kept.push(op)
      continue
    }
    const remaining = length - walked
    if (op.length <= remaining) {
      kept.push(op)
      walked += op.length
      continue
    }
    if (remaining > 0)
      kept.push({
        ...op,
        segment: headOf(op.segment, parameterAt(op.segment, remaining)),
        closes: false,
      })
    break
  }
  return serializeOps(kept)
}

/** Stroke dash values that draw a path on. */
export interface DrawOnStyle {
  /** One dash as long as the path. */
  strokeDasharray: number
  /** How much of the path is still hidden. */
  strokeDashoffset: number
}

/**
 * Dash values that reveal the first `progress` (clamped to [0, 1]) of a stroke of the given length. They take a
 * measured length, so they work on react-native-svg as well as on the web, without `pathLength={1}`.
 */
export function drawOn(length: number, progress: number): DrawOnStyle {
  const p = Math.min(1, Math.max(0, progress))
  return { strokeDasharray: length, strokeDashoffset: length * (1 - p) }
}
