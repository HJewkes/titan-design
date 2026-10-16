import {
  agentCostLabel,
  agentCountLabel,
  agentErrorsLabel,
  agentLastEventLabel,
  type AgentSummary,
} from './agent-metrics'
import { compareAgents, partitionAgents, uniqueAgents } from './agent-state'

/** A detail a roster row can show under the name. */
export type AgentRosterField =
  | 'task'
  | 'branch'
  | 'location'
  | 'idle'
  | 'tokens'
  | 'errors'
  | 'cost'

/** Every field, in the order a row prints them. */
export const AGENT_ROSTER_FIELDS: AgentRosterField[] = [
  'task',
  'idle',
  'cost',
  'branch',
  'location',
  'tokens',
  'errors',
]

/** The fields a row shows when the host names none. */
export const DEFAULT_ROSTER_FIELDS: AgentRosterField[] = ['task', 'idle', 'cost']

/** One field as text, or null when the agent has no value for it. Metrics fields are null without a transcript. */
export function agentRosterFieldText(
  agent: AgentSummary,
  field: AgentRosterField,
  now: number
): string | null {
  const { metrics } = agent
  switch (field) {
    case 'task':
      return agent.task || null
    case 'branch':
      return agent.branch || null
    case 'location':
      return agent.cwd || null
    case 'idle':
      return agent.lastEventAt == null ? null : agentLastEventLabel(agent.lastEventAt, now)
    case 'tokens':
      return metrics
        ? `${agentCountLabel(metrics.tokensIn)} in · ${agentCountLabel(metrics.tokensOut)} out`
        : null
    case 'errors':
      return metrics ? `${agentErrorsLabel(metrics)} errors` : null
    case 'cost':
      return agent.costUsd == null ? null : agentCostLabel(agent.costUsd)
  }
}

/** The roster's two groups: one record per id, live before past, each in {@link compareAgents} order. */
export function rosterGroups(agents: AgentSummary[]): {
  live: AgentSummary[]
  past: AgentSummary[]
} {
  const { live, past } = partitionAgents(uniqueAgents(agents))
  return { live: live.sort(compareAgents), past: past.sort(compareAgents) }
}
