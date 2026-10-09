import { useMemo } from 'react'
import { View } from 'react-native'
import { useControllableState } from '../../../hooks/useControllableState'
import { cn } from '../../../utils/cn'
import { DateTime } from '../../ui/date-time'
import { Typography } from '../../ui/typography'
import type { ProseLinker } from '../Prose'
import {
  interleaveTurn,
  isTimelineMessage,
  openerLabel,
  turnLabel,
  type SessionRoleLabels,
} from './conversation-model'
import { ASSISTANT_LABEL } from './session-vocabulary'
import type { TimelineMessage, TimelineToolCall, TimelineTurn } from './session-types'
import { AssistantMessages, Opener } from './TurnMessages'
import { ToolGroup } from './TurnToolGroup'

export type { SessionRoleLabels } from './conversation-model'

const DEFAULT_PREVIEW_CHARS = 500
const DEFAULT_TOOL_ROWS = 100

/** How much of a turn mounts at once. */
export interface ConversationLimits {
  /** Characters of each message shown before "Show more". Default 500. */
  previewChars?: number
  /** Tool rows mounted at once in an open group; a "Show N more calls" row pages the rest. Default 100. */
  toolRows?: number
}

/** Props for {@link ConversationTurn}. */
export interface ConversationTurnProps {
  /** The turn to draw: its opener, the assistant's messages and one tool group. */
  turn: TimelineTurn
  /** Controlled: whether the tool group is open. Omit to run uncontrolled. */
  expanded?: boolean
  /** Uncontrolled: whether the tool group starts open. */
  defaultExpanded?: boolean
  /** Called with the tool group's next open state. */
  onExpandedChange?: (expanded: boolean) => void
  /** Search did not match this turn. It stays mounted, readable and focusable. */
  isDimmed?: boolean
  /** Shows the date beside the time stamp; set on the first turn after a day change. */
  showDate?: boolean
  /** Shows times in UTC rather than the runtime's zone. */
  isUTC?: boolean
  /** Replaces the speaker labels ("User", "Assistant", "Injected", ...). */
  roleLabels?: SessionRoleLabels
  /** Reference patterns to link in assistant text. Nothing else is ever linked. */
  linkers?: ProseLinker[]
  /** How much text and how many tool rows mount at once. */
  limits?: ConversationLimits
  /** Makes each tool row a button. */
  onToolCallPress?: (call: TimelineToolCall) => void
  /** Shown as an action on a message the read model cut at its cap. The component never fetches. */
  onRequestFullText?: (message: TimelineMessage) => void
  /** Tailwind overrides on the article. */
  className?: string
}

function TurnHeader({
  turn,
  showDate,
  isUTC,
}: Pick<ConversationTurnProps, 'turn' | 'showDate' | 'isUTC'>) {
  const hasTime = turn.startMs !== null && Number.isFinite(turn.startMs)
  return (
    <View className="flex-row items-center gap-inline-md">
      <Typography variant="monoLabel" color="secondary">{`Turn ${turn.index + 1}`}</Typography>
      {hasTime ? (
        <DateTime
          value={turn.startMs}
          format={showDate ? 'datetime' : 'time'}
          isUTC={isUTC}
          variant="mono"
          color="secondary"
        />
      ) : null}
    </View>
  )
}

/**
 * One turn of an agent session: its opener, the assistant's messages in `seq` order, and every
 * tool call of the turn in one disclosure under the text. User text renders as plain text and
 * assistant text through MarkdownProse. A closed tool group mounts no row.
 */
export function ConversationTurn({
  turn,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  isDimmed = false,
  showDate = false,
  isUTC,
  roleLabels,
  linkers,
  limits,
  onToolCallPress,
  onRequestFullText,
  className,
}: ConversationTurnProps) {
  const [isOpen, setIsOpen] = useControllableState({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  })
  const ordered = useMemo(() => interleaveTurn(turn), [turn])
  const assistant = ordered.filter(
    (item): item is TimelineMessage => isTimelineMessage(item) && item.role === 'assistant'
  )
  const calls = ordered.filter((item): item is TimelineToolCall => !isTimelineMessage(item))
  const previewChars = limits?.previewChars ?? DEFAULT_PREVIEW_CHARS
  const messageProps = { previewChars, linkers, onRequestFullText }
  return (
    <View
      role="article"
      aria-label={turnLabel(turn, isUTC)}
      // The test id carries the dim, which jsdom cannot see in the class.
      testID={isDimmed ? 'conversation-turn-dimmed' : 'conversation-turn'}
      className={cn('gap-stack-sm py-stack-md', isDimmed && 'opacity-50', className)}
    >
      <TurnHeader turn={turn} showDate={showDate} isUTC={isUTC} />
      <Opener turn={turn} label={openerLabel(turn, roleLabels)} {...messageProps} />
      <AssistantMessages
        messages={assistant}
        label={roleLabels?.assistant ?? ASSISTANT_LABEL}
        {...messageProps}
      />
      {calls.length > 0 ? (
        <ToolGroup
          calls={calls}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          isUTC={isUTC}
          onToolCallPress={onToolCallPress}
          maxToolRows={limits?.toolRows ?? DEFAULT_TOOL_ROWS}
        />
      ) : null}
    </View>
  )
}
