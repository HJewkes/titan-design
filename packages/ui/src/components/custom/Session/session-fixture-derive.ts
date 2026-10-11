// Derives every session-level view of a fixture (buckets, gaps, tools, files, errors, agents,
// totals) from its turns, so the aggregates cannot disagree with the turns they summarise.
// Not exported from any barrel.
import type {
  CompactionMark,
  SessionTimeline,
  TimelineAgentSpan,
  TimelineErrorBreakdown,
  TimelineFileBreakdown,
  TimelineFileTouch,
  TimelineGap,
  TimelineMinuteBucket,
  TimelineTokenPoint,
  TimelineTokens,
  TimelineToolBreakdown,
  TimelineToolCall,
  TimelineTotals,
  TimelineTurn,
  TokenTimeline,
  ToolNameCount,
} from './session-types'

const MINUTE_MS = 60_000

export const ZERO_TOKENS: TimelineTokens = {
  input: 0,
  cacheRead: 0,
  cacheWrite: 0,
  cacheWrite5m: 0,
  cacheWrite1h: 0,
  output: 0,
}

export function addTokens(a: TimelineTokens, b: TimelineTokens): TimelineTokens {
  return {
    input: a.input + b.input,
    cacheRead: a.cacheRead + b.cacheRead,
    cacheWrite: a.cacheWrite + b.cacheWrite,
    cacheWrite5m: a.cacheWrite5m + b.cacheWrite5m,
    cacheWrite1h: a.cacheWrite1h + b.cacheWrite1h,
    output: a.output + b.output,
  }
}

const ascending = (values: (number | null)[]): number[] =>
  values.filter((v): v is number => v !== null && Number.isFinite(v)).sort((a, b) => a - b)

const allCalls = (turns: TimelineTurn[]): TimelineToolCall[] => turns.flatMap((t) => t.toolCalls)

export function deriveGaps(turns: TimelineTurn[]): TimelineGap[] {
  return turns.flatMap((turn, i) => {
    const gap = turn.gapBeforeMs
    if (i === 0 || gap === null || !(gap > 0) || turn.startMs === null) return []
    return [{ startMs: turn.startMs - gap, endMs: turn.startMs, durationMs: gap }]
  })
}

type BucketField = 'events' | 'messages' | 'toolCalls' | 'errors' | 'outputTokens' | 'costUsd'

function bucketAdder(buckets: Map<number, TimelineMinuteBucket>) {
  return (atMs: number | null, field: BucketField, amount = 1) => {
    if (atMs === null) return
    const minuteMs = Math.floor(atMs / MINUTE_MS) * MINUTE_MS
    const bucket = buckets.get(minuteMs) ?? {
      minuteMs,
      events: 0,
      messages: 0,
      toolCalls: 0,
      errors: 0,
      outputTokens: 0,
      costUsd: 0,
      gapBeforeMs: null,
    }
    bucket[field] += amount
    buckets.set(minuteMs, bucket)
  }
}

function addTurnEvents(add: ReturnType<typeof bucketAdder>, turn: TimelineTurn) {
  for (const message of [turn.user, ...turn.assistant]) {
    if (!message) continue
    add(message.atMs, 'events')
    add(message.atMs, 'messages')
  }
  for (const call of turn.toolCalls) {
    add(call.atMs, 'events')
    add(call.atMs, 'toolCalls')
    add(call.endMs, 'events')
    if (call.outcome === 'error') add(call.endMs, 'errors')
  }
}

export function deriveBuckets(
  turns: TimelineTurn[],
  points: TimelineTokenPoint[]
): TimelineMinuteBucket[] {
  const buckets = new Map<number, TimelineMinuteBucket>()
  const add = bucketAdder(buckets)
  for (const turn of turns) addTurnEvents(add, turn)
  for (const point of points) {
    add(point.atMs, 'outputTokens', point.outputTokens)
    add(point.atMs, 'costUsd', point.costUsd)
  }
  for (const gap of deriveGaps(turns)) {
    const bucket = buckets.get(Math.floor(gap.endMs / MINUTE_MS) * MINUTE_MS)
    if (bucket) bucket.gapBeforeMs = gap.durationMs
  }
  return [...buckets.values()].sort((a, b) => a.minuteMs - b.minuteMs)
}

function countByName(calls: TimelineToolCall[]): ToolNameCount[] {
  const byName = new Map<string, ToolNameCount>()
  for (const call of calls) {
    const row = byName.get(call.name) ?? {
      name: call.name,
      family: call.family,
      calls: 0,
      errors: 0,
      durationMs: 0,
    }
    row.calls += 1
    row.errors += call.outcome === 'error' ? 1 : 0
    row.durationMs += call.durationMs ?? 0
    byName.set(call.name, row)
  }
  // Array.prototype.sort is stable, so ties keep first-seen order.
  return [...byName.values()].sort((a, b) => b.calls - a.calls)
}

export function deriveTools(turns: TimelineTurn[]): TimelineToolBreakdown {
  const calls = allCalls(turns)
  const families = [...new Set(calls.map((c) => c.family))]
  return {
    byName: countByName(calls),
    byFamily: families.map((family) => {
      const own = calls.filter((c) => c.family === family)
      return {
        family,
        calls: own.length,
        errors: own.filter((c) => c.outcome === 'error').length,
        atMs: ascending(own.map((c) => c.atMs)),
      }
    }),
    atMs: ascending(calls.map((c) => c.atMs)),
  }
}

export function deriveFiles(turns: TimelineTurn[]): TimelineFileBreakdown {
  const touches = new Map<string, TimelineFileTouch>()
  for (const call of allCalls(turns)) {
    if (call.filePath === null) continue
    const access = call.family === 'fs_write' ? 'write' : 'read'
    const key = `${access}:${call.filePath}`
    const touch = touches.get(key) ?? { path: call.filePath, access, atMs: call.atMs, calls: 0 }
    touch.calls += 1
    touches.set(key, touch)
  }
  const rows = [...touches.values()]
  return {
    touches: rows,
    readCount: rows.filter((t) => t.access === 'read').length,
    writeCount: rows.filter((t) => t.access === 'write').length,
  }
}

export function deriveErrors(turns: TimelineTurn[]): TimelineErrorBreakdown {
  const calls = allCalls(turns)
  const items = calls
    .filter((c) => c.outcome === 'error')
    .map((c) => ({
      callId: c.id,
      toolName: c.name,
      turnIndex: c.turnIndex,
      atMs: c.endMs,
      message: c.errorMessage ?? '',
      sidechain: c.sidechain,
    }))
  return {
    rate: calls.length === 0 ? 0 : items.length / calls.length,
    items,
    atMs: ascending(items.map((i) => i.atMs)),
  }
}

export function deriveAgents(turns: TimelineTurn[]): TimelineAgentSpan[] {
  return allCalls(turns)
    .filter((c) => c.family === 'subagent')
    .map((c) => ({
      callId: c.id,
      label: c.inputSummary,
      startMs: c.atMs,
      endMs: c.endMs,
      outcome: c.outcome,
    }))
}

export function deriveCompactions(turns: TimelineTurn[]): CompactionMark[] {
  return turns
    .filter((t) => t.origin === 'compaction')
    .map((t) => ({
      atMs: t.startMs,
      turnIndex: t.index,
      byteOffset: t.user?.byteOffset ?? 0,
      summary: t.user?.text ?? null,
      summaryTruncated: t.user?.truncated ?? false,
    }))
}

export function deriveTotals(turns: TimelineTurn[], tokens: TokenTimeline): TimelineTotals {
  return {
    turns: turns.length,
    userMessages: turns.filter((t) => t.user !== null).length,
    assistantMessages: turns.reduce((n, t) => n + t.assistant.length, 0),
    toolCalls: turns.reduce((n, t) => n + t.toolCalls.length, 0),
    errors: turns.reduce((n, t) => n + t.errorCount, 0),
    compactions: tokens.compactions.length,
    requests: tokens.basis === 'snapshot' ? null : tokens.points.length,
    unpricedRequests: 0,
    tokens: turns.reduce((sum, t) => addTokens(sum, t.tokens), ZERO_TOKENS),
    costUsd: turns.reduce((n, t) => n + t.costUsd, 0),
  }
}

function sessionSpan(turns: TimelineTurn[]): Pick<SessionTimeline, 'startMs' | 'endMs'> {
  const last = turns[turns.length - 1]
  return { startMs: turns[0]?.startMs ?? null, endMs: last?.endMs ?? null }
}

function lastKnownMs(turns: TimelineTurn[]): number | null {
  const times = ascending(
    turns.flatMap((t) => [t.startMs, t.endMs, ...t.toolCalls.map((c) => c.atMs)])
  )
  return times[times.length - 1] ?? null
}

/** Assembles a complete timeline whose every aggregate is computed from `turns`. */
export function deriveTimeline(
  turns: TimelineTurn[],
  tokens: Omit<TokenTimeline, 'compactions'>,
  sessionId: string
): SessionTimeline {
  const tokenTimeline = { ...tokens, compactions: deriveCompactions(turns) }
  const { startMs, endMs } = sessionSpan(turns)
  const lastMs = endMs ?? lastKnownMs(turns)
  return {
    version: 1,
    sessionId,
    harness: 'orchard-cli',
    startMs,
    endMs,
    durationMs: startMs !== null && lastMs !== null ? lastMs - startMs : 0,
    totals: deriveTotals(turns, tokenTimeline),
    turns,
    buckets: deriveBuckets(turns, tokens.points),
    gaps: deriveGaps(turns),
    tokens: tokenTimeline,
    tools: deriveTools(turns),
    files: deriveFiles(turns),
    errors: deriveErrors(turns),
    agents: deriveAgents(turns),
  }
}
