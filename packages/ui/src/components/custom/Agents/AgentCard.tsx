import type { ReactNode } from 'react'
import { cn } from '../../../utils/cn'
import { Card } from '../../ui/card'
import { AgentCardHeader, AgentCardMeta, AgentCardTask } from './AgentCardIdentity'
import { AgentMetricsBlock, DefaultMetricsEmpty } from './AgentCardMetrics'
import type { AgentSummary } from './agent-metrics'
import { agentAccessibleSummary, isHistoryOnly } from './agent-state'

/** Props for {@link AgentCard}. */
export interface AgentCardProps {
  /** The session to show. */
  agent: AgentSummary
  /** Reference instant for the recency label, injected so renders are deterministic. */
  now: number
  /** Marks the card with the accent stripe, for the agent the host has in focus. */
  isHighlighted?: boolean
  /** Renders the card's skeleton in place of the content. */
  isLoading?: boolean
  /** Makes the agent name a link. The card itself is never a button. */
  onPress?: () => void
  /** Makes the task id pill a link. */
  onPressTask?: (taskId: string) => void
  /** Shown in place of the metrics block when `agent.metrics` is null or absent. */
  metricsEmpty?: ReactNode
  /** Host actions under the metrics. */
  footer?: ReactNode
  /** Tailwind overrides on the card. */
  className?: string
  /** Test id on the card root. */
  testID?: string
}

/**
 * One agent session: name, state, stated task, branch, recency, and the transcript's tokens,
 * tool calls, errors, cost and activity. A session with no transcript shows a notice, never zeros.
 * The card is a labelled group, not a button: `onPress` makes the name a link.
 */
export function AgentCard({
  agent,
  now,
  isHighlighted = false,
  isLoading = false,
  onPress,
  onPressTask,
  metricsEmpty,
  footer,
  className,
  testID = 'agent-card',
}: AgentCardProps) {
  const variant = isHighlighted ? 'accent' : isHistoryOnly(agent) ? 'subtle' : 'elevated'
  return (
    <Card
      variant={variant}
      isLoading={isLoading}
      role="group"
      aria-label={isLoading ? 'Loading agent' : agentAccessibleSummary(agent, now)}
      className={cn('gap-stack-md p-inset-md', className)}
      testID={testID}
    >
      <AgentCardHeader agent={agent} onPress={onPress} />
      <AgentCardTask agent={agent} onPressTask={onPressTask} />
      <AgentCardMeta agent={agent} now={now} />
      {agent.metrics ? (
        <AgentMetricsBlock metrics={agent.metrics} costUsd={agent.costUsd} />
      ) : (
        (metricsEmpty ?? <DefaultMetricsEmpty costUsd={agent.costUsd} />)
      )}
      {footer}
    </Card>
  )
}
