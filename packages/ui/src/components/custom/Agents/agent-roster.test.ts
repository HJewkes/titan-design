import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { agentRosterFieldText, rosterGroups, AGENT_ROSTER_FIELDS } from './agent-roster'
import {
  AGENTS_DUPLICATE_IDS,
  AGENTS_MIXED,
  AGENTS_NOW,
  AGENT_BARE,
  AGENT_BLOCKED,
  AGENT_NON_FINITE,
  AGENT_NO_TRANSCRIPT,
  AGENT_WORKING,
} from './agent-fixture'
import type { AgentSummary } from './agent-metrics'
import { HISTORY_STATES, PRESENCE_STATES } from './agent-types'

describe('agentRosterFieldText', () => {
  it('prints each field of a full agent', () => {
    const text = (field: (typeof AGENT_ROSTER_FIELDS)[number]) =>
      agentRosterFieldText(AGENT_WORKING, field, AGENTS_NOW)
    expect(text('task')).toBe(AGENT_WORKING.task)
    expect(text('branch')).toBe('feat/orchard-ledger-totals')
    expect(text('location')).toBe('~/orchard/.worktrees/ledger-totals')
    expect(text('idle')).toBe('2m ago')
    expect(text('tokens')).toBe('1.2M in · 86.4k out')
    expect(text('errors')).toBe('4 errors')
    expect(text('cost')).toBe('$4.81')
  })

  it('returns null for every field a bare agent lacks', () => {
    for (const field of AGENT_ROSTER_FIELDS) {
      expect(agentRosterFieldText(AGENT_BARE, field, AGENTS_NOW)).toBeNull()
    }
  })

  it('prints no metric field without a transcript, never zeros', () => {
    expect(agentRosterFieldText(AGENT_NO_TRANSCRIPT, 'tokens', AGENTS_NOW)).toBeNull()
    expect(agentRosterFieldText(AGENT_NO_TRANSCRIPT, 'errors', AGENTS_NOW)).toBeNull()
  })

  it('flags a high error rate and never prints NaN', () => {
    expect(agentRosterFieldText(AGENT_BLOCKED, 'errors', AGENTS_NOW)).toBe('11 · 9% errors')
    const texts = AGENT_ROSTER_FIELDS.map((f) =>
      agentRosterFieldText(AGENT_NON_FINITE, f, AGENTS_NOW)
    )
    expect(texts.join(' ')).not.toMatch(/NaN|Infinity/)
  })
})

const STATES = [...PRESENCE_STATES, ...HISTORY_STATES]

const agentArb: fc.Arbitrary<AgentSummary> = fc.record({
  id: fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f'),
  name: fc.string(),
  state: fc.constantFrom(...STATES),
  lastEventAt: fc.option(fc.integer(), { nil: null }),
})

describe('rosterGroups', () => {
  it('puts the live group first, in state order', () => {
    const { live, past } = rosterGroups(AGENTS_MIXED)
    expect(live.map((a) => a.state)).toEqual([
      'blocked',
      'working',
      'working',
      'available',
      'spawning',
      'detached',
    ])
    expect(past.map((a) => a.state)).toEqual(['failed', 'exited', 'retired'])
  })

  it('keeps the first record of a duplicate id', () => {
    const { live } = rosterGroups(AGENTS_DUPLICATE_IDS)
    expect(live.find((a) => a.id === AGENT_WORKING.id)?.task).toBe(AGENT_WORKING.task)
  })

  it('holds each distinct id exactly once', () => {
    fc.assert(
      fc.property(fc.array(agentArb), (agents) => {
        const { live, past } = rosterGroups(agents)
        const ids = [...live, ...past].map((a) => a.id)
        expect(ids).toHaveLength(new Set(agents.map((a) => a.id)).size)
        expect(new Set(ids).size).toBe(ids.length)
      })
    )
  })
})
