import type { IndicatorColor, IndicatorPulse } from '../../ui/indicator'
import { agentCostLabel, agentLastEventLabel, type AgentSummary } from './agent-metrics'
import { LIVE_HISTORY_STATES, PRESENCE_STATES, type AgentSummaryState } from './agent-types'

export interface AgentStateMeta {
  label: string
  dot: IndicatorColor
  pulse: IndicatorPulse | false
}

/** Attention first: a session waiting on a human, then running ones, then the past. */
export const AGENT_STATE_ORDER: AgentSummaryState[] = [
  'blocked',
  'working',
  'available',
  'spawning',
  'detached',
  'failed',
  'exited',
  'retired',
]

/**
 * State to its label and dot. Blocked is `warning` (waits on a human, not broken). The four
 * history-only states take the neutral dot until the owner picks their tones (TASTE T1).
 */
export const AGENT_STATE_META: Record<AgentSummaryState, AgentStateMeta> = {
  working: { label: 'Working', dot: 'success', pulse: 'ping' },
  available: { label: 'Available', dot: 'info', pulse: false },
  blocked: { label: 'Blocked', dot: 'warning', pulse: false },
  spawning: { label: 'Spawning', dot: 'default', pulse: false },
  detached: { label: 'Detached', dot: 'default', pulse: false },
  exited: { label: 'Exited', dot: 'default', pulse: false },
  failed: { label: 'Failed', dot: 'default', pulse: false },
  retired: { label: 'Retired', dot: 'default', pulse: false },
}

/** Meta for a state, falling back to a neutral dot and the raw word for a state from a newer roster. */
export function agentStateMeta(state: AgentSummaryState): AgentStateMeta {
  return AGENT_STATE_META[state] ?? { label: String(state), dot: 'default', pulse: false }
}

const LIVE_STATES: ReadonlySet<string> = new Set([...PRESENCE_STATES, ...LIVE_HISTORY_STATES])

/** Presence states, plus the history states whose process may still be running. */
export function isLiveAgent(state: AgentSummaryState): boolean {
  return LIVE_STATES.has(state)
}

/** Known only from durable history, with no live presence. */
export function isHistoryOnly(agent: Pick<AgentSummary, 'stateSource'>): boolean {
  return agent.stateSource === 'history'
}

function stateRank(state: AgentSummaryState): number {
  const rank = AGENT_STATE_ORDER.indexOf(state)
  return rank === -1 ? AGENT_STATE_ORDER.length : rank
}

function recency(agent: AgentSummary): number {
  const at = agent.lastEventAt
  return at != null && Number.isFinite(at) ? at : Number.NEGATIVE_INFINITY
}

/** By {@link AGENT_STATE_ORDER}, then most recent first, then by id, so the order is total. */
export function compareAgents(a: AgentSummary, b: AgentSummary): number {
  const byState = stateRank(a.state) - stateRank(b.state)
  if (byState !== 0) return byState
  const ra = recency(a)
  const rb = recency(b)
  if (ra !== rb) return ra > rb ? -1 : 1
  if (a.id === b.id) return 0
  return a.id < b.id ? -1 : 1
}

/** Live and past agents, each side in input order. The host owns the historical toggle. */
export function partitionAgents(agents: AgentSummary[]): {
  live: AgentSummary[]
  past: AgentSummary[]
} {
  const live: AgentSummary[] = []
  const past: AgentSummary[] = []
  for (const agent of agents) (isLiveAgent(agent.state) ? live : past).push(agent)
  return { live, past }
}

/** One record per id; the first wins. Two ids that share a name are two agents and both stay. */
export function uniqueAgents(agents: AgentSummary[]): AgentSummary[] {
  const seen = new Set<string>()
  return agents.filter((agent) => !seen.has(agent.id) && Boolean(seen.add(agent.id)))
}

/** The one-line label a card or row is announced by: name, state, recency and cost. */
export function agentAccessibleSummary(agent: AgentSummary, now: number): string {
  const parts = [agent.name, agentStateMeta(agent.state).label]
  if (agent.isDnd) parts.push('do not disturb')
  if (agent.lastEventAt != null)
    parts.push(`last event ${agentLastEventLabel(agent.lastEventAt, now)}`)
  if (agent.costUsd != null) parts.push(`cost ${agentCostLabel(agent.costUsd)}`)
  return parts.join(', ')
}
