import type { ReactNode } from 'react'
import { View } from 'react-native'
import type { ChatMessage, DataPart, Participant } from '@titan-design/chat-protocol'
import { cn } from '../../../utils/cn'
import { Avatar } from '../../ui/avatar'
import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'
import { DateTime } from '../DateTime'
import { MarkdownProse, type ProseLinker } from '../Prose'
import {
  DELIVERY_LABEL,
  aggregateDelivery,
  isDataPart,
  isStreaming,
  messageBody,
} from './chatThread'

/** Renders one `data-*` part. Return null for a part this surface does not know. */
export type DataPartRenderer = (part: DataPart, message: ChatMessage) => ReactNode

export interface MessageBubbleProps {
  message: ChatMessage
  /** The author, resolved from the thread's participants. Falls back to the raw `authorId`. */
  author?: Participant
  /** The viewer wrote it: aligns to the end, drops the avatar, shows delivery state. */
  isOwn?: boolean
  /** First message of an author run: shows the avatar and name. Followers leave the slot empty. */
  startsGroup?: boolean
  /** Titan-specific content. Unrendered `data-*` parts are dropped, never dumped. */
  renderDataPart?: DataPartRenderer
  linkers?: ProseLinker[]
  className?: string
}

function BubbleBody({ body, isOwn, linkers }: { body: string; isOwn: boolean; linkers?: ProseLinker[] }) {
  const prose = <MarkdownProse body={body} linkers={linkers} testID="chat-message-body" />
  if (isOwn) {
    return (
      <View className="rounded-xl bg-brand-primary-subtle px-inset-md py-inset-sm">{prose}</View>
    )
  }
  return (
    <Surface raise={1} className="rounded-xl px-inset-md py-inset-sm">
      {prose}
    </Surface>
  )
}

function MessageMeta({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  const delivery = isOwn ? aggregateDelivery(message) : undefined
  return (
    <View className={cn('flex-row gap-inline-sm', isOwn && 'justify-end')} testID="chat-message-meta">
      {isStreaming(message) ? (
        <Typography variant="caption" color="tertiary">
          Writing…
        </Typography>
      ) : (
        <DateTime value={message.createdAt} format="time" variant="caption" color="tertiary" />
      )}
      {delivery ? (
        <Typography
          variant="caption"
          color={delivery === 'undeliverable' ? 'error' : 'tertiary'}
          testID="chat-message-delivery"
        >
          {DELIVERY_LABEL[delivery]}
        </Typography>
      ) : null}
    </View>
  )
}

function AvatarSlot({ author, visible }: { author: Participant | undefined; visible: boolean }) {
  if (!visible) return <View className="w-8" />
  const name = author?.displayName ?? '?'
  return <Avatar size="sm" colorFromName={name} alt={name} />
}

function DataParts({ message, render }: { message: ChatMessage; render?: DataPartRenderer }) {
  if (!render) return null
  return (
    <>
      {message.parts.filter(isDataPart).map((part, index) => (
        <View key={part.id ?? `${part.type}-${index}`}>{render(part, message)}</View>
      ))}
    </>
  )
}

/**
 * One chat message: markdown prose in a bubble, any `data-*` parts rendered by
 * the caller beneath it, and a time / delivery line. Composes Surface, Avatar,
 * MarkdownProse, DateTime and Typography.
 */
export function MessageBubble({
  message,
  author,
  isOwn = false,
  startsGroup = true,
  renderDataPart,
  linkers,
  className,
}: MessageBubbleProps) {
  const body = messageBody(message)
  return (
    <View
      className={cn('flex-row items-end gap-inline-md', isOwn && 'justify-end', className)}
      testID={`chat-message-${message.id}`}
    >
      {isOwn ? null : <AvatarSlot author={author} visible={startsGroup} />}
      <View className={cn('max-w-[85%] shrink gap-stack-sm', isOwn && 'items-end')}>
        {startsGroup && !isOwn ? (
          <Typography variant="caption" color="secondary" testID="chat-message-author">
            {author?.displayName ?? message.authorId}
          </Typography>
        ) : null}
        {body ? <BubbleBody body={body} isOwn={isOwn} linkers={linkers} /> : null}
        <DataParts message={message} render={renderDataPart} />
        <MessageMeta message={message} isOwn={isOwn} />
      </View>
    </View>
  )
}
