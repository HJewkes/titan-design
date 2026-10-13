// Synthetic session timelines for the Session family's tests and stories (contract TP-855 F-e).
// Every value is generated from a seed: the prose is drawn from the invented orchard-inventory
// word list in session-fixture-words.ts, and every `*Ms` is a fixed epoch value, so nothing reads
// the clock. Not exported from any barrel.
import { seededRandom } from '../../ui/charts/kit/seededRandom'
import { ZERO_TOKENS, addTokens, deriveTimeline } from './session-fixture-derive'
import { PROSE_WORDS, SEARCH_WORDS } from './session-fixture-words'
import type {
  SessionTimeline,
  TimelineMessage,
  TimelineTokenPoint,
  TimelineTokens,
  TimelineToolCall,
  TimelineToolOutcome,
  TimelineTurn,
  TimelineTurnOrigin,
  TokenTimeline,
  ToolFamily,
} from './session-types'

const MINUTE_MS = 60_000

/** The fixed "now" every fixture is read against: 2026-09-14 18:00 UTC. */
export const SESSION_NOW = Date.UTC(2026, 8, 14, 18, 0)

/** How a turn opens. `channel` is an injected opener with the channel marker. */
export type FixtureOpener = 'prompt' | 'injected' | 'channel' | 'compaction' | 'none'

export interface SessionSpec {
  seed: number
  startMs: number
  turns: number
  /** Time from a turn's first event to its last. */
  turnMs: number
  /** Idle time between turns when no gap is set. */
  pauseMs?: number
  /** Tool calls across the session, excluding `pending`. */
  calls?: number
  /** `random` draws each call's turn from the seed; `even` deals them out in order. */
  spread?: 'random' | 'even'
  /** Families drawn in rotation; subagent calls are placed by `subagents`. */
  families?: ToolFamily[]
  subagents?: number
  /** Failed calls, or `all`. */
  errors?: number | 'all'
  /** Idle time before a turn, by turn index. */
  gaps?: Record<number, number>
  openers?: Record<number, FixtureOpener>
  /** False drops every assistant message, leaving turns that are only a tool group. */
  assistantText?: boolean
  /** Prompt text by turn index, in place of generated text. */
  prompts?: Record<number, string>
  /** Calls appended to the last turn with no result; the session then has no end. */
  pending?: number
  tokenBasis?: TokenTimeline['basis']
  /** Applied to the built turns before the aggregates are derived from them. */
  edit?: (turns: TimelineTurn[]) => TimelineTurn[]
}

const TOOLS_BY_FAMILY: Record<ToolFamily, string[]> = {
  fs_read: ['Read', 'Grep', 'Glob'],
  fs_write: ['Edit', 'Write'],
  bash: ['Bash'],
  subagent: ['Task'],
  web: ['WebFetch', 'WebSearch'],
  mcp_agentchat: ['mcp__agent-chat__chat_send'],
  mcp_other: ['mcp__ledger__lookup'],
  ask_user: ['AskUserQuestion'],
  scheduling: ['ScheduleWakeup'],
  skill_toolsearch: ['Skill', 'ToolSearch'],
  other_tool: ['OrchardSync'],
  none: [''],
}

const DEFAULT_FAMILIES: ToolFamily[] = ['fs_read', 'fs_write', 'bash']

interface CallPlan {
  family: ToolFamily
  isError: boolean
}

interface BuildContext {
  rand: () => number
  spec: SessionSpec
  plans: CallPlan[]
  seq: number
  byteOffset: number
  cursor: number
  callOrdinal: number
  points: TimelineTokenPoint[]
  afterCompaction: boolean
}

const pick = <T>(rand: () => number, items: readonly T[]): T =>
  items[Math.floor(rand() * items.length)] as T

function words(rand: () => number, count: number): string {
  return Array.from({ length: count }, () => pick(rand, PROSE_WORDS)).join(' ')
}

function allocateCalls(spec: SessionSpec, rand: () => number): number[] {
  const counts = Array<number>(spec.turns).fill(0)
  const calls = spec.turns === 0 ? 0 : (spec.calls ?? 0)
  for (let i = 0; i < calls; i++) {
    const turn = spec.spread === 'even' ? i % spec.turns : Math.floor(rand() * spec.turns)
    counts[turn] = (counts[turn] ?? 0) + 1
  }
  return counts
}

function distinctIndexes(rand: () => number, pool: number[], count: number): Set<number> {
  const remaining = [...pool]
  const chosen = new Set<number>()
  while (chosen.size < count && remaining.length > 0) {
    chosen.add(remaining.splice(Math.floor(rand() * remaining.length), 1)[0] as number)
  }
  return chosen
}

function planCalls(spec: SessionSpec, rand: () => number, total: number): CallPlan[] {
  const families = (spec.families ?? DEFAULT_FAMILIES).filter((f) => f !== 'subagent')
  const all = Array.from({ length: total }, (_, i) => i)
  const subagents = distinctIndexes(rand, all, spec.subagents ?? 0)
  const errorPool = all.filter((i) => !subagents.has(i))
  const errors =
    spec.errors === 'all' ? new Set(all) : distinctIndexes(rand, errorPool, spec.errors ?? 0)
  return all.map((i) => ({
    family: subagents.has(i) ? 'subagent' : (families[i % families.length] as ToolFamily),
    isError: errors.has(i),
  }))
}

function inputFor(rand: () => number, name: string): { summary: string; path: string | null } {
  if (name === 'Read' || name === 'Edit' || name === 'Write') {
    const path = `src/orchard/${pick(rand, PROSE_WORDS)}-ledger.ts`
    return { summary: path, path }
  }
  const summaries: Record<string, string> = {
    Grep: `${pick(rand, PROSE_WORDS)} count`,
    Glob: 'src/orchard/*.ts',
    Bash: rand() < 0.5 ? `pnpm test ${pick(rand, PROSE_WORDS)}` : 'git diff',
    Task: `count the ${words(rand, 3)}`,
    WebFetch: `docs orchard ${pick(rand, PROSE_WORDS)}`,
    WebSearch: `${words(rand, 2)} season`,
  }
  return { summary: summaries[name] ?? `${words(rand, 2)} ledger`, path: null }
}

function nextSeq(ctx: BuildContext): number {
  ctx.seq += 1
  return ctx.seq
}

function nextOffset(ctx: BuildContext, text: string): number {
  const offset = ctx.byteOffset
  ctx.byteOffset += text.length + 120
  return offset
}

function message(
  ctx: BuildContext,
  role: TimelineMessage['role'],
  atMs: number,
  text: string
): TimelineMessage {
  return {
    role,
    seq: nextSeq(ctx),
    atMs,
    text,
    truncated: false,
    byteOffset: nextOffset(ctx, text),
  }
}

function toolCall(
  ctx: BuildContext,
  turnIndex: number,
  atMs: number,
  maxMs: number,
  isPending: boolean
): TimelineToolCall {
  const plan = isPending
    ? { family: pick(ctx.rand, DEFAULT_FAMILIES), isError: false }
    : (ctx.plans[ctx.callOrdinal++] as CallPlan)
  const name = pick(ctx.rand, TOOLS_BY_FAMILY[plan.family])
  const input = inputFor(ctx.rand, name)
  const durationMs = isPending ? null : Math.round(Math.min(maxMs, 150 + ctx.rand() * 6_000))
  const outcome: TimelineToolOutcome = isPending ? 'pending' : plan.isError ? 'error' : 'success'
  const id = `call-${String(ctx.seq + 1).padStart(5, '0')}`
  return {
    id,
    seq: nextSeq(ctx),
    turnIndex,
    name,
    family: plan.family,
    atMs,
    endMs: durationMs === null ? null : atMs + durationMs,
    durationMs,
    outcome,
    errorMessage: plan.isError
      ? `${SEARCH_WORDS.onlyInErrors} found in ${pick(ctx.rand, PROSE_WORDS)} ledger`
      : null,
    inputSummary: input.summary,
    filePath: input.path,
    sidechain: false,
    byteOffset: nextOffset(ctx, id),
  }
}

function openerText(ctx: BuildContext, opener: FixtureOpener, index: number): string {
  if (opener === 'injected') return `reminder: ${words(ctx.rand, 6)}`
  if (opener === 'channel') return `channel note: ${words(ctx.rand, 8)}`
  if (opener === 'compaction') return `summary of the earlier context: ${words(ctx.rand, 14)}`
  return ctx.spec.prompts?.[index] ?? `please ${words(ctx.rand, 6 + Math.floor(ctx.rand() * 10))}`
}

const ORIGIN_OF: Record<FixtureOpener, TimelineTurnOrigin> = {
  prompt: 'prompt',
  injected: 'injected',
  channel: 'injected',
  compaction: 'compaction',
  none: 'none',
}

const MARKER_OF: Record<FixtureOpener, string | null> = {
  prompt: null,
  injected: 'reminder',
  channel: 'channel',
  compaction: 'compaction',
  none: null,
}

function assistantText(ctx: BuildContext): string {
  const lead = words(ctx.rand, 8 + Math.floor(ctx.rand() * 12))
  if (ctx.rand() < 0.5) return lead
  return `${lead}\n\n- **${pick(ctx.rand, PROSE_WORDS)}** ${words(ctx.rand, 5)}\n- \`src/orchard/index.ts\` ${words(ctx.rand, 4)}`
}

function tokenUsage(rand: () => number): TimelineTokens {
  const cacheWrite5m = 300 + Math.floor(rand() * 2_700)
  const cacheWrite1h = rand() < 0.2 ? 1_000 : 0
  return {
    input: 500 + Math.floor(rand() * 2_500),
    cacheRead: 20_000 + Math.floor(rand() * 40_000),
    cacheWrite: cacheWrite5m + cacheWrite1h,
    cacheWrite5m,
    cacheWrite1h,
    output: 80 + Math.floor(rand() * 1_400),
  }
}

function priceOf(t: TimelineTokens): number {
  const microDollars =
    t.input * 3 + t.cacheRead * 0.3 + t.cacheWrite5m * 3.75 + t.cacheWrite1h * 6 + t.output * 15
  return Math.round(microDollars) / 1e6
}

function tokenPoint(ctx: BuildContext, turnIndex: number, atMs: number, usage: TimelineTokens) {
  const costUsd = priceOf(usage)
  const previous = ctx.points[ctx.points.length - 1]
  ctx.points.push({
    atMs,
    turnIndex,
    model: 'orchard-large',
    contextTokens: usage.input + usage.cacheRead + usage.cacheWrite,
    outputTokens: usage.output,
    cumulativeOutputTokens: (previous?.cumulativeOutputTokens ?? 0) + usage.output,
    costUsd,
    cumulativeCostUsd: (previous?.cumulativeCostUsd ?? 0) + costUsd,
    priced: true,
    afterCompaction: ctx.afterCompaction,
  })
  ctx.afterCompaction = false
  return costUsd
}

type TurnEvent = { kind: 'user' } | { kind: 'assistant' } | { kind: 'call'; isPending: boolean }

function turnEvents(ctx: BuildContext, opener: FixtureOpener, calls: number, pending: number) {
  const events: TurnEvent[] = []
  const withText = ctx.spec.assistantText !== false
  if (opener !== 'none') events.push({ kind: 'user' })
  if (withText && calls > 0) events.push({ kind: 'assistant' })
  for (let i = 0; i < calls; i++) events.push({ kind: 'call', isPending: false })
  for (let i = 0; i < pending; i++) events.push({ kind: 'call', isPending: true })
  if (withText && pending === 0) events.push({ kind: 'assistant' })
  return events
}

interface TurnPlan {
  index: number
  calls: number
  pending: number
}

function buildTurn(ctx: BuildContext, { index, calls, pending }: TurnPlan): TimelineTurn {
  const opener = ctx.spec.openers?.[index] ?? 'prompt'
  const gapBeforeMs = index > 0 ? (ctx.spec.gaps?.[index] ?? null) : null
  const startMs =
    index === 0 ? ctx.spec.startMs : ctx.cursor + (gapBeforeMs ?? ctx.spec.pauseMs ?? MINUTE_MS)
  if (opener === 'compaction') ctx.afterCompaction = true
  const events = turnEvents(ctx, opener, calls, pending)
  const step = events.length > 1 ? Math.floor(ctx.spec.turnMs / (events.length - 1)) : 0
  const turn: TimelineTurn = {
    index,
    origin: ORIGIN_OF[opener],
    injectedMarker: MARKER_OF[opener],
    startMs,
    endMs: null,
    gapBeforeMs,
    user: null,
    assistant: [],
    toolCalls: [],
    errorCount: 0,
    tokens: ZERO_TOKENS,
    costUsd: 0,
  }
  events.forEach((event, k) => addEvent(ctx, turn, event, startMs + k * step, step))
  return closeTurn(ctx, turn, pending > 0)
}

function addEvent(
  ctx: BuildContext,
  turn: TimelineTurn,
  event: TurnEvent,
  atMs: number,
  step: number
) {
  if (event.kind === 'user') {
    const opener = ctx.spec.openers?.[turn.index] ?? 'prompt'
    turn.user = message(ctx, 'user', atMs, openerText(ctx, opener, turn.index))
  } else if (event.kind === 'assistant') {
    turn.assistant.push(message(ctx, 'assistant', atMs, assistantText(ctx)))
    const usage = tokenUsage(ctx.rand)
    turn.tokens = addTokens(turn.tokens, usage)
    turn.costUsd += tokenPoint(ctx, turn.index, atMs, usage)
  } else {
    const maxMs = step > 0 ? Math.floor(step * 0.8) : 1_500
    turn.toolCalls.push(toolCall(ctx, turn.index, atMs, maxMs, event.isPending))
  }
}

function closeTurn(ctx: BuildContext, turn: TimelineTurn, isPending: boolean): TimelineTurn {
  const times = [
    turn.startMs ?? 0,
    turn.user?.atMs ?? 0,
    ...turn.assistant.map((m) => m.atMs ?? 0),
    ...turn.toolCalls.map((c) => c.endMs ?? c.atMs ?? 0),
  ]
  const lastMs = Math.max(...times)
  ctx.cursor = lastMs
  return { ...turn, endMs: isPending ? null : lastMs }
}

function priceTurns(turns: TimelineTurn[], basis: TokenTimeline['basis']): TimelineTurn[] {
  const errorCounted = turns.map((t) => ({
    ...t,
    errorCount: t.toolCalls.filter((c) => c.outcome === 'error').length,
  }))
  return basis === 'delta' ? errorCounted : errorCounted.map((t) => ({ ...t, costUsd: 0 }))
}

/** A complete, internally consistent timeline from a seeded spec. */
export function makeSessionTimeline(
  spec: SessionSpec,
  sessionId = 'session-0001'
): SessionTimeline {
  const rand = seededRandom(spec.seed)
  const counts = allocateCalls(spec, rand)
  const ctx: BuildContext = {
    rand,
    spec,
    plans: planCalls(
      spec,
      rand,
      counts.reduce((a, b) => a + b, 0)
    ),
    seq: 0,
    byteOffset: 0,
    cursor: spec.startMs,
    callOrdinal: 0,
    points: [],
    afterCompaction: false,
  }
  const last = spec.turns - 1
  const built = counts.map((calls, index) =>
    buildTurn(ctx, { index, calls, pending: index === last ? (spec.pending ?? 0) : 0 })
  )
  const basis = spec.tokenBasis ?? 'delta'
  const turns = priceTurns((spec.edit ?? ((t) => t))(built), basis)
  const points = basis === 'delta' ? ctx.points : []
  return deriveTimeline(turns, { basis, points, models: modelsOf(points) }, sessionId)
}

function modelsOf(points: TimelineTokenPoint[]): TokenTimeline['models'] {
  return points.length === 0 ? [] : [{ model: 'orchard-large', requests: points.length }]
}

const ALL_FAMILIES: ToolFamily[] = [
  'fs_read',
  'fs_write',
  'bash',
  'web',
  'mcp_agentchat',
  'mcp_other',
  'ask_user',
  'scheduling',
  'skill_toolsearch',
  'other_tool',
]

const at = (hour: number, minute: number, day = 14) => Date.UTC(2026, 8, day, hour, minute)

/** 24 turns over about 2 h 40 min: 96 calls in 7 families, 4 errors, 12 and 31 minute gaps. */
export const SESSION_DEFAULT = makeSessionTimeline({
  seed: 7,
  startMs: at(9, 0),
  turns: 24,
  turnMs: 235_000,
  calls: 96,
  families: ['fs_read', 'fs_write', 'bash', 'web', 'mcp_agentchat', 'skill_toolsearch'],
  subagents: 2,
  errors: 4,
  gaps: { 9: 12 * MINUTE_MS, 17: 31 * MINUTE_MS },
  openers: { 12: 'compaction' },
  prompts: { 3: `check the ${SEARCH_WORDS.inOnePrompt} rows in the north block` },
})

export const SESSION_EMPTY = makeSessionTimeline({
  seed: 1,
  startMs: at(9, 0),
  turns: 0,
  turnMs: 0,
})

/** One prompt and one reply. */
export const SESSION_ONE_TURN = makeSessionTimeline({
  seed: 2,
  startMs: at(9, 0),
  turns: 1,
  turnMs: 40_000,
})

export const SESSION_NO_TOOLS = makeSessionTimeline({
  seed: 3,
  startMs: at(9, 0),
  turns: 6,
  turnMs: 50_000,
})

/** No opening message on the first turn, and no assistant text anywhere. */
export const SESSION_TOOLS_ONLY = makeSessionTimeline({
  seed: 4,
  startMs: at(9, 0),
  turns: 4,
  turnMs: 90_000,
  calls: 10,
  spread: 'even',
  openers: { 0: 'none' },
  assistantText: false,
})

/** A prompt, an injected block, a channel message, a compaction summary and a prompt. */
export const SESSION_ORIGINS = makeSessionTimeline({
  seed: 5,
  startMs: at(9, 0),
  turns: 5,
  turnMs: 60_000,
  calls: 6,
  openers: { 1: 'injected', 2: 'channel', 3: 'compaction' },
})

export const SESSION_ALL_ERRORS = makeSessionTimeline({
  seed: 6,
  startMs: at(9, 0),
  turns: 5,
  turnMs: 80_000,
  calls: 12,
  spread: 'even',
  errors: 'all',
})

/** A live session: the last turn holds 3 calls with no result, and the session has no end. */
export const SESSION_PENDING = makeSessionTimeline({
  seed: 8,
  startMs: at(17, 30),
  turns: 4,
  turnMs: 120_000,
  calls: 8,
  pending: 3,
})

/** 23:40 to about 00:25 UTC, so one turn starts on the next day. */
export const SESSION_MIDNIGHT = makeSessionTimeline({
  seed: 9,
  startMs: at(23, 40),
  turns: 9,
  turnMs: 240_000,
  calls: 12,
})

function withoutTimes(turns: TimelineTurn[]): TimelineTurn[] {
  const untimed = <T extends { atMs: number | null }>(m: T): T => ({ ...m, atMs: null })
  return turns.map((t) => ({
    ...t,
    startMs: null,
    endMs: null,
    gapBeforeMs: null,
    user: t.user && untimed(t.user),
    assistant: t.assistant.map(untimed),
    toolCalls: t.toolCalls.map((c) => ({ ...untimed(c), endMs: null })),
  }))
}

/** Every timestamp and gap is null; a source that reported no times. */
export const SESSION_NULL_TIMES = makeSessionTimeline({
  seed: 10,
  startMs: at(9, 0),
  turns: 5,
  turnMs: 60_000,
  calls: 8,
  gaps: { 2: 15 * MINUTE_MS },
  tokenBasis: 'unreported',
  edit: withoutTimes,
})

const LONG_REPLY_CAP = 4_000

function wordsUpTo(seed: number, length: number): string {
  const rand = seededRandom(seed)
  let text: string = pick(rand, PROSE_WORDS)
  for (;;) {
    const next = pick(rand, PROSE_WORDS)
    if (text.length + 1 + next.length > length) return text.padEnd(length, ' ')
    text = `${text} ${next}`
  }
}

const FORTY_LINE_PROMPT = Array.from(
  { length: 40 },
  (_, i) => `${i + 1}. ${wordsUpTo(100 + i, 48).trim()}`
).join('\n')

const MARKDOWN_REPLY = [
  '## Crate count',
  'The **north** rows are counted and `src/orchard/index.ts` is kept.',
  '- apples graded\n- pears sorted',
  '```ts\nconst crates = count(rows)\n```',
].join('\n\n')

function withLongText(turns: TimelineTurn[]): TimelineTurn[] {
  const [first, second, third] = turns as [TimelineTurn, TimelineTurn, TimelineTurn]
  const replace = (m: TimelineMessage | null | undefined, text: string, truncated = false) =>
    m ? { ...m, text, truncated } : null
  return [
    {
      ...first,
      user: replace(first.user, FORTY_LINE_PROMPT),
      assistant: first.assistant.map((m) => replace(m, wordsUpTo(11, LONG_REPLY_CAP), true)!),
    },
    { ...second, user: replace(second.user, 'pear-'.repeat(60)) },
    { ...third, assistant: third.assistant.map((m) => replace(m, MARKDOWN_REPLY)!) },
  ]
}

/** A reply cut at 4,000 characters, a 300-character token, a 40-line prompt and markdown. */
export const SESSION_LONG_TEXT = makeSessionTimeline({
  seed: 12,
  startMs: at(9, 0),
  turns: 3,
  turnMs: 60_000,
  calls: 2,
  spread: 'even',
  edit: withLongText,
})

/** One turn holding 400 calls. */
export const SESSION_ONE_HUGE_TURN = makeSessionTimeline({
  seed: 13,
  startMs: at(9, 0),
  turns: 1,
  turnMs: 20 * MINUTE_MS,
  calls: 400,
  errors: 6,
})

/** The stated scale: 500 turns and 5,000 calls. */
export const SESSION_LARGE = makeSessionTimeline({
  seed: 14,
  startMs: at(6, 0),
  turns: 500,
  turnMs: 40_000,
  pauseMs: 20_000,
  calls: 5_000,
  families: ALL_FAMILIES,
  subagents: 20,
  errors: 150,
  gaps: Object.fromEntries(
    Array.from({ length: 9 }, (_, i) => [(i + 1) * 50, (15 + i) * MINUTE_MS])
  ),
  openers: { 200: 'compaction', 400: 'compaction' },
})

/** Running totals only: no token points, and every cost is 0. */
export const SESSION_SNAPSHOT_BASIS = makeSessionTimeline({
  seed: 15,
  startMs: at(9, 0),
  turns: 6,
  turnMs: 60_000,
  calls: 14,
  tokenBasis: 'snapshot',
})

const MARKUP = '<script>alert(1)</script> <b>bold</b> pears'

function editCall(turn: TimelineTurn, k: number, patch: Partial<TimelineToolCall>) {
  turn.toolCalls[k] = { ...(turn.toolCalls[k] as TimelineToolCall), ...patch }
}

function makeHostile(turns: TimelineTurn[]): TimelineTurn[] {
  const [t0, t1, t2, t3] = turns.map((t) => ({ ...t, toolCalls: [...t.toolCalls] })) as [
    TimelineTurn,
    TimelineTurn,
    TimelineTurn,
    TimelineTurn,
  ]
  editCall(t0, 0, { family: 'future_family' as ToolFamily })
  editCall(t0, 1, { outcome: 'cancelled' as TimelineToolOutcome })
  editCall(t1, 0, { id: t0.toolCalls[0]?.id })
  editCall(t1, 1, { seq: 0, outcome: 'error', errorMessage: `<b>${SEARCH_WORDS.onlyInErrors}</b>` })
  editCall(t2, 0, { turnIndex: 99 })
  editCall(t2, 1, { durationMs: Number.NaN })
  editCall(t2, 2, { durationMs: -500 })
  editCall(t3, 0, { name: '' })
  t0.user = t0.user && { ...t0.user, text: MARKUP }
  t1.user = t1.user && { ...t1.user, text: 'תפוח עץ north row' }
  t2.assistant = t2.assistant.map((m) => ({ ...m, text: `apple${'\n'.repeat(200)}pear` }))
  return [t0, t1, { ...t2 }, { ...t3, gapBeforeMs: -MINUTE_MS }]
}

/** Values the unions do not know, duplicate ids, `seq` out of order, NaN and negative spans. */
export const SESSION_HOSTILE = makeSessionTimeline({
  seed: 16,
  startMs: at(9, 0),
  turns: 4,
  turnMs: 60_000,
  calls: 16,
  spread: 'even',
  errors: 2,
  edit: makeHostile,
})

/** Every named fixture, for the guard test and story `mapping`s. */
export const SESSION_FIXTURES = {
  SESSION_DEFAULT,
  SESSION_EMPTY,
  SESSION_ONE_TURN,
  SESSION_NO_TOOLS,
  SESSION_TOOLS_ONLY,
  SESSION_ORIGINS,
  SESSION_ALL_ERRORS,
  SESSION_PENDING,
  SESSION_MIDNIGHT,
  SESSION_NULL_TIMES,
  SESSION_LONG_TEXT,
  SESSION_ONE_HUGE_TURN,
  SESSION_LARGE,
  SESSION_SNAPSHOT_BASIS,
  SESSION_HOSTILE,
} as const
