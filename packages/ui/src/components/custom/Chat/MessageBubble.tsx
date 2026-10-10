import type { ReactNode } from 'react'
import { View } from 'react-native'
import type {
  ChatMessage,
  DataPart,
  DeliveryStatus,
  Participant,
} from '@titan-design/chat-protocol'
import { cn } from '../../../utils/cn'
import { Avatar } from '../../ui/avatar'
import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
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

/** Direct threads carry no per-message identity. Group threads name the author and show an avatar. */
export type ThreadLayout = 'direct' | 'group'

/** The bubble's built-in strings. */
export interface MessageBubbleLabels {
  /** Spoken on a message a human endorsed; the bubble's accent edge carries it visually. */
  endorsed: string
  /** Under a reply that is still streaming. */
  writing: string
  /** The hidden speaker name on the viewer's own messages. */
  you: string
  /** The delivery line, by the least-advanced recipient state. */
  delivery: Record<DeliveryStatus, string>
}

const DEFAULT_LABELS: MessageBubbleLabels = {
  endorsed: 'Endorsed',
  writing: 'Writing…',
  you: 'You',
  delivery: DELIVERY_LABEL,
}

export interface MessageBubbleProps {
  message: ChatMessage
  /** The author, resolved from the thread's participants. Falls back to the raw `authorId`. */
  author?: Participant
  /** The viewer wrote it: aligns to the end, drops the avatar, shows delivery state. */
  isOwn?: boolean
  layout?: ThreadLayout
  /** First message of an author run: a group thread names the author and shows the avatar. */
  startsGroup?: boolean
  /** Show the delivery line. A list turns it on for the newest own message only. */
  showDelivery?: boolean
  /** Titan-specific content. Unrendered `data-*` parts are dropped, never dumped. */
  renderDataPart?: DataPartRenderer
  linkers?: ProseLinker[]
  /** Replaces any of the built-in strings; the rest keep their defaults. */
  labels?: Partial<MessageBubbleLabels>
  className?: string
}

function isEndorsed(message: ChatMessage): boolean {
  const provenance = message.provenance
  return provenance !== undefined && 'endorsedBy' in provenance
}

interface BubbleBodyProps {
  body: string
  isOwn: boolean
  isEndorsed: boolean
  linkers?: ProseLinker[]
  endorsedLabel: string
}

function BubbleBody({ body, isOwn, isEndorsed, linkers, endorsedLabel }: BubbleBodyProps) {
  const prose = <MarkdownProse body={body} linkers={linkers} size="md" testID="chat-message-body" />
  if (isOwn) {
    return (
      <View
        className="rounded-xl bg-brand-primary-muted px-inset-md py-inset-sm"
        testID="chat-own-bubble"
      >
        {prose}
      </View>
    )
  }
  return (
    <Surface
      raise={1}
      className={cn(
        'rounded-xl px-inset-md py-inset-sm',
        isEndorsed && 'border-l-2 border-brand-primary'
      )}
      testID={isEndorsed ? 'chat-endorsed-bubble' : undefined}
    >
      {isEndorsed ? (
        <Typography variant="caption" className="absolute h-px w-px overflow-hidden opacity-0">
          {endorsedLabel}
        </Typography>
      ) : null}
      {prose}
    </Surface>
  )
}

interface MetaProps {
  message: ChatMessage
  isOwn: boolean
  showDelivery: boolean
  labels: MessageBubbleLabels
}

// Times live in the thread's time rows and the drag reveal; this line only carries state.
function MessageMeta({ message, isOwn, showDelivery, labels }: MetaProps) {
  const delivery = isOwn ? aggregateDelivery(message) : undefined
  const shownDelivery = delivery === 'undeliverable' || showDelivery ? delivery : undefined
  const writing = isStreaming(message)
  if (!writing && !shownDelivery) return null
  return (
    <View
      className={cn('flex-row gap-inline-sm', isOwn && 'justify-end')}
      testID="chat-message-meta"
    >
      {writing ? (
        <Typography variant="caption" color="secondary">
          {labels.writing}
        </Typography>
      ) : null}
      {shownDelivery ? (
        <Typography
          variant="caption"
          color={shownDelivery === 'undeliverable' ? 'error' : 'secondary'}
          testID="chat-message-delivery"
        >
          {labels.delivery[shownDelivery]}
        </Typography>
      ) : null}
    </View>
  )
}

interface SpeakerProps {
  name: string
  isOwn: boolean
  isVisible: boolean
  you: string
}

/** The author line a group thread shows; otherwise the same name, hidden, for assistive tech. */
function Speaker({ name, isOwn, isVisible, you }: SpeakerProps) {
  if (isVisible) {
    return (
      <Typography variant="caption" color="secondary" testID="chat-message-author">
        {name}
      </Typography>
    )
  }
  return (
    <Typography
      variant="caption"
      className="absolute h-px w-px overflow-hidden opacity-0"
      testID="chat-message-speaker"
    >
      {`${isOwn ? you : name}: `}
    </Typography>
  )
}

const AVATAR_SLOT = 'w-6'

interface AvatarSlotProps {
  author: Participant | undefined
  visible: boolean
}

function AvatarSlot({ author, visible }: AvatarSlotProps) {
  if (!visible) return <View className={AVATAR_SLOT} />
  const name = author?.displayName ?? '?'
  return <Avatar size="xs" colorFromName={name} alt={name} />
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
 * One chat message: markdown prose in a bubble and any `data-*` parts rendered by the
 * caller beneath it. A direct thread shows no per-message identity, only a
 * visually hidden speaker for assistive tech; a group thread names the author and puts a small avatar beside the first message of a run. Times live in the list, not here. Composes Surface, Avatar, MarkdownProse
 * and Typography.
 */
export function MessageBubble({
  message,
  author,
  isOwn = false,
  layout = 'direct',
  startsGroup = true,
  showDelivery = false,
  renderDataPart,
  linkers,
  labels,
  className,
}: MessageBubbleProps) {
  const text = { ...DEFAULT_LABELS, ...labels }
  const body = messageBody(message)
  const isGroup = layout === 'group' && !isOwn
  const showsAuthor = isGroup && startsGroup
  const speaker = author?.displayName ?? message.authorId
  return (
    <View
      className={cn('flex-row items-start gap-inline-sm', isOwn && 'justify-end', className)}
      testID={`chat-message-${message.id}`}
    >
      {isGroup ? <AvatarSlot author={author} visible={startsGroup} /> : null}
      <View className={cn('max-w-[85%] shrink gap-stack-sm', isOwn && 'items-end')}>
        <Speaker name={speaker} isOwn={isOwn} isVisible={showsAuthor} you={text.you} />
        {body ? (
          <BubbleBody
            body={body}
            isOwn={isOwn}
            isEndorsed={!isOwn && isEndorsed(message)}
            linkers={linkers}
            endorsedLabel={text.endorsed}
          />
        ) : null}
        <DataParts message={message} render={renderDataPart} />
        <MessageMeta message={message} isOwn={isOwn} showDelivery={showDelivery} labels={text} />
      </View>
    </View>
  )
}
