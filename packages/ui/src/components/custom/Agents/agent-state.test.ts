import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  AGENT_STATE_META,
  AGENT_STATE_ORDER,
  agentAccessibleSummary,
  agentStateMeta,
  compareAgents,
  isHistoryOnly,
  isLiveAgent,
  partitionAgents,
  uniqueAgents,
} from './agent-state'
import { HISTORY_STATES, PRESENCE_STATES, type AgentSummaryState } from './agent-types'
import type { AgentSummary } from './agent-metrics'
import {
  AGENTS_DUPLICATE_IDS,
  AGENTS_LARGE,
  AGENTS_MIXED,
  AGENTS_NOW,
  AGENT_BLOCKED,
  AGENT_RETIRED,
  AGENT_WORKING,
} from './agent-fixture'

const agentArb: fc.Arbitrary<AgentSummary> = fc.record({
  id: fc.string({ maxLength: 4 }),
  name: fc.string({ maxLength: 4 }),
  state: fc.constantFrom(...AGENT_STATE_ORDER),
  lastEventAt: fc.option(fc.oneof(fc.integer(), fc.constant(Number.NaN)), { nil: undefined }),
})

describe('agent state vocabulary', () => {
  it('orders and describes all eight roster states', () => {
    const all: AgentSummaryState[] = [...PRESENCE_STATES, ...HISTORY_STATES]
    expect([...AGENT_STATE_ORDER].sort()).toEqual([...all].sort())
    for (const state of all) expect(AGENT_STATE_META[state].label).toBeTruthy()
  })

  it.each([
    ['spawning', 'info', 'opacity'],
    ['detached', 'info', false],
    ['failed', 'error', false],
    ['exited', 'default', false],
    ['retired', 'default', false],
  ] as const)('gives %s the %s dot, pulse %s', (state, dot, pulse) => {
    expect(AGENT_STATE_META[state]).toMatchObject({ dot, pulse })
  })

  it('treats presence states and the still-running history states as live', () => {
    const live = AGENT_STATE_ORDER.filter(isLiveAgent)
    expect(live).toEqual(['blocked', 'working', 'available', 'spawning', 'detached'])
  })

  it('falls back to the raw word and a neutral dot for a state it does not know', () => {
    const meta = agentStateMeta('paused' as AgentSummaryState)
    expect(meta).toEqual({ label: 'paused', dot: 'default', pulse: false })
  })

  it('marks a history-sourced agent as history only', () => {
    expect(isHistoryOnly(AGENT_RETIRED)).toBe(true)
    expect(isHistoryOnly(AGENT_WORKING)).toBe(false)
  })
})

describe('compareAgents', () => {
  it('orders blocked, working, available, spawning, detached, failed, exited, retired, then most recent', () => {
    const sorted = [...AGENTS_MIXED].sort(compareAgents)
    expect(sorted.map((a) => a.state)).toEqual([
      'blocked',
      'working',
      'working',
      'available',
      'spawning',
      'detached',
      'failed',
      'exited',
      'retired',
    ])
    expect(sorted[1].name).toBe('orchard-planner')
  })

  it('is a total order, even over unparseable times', () => {
    fc.assert(
      fc.property(agentArb, agentArb, agentArb, (a, b, c) => {
        expect(Math.sign(compareAgents(a, b))).toBe(-Math.sign(compareAgents(b, a)) || 0)
        if (compareAgents(a, b) <= 0 && compareAgents(b, c) <= 0) {
          expect(compareAgents(a, c)).toBeLessThanOrEqual(0)
        }
        expect(Number.isNaN(compareAgents(a, b))).toBe(false)
      })
    )
  })
})

describe('partitionAgents', () => {
  it('loses and duplicates nothing, and each side holds only its states', () => {
    fc.assert(
      fc.property(fc.array(agentArb), (agents) => {
        const { live, past } = partitionAgents(agents)
        expect(live.length + past.length).toBe(agents.length)
        expect(live.every((a) => isLiveAgent(a.state))).toBe(true)
        expect(past.some((a) => isLiveAgent(a.state))).toBe(false)
      })
    )
  })

  it('splits the 200-agent roster into its 12 live agents and the rest', () => {
    const { live, past } = partitionAgents(AGENTS_LARGE)
    expect(live).toHaveLength(12)
    expect(past).toHaveLength(188)
  })
})

describe('uniqueAgents', () => {
  it('keeps the first of a duplicate id and keeps same-name agents', () => {
    const unique = uniqueAgents(AGENTS_DUPLICATE_IDS)
    expect(unique).toHaveLength(3)
    expect(unique[0]).toBe(AGENTS_DUPLICATE_IDS[0])
    expect(unique.filter((a) => a.name === 'grove-pruner')).toHaveLength(2)
  })
})

describe('agentAccessibleSummary', () => {
  it('names the agent, its state, do not disturb, recency and cost', () => {
    expect(agentAccessibleSummary(AGENT_BLOCKED, AGENTS_NOW)).toBe(
      'kiln-watcher, Blocked, do not disturb, last event 9m ago, cost $2.05'
    )
  })

  it('leaves out what the agent does not carry', () => {
    expect(agentAccessibleSummary({ id: 'a', name: 'bare', state: 'exited' }, AGENTS_NOW)).toBe(
      'bare, Exited'
    )
  })
})
