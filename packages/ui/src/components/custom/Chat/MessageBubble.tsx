import type { ReactNode } from 'react'
import { View } from 'react-native'
import type { ChatMessage, DataPart, Participant } from '@titan-design/chat-protocol'
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

export type OwnFill = 'solid' | 'tint'

/** How a human-endorsed agent message stands out; `none` draws it like any other. */
export type Endorsement = 'none' | 'outline' | 'fill' | 'emphasis'

/** Direct threads carry no per-message identity. Group threads name the author and show an avatar. */
export type ThreadLayout = 'direct' | 'group'

/** Which message of an author run carries the avatar in a group thread. */
export type GroupAvatarAt = 'first' | 'last'

export interface MessageBubbleProps {
  message: ChatMessage
  /** The author, resolved from the thread's participants. Falls back to the raw `authorId`. */
  author?: Participant
  /** The viewer wrote it: aligns to the end, drops the avatar, shows delivery state. */
  isOwn?: boolean
  layout?: ThreadLayout
  /** First message of an author run: a group thread names the author above it. */
  startsGroup?: boolean
  /** Last message of an author run: a group thread puts the avatar beside it. */
  endsGroup?: boolean
  groupAvatarAt?: GroupAvatarAt
  /** Solid brand fill with on-brand text, or a stronger tint with primary text. */
  ownFill?: OwnFill
  endorsement?: Endorsement
  /** Show the delivery line. A list turns it on for the newest own message only. */
  showDelivery?: boolean
  /** Titan-specific content. Unrendered `data-*` parts are dropped, never dumped. */
  renderDataPart?: DataPartRenderer
  linkers?: ProseLinker[]
  className?: string
}

const OWN_FILL_CLASS: Record<OwnFill, string> = {
  solid: 'bg-brand-primary',
  tint: 'bg-brand-primary-muted',
}

const ENDORSEMENT_CLASS: Record<Exclude<Endorsement, 'none'>, string> = {
  outline: 'border border-brand-primary',
  fill: 'bg-brand-primary-subtle',
  emphasis: 'border-l-2 border-brand-primary',
}

function isEndorsed(message: ChatMessage): boolean {
  const provenance = message.provenance
  return provenance !== undefined && 'endorsedBy' in provenance
}

interface BubbleBodyProps {
  body: string
  isOwn: boolean
  ownFill: OwnFill
  endorsement: Endorsement
  linkers?: ProseLinker[]
}

function BubbleBody({ body, isOwn, ownFill, endorsement, linkers }: BubbleBodyProps) {
  const prose = (
    <MarkdownProse
      body={body}
      linkers={linkers}
      size="md"
      tone={isOwn && ownFill === 'solid' ? 'on-brand' : 'default'}
      testID="chat-message-body"
    />
  )
  if (isOwn) {
    return (
      <View
        className={cn('rounded-xl px-inset-md py-inset-sm', OWN_FILL_CLASS[ownFill])}
        testID={`chat-own-bubble-${ownFill}`}
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
        endorsement !== 'none' && ENDORSEMENT_CLASS[endorsement]
      )}
      testID={endorsement === 'none' ? undefined : `chat-endorsed-bubble-${endorsement}`}
    >
      {prose}
    </Surface>
  )
}
interface MetaProps {
  message: ChatMessage
  isOwn: boolean
  showDelivery: boolean
}

// Times live in the thread's time rows and the drag reveal; this line only carries state.
function MessageMeta({ message, isOwn, showDelivery }: MetaProps) {
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
        <Typography variant="caption" color="tertiary">
          Writing…
        </Typography>
      ) : null}
      {shownDelivery ? (
        <Typography
          variant="caption"
          color={shownDelivery === 'undeliverable' ? 'error' : 'tertiary'}
          testID="chat-message-delivery"
        >
          {DELIVERY_LABEL[shownDelivery]}
        </Typography>
      ) : null}
    </View>
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
 * caller beneath it. A direct thread carries no per-message identity; a group thread
 * names the author above the first message of a run and puts a small avatar beside the
 * first or last. Times live in the list, not here. Composes Surface, Avatar, MarkdownProse
 * and Typography.
 */
export function MessageBubble({
  message,
  author,
  isOwn = false,
  layout = 'direct',
  startsGroup = true,
  endsGroup = true,
  groupAvatarAt = 'last',
  ownFill = 'solid',
  endorsement = 'none',
  showDelivery = false,
  renderDataPart,
  linkers,
  className,
}: MessageBubbleProps) {
  const body = messageBody(message)
  const isGroup = layout === 'group' && !isOwn
  const avatarHere = groupAvatarAt === 'last' ? endsGroup : startsGroup
  const shownEndorsement = !isOwn && isEndorsed(message) ? endorsement : 'none'
  return (
    <View
      className={cn(
        'flex-row gap-inline-sm',
        groupAvatarAt === 'first' ? 'items-start' : 'items-end',
        isOwn && 'justify-end',
        className
      )}
      testID={`chat-message-${message.id}`}
    >
      {isGroup ? <AvatarSlot author={author} visible={avatarHere} /> : null}
      <View className={cn('max-w-[85%] shrink gap-stack-sm', isOwn && 'items-end')}>
        {isGroup && startsGroup ? (
          <Typography variant="caption" color="secondary" testID="chat-message-author">
            {author?.displayName ?? message.authorId}
          </Typography>
        ) : null}
        {body ? (
          <BubbleBody
            body={body}
            isOwn={isOwn}
            ownFill={ownFill}
            endorsement={shownEndorsement}
            linkers={linkers}
          />
        ) : null}
        <DataParts message={message} render={renderDataPart} />
        <MessageMeta message={message} isOwn={isOwn} showDelivery={showDelivery} />
      </View>
    </View>
  )
}
