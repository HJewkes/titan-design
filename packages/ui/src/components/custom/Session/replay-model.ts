import { CHANNEL_MARKER, UNNAMED_TOOL_LABEL } from './session-vocabulary'
import { orderEvents, placeCompactions } from './replay-placement'
import { eventTitle, subtitleOf } from './replay-title'
import type {
  KindSource,
  Placed,
  ReplayEvent,
  ReplayEventKind,
  ReplayInput,
  ReplayMoment,
  ReplayPayload,
  SourceEntry,
} from './replay-types'
import type { TimelineAgentSpan, TimelineToolCall, TimelineTokenPoint } from './session-types'

/**
 * The replay event model: every message and tool call of a session as one flat, ordered list, with
 * compactions placed by byte offset. Pure and jsdom-free; the components only paint it.
 */

export const COMPACTION_TITLE = 'Context compaction'

/** Error beats agent beats tool; `unknown` and `pending` are not errors. A channel opener is `message`. */
export function kindOf(source: KindSource): ReplayEventKind {
  switch (source.type) {
    case 'assistant':
      return 'assistant'
    case 'mark':
      return 'compaction'
    case 'call':
      if (source.outcome === 'error') return 'error'
      return source.family === 'subagent' ? 'agent' : 'tool'
    case 'opener':
      if (source.origin === 'compaction') return 'compaction'
      if (source.origin === 'injected') {
        return source.injectedMarker === CHANNEL_MARKER ? 'message' : 'injected'
      }
      return 'prompt'
  }
}

/** Sorted by time, so "the last request at or before" is a binary search. */
export interface ContextIndex {
  points: TimelineTokenPoint[]
  firstAtMs: number | null
}

function lastAtOrBefore(points: readonly TimelineTokenPoint[], time: number, strict: boolean) {
  let low = 0
  let high = points.length
  while (low < high) {
    const mid = (low + high) >>> 1
    const at = points[mid]!.atMs
    if (strict ? at < time : at <= time) low = mid + 1
    else high = mid
  }
  return low - 1
}

function contextAt(index: ContextIndex, atMs: number | null): number | null {
  if (atMs === null) return null
  const found = lastAtOrBefore(index.points, atMs, false)
  return found < 0 ? null : (index.points[found]!.contextTokens ?? null)
}

function slotTime(placed: Placed): { atMs: number | null; turnIndex: number | null } {
  if (placed.slot === 'mark') {
    const opener = placed.opener?.payload.message
    return {
      atMs: placed.mark.atMs ?? opener?.atMs ?? null,
      turnIndex: placed.mark.turnIndex ?? placed.opener?.payload.turn.index ?? null,
    }
  }
  const { payload } = placed.entry
  return payload.type === 'message'
    ? { atMs: payload.message.atMs, turnIndex: payload.turn.index }
    : { atMs: payload.call.atMs, turnIndex: payload.call.turnIndex }
}

const finiteOrNull = (value: number | null): number | null =>
  value !== null && Number.isFinite(value) ? value : null

/** Where one placed event sits: position, time since the first timed event, and the context size. */
export function momentOf(
  placed: Placed,
  position: number,
  total: number,
  index: ContextIndex
): ReplayMoment {
  const { atMs: rawAt, turnIndex } = slotTime(placed)
  const atMs = finiteOrNull(rawAt)
  const first = finiteOrNull(index.firstAtMs)
  const elapsedMs = atMs === null || first === null ? null : Math.max(0, atMs - first)
  return { position, total, turnIndex, atMs, elapsedMs, contextTokens: contextAt(index, atMs) }
}

function compactionTokens(index: ContextIndex, atMs: number | null) {
  if (atMs === null) return { tokensBefore: null, tokensAfter: null }
  const before = lastAtOrBefore(index.points, atMs, true)
  const after = index.points.find((p) => p.afterCompaction && p.atMs >= atMs)
  return {
    tokensBefore: before < 0 ? null : (index.points[before]!.contextTokens ?? null),
    tokensAfter: after?.contextTokens ?? null,
  }
}

function callTitle(call: TimelineToolCall): string {
  return eventTitle(call.name, UNNAMED_TOOL_LABEL)
}

function describe(
  placed: Placed,
  index: ContextIndex
): Pick<ReplayEvent, 'kind' | 'title' | 'subtitle' | 'payload'> {
  if (placed.slot === 'mark') {
    const summaryMessage = placed.opener?.payload.message ?? null
    const summary = placed.mark.summary ?? summaryMessage?.text ?? null
    const { atMs } = slotTime(placed)
    return {
      kind: 'compaction',
      title: COMPACTION_TITLE,
      subtitle: subtitleOf(summary),
      payload: {
        type: 'compaction',
        mark: placed.mark,
        summaryMessage,
        ...compactionTokens(index, finiteOrNull(atMs)),
      },
    }
  }
  const { payload } = placed.entry
  if (payload.type === 'tool') {
    const { call } = payload
    return {
      kind: kindOf({ type: 'call', outcome: call.outcome, family: call.family }),
      title: callTitle(call),
      subtitle: subtitleOf(call.inputSummary),
      payload,
    }
  }
  return describeMessage(payload, index)
}

function describeMessage(
  payload: Extract<ReplayPayload, { type: 'message' }>,
  index: ContextIndex
): Pick<ReplayEvent, 'kind' | 'title' | 'subtitle' | 'payload'> {
  const { message, turn } = payload
  const isOpener = message.role === 'user'
  const kind = isOpener
    ? kindOf({ type: 'opener', origin: payload.origin, injectedMarker: turn.injectedMarker })
    : kindOf({ type: 'assistant' })
  if (kind === 'compaction') {
    const { atMs } = message
    return {
      kind,
      title: COMPACTION_TITLE,
      subtitle: subtitleOf(message.text),
      payload: {
        type: 'compaction',
        mark: null,
        summaryMessage: message,
        ...compactionTokens(index, finiteOrNull(atMs)),
      },
    }
  }
  return { kind, title: eventTitle(message.text), subtitle: null, payload }
}

function sourceEntries(input: ReplayInput): SourceEntry[] {
  const entries: SourceEntry[] = []
  const agents = new Map<string, TimelineAgentSpan>()
  for (const span of input.agents ?? []) if (!agents.has(span.callId)) agents.set(span.callId, span)
  for (const turn of input.turns) {
    const messages = [...(turn.user ? [turn.user] : []), ...turn.assistant]
    for (const message of messages) {
      const payload = { type: 'message' as const, message, origin: turn.origin, turn }
      entries.push({ seq: message.seq, byteOffset: message.byteOffset, payload })
    }
    for (const call of turn.toolCalls) {
      const payload = { type: 'tool' as const, call, agent: agents.get(call.id) ?? null }
      entries.push({ seq: call.seq, byteOffset: call.byteOffset, payload })
    }
  }
  return entries
}

function idOf(placed: Placed): string {
  if (placed.slot === 'mark') return `c:${placed.mark.byteOffset}`
  const { entry } = placed
  return `${entry.payload.type === 'tool' ? 't' : 'm'}:${entry.seq}`
}

function uniqueIds(ids: string[]): string[] {
  const seen = new Map<string, number>()
  return ids.map((id) => {
    const count = seen.get(id) ?? 0
    seen.set(id, count + 1)
    return count === 0 ? id : `${id}~${count}`
  })
}

function contextIndexOf(input: ReplayInput, placed: Placed[]): ContextIndex {
  const points = [...(input.tokens?.points ?? [])].sort((a, b) => a.atMs - b.atMs)
  const firstTimed = placed.map((p) => finiteOrNull(slotTime(p).atMs)).find((t) => t !== null)
  return { points, firstAtMs: firstTimed ?? null }
}

/** Every message, call and compaction of a session as one ordered list. */
export function buildReplayEvents(input: ReplayInput): ReplayEvent[] {
  const ordered = orderEvents(sourceEntries(input))
  const placed = placeCompactions(ordered, input.tokens?.compactions ?? [])
  const index = contextIndexOf(input, placed)
  const ids = uniqueIds(placed.map(idOf))
  return placed.map((slot, i) => ({
    id: ids[i]!,
    ...describe(slot, index),
    moment: momentOf(slot, i + 1, placed.length, index),
  }))
}
