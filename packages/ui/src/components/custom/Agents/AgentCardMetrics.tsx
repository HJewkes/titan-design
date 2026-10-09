import { View } from 'react-native'
import { resolveColor } from '../../../theme/resolve-color'
import { CardInset } from '../../ui/card'
import { SparkBars } from '../../ui/charts/spark-bars'
import { Pill } from '../../ui/pill'
import { Progress } from '../../ui/progress'
import { Typography } from '../../ui/typography'
import {
  agentCostLabel,
  agentCountLabel,
  agentErrorsLabel,
  clampedContextFraction,
  errorRate,
  isErrorRateFlagged,
  type AgentMetrics,
  type AgentSummary,
} from './agent-metrics'

const MAX_SPARK_BARS = 24

/**
 * A metric figure. A flagged one sits in the subtle error pill: `text-error` alone falls under AA
 * at this size on the dark planes, and the pill's label token is tuned to clear it.
 */
export function AgentMetricValue({
  value,
  isFlagged = false,
}: {
  value: string
  isFlagged?: boolean
}) {
  return isFlagged ? (
    <Pill tone="error" size="xs" className="self-start">
      {value}
    </Pill>
  ) : (
    <Typography variant="mono" color="primary">
      {value}
    </Typography>
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
      <Typography variant="microLabel" color="secondary">
        {label}
      </Typography>
      <AgentMetricValue value={value} isFlagged={isFlagged} />
    </View>
  )
}

export function AgentMetricsBlock({
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

export function DefaultMetricsEmpty({ costUsd }: { costUsd: AgentSummary['costUsd'] }) {
  return (
    <View className="gap-stack-sm" testID="agent-card-metrics-empty">
      <Typography variant="caption" color="secondary">
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
