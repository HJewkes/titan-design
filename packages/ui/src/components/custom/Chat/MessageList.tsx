import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ScrollView, Text, View } from 'react-native'
import type { ChatMessage, Participant } from '@titan-design/chat-protocol'
import { cn } from '../../../utils/cn'
import { Button, ButtonText } from '../../ui/button'
import type { ProseLinker } from '../Prose'
import { announceOnIOS } from './announceOnIOS'
import {
  buildThreadRows,
  findParticipant,
  isStreaming,
  messageBody,
  plainText,
  type ThreadRow,
} from './chatThread'
import { DateSeparator } from './DateSeparator'
import { ConversationIdentity } from './ConversationIdentity'
import { MessageBubble, type DataPartRenderer, type ThreadLayout } from './MessageBubble'
import { RevealProvider, RevealRow, useRevealGesture } from './RevealRow'
import { TypingIndicator } from './TypingIndicator'
import { UnreadBadge } from './UnreadBadge'
import { useStickToBottom } from './useStickToBottom'

export interface MessageListProps {
  /** Oldest first, the order a thread is stored in. */
  messages: readonly ChatMessage[]
  participants: readonly Participant[]
  /** The reader. Their messages align to the end and pull the list down when sent. */
  viewerId: string
  renderDataPart?: DataPartRenderer
  /** `direct` heads the thread with who it is with; `group` names authors and shows avatars. Defaults from the participant count. */
  layout?: ThreadLayout
  /** Top of the thread. A direct thread defaults to the other party's name and avatar. */
  header?: ReactNode
  /** Hold every message's time revealed, as if the thread were dragged left. */
  revealTimes?: boolean
  /** Participants composing right now, shown under the newest message. */
  typing?: readonly Participant[]
  /** The reader's "now" for day separators. Fix it in stories and tests. */
  now?: string | Date | number
  /** Messages mounted at once; "Show earlier" reveals another page. */
  pageSize?: number
  /** Pinned under the scroll area, in normal flow, so it stays above the keyboard on web. */
  composer?: ReactNode
  /** Shown instead of the scroll area while the thread has no messages. */
  emptyState?: ReactNode
  linkers?: ProseLinker[]
  className?: string
}

interface RowProps {
  row: ThreadRow
  props: MessageListProps
  layout: ThreadLayout
  newestOwnId: string | undefined
}

function Row({ row, props, layout, newestOwnId }: RowProps) {
  if (row.kind === 'date') {
    return (
      <View className="px-gutter-sm">
        <DateSeparator date={row.at} now={props.now} showDay={row.showDay} showTime />
      </View>
    )
  }
  const { message } = row
  return (
    <RevealRow at={message.createdAt}>
      <MessageBubble
        message={message}
        author={findParticipant(props.participants, message.authorId)}
        isOwn={message.authorId === props.viewerId}
        layout={layout}
        startsGroup={row.startsGroup}
        showDelivery={message.id === newestOwnId}
        renderDataPart={props.renderDataPart}
        linkers={props.linkers}
        className="px-gutter-sm"
      />
    </RevealRow>
  )
}

function resolveLayout(props: MessageListProps): ThreadLayout {
  return props.layout ?? (props.participants.length > 2 ? 'group' : 'direct')
}

function threadHeader(props: MessageListProps, layout: ThreadLayout): ReactNode {
  if (props.header !== undefined) return <View className="px-gutter-sm">{props.header}</View>
  const other = props.participants.find(({ id }) => id !== props.viewerId)
  if (layout !== 'direct' || !other) return null
  return <ConversationIdentity participant={other} />
}

function newestOwnMessageId(messages: readonly ChatMessage[], viewerId: string) {
  return [...messages].reverse().find((message) => message.authorId === viewerId)?.id
}

function useWindow(messages: readonly ChatMessage[], pageSize: number) {
  const [pages, setPages] = useState(1)
  const start = Math.max(0, messages.length - pages * pageSize)
  const visible = useMemo(() => messages.slice(start), [messages, start])
  return { visible, hasEarlier: start > 0, showEarlier: () => setPages((count) => count + 1) }
}

/**
 * The newest incoming message after `lastSeenId`. Nothing when the newest message is
 * unchanged (older history was prepended) or `lastSeenId` left the thread (it was replaced).
 */
function newestIncomingSince(
  messages: readonly ChatMessage[],
  lastSeenId: string | undefined,
  viewerId: string
): ChatMessage | undefined {
  const start = lastSeenId === undefined ? 0 : messages.findIndex(({ id }) => id === lastSeenId) + 1
  if (start === 0 && lastSeenId !== undefined) return undefined
  return messages
    .slice(start)
    .filter((message) => message.authorId !== viewerId)
    .pop()
}

function newestId(messages: readonly ChatMessage[]): string | undefined {
  return messages[messages.length - 1]?.id
}

interface SeenState {
  lastSeenId: string | undefined
  /** An incoming reply still streaming; it is announced once, with its final text. */
  streamingId?: string
}

/** The message to announce now, if any, and what has been seen after it. */
function nextAnnouncement(
  messages: readonly ChatMessage[],
  seen: SeenState,
  viewerId: string
): { seen: SeenState; message?: ChatMessage } {
  const lastSeenId = newestId(messages)
  const candidate =
    newestIncomingSince(messages, seen.lastSeenId, viewerId) ??
    messages.find(({ id }) => id === seen.streamingId)
  if (candidate === undefined) return { seen: { lastSeenId } }
  if (isStreaming(candidate)) return { seen: { lastSeenId, streamingId: candidate.id } }
  return { seen: { lastSeenId }, message: candidate }
}

/** Text for a polite live region: only the newest incoming message that arrives after mount. */
function useIncomingAnnouncement(props: MessageListProps): string {
  const { messages, participants, viewerId } = props
  const seenRef = useRef<SeenState>({ lastSeenId: newestId(messages) })
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => {
    const { seen, message } = nextAnnouncement(messages, seenRef.current, viewerId)
    seenRef.current = seen
    if (message === undefined) return
    const name = findParticipant(participants, message.authorId)?.displayName ?? 'Unknown'
    const text = `${name}: ${plainText(messageBody(message))}`
    setAnnouncement(text)
    announceOnIOS(text)
  }, [messages, participants, viewerId])
  return announcement
}

function ThreadScroll(props: MessageListProps) {
  const { messages, viewerId, typing = [], pageSize = 50 } = props
  const { visible, hasEarlier, showEarlier } = useWindow(messages, pageSize)
  const rows = useMemo(() => buildThreadRows(visible), [visible])
  const layout = resolveLayout(props)
  const header = threadHeader(props, layout)
  const newestOwnId = newestOwnMessageId(messages, viewerId)
  const { offset, panHandlers } = useRevealGesture(props.revealTimes ?? false)
  const { scrollRef, onScroll, onContentSizeChange, unseen, jumpToNewest } = useStickToBottom(
    messages,
    viewerId
  )
  return (
    <View className="flex-1 min-h-0">
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        scrollEventThrottle={32}
        testID="chat-message-scroll"
      >
        <RevealProvider offset={offset}>
          <View {...panHandlers}>
            {header ? <View className="pt-inset-md">{header}</View> : null}
            <View
              className={cn('gap-stack-md pb-inset-md', (!header || hasEarlier) && 'pt-inset-md')}
            >
              {hasEarlier ? (
                <Button variant="ghost" size="sm" onPress={showEarlier} className="self-center">
                  <ButtonText>Show earlier</ButtonText>
                </Button>
              ) : null}
              {rows.map((row) => (
                <Row
                  key={row.key}
                  row={row}
                  props={props}
                  layout={layout}
                  newestOwnId={newestOwnId}
                />
              ))}
              <TypingIndicator participants={typing} className="px-gutter-sm" />
            </View>
          </View>
        </RevealProvider>
      </ScrollView>
      <View className="absolute bottom-inset-md self-center pointer-events-box-none">
        <UnreadBadge count={unseen} onPress={jumpToNewest} size="md" />
      </View>
    </View>
  )
}

/**
 * A chat thread, oldest at the top. Non-inverted on purpose: inverted lists are
 * broken on react-native-web. Windowed to the newest `pageSize` messages, it
 * follows new messages while the reader is at the end and offers a jump back
 * when they have scrolled away. Composes MessageBubble, DateSeparator,
 * TypingIndicator and UnreadBadge.
 */
export function MessageList(props: MessageListProps) {
  const { messages, composer, emptyState, className } = props
  const isEmpty = messages.length === 0 && emptyState != null
  const announcement = useIncomingAnnouncement(props)
  return (
    <View className={cn('flex-1 min-h-0', className)} testID="chat-message-list">
      <View
        accessibilityLiveRegion="polite"
        className="absolute h-px w-px overflow-hidden"
        testID="chat-message-announcer"
      >
        <Text>{announcement}</Text>
      </View>
      {isEmpty ? <View className="flex-1">{emptyState}</View> : <ThreadScroll {...props} />}
      {composer}
    </View>
  )
}
