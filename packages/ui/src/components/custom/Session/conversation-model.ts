import { formatCompact } from '../../../utils/number-format'
import { formatDurationMs } from '../../../utils/time-format'
import { formatDateTime } from '../../ui/date-time'
import {
  SIDECHAIN_LABEL,
  UNNAMED_TOOL_LABEL,
  countLabel,
  toolOutcomeMeta,
} from './session-vocabulary'
import type { TimelineMessage, TimelineToolCall, TimelineTurn, ToolFamily } from './session-types'

type CallSpan = Pick<TimelineToolCall, 'outcome' | 'durationMs'>

const isTime = (ms: number | null | undefined): ms is number =>
  typeof ms === 'number' && Number.isFinite(ms)

const isSpan = (ms: number | null | undefined): ms is number => isTime(ms) && ms >= 0

/**
 * The span a row prints, or null when there is none to state: pending, or unreported. A
 * non-finite or negative span prints the placeholder, never "NaN".
 */
export function callDurationText(call: CallSpan): string | null {
  if (call.outcome === 'pending' || call.durationMs === null) return null
  return formatDurationMs(call.durationMs)
}

function spokenDuration(call: CallSpan): string | null {
  return call.outcome !== 'pending' && isSpan(call.durationMs)
    ? formatDurationMs(call.durationMs)
    : null
}

/** A row's accessible name: "Read, src/orchard/tree-ledger.ts, succeeded, 1.2 s". */
export function toolCallLabel(call: TimelineToolCall): string {
  return [
    call.name || UNNAMED_TOOL_LABEL,
    call.inputSummary.trim(),
    toolOutcomeMeta(call.outcome).label,
    spokenDuration(call),
    call.sidechain ? SIDECHAIN_LABEL : null,
  ]
    .filter(Boolean)
    .join(', ')
}

/** Counts for one turn's tool group. */
export interface ToolCallSummary {
  calls: number
  errors: number
  pending: number
  /** The sum of every stated span; NaN, negative and pending spans add nothing. */
  durationMs: number
  /** Most calls first; ties keep first-seen order. */
  byName: { name: string; family: ToolFamily | string; calls: number; errors: number }[]
}

/** Counts a turn's calls. `unknown` is neither an error nor pending. */
export function summarizeToolCalls(calls: TimelineToolCall[]): ToolCallSummary {
  const byName = new Map<string, ToolCallSummary['byName'][number]>()
  const summary: ToolCallSummary = {
    calls: calls.length,
    errors: 0,
    pending: 0,
    durationMs: 0,
    byName: [],
  }
  for (const call of calls) {
    const isError = call.outcome === 'error'
    if (isError) summary.errors += 1
    if (call.outcome === 'pending') summary.pending += 1
    else if (isSpan(call.durationMs)) summary.durationMs += call.durationMs
    const entry = byName.get(call.name) ?? {
      name: call.name,
      family: call.family,
      calls: 0,
      errors: 0,
    }
    entry.calls += 1
    if (isError) entry.errors += 1
    byName.set(call.name, entry)
  }
  // Array sort is stable, so equal counts keep the order the map saw them in.
  summary.byName = [...byName.values()].sort((a, b) => b.calls - a.calls)
  return summary
}

/** The summary as its visible parts: "6 calls", "1 error", "14 s". */
export function toolSummaryParts(summary: ToolCallSummary): string[] {
  const parts = [countLabel(summary.calls, 'call', 'calls')]
  if (summary.errors > 0) parts.push(countLabel(summary.errors, 'error', 'errors'))
  if (summary.pending > 0) parts.push(`${formatCompact(summary.pending)} pending`)
  if (summary.durationMs > 0) parts.push(formatDurationMs(summary.durationMs))
  return parts
}

/** One row of the conversation: a turn, or the idle gap the read model marked before it. */
export type ConversationRow =
  | { kind: 'gap'; key: string; durationMs: number; resumedAtMs: number | null; showDate: boolean }
  | { kind: 'turn'; key: string; turn: TimelineTurn; showDate: boolean }

/** Maps an instant to a calendar day; two instants on the same day share a key. */
export type DayKeyOf = (ms: number) => string

/** The UTC calendar day. */
export const utcDayKey: DayKeyOf = (ms) => new Date(ms).toISOString().slice(0, 10)

/** The calendar day in the runtime's zone. */
export const localDayKey: DayKeyOf = (ms) => {
  const date = new Date(ms)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

/** The day key that matches how stamps print. */
export function dayKeyFor(isUTC?: boolean): DayKeyOf {
  return isUTC ? utcDayKey : localDayKey
}

function uniqueKey(seen: Map<string, number>, base: string): string {
  const count = seen.get(base) ?? 0
  seen.set(base, count + 1)
  return count === 0 ? base : `${base}~${count}`
}

/**
 * Turns in input order, each preceded by a gap row when its `gapBeforeMs` is a positive finite
 * number. Gaps come from the data; the reader never recomputes the threshold. `showDate` is set
 * on the first timed turn (and its gap) whose day differs from the timed turn before it.
 */
export function buildConversationRows(
  turns: TimelineTurn[],
  dayKeyOf: DayKeyOf = utcDayKey
): ConversationRow[] {
  const rows: ConversationRow[] = []
  const seen = new Map<string, number>()
  let lastDay: string | null = null
  for (const turn of turns) {
    const day = isTime(turn.startMs) ? dayKeyOf(turn.startMs) : null
    const showDate = day !== null && lastDay !== null && day !== lastDay
    if (day !== null) lastDay = day
    const key = uniqueKey(seen, `turn-${turn.index}`)
    const gap = turn.gapBeforeMs
    if (isTime(gap) && gap > 0) {
      const resumedAtMs = isTime(turn.startMs) ? turn.startMs : null
      rows.push({ kind: 'gap', key: `gap-${key}`, durationMs: gap, resumedAtMs, showDate })
    }
    rows.push({ kind: 'turn', key, turn, showDate })
  }
  return rows
}

/** The turn's opener, assistant messages and calls in `seq` order. */
export function interleaveTurn(turn: TimelineTurn): (TimelineMessage | TimelineToolCall)[] {
  const items: (TimelineMessage | TimelineToolCall)[] = [
    ...(turn.user ? [turn.user] : []),
    ...turn.assistant,
    ...turn.toolCalls,
  ]
  return items.sort((a, b) => a.seq - b.seq)
}

/** True for a message, false for a tool call. */
export function isTimelineMessage(
  item: TimelineMessage | TimelineToolCall
): item is TimelineMessage {
  return 'role' in item
}

function turnText(turn: TimelineTurn): string[] {
  const calls = turn.toolCalls.flatMap((c) => [c.name, c.inputSummary, c.filePath, c.errorMessage])
  return [turn.user?.text, ...turn.assistant.map((m) => m.text), ...calls].filter(
    (text): text is string => typeof text === 'string'
  )
}

/**
 * The turns whose user text, assistant text, tool name, input summary, file path or error
 * message holds `query`, as a case-insensitive plain substring. The query is never a RegExp. A
 * blank query matches every turn. `matched` holds `turn.index` values.
 */
export function searchTurns(
  turns: TimelineTurn[],
  query: string
): { matched: Set<number>; total: number } {
  const needle = query.trim().toLowerCase()
  const matched = new Set<number>()
  for (const turn of turns) {
    if (!needle || turnText(turn).some((text) => text.toLowerCase().includes(needle))) {
      matched.add(turn.index)
    }
  }
  return { matched, total: turns.length }
}

/** True when the query filters anything: it holds a non-space character. */
export function isActiveQuery(query: string | undefined): query is string {
  return typeof query === 'string' && query.trim() !== ''
}

/**
 * At most `maxChars` characters of `text`, cut back to the last space when one sits in the
 * second half of the window. A non-finite `maxChars` keeps the whole text.
 */
export function previewText(text: string, maxChars: number): { text: string; isCut: boolean } {
  if (!Number.isFinite(maxChars) || text.length <= maxChars) return { text, isCut: false }
  const limit = Math.max(0, Math.floor(maxChars))
  const window = text.slice(0, limit)
  const space = window.search(/\s\S*$/)
  const cut = space > limit / 2 ? window.slice(0, space) : window
  return { text: cut.trimEnd(), isCut: true }
}

/**
 * The `index` of the turn that holds `time`: the last timed turn that started at or before it,
 * so a time in a gap names the turn before the gap. A time before the first timed turn names
 * that turn. Null when no turn has a start time.
 */
export function turnIndexAtTime(turns: TimelineTurn[], time: number): number | null {
  let found: TimelineTurn | null = null
  for (const turn of turns) {
    if (!isTime(turn.startMs)) continue
    if (found === null || turn.startMs <= time) found = turn
    if (turn.startMs > time) break
  }
  return found === null ? null : found.index
}

/** A turn's accessible name: "Turn 12, 14:03, 6 tool calls, 1 error". */
export function turnLabel(turn: TimelineTurn, isUTC?: boolean): string {
  const summary = summarizeToolCalls(turn.toolCalls)
  return [
    `Turn ${turn.index + 1}`,
    isTime(turn.startMs) ? formatDateTime(turn.startMs, 'time', { isUTC }) : null,
    summary.calls > 0 ? countLabel(summary.calls, 'tool call', 'tool calls') : null,
    summary.errors > 0 ? countLabel(summary.errors, 'error', 'errors') : null,
    summary.pending > 0 ? `${formatCompact(summary.pending)} pending` : null,
  ]
    .filter(Boolean)
    .join(', ')
}
