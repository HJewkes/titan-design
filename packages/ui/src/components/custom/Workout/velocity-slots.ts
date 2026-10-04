// --- Set-type slot model -----------------------------------------------------
// The strength-training set vocabulary (operator-approved in the Set Modalities
// exploration): one strip encoding for every per-rep set type. A set resolves to
// an ordered list of slots; the slot `kind` picks the color and `leadingGap`
// encodes the chunk pattern (rep gap vs the wide notch that splits drop sub-loads
// / myo clusters / cluster intra-rests). Set-LEVEL types (pyramid / superset /
// tempo) belong to the heading, not the strip.

/**
 * A structured strength-training set. Supply as {@link VelocityStripProps.set} to
 * render its set-type encoding; the done-velocity array (used for the mean / loss
 * / zone summary) is derived from the type's velocity fields.
 */
export type VelocitySet =
  /** Fixed reps at a fixed load: done reps colored + a grey todo remainder to `planned`. */
  | { type: 'straight'; velocities: number[]; planned?: number }
  /** Bounded reps: committed slots `0..floor`, then a cyan variable window `floor..max`. */
  | { type: 'range'; velocities: number[]; floor: number; max: number }
  /** As-many-reps-as-possible: done reps + a trailing cyan "continue" slot that never closes. */
  | { type: 'amrap'; velocities: number[]; target?: number }
  /** Load drops with no rest: each sub-load's reps, split by a WIDE notch gap. */
  | { type: 'drop'; subloads: number[][] }
  /** Rest-pause: an activation chunk + mini-clusters split by WIDE gaps; `open` adds a cyan continue. */
  | { type: 'myo'; activation: number[]; clusters: number[][]; open?: boolean }
  /** Fixed count broken by intra-set rests: reps grouped by `groupSize` with WIDE intra-rest gaps. */
  | { type: 'cluster'; velocities: number[]; groupSize: number; planned?: number }

/** One drawn cell of the strip. `kind` picks the color; `leadingGap` the spacing before it. */
export interface VelocitySlot {
  kind: 'rep' | 'todo' | 'variable' | 'continue'
  velocity?: number
  leadingGap: number
}

/** Butted reps carry this gap; chunk boundaries carry {@link WIDE_GAP}. */
export const REP_GAP = 2
/**
 * The between-group notch (drop sub-loads / myo clusters / cluster intra-rests): a
 * fixed 8px total gap that reads as a group break without dominating a narrow strip.
 * 4× the rep gap — enough to separate groups at session-rail scale AND wall scale
 * without the notch ballooning at large widths. In the mini variant the container's
 * 2px gap covers part of it, so per-slot margin adds the remaining 6px (2 + 6 = 8).
 */
const WIDE_GAP = 8

/** The done-velocity array a set contributes to the mean / loss / zone summary. */
export function deriveDoneVelocities(set: VelocitySet): number[] {
  switch (set.type) {
    case 'drop':
      return set.subloads.flat()
    case 'myo':
      return [...set.activation, ...set.clusters.flat()]
    default:
      return set.velocities
  }
}

/** Flatten velocity chunks into rep slots, carving a WIDE gap before each chunk but the first. */
function chunkedRepSlots(chunks: number[][]): VelocitySlot[] {
  const slots: VelocitySlot[] = []
  chunks.forEach((chunk) => {
    chunk.forEach((velocity, ri) => {
      const first = slots.length === 0
      slots.push({ kind: 'rep', velocity, leadingGap: first ? 0 : ri === 0 ? WIDE_GAP : REP_GAP })
    })
  })
  return slots
}

/** Resolve a set to its ordered slot list — the exact vocabulary of the Set Modalities sheet. */
export function buildSlots(set: VelocitySet): VelocitySlot[] {
  switch (set.type) {
    case 'straight': {
      const total = Math.max(set.velocities.length, set.planned ?? set.velocities.length)
      return Array.from({ length: total }, (_, i) => {
        const done = i < set.velocities.length
        return {
          kind: done ? 'rep' : 'todo',
          velocity: done ? set.velocities[i] : undefined,
          leadingGap: i === 0 ? 0 : REP_GAP,
        }
      })
    }
    case 'range': {
      const total = Math.max(set.max, set.velocities.length)
      return Array.from({ length: total }, (_, i) => {
        const kind: VelocitySlot['kind'] =
          i < set.velocities.length ? 'rep' : i < set.floor ? 'todo' : 'variable'
        return {
          kind,
          velocity: kind === 'rep' ? set.velocities[i] : undefined,
          leadingGap: i === 0 ? 0 : REP_GAP,
        }
      })
    }
    case 'amrap': {
      const reps = set.velocities.map<VelocitySlot>((velocity, i) => ({
        kind: 'rep',
        velocity,
        leadingGap: i === 0 ? 0 : REP_GAP,
      }))
      reps.push({ kind: 'continue', leadingGap: reps.length === 0 ? 0 : REP_GAP })
      return reps
    }
    case 'drop':
      return chunkedRepSlots(set.subloads)
    case 'myo': {
      const slots = chunkedRepSlots([set.activation, ...set.clusters])
      if (set.open) slots.push({ kind: 'continue', leadingGap: slots.length === 0 ? 0 : REP_GAP })
      return slots
    }
    case 'cluster': {
      const total = Math.max(set.velocities.length, set.planned ?? set.velocities.length)
      return Array.from({ length: total }, (_, i) => {
        const done = i < set.velocities.length
        const boundary = i > 0 && i % set.groupSize === 0
        return {
          kind: done ? 'rep' : 'todo',
          velocity: done ? set.velocities[i] : undefined,
          leadingGap: i === 0 ? 0 : boundary ? WIDE_GAP : REP_GAP,
        }
      })
    }
  }
}

/** A concise, set-type-aware summary for the strip's accessibility label. */
export function setAccessibilityLabel(set: VelocitySet, repCount: number): string {
  switch (set.type) {
    case 'straight':
      return `Velocity strip, straight set, ${repCount} reps`
    case 'range':
      return `Velocity strip, rep-range set, floor ${set.floor} to ${set.max}, ${repCount} reps done`
    case 'amrap':
      return `Velocity strip, AMRAP set, ${repCount} reps and counting`
    case 'drop':
      return `Velocity strip, drop set, ${set.subloads.length} loads, ${repCount} reps`
    case 'myo':
      return `Velocity strip, myo-reps set, ${set.clusters.length} clusters${set.open ? ', open' : ''}, ${repCount} reps`
    case 'cluster':
      return `Velocity strip, cluster set, groups of ${set.groupSize}, ${repCount} reps`
  }
}
