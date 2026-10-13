import { createContext, useContext } from 'react'
import { TimeOriginContext } from './hooks'

/** Named moments of a Beat, in seconds from the beat's start. */
export type BeatCues = Readonly<Record<string, number>>

/** Every cue the enclosing Beats declared, by name, in absolute timeline seconds. */
export const CueContext = createContext<ReadonlyMap<string, number>>(new Map())

/**
 * The cues in scope inside a Beat: the parent's, plus `cues` placed at `originS`. Throws when an
 * enclosing Beat already declared a name, or a cue falls outside `[0, durationS]`.
 */
export function withCues(
  parent: ReadonlyMap<string, number>,
  cues: BeatCues | undefined,
  originS: number,
  durationS: number
): ReadonlyMap<string, number> {
  if (!cues) return parent
  const merged = new Map(parent)
  for (const [name, atS] of Object.entries(cues)) {
    if (parent.has(name)) throw new Error(`Beat cue "${name}" is already declared by an enclosing Beat`)
    if (!Number.isFinite(atS) || atS < 0 || atS > durationS) {
      throw new RangeError(`Beat cue "${name}" at ${atS} s must be finite and within [0, ${durationS}]`)
    }
    merged.set(name, originS + atS)
  }
  return merged
}

/** Seconds from the current origin to the cue `name`, which an enclosing Beat declared. */
export function useCue(name: string): number {
  const cues = useContext(CueContext)
  const origin = useContext(TimeOriginContext)
  const atS = cues.get(name)
  if (atS === undefined) {
    const known = [...cues.keys()].join(', ') || 'none'
    throw new Error(`useCue: no Beat declares cue "${name}" (known: ${known})`)
  }
  return atS - origin
}
