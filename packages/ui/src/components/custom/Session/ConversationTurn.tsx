import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { useControllableState } from '../../../hooks/useControllableState'
import { cn } from '../../../utils/cn'
import { Button, ButtonText } from '../../ui/button'
import { Card } from '../../ui/card'
import { Collapse, CollapseButton, CollapseContent } from '../../ui/collapse'
import { DateTime } from '../../ui/date-time'
import { Indicator } from '../../ui/indicator'
import { Pill } from '../../ui/pill'
import { Typography } from '../../ui/typography'
import { MarkdownProse, type ProseLinker } from '../Prose'
import {
  interleaveTurn,
  isTimelineMessage,
  previewText,
  summarizeToolCalls,
  toolSummaryParts,
  turnLabel,
  type ToolCallSummary,
} from './conversation-model'
import {
  ASSISTANT_LABEL,
  CHANNEL_MARKER,
  LOAD_FULL_TEXT_LABEL,
  SHOW_LESS_LABEL,
  SHOW_MORE_LABEL,
  TEXT_CUT_LABEL,
  UNNAMED_TOOL_LABEL,
  moreCallsLabel,
  turnOriginMeta,
} from './session-vocabulary'
import type { TimelineMessage, TimelineToolCall, TimelineTurn } from './session-types'
import { ToolCallRow } from './ToolCallRow'

/** Host wording for each speaker; any key left out keeps the vocabulary's label. */
export type SessionRoleLabels = Partial<
  Record<'user' | 'assistant' | 'injected' | 'channel' | 'compaction', string>
>

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
  /** Characters of each message shown before "Show more". Default 500. */
  previewChars?: number
  /** Tool rows mounted at once in an open group; a "Show N more calls" row pages the rest. Default 100. */
  maxToolRows?: number
  /** Makes each tool row a button. */
  onToolCallPress?: (call: TimelineToolCall) => void
  /** Shown as an action on a message the read model cut at its cap. The component never fetches. */
  onRequestFullText?: (message: TimelineMessage) => void
  /** Tailwind overrides on the article. */
  className?: string
}

type MessageProps = Pick<ConversationTurnProps, 'linkers' | 'onRequestFullText'> & {
  message: TimelineMessage
  previewChars: number
  isMarkdown: boolean
}

function CutNotice({
  message,
  onRequestFullText,
}: Omit<MessageProps, 'previewChars' | 'isMarkdown' | 'linkers'>) {
  return (
    <View className="flex-row flex-wrap items-center gap-inline-md">
      <Typography variant="caption" color="secondary">
        {TEXT_CUT_LABEL}
      </Typography>
      {onRequestFullText ? (
        <Button variant="link" size="sm" onPress={() => onRequestFullText(message)}>
          <ButtonText>{LOAD_FULL_TEXT_LABEL}</ButtonText>
        </Button>
      ) : null}
    </View>
  )
}

function MessageText({
  message,
  previewChars,
  isMarkdown,
  linkers,
  onRequestFullText,
}: MessageProps) {
  const [isShowingAll, setIsShowingAll] = useState(false)
  const preview = useMemo(
    () => previewText(message.text, previewChars),
    [message.text, previewChars]
  )
  const text = isShowingAll ? message.text : preview.text
  return (
    <View className="gap-stack-xs">
      {isMarkdown ? (
        <MarkdownProse body={text} linkers={linkers} size="md" />
      ) : (
        <Typography variant="body2" className="web:break-words web:whitespace-pre-wrap" selectable>
          {text}
        </Typography>
      )}
      {preview.isCut ? (
        <Button
          variant="link"
          size="sm"
          className="self-start"
          onPress={() => setIsShowingAll(!isShowingAll)}
        >
          <ButtonText>{isShowingAll ? SHOW_LESS_LABEL : SHOW_MORE_LABEL}</ButtonText>
        </Button>
      ) : null}
      {message.truncated ? (
        <CutNotice message={message} onRequestFullText={onRequestFullText} />
      ) : null}
    </View>
  )
}

function openerLabel(turn: TimelineTurn, roleLabels: SessionRoleLabels | undefined): string {
  const isChannel = turn.origin === 'injected' && turn.injectedMarker === CHANNEL_MARKER
  const key = turn.origin === 'prompt' ? 'user' : isChannel ? 'channel' : turn.origin
  return (key === 'none' ? undefined : roleLabels?.[key]) ?? turnOriginMeta(turn).label
}

type BlockProps = Omit<MessageProps, 'isMarkdown' | 'message'> & { label: string }

/** A prompt sits on one filled plane; injected, channel and compaction openers stay quiet. */
function Opener({ turn, label, ...rest }: BlockProps & { turn: TimelineTurn }) {
  if (!turn.user) return null
  const body = (
    <View className="gap-stack-xs">
      <Typography variant="monoLabel" color="secondary">
        {label}
      </Typography>
      <MessageText message={turn.user} isMarkdown={false} {...rest} />
    </View>
  )
  return turn.origin === 'prompt' ? (
    <Card variant="filled" className="p-inset-sm">
      {body}
    </Card>
  ) : (
    body
  )
}

function AssistantMessages({
  messages,
  label,
  ...rest
}: BlockProps & { messages: TimelineMessage[] }) {
  if (messages.length === 0) return null
  return (
    <View className="gap-stack-sm">
      <Typography variant="monoLabel" color="secondary">
        {label}
      </Typography>
      {messages.map((message, i) => (
        <MessageText key={`${message.seq}-${i}`} message={message} isMarkdown {...rest} />
      ))}
    </View>
  )
}

const MAX_NAME_PILLS = 5

function SummaryLine({ summary }: { summary: ToolCallSummary }) {
  const [calls, ...rest] = toolSummaryParts(summary)
  const shown = summary.byName.slice(0, MAX_NAME_PILLS)
  return (
    <View className="flex-1 flex-row flex-wrap items-center gap-inline-md">
      <Typography variant="body2">{calls}</Typography>
      {summary.errors > 0 ? (
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Indicator size="sm" color="error" />
        </View>
      ) : null}
      {rest.map((part, i) => (
        <Typography
          key={part}
          variant="caption"
          color={i === 0 && summary.errors > 0 ? 'error' : 'secondary'}
        >
          {part}
        </Typography>
      ))}
      {shown.map((entry) => (
        <Pill key={entry.name} tone="neutral" variant="subtle" size="xs">
          {`${entry.name || UNNAMED_TOOL_LABEL} ${entry.calls}`}
        </Pill>
      ))}
    </View>
  )
}

type ToolGroupProps = Pick<ConversationTurnProps, 'isUTC' | 'onToolCallPress'> & {
  calls: TimelineToolCall[]
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  maxToolRows: number
}

function ToolRows({
  calls,
  isUTC,
  onToolCallPress,
  maxToolRows,
}: Omit<ToolGroupProps, 'isOpen' | 'onOpenChange'>) {
  const pageSize = Math.max(1, Math.floor(maxToolRows))
  const [limit, setLimit] = useState(pageSize)
  const hidden = calls.length - limit
  return (
    <View role="list" className="pl-inset-sm">
      {calls.slice(0, limit).map((call, i) => (
        <View role="listitem" key={`${call.id}-${i}`}>
          <ToolCallRow call={call} isUTC={isUTC} onPress={onToolCallPress} />
        </View>
      ))}
      {hidden > 0 ? (
        <View role="listitem">
          <Button
            variant="link"
            size="sm"
            className="self-start py-stack-sm"
            onPress={() => setLimit(limit + pageSize)}
          >
            <ButtonText>{moreCallsLabel(hidden)}</ButtonText>
          </Button>
        </View>
      ) : null}
    </View>
  )
}

function ToolGroup({ isOpen, onOpenChange, ...rest }: ToolGroupProps) {
  const summary = useMemo(() => summarizeToolCalls(rest.calls), [rest.calls])
  return (
    <Collapse isOpen={isOpen} onToggle={onOpenChange}>
      <CollapseButton
        accessibilityLabel={`Tool calls: ${toolSummaryParts(summary).join(', ')}`}
        className="px-inset-sm py-stack-sm gap-inline-md"
      >
        <SummaryLine summary={summary} />
      </CollapseButton>
      <CollapseContent>
        <ToolRows {...rest} />
      </CollapseContent>
    </Collapse>
  )
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
  previewChars = 500,
  maxToolRows = 100,
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
          maxToolRows={maxToolRows}
        />
      ) : null}
    </View>
  )
}
