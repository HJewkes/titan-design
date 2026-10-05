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
  messageBody,
  newestId,
  nextAnnouncement,
  plainText,
  type SeenState,
  type ThreadRow,
} from './chatThread'
import { DateSeparator, type DateSeparatorLabels } from './DateSeparator'
import { ConversationIdentity } from './ConversationIdentity'
import {
  MessageBubble,
  type DataPartRenderer,
  type MessageBubbleLabels,
  type ThreadLayout,
} from './MessageBubble'
import { RevealProvider, RevealRow, useRevealGesture } from './RevealRow'
import { TypingIndicator, type TypingIndicatorLabels } from './TypingIndicator'
import { UnreadBadge, type UnreadBadgeLabels } from './UnreadBadge'
import { useStickToBottom } from './useStickToBottom'

/** Every built-in string in a thread: the list's own plus those of the parts it composes. */
export interface MessageListLabels
  extends MessageBubbleLabels, DateSeparatorLabels, TypingIndicatorLabels, UnreadBadgeLabels {
  /** The button that pages in older messages. */
  showEarlier: string
  /** Names an author missing from `participants` when a new message is announced. */
  unknownAuthor: string
}

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
  /** Name of the thread's log region for assistive tech. */
  accessibilityLabel?: string
  /** Replaces any of the built-in strings; the rest keep their defaults. */
  labels?: Partial<MessageListLabels>
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
        <DateSeparator
          date={row.at}
          now={props.now}
          showDay={row.showDay}
          showTime
          labels={props.labels}
        />
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
        labels={props.labels}
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

/** Text for a polite live region: only the newest incoming message that arrives after mount. */
function useIncomingAnnouncement(props: MessageListProps): string {
  const { messages, participants, viewerId, labels } = props
  const unknownAuthor = labels?.unknownAuthor ?? 'Unknown'
  const seenRef = useRef<SeenState>({ lastSeenId: newestId(messages) })
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => {
    const { seen, message } = nextAnnouncement(messages, seenRef.current, viewerId)
    seenRef.current = seen
    if (message === undefined) return
    const name = findParticipant(participants, message.authorId)?.displayName ?? unknownAuthor
    const text = `${name}: ${plainText(messageBody(message))}`
    setAnnouncement(text)
    announceOnIOS(text)
  }, [messages, participants, viewerId, unknownAuthor])
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
        role="log"
        aria-label={props.accessibilityLabel ?? 'Conversation'}
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
                  <ButtonText>{props.labels?.showEarlier ?? 'Show earlier'}</ButtonText>
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
              <TypingIndicator
                participants={typing}
                labels={props.labels}
                className="px-gutter-sm"
              />
            </View>
          </View>
        </RevealProvider>
      </ScrollView>
      <View className="absolute bottom-inset-md self-center pointer-events-box-none">
        <UnreadBadge count={unseen} onPress={jumpToNewest} size="md" labels={props.labels} />
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
