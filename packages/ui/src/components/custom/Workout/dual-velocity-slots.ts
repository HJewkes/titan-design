import type { SetSlot } from '../charts/SetBarChart'
import { REP_GAP, buildSlots, deriveDoneVelocities, type VelocitySet } from './velocity-slots'

/** One voltra's velocity stream — the SAME shape VelocityStrip accepts (one of these). */
export interface DualVelocityStream {
  /** Per-rep MEAN concentric velocity (m/s) for this side. */
  velocities?: number[]
  /** A structured set descriptor for this side (drives the typed slot vocabulary). */
  set?: VelocitySet
  /**
   * The side's SLOT NAME (e.g. "Left Arm"), rendered as the vertical edge label. This is
   * the slot's identity supplied by data — there is no hardcoded LEFT/RIGHT fallback. When
   * absent or empty, that side renders no label.
   */
  label?: string
  /** Fade this side's wing, e.g. once its voltra has disconnected mid-set. */
  isDimmed?: boolean
}

/** One side's performed per-rep velocities — flattened from a `set` descriptor, or the raw array. */
export function streamDone(stream: DualVelocityStream): number[] {
  return stream.set ? deriveDoneVelocities(stream.set) : (stream.velocities ?? [])
}

/** A side's NATURAL slot list — its `set` slot vocabulary, or bare rep slots + a `targetReps` remainder. */
export function streamNaturalSlots(stream: DualVelocityStream, targetReps?: number): SetSlot[] {
  if (stream.set) {
    return buildSlots(stream.set).map((s) => ({
      kind: s.kind,
      value: s.velocity,
      leadingGap: s.leadingGap,
    }))
  }
  const reps: SetSlot[] = (stream.velocities ?? []).map((v, i) => ({
    kind: 'rep',
    value: v,
    leadingGap: i === 0 ? 0 : REP_GAP,
  }))
  const pad = Math.max(0, (targetReps ?? 0) - reps.length)
  return [...reps, ...Array.from({ length: pad }, () => ({ kind: 'todo' as const }))]
}

/**
 * The window-kind precedence when merging two sides' cells at a column: a set-type window (variable /
 * continue) that either side has wins; else if either logged (or plans) a rep there it's a REP column;
 * else it's a shared to-do. So a lagging side's not-yet-logged rep column stays a REP column (rendered
 * `empty` for that side), index-locked to the other side's rep — never shifted or re-spaced.
 */
function mergeColumnKind(l: SetSlot | undefined, r: SetSlot | undefined): SetSlot['kind'] {
  const kinds = [l?.kind, r?.kind]
  if (kinds.includes('variable')) return 'variable'
  if (kinds.includes('continue')) return 'continue'
  if (kinds.includes('rep')) return 'rep'
  return 'todo'
}

/** One side's cell at a merged column: its logged rep (with value), else `empty` for a rep column, else the shared window kind. */
function sideColumnCell(
  slot: SetSlot | undefined,
  kind: SetSlot['kind'],
  leadingGap: number
): SetSlot {
  if (kind !== 'rep') return { kind, leadingGap }
  return slot?.kind === 'rep'
    ? { kind: 'rep', value: slot.value, leadingGap }
    : { kind: 'empty', leadingGap }
}

/**
 * Build ONE index-locked column structure shared by both diverging wings from their natural slot
 * lists: same column count, same rep indices, same WIDE-gap positions. Each column resolves to a
 * shared kind ({@link mergeColumnKind}); per side it's that side's rep value, or `empty` when the
 * side hasn't logged that rep (assumes symmetric bilateral reps — both sides step together).
 */
export function alignDualSlots(
  left: SetSlot[],
  right: SetSlot[]
): { left: SetSlot[]; right: SetSlot[] } {
  const n = Math.max(left.length, right.length)
  const L: SetSlot[] = []
  const R: SetSlot[] = []
  for (let i = 0; i < n; i++) {
    const lt = left[i]
    const rt = right[i]
    const kind = mergeColumnKind(lt, rt)
    const gap = Math.max(lt?.leadingGap ?? REP_GAP, rt?.leadingGap ?? REP_GAP)
    L.push(sideColumnCell(lt, kind, gap))
    R.push(sideColumnCell(rt, kind, gap))
  }
  return { left: L, right: R }
}
