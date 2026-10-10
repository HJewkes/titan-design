import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Tooltip, useHoverFocusState, type TooltipPlacement } from '../../ui/tooltip'
import { TriggerSurface } from '../../ui/trigger'
import { Typography } from '../../ui/typography'
import { AgentCardHeader, AgentCardMeta, AgentCardTask } from './AgentCardIdentity'
import { AgentMetricValue, DefaultMetricsEmpty } from './AgentCardMetrics'
import {
  agentCostLabel,
  agentCountLabel,
  agentErrorsLabel,
  errorRate,
  isErrorRateFlagged,
  type AgentMetrics,
  type AgentSummary,
} from './agent-metrics'

/** Props for {@link AgentHoverCardContent}. */
export interface AgentHoverCardContentProps {
  /** The session to summarise. */
  agent: AgentSummary
  /** Reference instant for the recency label, injected so renders are deterministic. */
  now: number
  /** Tailwind overrides on the content root. */
  className?: string
}

/** Props for {@link AgentHoverCard}. */
export interface AgentHoverCardProps extends AgentHoverCardContentProps {
  /** The trigger: a focusable agent name, avatar or row. Anything else is wrapped in a focusable trigger. */
  children: ReactNode
  /** Controlled visibility. */
  isOpen?: boolean
  /** Initial visibility when uncontrolled. */
  defaultIsOpen?: boolean
  /** Called with `true` on open and `false` on close. */
  onOpenChange?: (isOpen: boolean) => void
  /** Side of the trigger the card opens on. */
  placement?: TooltipPlacement
  /** Delay before opening on hover or focus (ms). */
  openDelay?: number
  /** Delay before closing on hover out or blur (ms). */
  closeDelay?: number
  /** Never opens, whatever `isOpen` says. */
  isDisabled?: boolean
}

function MetricRow({
  label,
  value,
  isFlagged = false,
}: {
  label: string
  value: string
  isFlagged?: boolean
}) {
  return (
    <View className="flex-row items-center justify-between gap-inline-lg">
      <Typography variant="caption" color="secondary">
        {label}
      </Typography>
      <AgentMetricValue value={value} isFlagged={isFlagged} />
    </View>
  )
}

function HoverMetrics({
  metrics,
  costUsd,
}: {
  metrics: AgentMetrics
  costUsd: AgentSummary['costUsd']
}) {
  return (
    <View className="gap-stack-sm" testID="agent-hover-card-metrics">
      <MetricRow
        label="Tokens"
        value={`${agentCountLabel(metrics.tokensIn)} in · ${agentCountLabel(metrics.tokensOut)} out`}
      />
      <MetricRow label="Tool calls" value={agentCountLabel(metrics.toolCalls)} />
      <MetricRow
        label="Errors"
        value={agentErrorsLabel(metrics)}
        isFlagged={isErrorRateFlagged(errorRate(metrics))}
      />
      <MetricRow label="Cost" value={agentCostLabel(costUsd)} />
    </View>
  )
}

/**
 * The agent summary a hover card shows: identity, stated task, branch, recency and the metric
 * figures, or the no-transcript notice. It holds no focusable element. Exported on its own so a
 * host can place it in another floating slot, such as a graph node's detail.
 */
export function AgentHoverCardContent({ agent, now, className }: AgentHoverCardContentProps) {
  return (
    <View className={cn('w-72 gap-stack-md', className)} testID="agent-hover-card-content">
      <AgentCardHeader agent={agent} />
      <AgentCardTask agent={agent} />
      <AgentCardMeta agent={agent} now={now} />
      {agent.metrics ? (
        <HoverMetrics metrics={agent.metrics} costUsd={agent.costUsd} />
      ) : (
        <DefaultMetricsEmpty costUsd={agent.costUsd} />
      )}
    </View>
  )
}

type DescribedElement = ReactElement<{ 'aria-describedby'?: string }>

/** The child as a component that can take press handlers and a description. */
function asTrigger(children: ReactNode, describedBy: string | undefined) {
  const trigger: DescribedElement =
    isValidElement(children) && typeof children.type !== 'string' ? (
      (children as DescribedElement)
    ) : (
      <Pressable testID="agent-hover-card-trigger">{children}</Pressable>
    )
  return cloneElement(trigger, { 'aria-describedby': describedBy })
}

/**
 * An agent summary over a trigger, as a WAI-ARIA tooltip: hover or keyboard focus opens it after
 * `openDelay`, hover out or blur close it after `closeDelay`, Escape closes it at once, and a long
 * press opens it on touch. The trigger is described by the open card. Any action belongs on the
 * trigger, never in the card.
 */
export function AgentHoverCard({
  agent,
  now,
  className,
  children,
  isOpen,
  defaultIsOpen,
  onOpenChange,
  placement = 'right',
  openDelay = 300,
  closeDelay = 100,
  isDisabled = false,
}: AgentHoverCardProps) {
  const { isOpen: isHeld, triggerProps } = useHoverFocusState({
    isDisabled,
    openDelay,
    closeDelay,
    defaultIsOpen,
    onOpenChange,
  })
  const isVisible = !isDisabled && (isOpen ?? isHeld)
  const cardId = `agent-card-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  // The Tooltip anchors to its own root, so the root hugs the trigger instead of the parent's width.
  return (
    <View className="self-start">
      <Tooltip
        isOpen={isVisible}
        usePortal
        placement={placement}
        hasArrow={false}
        content={
          <View nativeID={cardId} role="tooltip">
            <AgentHoverCardContent agent={agent} now={now} className={className} />
          </View>
        }
      >
        <TriggerSurface handlers={triggerProps}>
          {asTrigger(children, isVisible ? cardId : undefined)}
        </TriggerSurface>
      </Tooltip>
    </View>
  )
}
