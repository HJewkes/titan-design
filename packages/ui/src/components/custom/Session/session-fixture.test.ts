import { describe, expect, it } from 'vitest'
import { ALLOWED_WORDS, SEARCH_WORDS, TOOL_NAMES } from './session-fixture-words'
import {
  SESSION_ALL_ERRORS,
  SESSION_DEFAULT,
  SESSION_EMPTY,
  SESSION_FIXTURES,
  SESSION_HOSTILE,
  SESSION_LARGE,
  SESSION_LONG_TEXT,
  SESSION_MIDNIGHT,
  SESSION_NULL_TIMES,
  SESSION_ONE_HUGE_TURN,
  SESSION_ORIGINS,
  SESSION_PENDING,
  SESSION_SNAPSHOT_BASIS,
  SESSION_TOOLS_ONLY,
  makeSessionTimeline,
} from './session-fixture'
import {
  TIMELINE_GAP_MIN_MS,
  type SessionTimeline,
  type TimelineTokens,
  type TimelineTurn,
} from './session-types'

const MINUTE_MS = 60_000
const WELL_FORMED = Object.entries(SESSION_FIXTURES).filter(([name]) => name !== 'SESSION_HOSTILE')

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
const isAscending = (values: number[]) => values.every((v, i) => i === 0 || values[i - 1]! <= v)
const allCalls = (s: SessionTimeline) => s.turns.flatMap((t) => t.toolCalls)

function turnSeqs(turn: TimelineTurn): number[] {
  const rest = [...turn.assistant, ...turn.toolCalls].map((e) => e.seq).sort((a, b) => a - b)
  return [...(turn.user ? [turn.user.seq] : []), ...rest]
}

function sumTokens(turns: TimelineTurn[], key: keyof TimelineTokens): number {
  return sum(turns.map((t) => t.tokens[key]))
}

function* stringsIn(value: unknown): Generator<string> {
  if (typeof value === 'string') yield value
  else if (Array.isArray(value)) for (const item of value) yield* stringsIn(item)
  else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) yield* stringsIn(item)
  }
}

function unknownWords(fixture: SessionTimeline): string[] {
  const toolNames = new Set<string>(TOOL_NAMES)
  const unknown = new Set<string>()
  for (const text of stringsIn(fixture)) {
    if (toolNames.has(text)) continue
    for (const word of text.toLowerCase().match(/\p{L}+/gu) ?? []) {
      if (!ALLOWED_WORDS.has(word)) unknown.add(word)
    }
  }
  return [...unknown]
}

describe('session fixtures', () => {
  it('pins the fixture names', () => {
    expect(Object.keys(SESSION_FIXTURES)).toEqual([
      'SESSION_DEFAULT',
      'SESSION_EMPTY',
      'SESSION_ONE_TURN',
      'SESSION_NO_TOOLS',
      'SESSION_TOOLS_ONLY',
      'SESSION_ORIGINS',
      'SESSION_ALL_ERRORS',
      'SESSION_PENDING',
      'SESSION_MIDNIGHT',
      'SESSION_NULL_TIMES',
      'SESSION_LONG_TEXT',
      'SESSION_ONE_HUGE_TURN',
      'SESSION_LARGE',
      'SESSION_SNAPSHOT_BASIS',
      'SESSION_HOSTILE',
    ])
  })

  it('builds the same timeline from the same spec', () => {
    const spec = { seed: 3, startMs: 0, turns: 4, turnMs: 60_000, calls: 9, errors: 2 }
    expect(makeSessionTimeline(spec)).toEqual(makeSessionTimeline(spec))
  })

  describe.each(WELL_FORMED)('%s', (_name, fixture) => {
    it('numbers turns in order and keeps seq strictly increasing, opener first', () => {
      expect(fixture.turns.map((t) => t.index)).toEqual(fixture.turns.map((_, i) => i))
      const seqs = fixture.turns.flatMap(turnSeqs)
      expect(seqs.every((seq, i) => i === 0 || seqs[i - 1]! < seq)).toBe(true)
    })

    it("names each call's own turn", () => {
      for (const turn of fixture.turns) {
        for (const call of turn.toolCalls) expect(call.turnIndex).toBe(turn.index)
      }
    })

    it('ascends buckets by minute and every atMs array', () => {
      const minutes = fixture.buckets.map((b) => b.minuteMs)
      expect(new Set(minutes).size).toBe(minutes.length)
      expect(isAscending(minutes)).toBe(true)
      expect(isAscending(fixture.tools.atMs)).toBe(true)
      expect(isAscending(fixture.errors.atMs)).toBe(true)
      for (const row of fixture.tools.byFamily) expect(isAscending(row.atMs)).toBe(true)
    })

    it('holds every gap to at least 10 minutes, one per gapped turn', () => {
      for (const gap of fixture.gaps) {
        expect(gap.durationMs).toBeGreaterThanOrEqual(TIMELINE_GAP_MIN_MS)
        expect(gap.endMs - gap.startMs).toBe(gap.durationMs)
      }
      const gapped = fixture.turns.filter((t) => t.gapBeforeMs !== null && t.gapBeforeMs > 0)
      expect(fixture.gaps).toHaveLength(gapped.length)
    })

    it('makes every total equal the sum of its parts', () => {
      const calls = allCalls(fixture)
      const failed = calls.filter((c) => c.outcome === 'error').length
      expect(fixture.totals.turns).toBe(fixture.turns.length)
      expect(fixture.totals.toolCalls).toBe(calls.length)
      expect(sum(fixture.tools.byName.map((r) => r.calls))).toBe(calls.length)
      expect(sum(fixture.tools.byFamily.map((r) => r.calls))).toBe(calls.length)
      expect(sum(fixture.turns.map((t) => t.errorCount))).toBe(failed)
      expect(fixture.totals.errors).toBe(failed)
      expect(fixture.errors.items).toHaveLength(failed)
      expect(fixture.totals.tokens.output).toBe(sumTokens(fixture.turns, 'output'))
      expect(fixture.totals.tokens.cacheWrite).toBe(sumTokens(fixture.turns, 'cacheWrite'))
      expect(fixture.totals.costUsd).toBeCloseTo(sum(fixture.turns.map((t) => t.costUsd)), 9)
      expect(fixture.totals.costUsd).toBeCloseTo(
        sum(fixture.tokens.points.map((p) => p.costUsd)),
        9
      )
      expect(sum(fixture.buckets.map((b) => b.toolCalls))).toBe(
        calls.filter((c) => c.atMs !== null).length
      )
    })

    it('marks each compaction once', () => {
      const compactions = fixture.turns.filter((t) => t.origin === 'compaction').length
      expect(fixture.tokens.compactions).toHaveLength(compactions)
      expect(fixture.totals.compactions).toBe(compactions)
      expect(fixture.tokens.points.filter((p) => p.afterCompaction).length).toBeLessThanOrEqual(
        compactions
      )
    })
  })

  describe('leak guard', () => {
    it.each(Object.entries(SESSION_FIXTURES))(
      '%s holds only invented words and tool names',
      (_name, fixture) => {
        expect(unknownWords(fixture)).toEqual([])
      }
    )

    it('catches a word outside the lists', () => {
      const leaked = { ...SESSION_EMPTY, sessionId: 'quarterly roadmap' }
      expect(unknownWords(leaked)).toEqual(['quarterly', 'roadmap'])
    })

    it('uses only listed tool names', () => {
      const names = new Set<string>([...TOOL_NAMES, ''])
      for (const fixture of Object.values(SESSION_FIXTURES)) {
        for (const call of allCalls(fixture)) expect(names.has(call.name)).toBe(true)
      }
    })
  })

  describe('shapes the stories and tests rely on', () => {
    it('SESSION_DEFAULT: 24 turns over about 2 h 40 min, 96 calls in 7 families, 4 errors', () => {
      const families = new Set(allCalls(SESSION_DEFAULT).map((c) => c.family))
      expect(SESSION_DEFAULT.turns).toHaveLength(24)
      expect(SESSION_DEFAULT.totals.toolCalls).toBe(96)
      expect(families.size).toBe(7)
      expect(SESSION_DEFAULT.totals.errors).toBe(4)
      expect(SESSION_DEFAULT.agents).toHaveLength(2)
      expect(SESSION_DEFAULT.tokens.compactions).toHaveLength(1)
      expect(SESSION_DEFAULT.gaps.map((g) => g.durationMs / MINUTE_MS)).toEqual([12, 31])
      expect(Math.round(SESSION_DEFAULT.durationMs / MINUTE_MS)).toBeGreaterThanOrEqual(150)
      expect(Math.round(SESSION_DEFAULT.durationMs / MINUTE_MS)).toBeLessThanOrEqual(170)
    })

    it('SESSION_DEFAULT holds one search word in one prompt and another only in errors', () => {
      const prompts = SESSION_DEFAULT.turns.filter((t) =>
        t.user?.text.includes(SEARCH_WORDS.inOnePrompt)
      )
      expect(prompts).toHaveLength(1)
      const texts = [...stringsIn(SESSION_DEFAULT.turns)]
      const errorTexts = new Set(allCalls(SESSION_DEFAULT).map((c) => c.errorMessage))
      const withWord = texts.filter((t) => t.includes(SEARCH_WORDS.onlyInErrors))
      expect(withWord.length).toBeGreaterThan(0)
      expect(withWord.every((t) => errorTexts.has(t))).toBe(true)
    })

    it('SESSION_EMPTY has no turns and no span', () => {
      expect(SESSION_EMPTY.turns).toEqual([])
      expect(SESSION_EMPTY.startMs).toBeNull()
      expect(SESSION_EMPTY.endMs).toBeNull()
    })

    it('SESSION_TOOLS_ONLY opens with no message and carries no assistant text', () => {
      expect(SESSION_TOOLS_ONLY.turns[0]?.origin).toBe('none')
      expect(SESSION_TOOLS_ONLY.turns[0]?.user).toBeNull()
      expect(SESSION_TOOLS_ONLY.totals.assistantMessages).toBe(0)
      expect(SESSION_TOOLS_ONLY.turns.every((t) => t.toolCalls.length > 0)).toBe(true)
    })

    it('SESSION_ORIGINS holds a prompt, an injected block, a channel message and a compaction', () => {
      const openers = SESSION_ORIGINS.turns.map((t) => [t.origin, t.injectedMarker])
      expect(openers).toContainEqual(['prompt', null])
      expect(openers).toContainEqual(['injected', 'reminder'])
      expect(openers).toContainEqual(['injected', 'channel'])
      expect(openers).toContainEqual(['compaction', 'compaction'])
    })

    it('SESSION_ALL_ERRORS fails every call, each with a message', () => {
      const calls = allCalls(SESSION_ALL_ERRORS)
      expect(SESSION_ALL_ERRORS.totals.errors).toBe(calls.length)
      expect(calls.every((c) => c.errorMessage)).toBe(true)
    })

    it('SESSION_PENDING ends on 3 calls with no result and has no end time', () => {
      const last = SESSION_PENDING.turns[SESSION_PENDING.turns.length - 1]!
      const pending = last.toolCalls.filter((c) => c.outcome === 'pending')
      expect(pending).toHaveLength(3)
      expect(pending.every((c) => c.durationMs === null && c.endMs === null)).toBe(true)
      expect(SESSION_PENDING.endMs).toBeNull()
    })

    it('SESSION_MIDNIGHT starts at 23:40 UTC and crosses into the next UTC day', () => {
      const days = SESSION_MIDNIGHT.turns.map((t) => new Date(t.startMs!).getUTCDate())
      expect(new Date(SESSION_MIDNIGHT.startMs!).toISOString()).toMatch(/T23:40/)
      expect(new Set(days).size).toBe(2)
    })

    it('SESSION_NULL_TIMES carries no timestamp or gap anywhere', () => {
      for (const turn of SESSION_NULL_TIMES.turns) {
        expect([turn.startMs, turn.endMs, turn.gapBeforeMs, turn.user?.atMs]).toEqual([
          null,
          null,
          null,
          null,
        ])
        expect(turn.toolCalls.every((c) => c.atMs === null && c.endMs === null)).toBe(true)
      }
      expect(SESSION_NULL_TIMES.buckets).toEqual([])
    })

    it('SESSION_LONG_TEXT holds a cut 4,000-character reply, a 300-character token and 40 lines', () => {
      const [first, second, third] = SESSION_LONG_TEXT.turns
      expect(first?.assistant[0]?.text).toHaveLength(4_000)
      expect(first?.assistant[0]?.truncated).toBe(true)
      expect(first?.user?.text.split('\n')).toHaveLength(40)
      expect(second?.user?.text).toHaveLength(300)
      expect(second?.user?.text).not.toMatch(/\s/)
      expect(third?.assistant[0]?.text).toContain('```')
    })

    it('SESSION_ONE_HUGE_TURN and SESSION_LARGE hold the stated scale', () => {
      expect(SESSION_ONE_HUGE_TURN.turns).toHaveLength(1)
      expect(SESSION_ONE_HUGE_TURN.turns[0]?.toolCalls).toHaveLength(400)
      expect(SESSION_LARGE.turns).toHaveLength(500)
      expect(SESSION_LARGE.totals.toolCalls).toBe(5_000)
    })

    it('SESSION_SNAPSHOT_BASIS has no points and no cost', () => {
      expect(SESSION_SNAPSHOT_BASIS.tokens.basis).toBe('snapshot')
      expect(SESSION_SNAPSHOT_BASIS.tokens.points).toEqual([])
      expect(SESSION_SNAPSHOT_BASIS.totals.requests).toBeNull()
      expect(SESSION_SNAPSHOT_BASIS.turns.every((t) => t.costUsd === 0)).toBe(true)
    })

    it('SESSION_HOSTILE carries every value a renderer must survive', () => {
      const calls = allCalls(SESSION_HOSTILE)
      const ids = calls.map((c) => c.id)
      const turnIndexes = new Set(SESSION_HOSTILE.turns.map((t) => t.index))
      expect(calls.some((c) => c.family === ('future_family' as string))).toBe(true)
      expect(calls.some((c) => c.outcome === ('cancelled' as string))).toBe(true)
      expect(new Set(ids).size).toBeLessThan(ids.length)
      expect(calls.some((c) => !turnIndexes.has(c.turnIndex))).toBe(true)
      expect(calls.some((c) => Number.isNaN(c.durationMs))).toBe(true)
      expect(calls.some((c) => (c.durationMs ?? 0) < 0)).toBe(true)
      expect(calls.some((c) => c.name === '')).toBe(true)
      expect(SESSION_HOSTILE.turns.some((t) => (t.gapBeforeMs ?? 0) < 0)).toBe(true)
      expect(
        SESSION_HOSTILE.turns.flatMap(turnSeqs).some((s, i, a) => i > 0 && a[i - 1]! >= s)
      ).toBe(true)
    })
  })
})
