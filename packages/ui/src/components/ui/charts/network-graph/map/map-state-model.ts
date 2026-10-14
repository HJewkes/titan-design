// resolveMapState: the map's whole visual state as a pure function of (timeline, layout, t). It never
// reads a clock or a previous frame, so a seek and a frame-by-frame sweep give the same state.
import { interpolate } from '../../../motion/interpolate'
import { MOTION } from '../../../motion/tokens'
import type { MapIdsOp, MapKeyframe, MapLayout, MapSpan, MapTimeline } from './types'

/** Node weights: full for the focus set, context (dimmed, greyed) for every other node. */
export const MAP_WEIGHT = { full: 1, context: 0.35 } as const

/** One node's channels, each 0 to 1 except `weight` (between `MAP_WEIGHT.context` and `full`). */
export interface MapNodeState {
  opacity: number
  weight: number
  lit: number
}

/** A card's progress in (`enter`) and out (`exit`). A fully exited card is omitted. */
export interface MapCardState {
  id: string
  enter: number
  exit: number
}

/** The resolved state at video time `t`. Off the map it holds the state from the moment the map left. */
export interface MapState {
  t: number
  /** The map's own clock: on-screen seconds before `t`. Camera and flow layers read this too. */
  mapT: number
  onMap: boolean
  level: number
  nodes: Readonly<Record<string, MapNodeState>>
  /** Draw-on progress per edge id. */
  edges: Readonly<Record<string, number>>
  cards: readonly MapCardState[]
  minimap: number
}

interface Step {
  atS: number
  durS: number
  to: number
}

/** The on-screen seconds before `t`. Stops between spans; no `spans` means always on screen. */
export function mapTime(spans: readonly MapSpan[] | undefined, t: number): number {
  if (!spans) return t
  return spans.reduce(
    (sum, span) => sum + Math.min(Math.max(t - span.startS, 0), span.endS - span.startS),
    0
  )
}

const isOnMap = (spans: readonly MapSpan[] | undefined, t: number) =>
  !spans || spans.some((span) => t >= span.startS && t < span.endS)

const tween = (from: number, step: Step, at: number) =>
  interpolate(at, [step.atS, step.atS + step.durS], [from, step.to], { ease: MOTION.ease.inOut })

/** Folds steps sorted by start; a step that interrupts another starts from the value at that moment. */
function settle(steps: readonly Step[], initial: number, at: number): number {
  let current: { from: number; step: Step } | null = null
  for (const step of steps) {
    if (step.atS > at) break
    const from: number = current ? tween(current.from, current.step, step.atS) : initial
    current = { from, step }
  }
  return current ? tween(current.from, current.step, at) : initial
}

type IdsKeyframe = MapKeyframe & { op: MapIdsOp }

const byOp = (keyframes: readonly MapKeyframe[], op: MapIdsOp) =>
  keyframes.filter((keyframe): keyframe is IdsKeyframe => keyframe.op === op)

/** Each keyframe of `op` becomes one step whose target is `to(ids)`. */
const stepsOf = (
  keyframes: readonly MapKeyframe[],
  op: MapIdsOp,
  to: (ids: readonly string[]) => number
) =>
  byOp(keyframes, op).map((keyframe) => ({
    atS: keyframe.atS,
    durS: keyframe.durS,
    to: to(keyframe.ids),
  }))

/** A drawn-in channel: 0 until its first keyframe if any keyframe names the id, else always 1. */
function drawIn(keyframes: readonly MapKeyframe[], op: 'reveal' | 'edge', id: string, at: number) {
  const steps = byOp(keyframes, op)
    .filter((keyframe) => keyframe.ids.includes(id))
    .map((keyframe) => ({ atS: keyframe.atS, durS: keyframe.durS, to: 1 }))
  return steps.length === 0 ? 1 : settle(steps, 0, at)
}

function resolveNodes(keyframes: readonly MapKeyframe[], layout: MapLayout, at: number) {
  const nodes: Record<string, MapNodeState> = {}
  for (const { id } of layout.nodes) {
    const focus = stepsOf(keyframes, 'focus', (ids) =>
      ids.length === 0 || ids.includes(id) ? MAP_WEIGHT.full : MAP_WEIGHT.context
    )
    const lit = stepsOf(keyframes, 'lit', (ids) => (ids.includes(id) ? 1 : 0))
    nodes[id] = {
      opacity: drawIn(keyframes, 'reveal', id, at),
      weight: settle(focus, MAP_WEIGHT.full, at),
      lit: settle(lit, 0, at),
    }
  }
  return nodes
}

function resolveCards(keyframes: readonly MapKeyframe[], layout: MapLayout, at: number) {
  return layout.cards.flatMap(({ id }): MapCardState[] => {
    const latest = (op: MapIdsOp, after: number) =>
      byOp(keyframes, op)
        .filter(
          (keyframe) => keyframe.atS >= after && keyframe.atS <= at && keyframe.ids.includes(id)
        )
        .pop()
    const lastIn = latest('card-in', -Infinity)
    if (!lastIn) return []
    const lastOut = latest('card-out', lastIn.atS)
    const enter = tween(0, { ...lastIn, to: 1 }, at)
    const exit = lastOut ? tween(0, { ...lastOut, to: 1 }, at) : 0
    return exit >= 1 ? [] : [{ id, enter, exit }]
  })
}

function resolveLevel(keyframes: readonly MapKeyframe[], layout: MapLayout, at: number): number {
  let level = layout.levels[0]?.id ?? 0
  for (const keyframe of keyframes) {
    if (keyframe.atS > at) break
    if (keyframe.op === 'level') level = keyframe.level
  }
  return level
}

function resolveMinimap(keyframes: readonly MapKeyframe[], at: number): number {
  const steps = keyframes.flatMap((keyframe) =>
    keyframe.op === 'minimap'
      ? [{ atS: keyframe.atS, durS: keyframe.durS, to: keyframe.on ? 1 : 0 }]
      : []
  )
  return settle(steps, 0, at)
}

/** Keyframe starts converted to map time; `durS` already runs in map time. */
const toMapTime = (timeline: MapTimeline): MapKeyframe[] =>
  timeline.keyframes.map((keyframe) => ({
    ...keyframe,
    atS: mapTime(timeline.spans, keyframe.atS),
  }))

/** The map's state at video time `t`: reveal, focus weight, lit, edge draw, cards, level, minimap. */
export function resolveMapState(timeline: MapTimeline, layout: MapLayout, t: number): MapState {
  const mapT = mapTime(timeline.spans, t)
  const keyframes = toMapTime(timeline)
  const edges: Record<string, number> = {}
  for (const { id } of layout.edges) edges[id] = drawIn(keyframes, 'edge', id, mapT)
  return {
    t,
    mapT,
    onMap: isOnMap(timeline.spans, t),
    level: resolveLevel(keyframes, layout, mapT),
    nodes: resolveNodes(keyframes, layout, mapT),
    edges,
    cards: resolveCards(keyframes, layout, mapT),
    minimap: resolveMinimap(keyframes, mapT),
  }
}
