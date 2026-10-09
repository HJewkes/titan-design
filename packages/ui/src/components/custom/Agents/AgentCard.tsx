import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { cn } from '../../../utils/cn'
import { resolveColor } from '../../../theme/resolve-color'
import { Avatar } from '../../ui/avatar'
import { Card, CardInset, type CardProps } from '../../ui/card'
import { SparkBars } from '../../ui/charts/spark-bars'
import { Pill } from '../../ui/pill'
import { Progress } from '../../ui/progress'
import { Typography } from '../../ui/typography'
import { AgentStateLabel } from './AgentStateLabel'
import {
  agentCostLabel,
  agentCountLabel,
  agentErrorsLabel,
  agentLastEventLabel,
  clampedContextFraction,
  errorRate,
  isErrorRateFlagged,
  type AgentMetrics,
  type AgentSummary,
} from './agent-metrics'
import { agentAccessibleSummary, isHistoryOnly } from './agent-state'

/** Tags beyond this many collapse into a `+N` pill. */
const MAX_TAGS = 3
const MAX_SPARK_BARS = 24

export interface AgentCardProps extends Omit<CardProps, 'children' | 'onPress' | 'variant'> {
  agent: AgentSummary
  /** Reference instant for the recency label, injected so renders are deterministic. */
  now: number
  isHighlighted?: boolean
  isLoading?: boolean
  /** Makes the agent name a link. The card itself is never a button. */
  onPress?: () => void
  /** Makes the task id pill a link. */
  onPressTask?: (taskId: string) => void
  /** Shown in place of the metrics block when `agent.metrics` is null or absent. */
  metricsEmpty?: ReactNode
  footer?: ReactNode
  className?: string
}

function AgentName({ agent, onPress }: Pick<AgentCardProps, 'agent' | 'onPress'>) {
  const name = (
    <Typography variant="subtitle2" color="primary" className="web:break-all">
      {agent.name}
    </Typography>
  )
  return onPress ? (
    <Pressable accessibilityRole="link" onPress={onPress} className="web:hover:underline">
      {name}
    </Pressable>
  ) : (
    name
  )
}

function AgentCardHeader({ agent, onPress }: Pick<AgentCardProps, 'agent' | 'onPress'>) {
  return (
    <View className="flex-row items-start gap-inline-md">
      <Avatar
        size="sm"
        colorFromName={agent.name}
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <View className="flex-1 gap-stack-sm">
        <AgentName agent={agent} onPress={onPress} />
        {agent.isProvisional ? (
          <Typography variant="caption" color="tertiary">
            Provisional name
          </Typography>
        ) : null}
      </View>
      <AgentStateLabel state={agent.state} isDnd={agent.isDnd} />
    </View>
  )
}

function AgentCardTask({ agent, onPressTask }: Pick<AgentCardProps, 'agent' | 'onPressTask'>) {
  const { taskId, task } = agent
  return (
    <View className="flex-row flex-wrap items-center gap-inline-sm">
      {taskId ? (
        <Pill
          size="xs"
          onPress={onPressTask ? () => onPressTask(taskId) : undefined}
          accessibilityRole={onPressTask ? 'link' : undefined}
        >
          {taskId}
        </Pill>
      ) : null}
      <Typography variant="body2" color={task ? 'secondary' : 'tertiary'} className="flex-1">
        {task || 'No stated task'}
      </Typography>
    </View>
  )
}

function AgentCardTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  const hidden = tags.length - MAX_TAGS
  return (
    <View className="flex-row flex-wrap gap-inline-sm">
      {tags.slice(0, MAX_TAGS).map((tag) => (
        <Pill key={tag} size="xs" variant="outline">
          {tag}
        </Pill>
      ))}
      {hidden > 0 ? <Pill size="xs" variant="outline">{`+${hidden}`}</Pill> : null}
    </View>
  )
}

function AgentCardMeta({ agent, now }: Pick<AgentCardProps, 'agent' | 'now'>) {
  return (
    <View className="gap-stack-sm">
      {agent.branch ? (
        <Typography variant="mono" color="secondary" className="web:break-all">
          {agent.branch}
        </Typography>
      ) : null}
      <Typography variant="caption" color="tertiary">
        {`Last event ${agentLastEventLabel(agent.lastEventAt, now)}`}
      </Typography>
      <AgentCardTags tags={agent.tags ?? []} />
    </View>
  )
}

function MetricCell({
  label,
  value,
  isFlagged = false,
}: {
  label: string
  value: string
  isFlagged?: boolean
}) {
  return (
    <View className="flex-1 gap-stack-sm">
      <Typography variant="microLabel" color="tertiary">
        {label}
      </Typography>
      <Typography variant="mono" color={isFlagged ? 'error' : 'primary'}>
        {value}
      </Typography>
    </View>
  )
}

function AgentMetricsBlock({
  metrics,
  costUsd,
}: {
  metrics: AgentMetrics
  costUsd: AgentSummary['costUsd']
}) {
  const context = clampedContextFraction(metrics)
  const activity = metrics.activity ?? []
  const tokens = `${agentCountLabel(metrics.tokensIn)} in · ${agentCountLabel(metrics.tokensOut)} out`
  return (
    <CardInset className="gap-stack-md p-inset-sm" testID="agent-card-metrics">
      <View className="flex-row gap-inline-md">
        <MetricCell label="Tokens" value={tokens} />
        <MetricCell label="Tool calls" value={agentCountLabel(metrics.toolCalls)} />
        <MetricCell
          label="Errors"
          value={agentErrorsLabel(metrics)}
          isFlagged={isErrorRateFlagged(errorRate(metrics))}
        />
        <MetricCell label="Cost" value={agentCostLabel(costUsd)} />
      </View>
      {activity.length > 0 ? (
        <SparkBars
          values={activity}
          maxBars={MAX_SPARK_BARS}
          color={resolveColor('data-1')}
          label={`Tool calls per interval, last ${Math.min(activity.length, MAX_SPARK_BARS)} intervals`}
        />
      ) : null}
      {context === null ? null : (
        <Progress value={context * 100} size="sm" label="Context window" showValue />
      )}
    </CardInset>
  )
}

function DefaultMetricsEmpty({ costUsd }: { costUsd: AgentSummary['costUsd'] }) {
  return (
    <View className="gap-stack-sm" testID="agent-card-metrics-empty">
      <Typography variant="caption" color="tertiary">
        No transcript for this session
      </Typography>
      {costUsd == null ? null : (
        <Typography
          variant="caption"
          color="secondary"
        >{`Cost ${agentCostLabel(costUsd)}`}</Typography>
      )}
    </View>
  )
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
  ...cardProps
}: AgentCardProps) {
  const variant = isHighlighted ? 'accent' : isHistoryOnly(agent) ? 'subtle' : 'elevated'
  return (
    <Card
      variant={variant}
      isLoading={isLoading}
      role="group"
      aria-label={isLoading ? 'Loading agent' : agentAccessibleSummary(agent, now)}
      className={cn('gap-stack-md p-inset-md', className)}
      testID="agent-card"
      {...cardProps}
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
