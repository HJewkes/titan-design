import { useMemo, useState, type ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import type { ChatMessage, Participant } from '@titan-design/chat-protocol'
import { cn } from '../../../utils/cn'
import { Button, ButtonText } from '../../ui/button'
import type { ProseLinker } from '../Prose'
import { buildThreadRows, findParticipant, type ThreadRow } from './chatThread'
import { DateSeparator } from './DateSeparator'
import { MessageBubble, type DataPartRenderer } from './MessageBubble'
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
}

function Row({ row, props }: RowProps) {
  if (row.kind === 'date') return <DateSeparator date={row.at} now={props.now} />
  const { message, startsGroup } = row
  return (
    <MessageBubble
      message={message}
      author={findParticipant(props.participants, message.authorId)}
      isOwn={message.authorId === props.viewerId}
      startsGroup={startsGroup}
      renderDataPart={props.renderDataPart}
      linkers={props.linkers}
    />
  )
}

function useWindow(messages: readonly ChatMessage[], pageSize: number) {
  const [pages, setPages] = useState(1)
  const start = Math.max(0, messages.length - pages * pageSize)
  const visible = useMemo(() => messages.slice(start), [messages, start])
  return { visible, hasEarlier: start > 0, showEarlier: () => setPages((count) => count + 1) }
}

function ThreadScroll(props: MessageListProps) {
  const { messages, viewerId, typing = [], pageSize = 50 } = props
  const { visible, hasEarlier, showEarlier } = useWindow(messages, pageSize)
  const rows = useMemo(() => buildThreadRows(visible), [visible])
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
        <View className="gap-stack-md px-gutter-sm py-inset-md">
          {hasEarlier ? (
            <Button variant="ghost" size="sm" onPress={showEarlier} className="self-center">
              <ButtonText>Show earlier</ButtonText>
            </Button>
          ) : null}
          {rows.map((row) => (
            <Row key={row.key} row={row} props={props} />
          ))}
          <TypingIndicator participants={typing} className="pl-10" />
        </View>
      </ScrollView>
      <View className="absolute bottom-inset-md self-center" pointerEvents="box-none">
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
  return (
    <View className={cn('flex-1 min-h-0', className)} testID="chat-message-list">
      {isEmpty ? <View className="flex-1">{emptyState}</View> : <ThreadScroll {...props} />}
      {composer}
    </View>
  )
}
