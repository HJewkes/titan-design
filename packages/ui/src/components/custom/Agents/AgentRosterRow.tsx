import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Avatar } from '../../ui/avatar'
import { Typography } from '../../ui/typography'
import { AgentStateLabel } from './AgentStateLabel'
import type { AgentSummary } from './agent-metrics'
import {
  AGENT_ROSTER_FIELDS,
  DEFAULT_ROSTER_FIELDS,
  agentRosterFieldText,
  type AgentRosterField,
} from './agent-roster'
import { agentAccessibleSummary } from './agent-state'

/** Props for {@link AgentRosterRow}. */
export interface AgentRosterRowProps {
  /** The session to show. */
  agent: AgentSummary
  /** Reference instant for the recency label, injected so renders are deterministic. */
  now: number
  /** Renders the selected treatment (raised fill and leading accent bar). */
  isSelected?: boolean
  /** Makes the row a selectable option. Without it the row is inert text. */
  onSelect?: () => void
  /** The details under the name; printed in a fixed order whatever order is passed. */
  fields?: AgentRosterField[]
  /** Host content at the row's end. Keep it non-interactive: the row is the control. */
  trailing?: ReactNode
  /** The row's tab stop, when a list roves focus across its rows. */
  tabIndex?: 0 | -1
  /** Receives the row's host node, so a list can move focus to it. */
  focusRef?: (node: unknown) => void
  /** Tailwind overrides on the row. */
  className?: string
  /** Test id on the row root. */
  testID?: string
}

function RowDetails({
  agent,
  now,
  fields,
}: {
  agent: AgentSummary
  now: number
  fields: AgentRosterField[]
}) {
  const shown = new Set(fields)
  const task = shown.has('task') ? agentRosterFieldText(agent, 'task', now) : null
  const meta = AGENT_ROSTER_FIELDS.filter((field) => field !== 'task' && shown.has(field))
    .map((field) => agentRosterFieldText(agent, field, now))
    .filter((text): text is string => text !== null)
  return (
    <>
      {task ? (
        <Typography variant="body2" color="secondary">
          {task}
        </Typography>
      ) : null}
      {meta.length > 0 ? (
        <Typography variant="caption" color="secondary" className="web:break-all">
          {meta.join(' · ')}
        </Typography>
      ) : null}
    </>
  )
}

function RowBody({
  agent,
  now,
  fields,
  trailing,
}: Pick<AgentRosterRowProps, 'agent' | 'now' | 'trailing'> & { fields: AgentRosterField[] }) {
  return (
    <View className="flex-row items-start gap-inline-md">
      <Avatar
        size="xs"
        colorFromName={agent.name}
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <View className="flex-1 gap-stack-sm">
        <View className="flex-row flex-wrap items-center justify-between gap-inline-sm">
          <Typography variant="body2" color="primary" className="font-medium web:break-all">
            {agent.name}
          </Typography>
          <AgentStateLabel state={agent.state} isDnd={agent.isDnd} />
        </View>
        <RowDetails agent={agent} now={now} fields={fields} />
      </View>
      {trailing}
    </View>
  )
}

/**
 * One agent in a dense list: name, state and the chosen details. With `onSelect` it is a listbox
 * option, so it belongs inside a `listbox` such as {@link AgentRoster}; selection is raw
 * `role`/`aria-selected` because RNW drops `accessibilityState.selected`.
 */
export function AgentRosterRow({
  agent,
  now,
  isSelected = false,
  onSelect,
  fields = DEFAULT_ROSTER_FIELDS,
  trailing,
  tabIndex,
  focusRef,
  className,
  testID = 'agent-roster-row',
}: AgentRosterRowProps) {
  const rowClassName = cn(
    'relative rounded-md px-squish-x-md py-squish-y-md',
    isSelected && 'bg-surface-raised',
    className
  )
  const body = <RowBody agent={agent} now={now} fields={fields} trailing={trailing} />
  if (!onSelect) {
    return (
      <View className={rowClassName} testID={testID}>
        {body}
      </View>
    )
  }
  return (
    <Pressable
      onPress={onSelect}
      ref={focusRef}
      {...(tabIndex === undefined ? {} : { tabIndex })}
      role="option"
      aria-selected={isSelected}
      accessibilityLabel={agentAccessibleSummary(agent, now)}
      testID={testID}
      className={rowClassName}
    >
      {isSelected ? (
        <View
          testID="agent-roster-row-accent"
          className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-[3px] bg-brand-primary"
        />
      ) : null}
      {body}
    </Pressable>
  )
}
