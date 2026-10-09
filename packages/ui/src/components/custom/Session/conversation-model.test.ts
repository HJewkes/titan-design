import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../test/property'
import {
  buildConversationRows,
  callDurationText,
  interleaveTurn,
  localDayKey,
  previewText,
  searchTurns,
  summarizeToolCalls,
  toolCallLabel,
  turnIndexAtTime,
  turnLabel,
  utcDayKey,
} from './conversation-model'
import {
  SESSION_DEFAULT,
  SESSION_HOSTILE,
  SESSION_MIDNIGHT,
  SESSION_NULL_TIMES,
} from './session-fixture'
import { SEARCH_WORDS } from './session-fixture-words'
import type { TimelineToolCall, TimelineTurn } from './session-types'

const CALL: TimelineToolCall = {
  id: 'call-1',
  seq: 4,
  turnIndex: 0,
  name: 'Read',
  family: 'fs_read',
  atMs: Date.UTC(2026, 8, 14, 9, 0),
  endMs: Date.UTC(2026, 8, 14, 9, 0) + 1_200,
  durationMs: 1_200,
  outcome: 'success',
  errorMessage: null,
  inputSummary: 'src/orchard/tree-ledger.ts',
  filePath: 'src/orchard/tree-ledger.ts',
  sidechain: false,
  byteOffset: 0,
}

describe('toolCallLabel', () => {
  it('names the tool, what it acted on, the outcome and the duration', () => {
    expect(toolCallLabel(CALL)).toBe('Read, src/orchard/tree-ledger.ts, succeeded, 1.2 s')
  })

  it('states no duration for a pending call or an unreported span', () => {
    const pending = { ...CALL, outcome: 'pending' as const, durationMs: null, endMs: null }
    expect(toolCallLabel(pending)).toBe('Read, src/orchard/tree-ledger.ts, pending')
    expect(toolCallLabel({ ...CALL, outcome: 'unknown', durationMs: null })).toBe(
      'Read, src/orchard/tree-ledger.ts, no result status'
    )
  })

  it('drops an empty summary, names an empty tool and skips a span that is not a duration', () => {
    const hostile = { ...CALL, name: '', inputSummary: '  ', durationMs: Number.NaN }
    expect(toolCallLabel(hostile)).toBe('Unnamed tool, succeeded')
    expect(toolCallLabel({ ...CALL, durationMs: -5, outcome: 'error' })).toBe(
      'Read, src/orchard/tree-ledger.ts, failed'
    )
  })

  it('reads an unknown outcome as no result status and marks a sidechain call', () => {
    const odd = { ...CALL, outcome: 'cancelled' as TimelineToolCall['outcome'], sidechain: true }
    expect(toolCallLabel(odd)).toBe(
      'Read, src/orchard/tree-ledger.ts, no result status, 1.2 s, in subagent'
    )
  })
})

describe('callDurationText', () => {
  it('prints nothing for pending or unreported, and the placeholder for a non-finite span', () => {
    expect(callDurationText({ outcome: 'pending', durationMs: 900 })).toBeNull()
    expect(callDurationText({ outcome: 'success', durationMs: null })).toBeNull()
    expect(callDurationText({ outcome: 'success', durationMs: Number.NaN })).toBe('–')
    expect(callDurationText({ outcome: 'error', durationMs: 340 })).toBe('340 ms')
  })
})

type ArbValue<A> = A extends fc.Arbitrary<infer T> ? T : never

const OUTCOMES = ['success', 'error', 'unknown', 'pending', 'cancelled'] as const

const callArb = fc.record({
  seq: fc.integer({ min: 0, max: 10_000 }),
  name: fc.constantFrom('Read', 'Bash', 'Edit', ''),
  outcome: fc.constantFrom(...OUTCOMES),
  durationMs: fc.oneof(fc.constant(null), fc.integer({ min: -100, max: 9_000 }), fc.constant(NaN)),
})

const toCall = (c: ArbValue<typeof callArb>, i: number): TimelineToolCall => ({
  ...CALL,
  id: `call-${i}`,
  ...c,
  outcome: c.outcome as TimelineToolCall['outcome'],
})

const TURN: TimelineTurn = SESSION_DEFAULT.turns[0]!

const turnArb = fc.record({
  gapBeforeMs: fc.oneof(fc.constant(null), fc.integer({ min: -60_000, max: 3_600_000 })),
  calls: fc.array(callArb, { maxLength: 6 }),
  texts: fc.array(fc.integer({ min: 0, max: 10_000 }), { maxLength: 3 }),
})

const toTurns = (specs: ArbValue<typeof turnArb>[]): TimelineTurn[] =>
  specs.map((spec, index) => ({
    ...TURN,
    index,
    gapBeforeMs: spec.gapBeforeMs,
    user: null,
    assistant: spec.texts.map((seq) => ({ ...TURN.user!, role: 'assistant', seq })),
    toolCalls: spec.calls.map(toCall),
  }))

describe('buildConversationRows', () => {
  it('puts a gap row before exactly the turns with a positive finite gapBeforeMs', () => {
    for (const { turns } of [SESSION_DEFAULT, SESSION_HOSTILE]) {
      const rows = buildConversationRows(turns)
      const gapped = rows.flatMap((row, i) =>
        row.kind === 'gap' ? [(rows[i + 1] as { turn: TimelineTurn }).turn.index] : []
      )
      const expected = turns.filter((t) => t.gapBeforeMs !== null && t.gapBeforeMs > 0)
      expect(gapped).toEqual(expected.map((t) => t.index))
    }
    expect(
      buildConversationRows(SESSION_DEFAULT.turns).filter((r) => r.kind === 'gap')
    ).toHaveLength(2)
  })

  it('holds every turn once, in input order, with unique keys', () => {
    fcAssert(
      fc.property(fc.array(turnArb, { maxLength: 30 }), (specs) => {
        const turns = toTurns(specs)
        const rows = buildConversationRows(turns)
        const inRows = rows.flatMap((r) => (r.kind === 'turn' ? [r.turn] : []))
        expect(inRows).toEqual(turns)
        expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length)
      })
    )
  })

  it('sets showDate on the first turn after a day change, by the zone it is given', () => {
    const utcRows = buildConversationRows(SESSION_MIDNIGHT.turns, utcDayKey)
    const dated = utcRows.filter((r) => r.kind === 'turn' && r.showDate)
    expect(dated).toHaveLength(1)
    const first = (dated[0] as { turn: TimelineTurn }).turn
    expect(new Date(first.startMs!).getUTCHours()).toBe(0)

    const shifted = (ms: number) => utcDayKey(ms + 3 * 3_600_000)
    expect(buildConversationRows(SESSION_MIDNIGHT.turns, shifted).some((r) => r.showDate)).toBe(
      false
    )
  })

  it('keeps duplicate turn indexes on distinct keys and needs no times', () => {
    const turns = [TURN, TURN]
    const keys = buildConversationRows(turns, localDayKey).map((r) => r.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(buildConversationRows(SESSION_NULL_TIMES.turns).every((r) => r.kind === 'turn')).toBe(
      true
    )
  })
})

describe('summarizeToolCalls', () => {
  it('counts calls, errors and pending; byName sums to the calls', () => {
    fcAssert(
      fc.property(fc.array(callArb, { maxLength: 40 }), (raw) => {
        const calls = raw.map(toCall)
        const summary = summarizeToolCalls(calls)
        expect(summary.calls).toBe(calls.length)
        expect(summary.errors).toBe(calls.filter((c) => c.outcome === 'error').length)
        expect(summary.errors + summary.pending).toBeLessThanOrEqual(summary.calls)
        expect(summary.byName.reduce((sum, e) => sum + e.calls, 0)).toBe(summary.calls)
        expect(Number.isFinite(summary.durationMs)).toBe(true)
      })
    )
  })

  it('orders byName by calls, ties in first-seen order', () => {
    const names = ['Edit', 'Read', 'Bash', 'Read', 'Bash', 'Grep']
    const calls = names.map((name, i) => ({ ...CALL, id: `c${i}`, name }))
    expect(summarizeToolCalls(calls).byName.map((e) => e.name)).toEqual([
      'Read',
      'Bash',
      'Edit',
      'Grep',
    ])
  })
})

describe('interleaveTurn', () => {
  it('returns every message and call, sorted by seq', () => {
    fcAssert(
      fc.property(turnArb, (spec) => {
        const [turn] = toTurns([spec]) as [TimelineTurn]
        const items = interleaveTurn(turn)
        expect(items).toHaveLength(turn.assistant.length + turn.toolCalls.length)
        expect(items.map((i) => i.seq)).toEqual(items.map((i) => i.seq).sort((a, b) => a - b))
      })
    )
  })
})

describe('searchTurns', () => {
  const callTurn = (patch: Partial<TimelineToolCall>): TimelineTurn => ({
    ...TURN,
    user: null,
    assistant: [],
    toolCalls: [{ ...CALL, name: 'Read', inputSummary: '', filePath: null, ...patch }],
  })

  it('matches each searched field, case-insensitively', () => {
    const turns: TimelineTurn[] = [
      { ...TURN, index: 0, user: { ...TURN.user!, text: 'Grade the Quince rows' }, toolCalls: [] },
      {
        ...TURN,
        index: 1,
        user: null,
        assistant: [{ ...TURN.user!, text: 'Bramble noted' }],
        toolCalls: [],
      },
      { ...callTurn({ name: 'OrchardSync' }), index: 2 },
      { ...callTurn({ inputSummary: 'count the damson crates' }), index: 3 },
      { ...callTurn({ filePath: 'src/orchard/medlar.ts' }), index: 4 },
      { ...callTurn({ errorMessage: 'mildew found' }), index: 5 },
    ]
    const words = ['QUINCE', 'bramble', 'orchardsync', 'Damson', 'MEDLAR', 'Mildew']
    words.forEach((word, i) => expect([...searchTurns(turns, word).matched]).toEqual([i]))
  })

  it('finds the planted words in the fixtures', () => {
    expect(searchTurns(SESSION_DEFAULT.turns, SEARCH_WORDS.inOnePrompt).matched.size).toBe(1)
    const errors = SESSION_DEFAULT.turns.filter((t) =>
      t.toolCalls.some((c) => c.outcome === 'error')
    )
    expect(searchTurns(SESSION_DEFAULT.turns, SEARCH_WORDS.onlyInErrors).matched).toEqual(
      new Set(errors.map((t) => t.index))
    )
  })

  it('matches every turn for a blank query and treats regex metacharacters literally', () => {
    const { matched, total } = searchTurns(SESSION_DEFAULT.turns, '   ')
    expect(matched.size).toBe(total)
    expect(() => searchTurns(SESSION_DEFAULT.turns, '.*(')).not.toThrow()
    expect(searchTurns(SESSION_DEFAULT.turns, '.*(').matched.size).toBe(0)
    const literal = { ...TURN, user: { ...TURN.user!, text: 'odd .*( text' } }
    expect(searchTurns([literal], '.*(').matched.size).toBe(1)
  })
})

describe('previewText', () => {
  it('never exceeds maxChars, and isCut is true exactly when the text was longer', () => {
    fcAssert(
      fc.property(fc.string({ maxLength: 400 }), fc.integer({ min: 0, max: 300 }), (text, max) => {
        const preview = previewText(text, max)
        expect(preview.text.length).toBeLessThanOrEqual(max)
        expect(preview.isCut).toBe(text.length > max)
        if (!preview.isCut) expect(preview.text).toBe(text)
      })
    )
  })

  it('cuts back to a word boundary, and cuts a long token mid-word', () => {
    expect(previewText('apple pear quince', 12)).toEqual({ text: 'apple pear', isCut: true })
    expect(previewText('pear-'.repeat(60), 10)).toEqual({ text: 'pear-pear-', isCut: true })
  })
})

describe('turnIndexAtTime', () => {
  const turns = SESSION_DEFAULT.turns

  it('returns the turn whose span holds the time, the earlier turn in a gap, and null untimed', () => {
    const third = turns[3]!
    expect(turnIndexAtTime(turns, third.startMs! + 1)).toBe(third.index)
    const afterGap = turns.find((t) => t.gapBeforeMs !== null)!
    const before = turns[turns.indexOf(afterGap) - 1]!
    expect(turnIndexAtTime(turns, afterGap.startMs! - 60_000)).toBe(before.index)
    expect(turnIndexAtTime(turns, turns[0]!.startMs! - 1)).toBe(turns[0]!.index)
    expect(turnIndexAtTime(SESSION_NULL_TIMES.turns, turns[0]!.startMs!)).toBeNull()
  })
})

describe('turnLabel', () => {
  it('names the turn number, time, calls and errors', () => {
    const turn: TimelineTurn = {
      ...TURN,
      index: 11,
      startMs: Date.UTC(2026, 8, 14, 14, 3),
      toolCalls: [CALL, { ...CALL, outcome: 'error' }, CALL],
    }
    expect(turnLabel(turn, true)).toMatch(/^Turn 12, 02:03 PM, 3 tool calls, 1 error$/)
    expect(turnLabel({ ...turn, startMs: null, toolCalls: [] })).toBe('Turn 12')
  })
})
