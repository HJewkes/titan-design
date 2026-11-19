import type { MessageEntry, Placed, SourceEntry } from './replay-types'
import type { CompactionMark } from './session-types'

/** Source order, and where each compaction mark lands in it. */

/** Source order: by `seq`, ties by input order. Timestamps never decide. */
export function orderEvents<T extends { seq: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => (a.seq < b.seq ? -1 : a.seq > b.seq ? 1 : 0))
}

function isCompactionOpener(entry: SourceEntry): entry is MessageEntry {
  return (
    entry.payload.type === 'message' &&
    entry.payload.origin === 'compaction' &&
    entry.payload.message.role === 'user'
  )
}

function firstAfter(entries: readonly SourceEntry[], mark: CompactionMark): number {
  return entries.findIndex(
    (e) =>
      e.byteOffset > mark.byteOffset || (e.byteOffset === mark.byteOffset && isCompactionOpener(e))
  )
}

/**
 * Puts each mark before the first entry whose byte offset is greater than its own, or last when none
 * is. A compaction opener directly after the mark merges into it, so one compaction is one slot.
 */
export function placeCompactions(
  entries: readonly SourceEntry[],
  marks: readonly CompactionMark[]
): Placed[] {
  const byIndex = new Map<number, CompactionMark[]>()
  for (const mark of marks) {
    const at = firstAfter(entries, mark)
    const index = at === -1 ? entries.length : at
    byIndex.set(index, [...(byIndex.get(index) ?? []), mark])
  }
  const placed: Placed[] = []
  entries.forEach((entry, index) => {
    const here = [...(byIndex.get(index) ?? [])]
    const merges = here.length > 0 && isCompactionOpener(entry)
    const lead = merges ? here.slice(0, -1) : here
    for (const mark of lead) placed.push({ slot: 'mark', mark, opener: null })
    if (merges) placed.push({ slot: 'mark', mark: here[here.length - 1]!, opener: entry })
    else placed.push({ slot: 'entry', entry })
  })
  for (const mark of byIndex.get(entries.length) ?? []) {
    placed.push({ slot: 'mark', mark, opener: null })
  }
  return placed
}
