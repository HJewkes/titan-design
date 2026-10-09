import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  ERROR_RATE_FLAG_ABOVE,
  agentCostLabel,
  agentCountLabel,
  agentLastEventLabel,
  clampedContextFraction,
  errorRate,
  isErrorRateFlagged,
} from './agent-metrics'
import { AGENTS_NOW } from './agent-fixture'

const MINUTE = 60_000

describe('errorRate', () => {
  it('is null or within 0 to 1 for any counts', () => {
    const count = fc.oneof(
      fc.nat(),
      fc.integer({ min: -100, max: -1 }),
      fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY)
    )
    fc.assert(
      fc.property(count, count, (toolCalls, errors) => {
        const rate = errorRate({ toolCalls, errors })
        expect(rate === null || (rate >= 0 && rate <= 1)).toBe(true)
      })
    )
  })

  it('is null, not NaN, when there are no tool calls', () => {
    expect(errorRate({ toolCalls: 0, errors: 0 })).toBeNull()
  })

  it('clamps more errors than calls to 1', () => {
    expect(errorRate({ toolCalls: 2, errors: 5 })).toBe(1)
  })
})

describe('isErrorRateFlagged', () => {
  it('flags above 5 percent, not at 5 percent', () => {
    expect(isErrorRateFlagged(ERROR_RATE_FLAG_ABOVE)).toBe(false)
    expect(isErrorRateFlagged(ERROR_RATE_FLAG_ABOVE + 0.001)).toBe(true)
    expect(isErrorRateFlagged(null)).toBe(false)
  })
})

describe('labels', () => {
  it('renders counts compactly and invalid counts as the placeholder', () => {
    expect(agentCountLabel(1_240_000)).toBe('1.2M')
    expect(agentCountLabel(Number.POSITIVE_INFINITY)).toBe('—')
    expect(agentCountLabel(-3)).toBe('—')
  })

  it('renders cost to the cent and a missing or invalid cost as the placeholder', () => {
    expect(agentCostLabel(4.81)).toBe('$4.81')
    expect(agentCostLabel(null)).toBe('—')
    expect(agentCostLabel(Number.NaN)).toBe('—')
  })

  it('renders the time since the last event in minutes, hours or days', () => {
    expect(agentLastEventLabel(AGENTS_NOW - 42 * MINUTE, AGENTS_NOW)).toBe('42m ago')
    expect(agentLastEventLabel(AGENTS_NOW - 125 * MINUTE, AGENTS_NOW)).toBe('2h 5m ago')
    expect(agentLastEventLabel(AGENTS_NOW - 3 * 1440 * MINUTE, AGENTS_NOW)).toBe('3d ago')
    expect(agentLastEventLabel(AGENTS_NOW - 10_000, AGENTS_NOW)).toBe('just now')
  })

  it('renders a missing or invalid time as the placeholder', () => {
    expect(agentLastEventLabel(undefined, AGENTS_NOW)).toBe('—')
    expect(agentLastEventLabel(Number.NaN, AGENTS_NOW)).toBe('—')
  })

  it('clamps the context share and drops a non-finite one', () => {
    const base = { tokensIn: 0, tokensOut: 0, toolCalls: 0, errors: 0 }
    expect(clampedContextFraction({ ...base, contextFraction: 1.4 })).toBe(1)
    expect(clampedContextFraction({ ...base, contextFraction: -0.2 })).toBe(0)
    expect(clampedContextFraction({ ...base, contextFraction: Number.NaN })).toBeNull()
    expect(clampedContextFraction(base)).toBeNull()
  })
})
