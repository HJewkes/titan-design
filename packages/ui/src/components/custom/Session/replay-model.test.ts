import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../test/property'
import {
  REPLAY_ALL_ERRORS,
  REPLAY_DEFAULT,
  REPLAY_EMPTY,
  REPLAY_HOSTILE,
  REPLAY_LARGE,
  REPLAY_LONG_TEXT,
  REPLAY_NO_TOKENS,
  REPLAY_NULL_TIMES,
  REPLAY_ONE,
  REPLAY_ORIGINS,
  REPLAY_PENDING,
  REPLAY_IDS,
  replayEventsOf,
} from './replay-fixture'
import { buildReplayEvents, kindOf } from './replay-model'
import {
  countByKind,
  eventIdAtTime,
  eventIndexById,
  replayEventLabel,
  stepSelection,
  type StepKey,
} from './replay-navigation'
import { eventTitle } from './replay-title'
import { REPLAY_KIND_ORDER, type ReplayEvent } from './replay-types'
import { SESSION_DEFAULT, SESSION_ORIGINS } from './session-fixture'
import type {
  CompactionMark,
  TimelineMessage,
  TimelineToolCall,
  TimelineTokenPoint,
  TimelineTurn,
  TimelineTurnOrigin,
} from './session-types'

const TURN: TimelineTurn = SESSION_DEFAULT.turns[0]!
const CALL: TimelineToolCall = TURN.toolCalls[0]!
const USER: TimelineMessage = TURN.user!

const message = (patch: Partial<TimelineMessage>): TimelineMessage => ({ ...USER, ...patch })
const call = (patch: Partial<TimelineToolCall>): TimelineToolCall => ({ ...CALL, ...patch })
const turnOf = (patch: Partial<TimelineTurn>): TimelineTurn => ({
  ...TURN,
  user: null,
  assistant: [],
  toolCalls: [],
  ...patch,
})
const markAt = (byteOffset: number, patch: Partial<CompactionMark> = {}): CompactionMark => ({
  atMs: null,
  turnIndex: null,
  byteOffset,
  summary: 'older context, summarised',
  summaryTruncated: false,
  ...patch,
})
const point = (patch: Partial<TimelineTokenPoint>): TimelineTokenPoint => ({
  atMs: 0,
  turnIndex: null,
  model: null,
  contextTokens: 100,
  outputTokens: 1,
  cumulativeOutputTokens: 1,
  costUsd: 0,
  cumulativeCostUsd: 0,
  priced: true,
  afterCompaction: false,
  ...patch,
})

const FIXTURES = {
  REPLAY_DEFAULT,
  REPLAY_EMPTY,
  REPLAY_ONE,
  REPLAY_ALL_ERRORS,
  REPLAY_ORIGINS,
  REPLAY_PENDING,
  REPLAY_NULL_TIMES,
  REPLAY_NO_TOKENS,
  REPLAY_LONG_TEXT,
  REPLAY_LARGE,
  REPLAY_HOSTILE,
}

const seqOf = (event: ReplayEvent): number | null => {
  const { payload } = event
  if (payload.type === 'message') return payload.message.seq
  return payload.type === 'tool' ? payload.call.seq : null
}

const originArb = fc.constantFrom<TimelineTurnOrigin>('prompt', 'injected', 'compaction', 'none')

const turnsArb = fc.array(
  fc.record({
    origin: originArb,
    opener: fc.option(fc.record({ seq: fc.nat(500), byteOffset: fc.nat(500) }), { nil: null }),
    replies: fc.array(fc.record({ seq: fc.nat(500), byteOffset: fc.nat(500) }), { maxLength: 3 }),
    calls: fc.array(
      fc.record({
        seq: fc.nat(500),
        byteOffset: fc.nat(500),
        id: fc.constantFrom('a', 'b', 'c'),
        outcome: fc.constantFrom('success', 'error', 'unknown', 'pending'),
      }),
      { maxLength: 4 }
    ),
  }),
  { maxLength: 6 }
)

const marksArb = fc.array(
  fc.nat(500).map((offset) => markAt(offset)),
  { maxLength: 3 }
)

type GeneratedTurns = typeof turnsArb extends fc.Arbitrary<infer T> ? T : never
type Spec = GeneratedTurns[number]

const toTurns = (specs: GeneratedTurns): TimelineTurn[] =>
  specs.map((s: Spec, index) =>
    turnOf({
      index,
      origin: s.origin,
      user: s.opener && message({ ...s.opener, role: 'user' }),
      assistant: s.replies.map((r) => message({ ...r, role: 'assistant' })),
      toolCalls: s.calls.map((c) =>
        call({ ...c, outcome: c.outcome as TimelineToolCall['outcome'] })
      ),
    })
  )

const sourceCount = (turns: TimelineTurn[]) =>
  turns.reduce((n, t) => n + (t.user ? 1 : 0) + t.assistant.length + t.toolCalls.length, 0)

describe('buildReplayEvents counts and order', () => {
  it('holds openers plus assistant messages plus calls plus marks, minus merged pairs', () => {
    fcAssert(
      fc.property(turnsArb, marksArb, (specs, marks) => {
        const turns = toTurns(specs)
        const events = buildReplayEvents({ turns, tokens: { points: [], compactions: marks } })
        const merged = events.filter(
          (e) =>
            e.payload.type === 'compaction' &&
            e.payload.mark !== null &&
            e.payload.summaryMessage !== null
        ).length

        expect(events).toHaveLength(sourceCount(turns) + marks.length - merged)
      })
    )
  })

  it('keeps messages and calls in seq order for any input order', () => {
    fcAssert(
      fc.property(turnsArb, (specs) => {
        const events = buildReplayEvents({ turns: toTurns(specs) })
        const seqs = events.map(seqOf).filter((s): s is number => s !== null)

        expect(seqs).toEqual([...seqs].sort((a, b) => a - b))
      })
    )
  })

  it('keeps seq order when timestamps are null or equal', () => {
    const turns = SESSION_DEFAULT.turns.map((t) => ({
      ...t,
      user: t.user && { ...t.user, atMs: 5 },
      assistant: t.assistant.map((m) => ({ ...m, atMs: 5 })),
      toolCalls: t.toolCalls.map((c) => ({ ...c, atMs: 5 })),
    }))
    const seqs = (events: ReplayEvent[]) => events.map(seqOf).filter((s): s is number => s !== null)

    for (const events of [REPLAY_NULL_TIMES, buildReplayEvents({ turns })]) {
      expect(seqs(events)).toEqual([...seqs(events)].sort((a, b) => a - b))
    }
    expect(REPLAY_NULL_TIMES.every((e) => e.moment.atMs === null)).toBe(true)
  })

  it('numbers positions 1 to total with no hole', () => {
    fcAssert(
      fc.property(turnsArb, marksArb, (specs, marks) => {
        const events = buildReplayEvents({
          turns: toTurns(specs),
          tokens: { points: [], compactions: marks },
        })

        expect(events.map((e) => e.moment.position)).toEqual(events.map((_, i) => i + 1))
        for (const e of events) expect(e.moment.total).toBe(events.length)
      })
    )
  })

  it('gives unique ids, including with duplicate call ids and seqs', () => {
    fcAssert(
      fc.property(turnsArb, marksArb, (specs, marks) => {
        const events = buildReplayEvents({
          turns: toTurns(specs),
          tokens: { points: [], compactions: marks },
        })

        expect(new Set(events.map((e) => e.id)).size).toBe(events.length)
      })
    )
    expect(new Set(REPLAY_HOSTILE.map((e) => e.id)).size).toBe(REPLAY_HOSTILE.length)
  })

  it('builds no events from an empty session', () => {
    expect(REPLAY_EMPTY).toEqual([])
  })
})

describe('compaction placement', () => {
  const turns = [
    turnOf({
      index: 0,
      user: message({ seq: 0, byteOffset: 0 }),
      assistant: [message({ role: 'assistant', seq: 1, byteOffset: 100 })],
      toolCalls: [call({ id: 'x', seq: 2, byteOffset: 200 })],
    }),
  ]
  const kinds = (marks: CompactionMark[]) =>
    buildReplayEvents({ turns, tokens: { points: [], compactions: marks } }).map((e) => e.kind)

  it('sits before the first event with a greater byte offset', () => {
    expect(kinds([markAt(50)])).toEqual(['prompt', 'compaction', 'assistant', 'tool'])
    expect(kinds([markAt(150)])).toEqual(['prompt', 'assistant', 'compaction', 'tool'])
  })

  it('sits last when no event has a greater byte offset', () => {
    expect(kinds([markAt(200)])).toEqual(['prompt', 'assistant', 'tool', 'compaction'])
    expect(kinds([markAt(9_999)])).toEqual(['prompt', 'assistant', 'tool', 'compaction'])
  })

  it('merges a mark with the compaction opener that follows it into one event', () => {
    const opener = message({ seq: 5, byteOffset: 300 })
    const compacted = [
      ...turns,
      turnOf({ index: 1, origin: 'compaction', user: opener, injectedMarker: 'compact' }),
    ]

    const events = buildReplayEvents({
      turns: compacted,
      tokens: { points: [], compactions: [markAt(250)] },
    })
    const compaction = events.filter((e) => e.kind === 'compaction')

    expect(compaction).toHaveLength(1)
    expect(compaction[0]?.payload).toMatchObject({
      mark: { byteOffset: 250 },
      summaryMessage: opener,
    })
    expect(compaction[0]?.id).toBe('c:250')
  })

  it('gives a lone compaction opener one event and a lone mark one event', () => {
    const opener = turnOf({
      index: 1,
      origin: 'compaction',
      user: message({ seq: 5, byteOffset: 300 }),
    })
    const loneOpener = buildReplayEvents({ turns: [...turns, opener] })
    const loneMark = buildReplayEvents({ turns, tokens: { points: [], compactions: [markAt(10)] } })

    expect(loneOpener.filter((e) => e.kind === 'compaction')).toHaveLength(1)
    expect(loneOpener[loneOpener.length - 1]?.payload).toMatchObject({ mark: null })
    expect(loneMark.filter((e) => e.kind === 'compaction')).toHaveLength(1)
    expect(loneMark[1]?.payload).toMatchObject({ summaryMessage: null })
  })

  it('shows one compaction event for a fixture mark and its opener', () => {
    const origins = REPLAY_ORIGINS.filter((e) => e.kind === 'compaction')

    expect(SESSION_ORIGINS.tokens.compactions).toHaveLength(1)
    expect(origins).toHaveLength(1)
    expect(origins[0]?.payload).toMatchObject({ type: 'compaction' })
  })
})

describe('kind', () => {
  it('lets error beat agent beat tool, and reads unknown and pending as tool', () => {
    const kindFor = (outcome: TimelineToolCall['outcome'], family: TimelineToolCall['family']) =>
      kindOf({ type: 'call', outcome, family })

    expect(kindFor('error', 'subagent')).toBe('error')
    expect(kindFor('success', 'subagent')).toBe('agent')
    expect(kindFor('pending', 'subagent')).toBe('agent')
    expect(kindFor('success', 'bash')).toBe('tool')
    expect(kindFor('unknown', 'bash')).toBe('tool')
    expect(kindFor('pending', 'bash')).toBe('tool')
  })

  it('maps an opener by its origin and marker, and a channel opener to message', () => {
    const opener = (origin: TimelineTurnOrigin, injectedMarker: string | null) =>
      kindOf({ type: 'opener', origin, injectedMarker })

    expect(opener('prompt', null)).toBe('prompt')
    expect(opener('injected', 'reminder')).toBe('injected')
    expect(opener('injected', 'channel')).toBe('message')
    expect(opener('compaction', 'channel')).toBe('compaction')
    expect(kindOf({ type: 'assistant' })).toBe('assistant')
    expect(kindOf({ type: 'mark' })).toBe('compaction')
  })

  it('shows every kind in the default and origins fixtures', () => {
    const kinds = new Set([...REPLAY_DEFAULT, ...REPLAY_ORIGINS].map((e) => e.kind))

    for (const kind of REPLAY_KIND_ORDER) expect(kinds.has(kind)).toBe(true)
  })

  it('reads an unknown outcome as a tool, never an error', () => {
    const unknown = REPLAY_HOSTILE.find(
      (e) => e.payload.type === 'tool' && String(e.payload.call.outcome) === 'cancelled'
    )

    expect(unknown?.kind).toBe('tool')
  })
})

describe('moment', () => {
  const t0 = 1_000_000
  const timed = [
    turnOf({
      index: 0,
      user: message({ seq: 0, byteOffset: 0, atMs: t0 }),
      assistant: [message({ role: 'assistant', seq: 1, byteOffset: 10, atMs: t0 + 5_000 })],
      toolCalls: [call({ id: 'x', seq: 2, byteOffset: 20, atMs: t0 + 9_000 })],
    }),
  ]
  const points = [
    point({ atMs: t0 + 1_000, contextTokens: 300 }),
    point({ atMs: t0 + 6_000, contextTokens: 900 }),
  ]

  it('takes elapsed from the first timed event and context from the last point at or before', () => {
    const events = buildReplayEvents({ turns: timed, tokens: { points, compactions: [] } })

    expect(events.map((e) => e.moment.elapsedMs)).toEqual([0, 5_000, 9_000])
    expect(events.map((e) => e.moment.contextTokens)).toEqual([null, 300, 900])
  })

  it('reads null, never 0, when time or tokens are unknown', () => {
    for (const e of [...REPLAY_NULL_TIMES, ...REPLAY_NO_TOKENS]) {
      if (e.moment.atMs === null) expect(e.moment.elapsedMs).toBeNull()
    }
    expect(REPLAY_NO_TOKENS.every((e) => e.moment.contextTokens === null)).toBe(true)
    expect(REPLAY_NULL_TIMES.every((e) => e.moment.contextTokens === null)).toBe(true)
  })

  it('takes compaction before and after from the points around the mark', () => {
    const marked = buildReplayEvents({
      turns: timed,
      tokens: {
        points: [
          point({ atMs: t0 + 1_000, contextTokens: 800 }),
          point({ atMs: t0 + 7_000, contextTokens: 120, afterCompaction: true }),
        ],
        compactions: [markAt(15, { atMs: t0 + 6_000 })],
      },
    })
    const payload = marked.find((e) => e.kind === 'compaction')?.payload

    expect(payload).toMatchObject({ tokensBefore: 800, tokensAfter: 120 })
  })

  it('leaves a missing side null so no saving can be derived', () => {
    const only = (list: TimelineTokenPoint[]) =>
      buildReplayEvents({
        turns: timed,
        tokens: { points: list, compactions: [markAt(15, { atMs: t0 + 6_000 })] },
      }).find((e) => e.kind === 'compaction')?.payload

    expect(only([point({ atMs: t0 + 1_000, contextTokens: 800 })])).toMatchObject({
      tokensBefore: 800,
      tokensAfter: null,
    })
    expect(
      only([point({ atMs: t0 + 7_000, contextTokens: 120, afterCompaction: true })])
    ).toMatchObject({ tokensBefore: null, tokensAfter: 120 })
    expect(only([])).toMatchObject({ tokensBefore: null, tokensAfter: null })
  })
})

describe('eventTitle', () => {
  it('is one line of at most 80 characters and never empty', () => {
    fcAssert(
      fc.property(
        fc.string({ maxLength: 400 }),
        fc.string({ maxLength: 120 }),
        (text, fallback) => {
          const title = eventTitle(text, fallback)

          expect(title).not.toBe('')
          expect(title.length).toBeLessThanOrEqual(80)
          expect(title).not.toMatch(/[\r\n\u2028\u2029]/)
        }
      )
    )
  })

  it('uses the first non-empty line, cut at a word', () => {
    expect(eventTitle('\n\n  first line  \nsecond')).toBe('first line')
    const long = Array.from({ length: 40 }, () => 'pear').join(' ')

    expect(eventTitle(long).endsWith('…')).toBe(true)
    expect(eventTitle(long)).not.toMatch(/pea…$|pe…$|p…$/)
  })

  it('uses the fallback for blank text', () => {
    expect(eventTitle('  \n\t', 'Unnamed tool')).toBe('Unnamed tool')
    expect(eventTitle('')).not.toBe('')
    for (const e of REPLAY_LONG_TEXT) expect(e.title).not.toContain('\n')
  })
})

describe('countByKind', () => {
  it('sums to the event count with every kind present', () => {
    for (const events of Object.values(FIXTURES)) {
      const counts = countByKind(events)

      expect(Object.keys(counts).sort()).toEqual([...REPLAY_KIND_ORDER].sort())
      expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(events.length)
    }
    expect(countByKind(REPLAY_ALL_ERRORS).tool).toBe(0)
  })
})

describe('eventIndexById', () => {
  it('finds an id, and gives -1 for null or an absent id', () => {
    expect(eventIndexById(REPLAY_DEFAULT, REPLAY_IDS.first)).toBe(0)
    expect(eventIndexById(REPLAY_DEFAULT, REPLAY_IDS.last)).toBe(REPLAY_DEFAULT.length - 1)
    expect(eventIndexById(REPLAY_DEFAULT, null)).toBe(-1)
    expect(eventIndexById(REPLAY_DEFAULT, 'nope')).toBe(-1)
  })
})

describe('eventIdAtTime', () => {
  const timedEvents = REPLAY_DEFAULT.filter((e) => e.moment.atMs !== null)

  it('returns the last event at or before the time', () => {
    const target = timedEvents[10]!
    const next = timedEvents.find((e) => (e.moment.atMs ?? 0) > target.moment.atMs!)!

    expect(eventIdAtTime(REPLAY_DEFAULT, target.moment.atMs!)).toBe(
      timedEvents.filter((e) => e.moment.atMs! <= target.moment.atMs!).pop()!.id
    )
    expect(eventIdAtTime(REPLAY_DEFAULT, next.moment.atMs! - 1)).not.toBe(next.id)
  })

  it('returns null before the first timed event', () => {
    expect(eventIdAtTime(REPLAY_DEFAULT, timedEvents[0]!.moment.atMs! - 1)).toBeNull()
    expect(eventIdAtTime(REPLAY_NULL_TIMES, Number.MAX_SAFE_INTEGER)).toBeNull()
  })
})

describe('replayEventLabel', () => {
  it('holds position, kind, title and time, with the kind as visible words', () => {
    const failed = REPLAY_DEFAULT.find((e) => e.id === REPLAY_IDS.failedCall)!
    const label = replayEventLabel(failed)

    expect(label).toMatch(
      new RegExp(`^${failed.moment.position} of ${failed.moment.total}, tool error, `)
    )
    expect(label).toContain(failed.title)
    expect(label).toMatch(/, \d\d:\d\d$/)
  })

  it('leaves the time out when unknown', () => {
    for (const e of REPLAY_NULL_TIMES) expect(replayEventLabel(e)).not.toMatch(/\d\d:\d\d$/)
  })
})

describe('stepSelection', () => {
  it('moves one on the arrows and clamps at both ends', () => {
    expect(stepSelection(3, 'ArrowDown', 10)).toBe(4)
    expect(stepSelection(3, 'ArrowUp', 10)).toBe(2)
    expect(stepSelection(9, 'ArrowDown', 10)).toBe(9)
    expect(stepSelection(0, 'ArrowUp', 10)).toBe(0)
  })

  it('moves ten on the Page keys and clamps', () => {
    expect(stepSelection(5, 'PageDown', 100)).toBe(15)
    expect(stepSelection(25, 'PageUp', 100)).toBe(15)
    expect(stepSelection(95, 'PageDown', 100)).toBe(99)
    expect(stepSelection(4, 'PageUp', 100)).toBe(0)
  })

  it('jumps to the ends on Home and End and clears on Escape', () => {
    expect(stepSelection(4, 'Home', 10)).toBe(0)
    expect(stepSelection(4, 'End', 10)).toBe(9)
    expect(stepSelection(4, 'Escape', 10)).toBeNull()
  })

  it('starts at 0 from nothing selected, never NaN or -1', () => {
    for (const key of ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home'] as const) {
      expect(stepSelection(-1, key, 10)).toBe(0)
    }
    expect(stepSelection(-1, 'End', 10)).toBe(9)
  })

  it('selects nothing in an empty list', () => {
    expect(stepSelection(-1, 'ArrowDown', 0)).toBeNull()
    expect(stepSelection(0, 'End', 0)).toBeNull()
  })

  it('stays in range for any index and key', () => {
    fcAssert(
      fc.property(
        fc.integer({ min: -5, max: 50 }),
        fc.constantFrom<StepKey>('ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'),
        fc.integer({ min: 1, max: 40 }),
        (index, key, count) => {
          const next = stepSelection(index, key, count)

          expect(next).toBeGreaterThanOrEqual(0)
          expect(next).toBeLessThan(count)
        }
      )
    )
  })
})

describe('fixtures', () => {
  it('builds the same events again from the same timeline', () => {
    expect(replayEventsOf(SESSION_DEFAULT)).toEqual(REPLAY_DEFAULT)
  })

  it('names ids that exist and are distinct kinds', () => {
    for (const id of Object.values(REPLAY_IDS)) {
      expect(eventIndexById(REPLAY_DEFAULT, id)).toBeGreaterThanOrEqual(0)
    }
    expect(REPLAY_IDS.failedCall).not.toBe(REPLAY_IDS.subagentCall)
  })

  it('stays within the stated scale', () => {
    expect(REPLAY_LARGE.length).toBeGreaterThan(5_000)
    expect(REPLAY_PENDING.some((e) => e.payload.type === 'tool' && e.kind === 'tool')).toBe(true)
    expect(REPLAY_ONE.map((e) => e.kind)).toEqual(['prompt', 'assistant'])
  })
})
