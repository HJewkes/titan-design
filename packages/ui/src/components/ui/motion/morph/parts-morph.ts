// Keyed morph between two scenes as a pure function of progress. Nothing here reads a clock.
import type { Easing } from '../easing'
import { interpolate } from '../interpolate'
import { MOTION } from '../tokens'
import { matchParts, type MorphBox, type MorphKeyMap, type MorphPart } from './match-parts'

/** A span of the morph's progress, `[start, end]` within [0, 1]. */
export type MorphWindow = readonly [start: number, end: number]

/** When each kind of part animates. */
export interface MorphWindows {
  /** Unmatched source parts fade out. Default `[0, 0.5]`. */
  exit: MorphWindow
  /** Matched parts move and mapped parts cross-fade. Default `[0, 1]`. */
  move: MorphWindow
  /** Unmatched target parts fade in. Default `[0.5, 1]`. */
  enter: MorphWindow
}

/** Options for `partsMorph`. */
export interface PartsMorphOptions {
  keyMap?: MorphKeyMap
  /** Eases the move; may overshoot. Default `MOTION.ease.inOut`. */
  ease?: Easing
  windows?: Partial<MorphWindows>
  /**
   * Bows each moving part's path (Manim's `path_arc`): the peak sideways offset as a share of the
   * distance travelled, to the left of travel. Parts swapping places pass on opposite sides instead
   * of through each other. Default 0, a straight line.
   */
  arc?: number
}

/** How a layer takes part: `match` by key, `mapped` by the key map, or fading `exit` and `enter`. */
export type MorphRole = 'match' | 'mapped' | 'exit' | 'enter'

/** Centre-origin transform from a part's own box to where the layer is now. */
export interface MorphTransform {
  translateX: number
  translateY: number
  scaleX: number
  scaleY: number
}

/** One painted layer: `part` is drawn in its own box, then moved by `transform`. */
export interface MorphLayer<P extends MorphPart = MorphPart> {
  /** `from:` or `to:` and the painted part's id: stable across progress, unique within the morph. */
  id: string
  part: P
  role: MorphRole
  box: MorphBox
  transform: MorphTransform
  opacity: number
}

export const DEFAULT_MORPH_WINDOWS: MorphWindows = { exit: [0, 0.5], move: [0, 1], enter: [0.5, 1] }

function assertBox({ id, box }: MorphPart): void {
  const sizes = [box.width, box.height]
  if (![box.x, box.y].every(Number.isFinite) || !sizes.every((s) => s > 0 && s < Infinity)) {
    throw new RangeError(`partsMorph: part '${id}' needs a finite box with a positive size`)
  }
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p

function lerpBox(a: MorphBox, b: MorphBox, p: number, arc = 0): MorphBox {
  // sin(π) is 1e-16, not 0: pin the ends so a finished move lands exactly on its target.
  const bow = Number.isInteger(p) ? 0 : arc * Math.sin(Math.PI * p)
  return {
    x: lerp(a.x, b.x, p) + (b.y - a.y) * bow,
    y: lerp(a.y, b.y, p) - (b.x - a.x) * bow,
    width: lerp(a.width, b.width, p),
    height: lerp(a.height, b.height, p),
  }
}

function transformTo(own: MorphBox, box: MorphBox): MorphTransform {
  return {
    translateX: box.x + box.width / 2 - (own.x + own.width / 2),
    translateY: box.y + box.height / 2 - (own.y + own.height / 2),
    scaleX: box.width / own.width,
    scaleY: box.height / own.height,
  }
}

const unit = (p: number) => Math.min(1, Math.max(0, p))

type Plan<P extends MorphPart> = (move: number, fadeOut: number, fadeIn: number) => MorphLayer<P>[]

type Side = 'from' | 'to'

function paint<P extends MorphPart>(
  side: Side,
  part: P,
  role: MorphRole,
  box: MorphBox,
  opacity: number
): MorphLayer<P> {
  return {
    id: `${side}:${part.id}`,
    part,
    role,
    box,
    transform: transformTo(part.box, box),
    opacity,
  }
}

function planPair<P extends MorphPart>(a: P, b: P, via: 'key' | 'keyMap', arc: number): Plan<P> {
  if (via === 'key') return (move) => [paint('to', b, 'match', lerpBox(a.box, b.box, move, arc), 1)]
  return (move) => {
    const box = lerpBox(a.box, b.box, move, arc)
    return [
      paint('from', a, 'mapped', box, 1 - unit(move)),
      paint('to', b, 'mapped', box, unit(move)),
    ]
  }
}

function planFade<P extends MorphPart>(part: P, role: 'exit' | 'enter'): Plan<P> {
  const side: Side = role === 'exit' ? 'from' : 'to'
  return (_move, fadeOut, fadeIn) => [
    paint(side, part, role, part.box, role === 'exit' ? 1 - fadeOut : fadeIn),
  ]
}

/**
 * Builds a keyed morph from scene `from` to scene `to` once (the Manim TransformMatchingParts plan);
 * the returned function gives the painted layers at `progress` in [0, 1]. Matched parts move and
 * scale from their source box to their target box and paint the target part, so equal keys must
 * mean equal content. Key-mapped pairs move the same way while the source cross-fades into the
 * target. Unmatched parts fade in place. Layers are ordered exits, pairs, then enters, bottom to top.
 */
export function partsMorph<P extends MorphPart>(
  from: readonly P[],
  to: readonly P[],
  { keyMap, ease = MOTION.ease.inOut, windows = {}, arc = 0 }: PartsMorphOptions = {}
): (progress: number) => MorphLayer<P>[] {
  ;[...from, ...to].forEach(assertBox)
  const { exit, move, enter } = { ...DEFAULT_MORPH_WINDOWS, ...windows }
  const byId = (parts: readonly P[]) => new Map(parts.map((part) => [part.id, part]))
  const [source, target] = [byId(from), byId(to)]
  const { pairs, exits, enters } = matchParts(from, to, keyMap)
  const plans: Plan<P>[] = [
    ...exits.map((id) => planFade(source.get(id) as P, 'exit')),
    ...pairs.map(({ from: a, to: b, via }) =>
      planPair(source.get(a) as P, target.get(b) as P, via, arc)
    ),
    ...enters.map((id) => planFade(target.get(id) as P, 'enter')),
  ]
  return (progress) => {
    const moved = interpolate(progress, move, [0, 1], { ease })
    const fadeOut = interpolate(progress, exit, [0, 1])
    const fadeIn = interpolate(progress, enter, [0, 1])
    return plans.flatMap((plan) => plan(moved, fadeOut, fadeIn))
  }
}
