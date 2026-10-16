import { describe, it, expect } from 'vitest'
import { formatDurationMs, formatSessionDuration, formatTaskAge } from './time-format'

describe('formatSessionDuration', () => {
  it('reads minutes under an hour and hours plus minutes above it', () => {
    expect(formatSessionDuration('2026-07-01T10:00:00Z', '2026-07-01T10:42:00Z')).toBe('42m')
    expect(formatSessionDuration('2026-07-01T10:00:00Z', '2026-07-01T11:04:00Z')).toBe('1h 4m')
  })

  it('is empty for a missing, reversed or unparseable span so callers can drop the separator', () => {
    expect(formatSessionDuration('2026-07-01T11:00:00Z', '2026-07-01T10:00:00Z')).toBe('')
    expect(formatSessionDuration('nope', '2026-07-01T10:00:00Z')).toBe('')
  })
})

describe('formatTaskAge (shared with the task table)', () => {
  const now = new Date('2026-07-13T09:00:00Z').getTime()
  it('still reads today, days and months', () => {
    expect(formatTaskAge('2026-07-13T01:00:00Z', now)).toBe('today')
    expect(formatTaskAge('2026-07-01T01:00:00Z', now)).toBe('12d ago')
    expect(formatTaskAge('2026-05-13T01:00:00Z', now)).toBe('2mo ago')
  })
})

describe('formatDurationMs', () => {
  it('prints whole milliseconds under a second', () => {
    expect(formatDurationMs(0)).toBe('0 ms')
    expect(formatDurationMs(340.4)).toBe('340 ms')
    expect(formatDurationMs(999.4)).toBe('999 ms')
  })

  it('prints seconds with one decimal from a second to a minute', () => {
    expect(formatDurationMs(999.6)).toBe('1.0 s')
    expect(formatDurationMs(1_000)).toBe('1.0 s')
    expect(formatDurationMs(4_240)).toBe('4.2 s')
    expect(formatDurationMs(59_940)).toBe('59.9 s')
  })

  it('prints minutes and seconds from a minute to an hour, rounding up into the next unit', () => {
    expect(formatDurationMs(59_960)).toBe('1m')
    expect(formatDurationMs(252_000)).toBe('4m 12s')
    expect(formatDurationMs(1_920_000)).toBe('32m')
    expect(formatDurationMs(3_599_400)).toBe('59m 59s')
  })

  it('prints hours and minutes from an hour up', () => {
    expect(formatDurationMs(3_599_600)).toBe('1h')
    expect(formatDurationMs(7_500_000)).toBe('2h 5m')
    expect(formatDurationMs(9_600_000)).toBe('2h 40m')
  })

  it('prints the en-dash placeholder for a negative or non-finite span', () => {
    expect(formatDurationMs(-1)).toBe('–')
    expect(formatDurationMs(Number.NaN)).toBe('–')
    expect(formatDurationMs(Number.POSITIVE_INFINITY)).toBe('–')
  })
})
