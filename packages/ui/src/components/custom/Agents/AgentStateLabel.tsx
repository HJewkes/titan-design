import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Indicator } from '../../ui/indicator'
import { Pill } from '../../ui/pill'
import { Typography } from '../../ui/typography'
import { agentStateMeta } from './agent-state'
import type { AgentSummaryState } from './agent-types'

/** Props for {@link AgentStateLabel}. */
export interface AgentStateLabelProps {
  /** The state to show. */
  state: AgentSummaryState
  /**
   * The session holds pushes: a message sent to it queues in its inbox instead of interrupting.
   * Independent of `state` (an available agent can hold pushes), so it gets its own neutral pill.
   */
  isDnd?: boolean
  /** `sm` (caption) for cards and rows, `md` (body) for headers. */
  size?: 'sm' | 'md'
  /** Tailwind overrides on the row. */
  className?: string
}

/**
 * An agent's state as a dot and its word, never colour alone. Working pulses; the dot is
 * hidden from assistive tech because the word carries the state.
 */
export function AgentStateLabel({
  state,
  isDnd = false,
  size = 'sm',
  className,
}: AgentStateLabelProps) {
  const { label, dot, pulse } = agentStateMeta(state)
  return (
    <View className={cn('flex-row items-center gap-inline-sm', className)}>
      <Indicator
        size={size}
        color={dot}
        pulse={pulse}
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID={`agent-state-dot-${state}`}
      />
      <Typography variant={size === 'md' ? 'body2' : 'caption'} color="secondary">
        {label}
      </Typography>
      {isDnd ? (
        <Pill tone="neutral" size="xs" className="self-center" testID="agent-state-dnd">
          DND
        </Pill>
      ) : null}
    </View>
  )
}
