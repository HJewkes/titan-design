import type {
  ChatMessage,
  ChatPart,
  DataPart,
  DeliveryStatus,
  Participant,
  TextPart,
} from '@titan-design/chat-protocol'
import { parseProseBlocks } from '../Prose'

/** Consecutive messages from one author closer than this form one run. */
export const GROUP_WINDOW_MS = 5 * 60 * 1000

/** A gap longer than this opens a time row, the way Messages marks a pause in the thread. */
export const TIME_BREAK_MS = 60 * 60 * 1000

/** A rendered row in the thread: a time or day boundary, or a message with its run position. */
export type ThreadRow =
  | { kind: 'date'; key: string; at: string; showDay: boolean }
  | { kind: 'message'; key: string; message: ChatMessage; startsGroup: boolean }

export function isTextPart(part: ChatPart): part is TextPart {
  return part.type === 'text'
}

// Mirrors the protocol's `isDataPartType` without importing its runtime, which pulls in zod.
export function isDataPart(part: ChatPart): part is DataPart {
  return part.type.startsWith('data-')
}

/** The message's prose: every text part, in order, as one markdown body. */
export function messageBody(message: ChatMessage): string {
  return message.parts
    .filter(isTextPart)
    .map((part) => part.text)
    .join('\n\n')
}

// The bold and code spans MarkdownProse renders; any other markup is shown, and spoken, literally.
const RENDERED_INLINE = /\*\*([^*]+)\*\*|`([^`]+)`/g

/** The text a message bubble shows, as one line for a screen reader to speak. */
export function plainText(markdown: string): string {
  return parseProseBlocks(markdown)
    .map(({ text }) => text.replace(RENDERED_INLINE, (_span, bold, code) => bold ?? code))
    .join(' ')
}

export function isStreaming(message: ChatMessage): boolean {
  return message.parts.some((part) => isTextPart(part) && part.state === 'streaming')
}

/** Local calendar day, so a separator lands where the reader's midnight is. */
export function dayKey(iso: string): string {
  const date = new Date(iso)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function gapMs(previous: ChatMessage, message: ChatMessage): number {
  return Date.parse(message.createdAt) - Date.parse(previous.createdAt)
}

function opensRun(previous: ChatMessage | undefined, message: ChatMessage): boolean {
  if (!previous || previous.authorId !== message.authorId) return true
  return gapMs(previous, message) > GROUP_WINDOW_MS
}

function dateRow(previous: ChatMessage | undefined, message: ChatMessage): ThreadRow | null {
  const newDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)
  const paused = previous !== undefined && gapMs(previous, message) > TIME_BREAK_MS
  if (!newDay && !paused) return null
  const key = newDay ? `date-${dayKey(message.createdAt)}` : `break-${message.id}`
  return { kind: 'date', key, at: message.createdAt, showDay: newDay }
}

/** Interleaves time rows and marks where each author run begins. */
export function buildThreadRows(messages: readonly ChatMessage[]): ThreadRow[] {
  const rows: ThreadRow[] = []
  messages.forEach((message, index) => {
    const previous = messages[index - 1]
    const date = dateRow(previous, message)
    if (date) rows.push(date)
    rows.push({
      kind: 'message',
      key: message.id,
      message,
      startsGroup: date !== null || opensRun(previous, message),
    })
  })
  return rows
}

const DELIVERY_RANK: Record<DeliveryStatus, number> = {
  undeliverable: 0,
  held: 1,
  pending: 2,
  accepted: 3,
  delivered: 4,
  read: 5,
}

/**
 * The least-advanced state across recipients, so a two-recipient message reads
 * "delivered" only once both have it. Absent delivery means untracked: undefined.
 */
export function aggregateDelivery(message: ChatMessage): DeliveryStatus | undefined {
  const states = message.delivery
  if (!states || states.length === 0) return undefined
  return states.reduce<DeliveryStatus>(
    (worst, state) => (DELIVERY_RANK[state.status] < DELIVERY_RANK[worst] ? state.status : worst),
    'read'
  )
}

export const DELIVERY_LABEL: Record<DeliveryStatus, string> = {
  pending: 'Sending',
  accepted: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  held: 'Held',
  undeliverable: 'Not delivered',
}

export function findParticipant(
  participants: readonly Participant[],
  id: string
): Participant | undefined {
  return participants.find((participant) => participant.id === id)
}
