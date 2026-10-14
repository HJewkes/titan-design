// Keyed part matching. Adapted from Manim Community's TransformMatchingAbstractBase
// (manim/animation/transform_matching_parts.py, https://github.com/ManimCommunity/manim, MIT,
// (c) 2018 3Blue1Brown LLC and (c) 2024 the Manim Community Developers; see ./LICENSE-manim).
// Same plan: group each side's parts by key, let the key map claim its pairs, transform parts whose
// keys match, and fade the rest out and in. Changes from the source: the key map claims its pairs
// before keys match, so a mapped key is never animated twice; parts sharing a key pair up in order
// rather than as one group; and every list keeps input order, where Manim iterates a set.

/** A part's box on the stage, in px from the stage's top left. */
export interface MorphBox {
  x: number
  y: number
  width: number
  height: number
}

/** One piece of a scene that a morph can carry from one state to the next. */
export interface MorphPart {
  /** Unique within its scene. */
  id: string
  /** What the part is, for matching: a label, a shape or a role. Defaults to `id`. */
  key?: string
  box: MorphBox
}

/** Source match keys mapped to target match keys that should transform although they differ. */
export type MorphKeyMap = Readonly<Record<string, string>>

/** A source part carried to a target part, by an equal key or by the key map. */
export interface PartPair {
  from: string
  to: string
  via: 'key' | 'keyMap'
}

/** The parts that transform, and the ids that fade out (`exits`) and in (`enters`). */
export interface PartMatching {
  pairs: PartPair[]
  exits: string[]
  enters: string[]
}

const matchKey = (part: MorphPart): string => part.key ?? part.id

function groupByKey(parts: readonly MorphPart[], side: string): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  const seen = new Set<string>()
  for (const part of parts) {
    if (seen.has(part.id)) throw new RangeError(`matchParts: ${side} id '${part.id}' repeats`)
    seen.add(part.id)
    const key = matchKey(part)
    groups.set(key, [...(groups.get(key) ?? []), part.id])
  }
  return groups
}

function pairUp(from: string[], to: string[], via: PartPair['via'], matching: PartMatching): void {
  from.forEach((id, i) => {
    const target = to[i]
    if (target === undefined) matching.exits.push(id)
    else matching.pairs.push({ from: id, to: target, via })
  })
  matching.enters.push(...to.slice(from.length))
}

/**
 * Pairs the parts of two scenes. `keyMap` entries claim their parts first, then parts with equal keys
 * pair up; parts sharing a key pair in order and any extra fade. Map a key to itself to cross-fade a
 * part whose content changed. Throws a `RangeError` when an id repeats within a scene.
 */
export function matchParts(
  from: readonly MorphPart[],
  to: readonly MorphPart[],
  keyMap: MorphKeyMap = {}
): PartMatching {
  const source = groupByKey(from, 'from')
  const target = groupByKey(to, 'to')
  const matching: PartMatching = { pairs: [], exits: [], enters: [] }
  for (const [fromKey, toKey] of Object.entries(keyMap)) {
    const [a, b] = [source.get(fromKey), target.get(toKey)]
    if (!a || !b) continue
    pairUp(a, b, 'keyMap', matching)
    source.delete(fromKey)
    target.delete(toKey)
  }
  for (const [key, ids] of source) {
    pairUp(ids, target.get(key) ?? [], 'key', matching)
    target.delete(key)
  }
  for (const ids of target.values()) matching.enters.push(...ids)
  return matching
}
