import { REPLAY_KIND_META, UNNAMED_TOOL_LABEL, CHANNEL_MARKER } from './session-vocabulary'
import type {
  CompactionMark,
  TimelineAgentSpan,
  TimelineMessage,
  TimelineToolCall,
  TimelineToolOutcome,
  TimelineTurn,
  TimelineTurnOrigin,
  TokenTimeline,
  TimelineTokenPoint,
  ToolFamily,
} from './session-types'

/**
 * The replay event model: every message and tool call of a session as one flat, ordered list, with
 * compactions placed by byte offset. Pure and jsdom-free; the components only paint it.
 */

export type ReplayEventKind =
  | 'prompt'
  | 'injected'
  | 'message'
  | 'assistant'
  | 'tool'
  | 'error'
  | 'agent'
  | 'compaction'

/** The kinds in the order a legend lists them. */
export const REPLAY_KIND_ORDER: ReplayEventKind[] = [
  'prompt',
  'injected',
  'message',
  'assistant',
  'tool',
  'error',
  'agent',
  'compaction',
]

export interface ReplayMoment {
  /** 1-based position in the list. */
  position: number
  total: number
  turnIndex: number | null
  atMs: number | null
  /** Since the first timed event; null when either time is unknown. */
  elapsedMs: number | null
  /** Prompt size of the last API request at or before this event; null when unknown. */
  contextTokens: number | null
}

export type ReplayPayload =
  | { type: 'message'; message: TimelineMessage; origin: TimelineTurnOrigin; turn: TimelineTurn }
  | { type: 'tool'; call: TimelineToolCall; agent: TimelineAgentSpan | null }
  | {
      type: 'compaction'
      /** Null when a compaction opener has no mark before it. */
      mark: CompactionMark | null
      /** The opener with origin 'compaction' that follows the mark, when there is one. */
      summaryMessage: TimelineMessage | null
      tokensBefore: number | null
      tokensAfter: number | null
    }

export interface ReplayEvent {
  /** Stable across renders and unique within a list: 'm:<seq>', 't:<seq>', 'c:<byteOffset>'. */
  id: string
  kind: ReplayEventKind
  /** One line. First line of the text, the tool name, or 'Context compaction'. */
  title: string
  /** One line. The input summary, or the start of a summary. */
  subtitle: string | null
  moment: ReplayMoment
  payload: ReplayPayload
}

export interface ReplayInput {
  turns: TimelineTurn[]
  tokens?: Pick<TokenTimeline, 'points' | 'compactions'>
  agents?: TimelineAgentSpan[]
}

export const TITLE_MAX_LENGTH = 80
export const COMPACTION_TITLE = 'Context compaction'
export const EMPTY_MESSAGE_TITLE = 'Empty message'
const PAGE_STEP = 10

/** What decides a kind. A call's outcome and family, an opener's origin and marker. */
export type KindSource =
  | { type: 'opener'; origin: TimelineTurnOrigin; injectedMarker: string | null }
  | { type: 'assistant' }
  | { type: 'call'; outcome: TimelineToolOutcome; family: ToolFamily }
  | { type: 'mark' }

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

/** Source order: by `seq`, ties by input order. Timestamps never decide. */
export function orderEvents<T extends { seq: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => (a.seq < b.seq ? -1 : a.seq > b.seq ? 1 : 0))
}

export interface MessageEntry {
  seq: number
  byteOffset: number
  payload: Extract<ReplayPayload, { type: 'message' }>
}

export interface ToolEntry {
  seq: number
  byteOffset: number
  payload: Extract<ReplayPayload, { type: 'tool' }>
}

export type SourceEntry = MessageEntry | ToolEntry

/** A source entry, or a compaction mark with the opener it merged with. */
export type Placed =
  | { slot: 'entry'; entry: SourceEntry }
  | { slot: 'mark'; mark: CompactionMark; opener: MessageEntry | null }

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

const LINE_BREAK = new RegExp('\\r\\n|[\\r\\n\\u2028\\u2029]')

function firstLine(text: string): string {
  const line = text.split(LINE_BREAK).find((l) => l.trim() !== '')
  return (line ?? '').replace(/\s+/g, ' ').trim()
}

function cutAtWord(line: string, max: number): string {
  if (line.length <= max) return line
  let cut = line.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  if (space > 0) cut = cut.slice(0, space)
  if (/[\ud800-\udbff]$/.test(cut)) cut = cut.slice(0, -1)
  return `${cut.trimEnd()}…`
}

/** One line of at most 80 characters, never empty: the first non-empty line, else the fallback. */
export function eventTitle(text: string, fallback = EMPTY_MESSAGE_TITLE): string {
  const line = cutAtWord(firstLine(text), TITLE_MAX_LENGTH)
  if (line !== '') return line
  return cutAtWord(firstLine(fallback), TITLE_MAX_LENGTH) || EMPTY_MESSAGE_TITLE
}

function subtitleOf(text: string | null | undefined): string | null {
  const line = cutAtWord(firstLine(text ?? ''), TITLE_MAX_LENGTH)
  return line === '' ? null : line
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
