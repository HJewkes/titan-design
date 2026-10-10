import { describe, expect, it } from 'vitest'
import { callDurationText, toolCallLabel } from './conversation-model'
import type { TimelineToolCall } from './session-types'

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
