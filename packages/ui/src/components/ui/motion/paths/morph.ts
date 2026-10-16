// Path morphing. Ported from @remotion/paths (MIT, (c) 2023 JonnyBurger) at commit 4d9ff70e1f,
// interpolate-path/*.ts, which is copied and adapted from pbeshai/d3-interpolate-path (BSD-3-Clause,
// (c) 2016 Peter Beshai). Same plan: equalise the command counts by splitting segments, match command
// types, then interpolate operands. Lines are promoted to cubics up front so every drawn step is a `C`;
// see ./LICENSE.
import { pathModel, serializeOps, type PathModel, type PathOp } from './model'
import type { PathPoint } from './parse'
import { headOf, tailOf, type Segment } from './segment'

type Step =
  | { type: 'M'; point: PathPoint }
  | { type: 'C'; tail: readonly [PathPoint, PathPoint, PathPoint] }

interface Steps {
  steps: Step[]
  closed: boolean
}

const endOf = (step: Step): PathPoint => (step.type === 'M' ? step.point : step.tail[2])

const lerp = (a: PathPoint, b: PathPoint, t: number): PathPoint => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})

function cubicStep(segment: Segment): Step {
  const [p0, p1, p2, p3] = segment as [PathPoint, PathPoint, PathPoint?, PathPoint?]
  if (p2 && p3) return { type: 'C', tail: [p1, p2, p3] }
  return { type: 'C', tail: [lerp(p0, p1, 1 / 3), lerp(p0, p1, 2 / 3), p1] }
}

function toSteps(model: PathModel): Steps {
  const steps: Step[] = []
  for (const op of model.ops) {
    if (op.type === 'M') steps.push({ type: 'M', point: op.point })
    else {
      if (steps.length === 0) steps.push({ type: 'M', point: op.segment[0]! })
      steps.push(cubicStep(op.segment))
    }
  }
  const last = model.ops[model.ops.length - 1]
  return { steps, closed: last?.type === 'segment' && last.closes }
}

const still = (at: PathPoint): Step => ({ type: 'C', tail: [at, at, at] })

function splitStep(step: Step, from: PathPoint, pieces: number): Step[] {
  if (step.type === 'M') return [...Array.from({ length: pieces - 1 }, () => still(from)), step]
  const out: Step[] = []
  let rest: Segment = [from, ...step.tail]
  for (let i = 0; i < pieces - 1; i++) {
    const t = 1 / (pieces - i)
    out.push(cubicStep(headOf(rest, t)))
    rest = tailOf(rest, t)
  }
  out.push(cubicStep(rest))
  return out
}

/** Splits steps until there are `target`, spreading the splits evenly along the path (d3-interpolate-path). */
function extend(steps: Step[], target: number): Step[] {
  const [first, ...rest] = steps as [Step, ...Step[]]
  if (rest.length === 0)
    return [first, ...Array.from({ length: target - 1 }, () => still(endOf(first)))]
  const counts = new Array<number>(rest.length).fill(0)
  for (let i = 0; i < target - 1; i++) counts[Math.floor((i * rest.length) / (target - 1))]! += 1
  const out = [first]
  counts.forEach((pieces, j) => out.push(...splitStep(rest[j]!, endOf(steps[j]!), pieces)))
  return out
}

/** A moveto facing a curve becomes a line to the same point, so both sides draw the same command. */
function align(steps: Step[], other: Step[]): Step[] {
  return steps.map((step, i) => {
    if (i === 0 || step.type === other[i]!.type || step.type === 'C') return step
    return cubicStep([endOf(steps[i - 1]!), step.point])
  })
}

function lerpStep(a: Step, b: Step, t: number): Step {
  if (a.type === 'M' && b.type === 'M') return { type: 'M', point: lerp(a.point, b.point, t) }
  const [ta, tb] = [
    (a as Extract<Step, { type: 'C' }>).tail,
    (b as Extract<Step, { type: 'C' }>).tail,
  ]
  return { type: 'C', tail: [lerp(ta[0], tb[0], t), lerp(ta[1], tb[1], t), lerp(ta[2], tb[2], t)] }
}

function toOps(steps: Step[], closed: boolean): PathOp[] {
  const ops = steps.map((step, i): PathOp => {
    if (step.type === 'M') return { type: 'M', point: step.point }
    return {
      type: 'segment',
      segment: [endOf(steps[i - 1]!), ...step.tail],
      length: 0,
      closes: false,
    }
  })
  const end = endOf(steps[steps.length - 1]!)
  if (closed) ops.push({ type: 'segment', segment: [end, end], length: 0, closes: true })
  return ops
}

function pairSteps(a: Steps, b: Steps): [Step[], Step[]] {
  let [sa, sb] = [a.steps, b.steps]
  if (sa.length === 0) sa = [sb[0]!]
  if (sb.length === 0) sb = [sa[0]!]
  const size = Math.max(sa.length, sb.length)
  ;[sa, sb] = [sa.length < size ? extend(sa, size) : sa, sb.length < size ? extend(sb, size) : sb]
  return [align(sa, sb), align(sb, sa)]
}

/**
 * Builds a morph from path `from` to path `to` once; the returned function gives the path at progress `t`.
 * `t` 0 and 1 return the inputs unchanged; values outside [0, 1] extrapolate (for overshooting eases).
 * Intermediate paths are absolute `M C Z`, closed only when both inputs end closed.
 */
export function pathMorph(from: string, to: string): (t: number) => string {
  const [a, b] = [toSteps(pathModel(from)), toSteps(pathModel(to))]
  if (a.steps.length === 0 && b.steps.length === 0) return (t) => (t >= 1 ? to : from)
  const [sa, sb] = pairSteps(a, b)
  const closed = a.closed && b.closed
  return (t) => {
    if (t === 0) return from
    if (t === 1) return to
    return serializeOps(
      toOps(
        sa.map((step, i) => lerpStep(step, sb[i]!, t)),
        closed
      )
    )
  }
}

const MORPH_CACHE_LIMIT = 32
const morphs = new Map<string, (t: number) => string>()

/** The path between `from` and `to` at progress `t`; the pair is prepared once and cached. */
export function interpolatePath(t: number, from: string, to: string): string {
  const key = `${from}\u0000${to}`
  let morph = morphs.get(key)
  if (!morph) {
    morph = pathMorph(from, to)
    if (morphs.size >= MORPH_CACHE_LIMIT) morphs.delete(morphs.keys().next().value as string)
    morphs.set(key, morph)
  }
  return morph(t)
}
