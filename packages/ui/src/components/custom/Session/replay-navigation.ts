import { REPLAY_KIND_META } from './session-vocabulary'
import { REPLAY_KIND_ORDER, type ReplayEvent, type ReplayEventKind } from './replay-types'

/** Lookups, labels and keyboard stepping over a built replay event list. */

const PAGE_STEP = 10

export function countByKind(events: readonly ReplayEvent[]): Record<ReplayEventKind, number> {
  const counts = Object.fromEntries(REPLAY_KIND_ORDER.map((k) => [k, 0])) as Record<
    ReplayEventKind,
    number
  >
  for (const event of events) counts[event.kind] += 1
  return counts
}

/** -1 when the id is null or not in the list. */
export function eventIndexById(events: readonly ReplayEvent[], id: string | null): number {
  return id === null ? -1 : events.findIndex((e) => e.id === id)
}

/** The last event at or before `time`; null before the first timed event. */
export function eventIdAtTime(events: readonly ReplayEvent[], time: number): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const at = events[i]!.moment.atMs
    if (at !== null && at <= time) return events[i]!.id
  }
  return null
}

function clockText(atMs: number | null): string | null {
  if (atMs === null) return null
  const date = new Date(atMs)
  if (Number.isNaN(date.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

/** The option's accessible name: "12 of 340, tool error, Bash, 14:03". The kind is always in it. */
export function replayEventLabel(event: ReplayEvent): string {
  const { position, total, atMs } = event.moment
  const parts = [
    `${position} of ${total}`,
    REPLAY_KIND_META[event.kind].label.toLowerCase(),
    event.title,
    clockText(atMs),
  ]
  return parts.filter((p): p is string => p !== null).join(', ')
}

export type StepKey = 'ArrowDown' | 'ArrowUp' | 'Home' | 'End' | 'PageDown' | 'PageUp' | 'Escape'

const clamp = (value: number, count: number) => Math.min(Math.max(value, 0), count - 1)

/**
 * The next selected index for a key: clamps at both ends, never wraps, moves ten on the Page keys,
 * and starts at 0 from nothing selected (index -1). Null clears the selection.
 */
export function stepSelection(index: number, key: StepKey, count: number): number | null {
  if (count <= 0 || key === 'Escape') return null
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  const hasSelection = Number.isInteger(index) && index >= 0
  if (!hasSelection) return 0
  const delta = { ArrowDown: 1, ArrowUp: -1, PageDown: PAGE_STEP, PageUp: -PAGE_STEP }[key]
  return clamp(index + delta, count)
}
