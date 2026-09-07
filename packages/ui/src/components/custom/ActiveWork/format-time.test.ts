import { describe, it, expect } from 'vitest'
import { formatSessionDuration, formatTaskAge } from './format-time'

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
