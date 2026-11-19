import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  SESSION_FIXTURES,
  SESSION_DEFAULT,
  SESSION_EMPTY,
  SESSION_HOSTILE,
  SESSION_NULL_TIMES,
} from './session-fixture'
import {
  contextSeries,
  errorsAtCursor,
  filesAtCursor,
  pointIdAtCursor,
  toolRowsAtCursor,
  toolRowsMax,
} from './session-sidebar-model'
import type {
  TimelineError,
  TimelineFileTouch,
  TimelineTokenPoint,
  ToolFamily,
  TokenTimeline,
} from './session-types'

const point = (atMs: number, contextTokens: number | null = 100): TimelineTokenPoint => ({
  atMs,
  turnIndex: 0,
  model: null,
  contextTokens,
  outputTokens: 0,
  cumulativeOutputTokens: 0,
  costUsd: 0,
  cumulativeCostUsd: 0,
  priced: true,
  afterCompaction: false,
})

const ascendingTimes = fc
  .array(fc.integer({ min: 0, max: 100 }))
  .map((times) => [...times].sort((a, b) => a - b))

describe('contextSeries', () => {
  it('maps a null or NaN contextTokens to a null y with a reason', () => {
    const tokens: TokenTimeline = {
      basis: 'delta',
      points: [point(1, null), point(2, Number.NaN), point(3, 40)],
      compactions: [],
      models: [],
    }
    const [series] = contextSeries(tokens).series
    expect(series!.points.map((p) => p.y)).toEqual([null, null, 40])
    expect(series!.points[0]!.missing).toBe('count not reported')
    expect(series!.points[1]!.missing).toBe('count not reported')
    expect(series!.points[2]!.missing).toBeUndefined()
  })

  it('drops compactions with no time and keeps timed ones as boundaries', () => {
    const mark = (atMs: number | null) => ({
      atMs,
      turnIndex: null,
      byteOffset: 0,
      summary: null,
      summaryTruncated: false,
    })
    const tokens: TokenTimeline = {
      basis: 'delta',
      points: [],
      compactions: [mark(null), mark(50), mark(Number.NaN)],
      models: [],
    }
    expect(contextSeries(tokens).boundaries).toEqual([{ x: 50, label: 'Compaction' }])
  })

  it('handles SESSION_HOSTILE without a non-finite y', () => {
    const [series] = contextSeries(SESSION_HOSTILE.tokens).series
    for (const p of series!.points) expect(p.y === null || Number.isFinite(p.y)).toBe(true)
  })

  it.each(Object.entries(SESSION_FIXTURES))('never sets segmentKey on %s', (_name, timeline) => {
    for (const s of contextSeries(timeline.tokens).series) {
      for (const p of s.points) expect(p).not.toHaveProperty('segmentKey')
    }
  })
})

describe('pointIdAtCursor', () => {
  it('is the last point at or before the cursor, and null before the first', () => {
    fc.assert(
      fc.property(ascendingTimes, fc.integer({ min: -5, max: 105 }), (times, cursor) => {
        const points = times.map((t) => point(t))
        const expected = times.filter((t) => t <= cursor).length
        const id = pointIdAtCursor(points, cursor)
        if (expected === 0) expect(id).toBeNull()
        else
          expect(id).toBe(
            contextSeries({ basis: 'delta', points, compactions: [], models: [] }).series[0]!
              .points[expected - 1]!.id
          )
      })
    )
  })

  it('is null for a null or NaN cursor', () => {
    expect(pointIdAtCursor([point(1)], null)).toBeNull()
    expect(pointIdAtCursor([point(1)], Number.NaN)).toBeNull()
  })
})

const toolsFrom = (families: Record<string, number[]>) => ({
  byFamily: Object.entries(families).map(([family, atMs]) => ({
    family: family as ToolFamily,
    calls: atMs.length,
    errors: 0,
    atMs,
  })),
  byName: Object.keys(families).map((family) => ({
    name: `${family}-tool`,
    family: family as ToolFamily,
    calls: 0,
    errors: 0,
    durationMs: 0,
  })),
})

describe('toolRowsAtCursor', () => {
  it('keeps each value between 0 and its total and never decreases as the cursor advances', () => {
    fc.assert(
      fc.property(
        fc.tuple(ascendingTimes, ascendingTimes, ascendingTimes),
        fc.array(fc.integer({ min: -5, max: 105 }), { minLength: 2 }),
        ([a, b, c], cursors) => {
          const tools = toolsFrom({ bash: a, fs_read: b, web: c })
          const sorted = [...cursors].sort((x, y) => x - y)
          let previous = new Map<string, number>()
          for (const cursor of sorted) {
            const rows = toolRowsAtCursor(tools, undefined, cursor)
            for (const row of rows) {
              expect(row.value!).toBeGreaterThanOrEqual(previous.get(row.id) ?? 0)
              expect(row.value!).toBeLessThanOrEqual(row.secondaryValue!)
            }
            previous = new Map(rows.map((r) => [r.id, r.value!]))
          }
        }
      )
    )
  })

  it('orders rows by session total at every cursor', () => {
    const { tools, errors } = SESSION_DEFAULT
    const cursors = [
      null,
      SESSION_DEFAULT.startMs! - 1,
      SESSION_DEFAULT.startMs!,
      SESSION_DEFAULT.startMs! + 71 * 60_000,
      SESSION_DEFAULT.endMs!,
    ]
    const byTotal = [...tools.byFamily].sort((a, b) => b.calls - a.calls).map((f) => f.family)
    for (const cursor of cursors) {
      expect(toolRowsAtCursor(tools, errors, cursor).map((r) => r.id)).toEqual(byTotal)
    }
  })

  it('reads the whole session with no cursor', () => {
    const rows = toolRowsAtCursor(SESSION_DEFAULT.tools, undefined, null)
    for (const row of rows) expect(row.value).toBe(row.secondaryValue)
  })

  it('takes max from the largest family total, and 1 with no calls', () => {
    expect(toolRowsMax(SESSION_DEFAULT.tools)).toBe(
      Math.max(...SESSION_DEFAULT.tools.byFamily.map((f) => f.calls))
    )
    expect(toolRowsMax(SESSION_EMPTY.tools)).toBe(1)
    expect(toolRowsAtCursor(SESSION_EMPTY.tools, SESSION_EMPTY.errors, 0)).toEqual([])
  })

  it('flags a family only for errors at or before the cursor', () => {
    const tools = toolsFrom({ bash: [10, 20, 30] })
    const error = (atMs: number | null): TimelineError => ({
      callId: `c${atMs}`,
      toolName: 'bash-tool',
      turnIndex: 0,
      atMs,
      message: 'failed',
      sidechain: false,
    })
    const errors = { items: [error(20), error(30)] }
    expect(toolRowsAtCursor(tools, errors, 10)[0]!.flag).toBeUndefined()
    expect(toolRowsAtCursor(tools, errors, 20)[0]!.flag).toEqual({
      tone: 'error',
      label: '1 error',
    })
    expect(toolRowsAtCursor(tools, errors, 99)[0]!.flag).toEqual({
      tone: 'error',
      label: '2 errors',
    })
    expect(toolRowsAtCursor(tools, undefined, 99)[0]!.flag).toBeUndefined()
  })
})

const touchArb = fc.record({
  path: fc.string({ minLength: 1, maxLength: 6 }),
  access: fc.constantFrom('read' as const, 'write' as const),
  atMs: fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
  calls: fc.integer({ min: 1, max: 5 }),
})

const breakdownOf = (touches: TimelineFileTouch[]) => ({
  touches,
  readCount: touches.filter((t) => t.access === 'read').length,
  writeCount: touches.filter((t) => t.access === 'write').length,
})

describe('filesAtCursor', () => {
  it('keeps soFar within total, and recent to touches at or before the cursor, newest first', () => {
    fc.assert(
      fc.property(fc.array(touchArb), fc.integer({ min: -5, max: 105 }), (touches, cursor) => {
        const result = filesAtCursor(breakdownOf(touches), cursor)
        expect(result.read.soFar).toBeLessThanOrEqual(result.read.total)
        expect(result.written.soFar).toBeLessThanOrEqual(result.written.total)
        const times = result.recent.map((t) => t.atMs!)
        expect(times.every((t) => t <= cursor)).toBe(true)
        expect(times).toEqual([...times].sort((a, b) => b - a))
        expect(result.recent.length).toBe(
          touches.filter((t) => t.atMs !== null && t.atMs <= cursor).length
        )
      })
    )
  })

  it('counts untimed touches in totals only', () => {
    const { files } = SESSION_NULL_TIMES
    expect(files.touches.length).toBeGreaterThan(0)
    const result = filesAtCursor(files, 0)
    expect(result.untimed).toBe(files.touches.length)
    expect(result.recent).toEqual([])
    expect(result.read.soFar + result.written.soFar).toBe(0)
    expect(result.read.total + result.written.total).toBe(files.touches.length)
  })

  it('treats no cursor as everything touched so far', () => {
    const result = filesAtCursor(SESSION_DEFAULT.files, null)
    expect(result.read.soFar).toBe(result.read.total)
    expect(result.written.soFar).toBe(result.written.total)
  })
})

describe('errorsAtCursor', () => {
  const error = (callId: string, atMs: number | null): TimelineError => ({
    callId,
    toolName: 'bash-tool',
    turnIndex: 0,
    atMs,
    message: 'failed',
    sidechain: false,
  })
  const errors = {
    rate: 0.5,
    items: [error('a', 10), error('b', 20), error('untimed', null)],
    atMs: [10, 20],
  }

  it('names the latest error at or before the cursor, or none', () => {
    expect(errorsAtCursor(errors, 5)).toEqual({ soFar: 0, total: 3, currentId: null })
    expect(errorsAtCursor(errors, 10)).toEqual({ soFar: 1, total: 3, currentId: 'a' })
    expect(errorsAtCursor(errors, 15)).toEqual({ soFar: 1, total: 3, currentId: 'a' })
    expect(errorsAtCursor(errors, 99)).toEqual({ soFar: 2, total: 3, currentId: 'b' })
  })

  it('counts untimed errors in the total only', () => {
    const untimed = SESSION_NULL_TIMES.errors
    const result = errorsAtCursor(untimed, 1e15)
    expect(result.soFar).toBe(0)
    expect(result.total).toBe(untimed.items.length)
    expect(result.currentId).toBeNull()
  })

  it('reads the whole session with no cursor', () => {
    expect(errorsAtCursor(errors, null)).toEqual({ soFar: 3, total: 3, currentId: null })
  })
})
