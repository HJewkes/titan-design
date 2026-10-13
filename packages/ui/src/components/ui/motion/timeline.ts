// Timing arithmetic in seconds: delays and phase windows, never a clock read.

/** Options for `stagger`. */
export interface StaggerOptions {
  /** Seconds between neighbours. */
  each: number
  /** Index the stagger radiates from. Default 0. */
  from?: number
}

/** Delay in seconds for item `index`: its distance from `from`, times `each`. */
export function stagger(index: number, { each, from = 0 }: StaggerOptions): number {
  return Math.abs(index - from) * each
}

/** Options for `sequence`. */
export interface SequenceOptions {
  /** Start of the first item, in seconds. Default 0. */
  startS?: number
  /** Seconds each item starts before its predecessor ends. Default 0, so phases abut. */
  overlapS?: number
}

/** An item placed by `sequence`, with its window in seconds. */
export type Sequenced<T> = T & { startS: number; endS: number }

/** What `sequence` returns. */
export interface SequenceResult<T> {
  /** The input items in order, each with `startS` and `endS`. */
  items: Sequenced<T>[]
  /** Seconds from the first start to the last end. */
  totalS: number
}

function assertSequenceable(items: readonly { durationS: number }[], overlapS: number): void {
  if (!(overlapS >= 0)) throw new RangeError(`sequence: overlapS must be >= 0, got ${overlapS}`)
  items.forEach(({ durationS }, i) => {
    if (!(durationS >= 0)) throw new RangeError(`sequence: item ${i} has durationS ${durationS}`)
    const previous = items[i - 1]
    if (previous && overlapS > Math.min(previous.durationS, durationS)) {
      throw new RangeError(`sequence: overlapS ${overlapS} exceeds a neighbour of item ${i}`)
    }
  })
}

/**
 * Lays items end to end: item i starts `overlapS` before item i-1 ends. An overlap longer than either
 * neighbour, a negative overlap or a negative duration throws, since each is an authoring error.
 */
export function sequence<T extends { durationS: number }>(
  items: readonly T[],
  { startS = 0, overlapS = 0 }: SequenceOptions = {}
): SequenceResult<T> {
  assertSequenceable(items, overlapS)
  const placed: Sequenced<T>[] = []
  let cursor = startS
  for (const item of items) {
    const itemStartS = placed.length === 0 ? cursor : cursor - overlapS
    cursor = itemStartS + item.durationS
    placed.push({ ...item, startS: itemStartS, endS: cursor })
  }
  return { items: placed, totalS: cursor - startS }
}
