import type {
  ChatMessage,
  ChatPart,
  DataPart,
  DeliveryStatus,
  Participant,
  TextPart,
} from '@titan-design/chat-protocol'

/** Consecutive messages from one author closer than this share one avatar and name. */
export const GROUP_WINDOW_MS = 5 * 60 * 1000

/** A rendered row in the thread: either a day boundary or a message with its grouping. */
export type ThreadRow =
  | { kind: 'date'; key: string; at: string }
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

export function isStreaming(message: ChatMessage): boolean {
  return message.parts.some((part) => isTextPart(part) && part.state === 'streaming')
}

/** Local calendar day, so a separator lands where the reader's midnight is. */
export function dayKey(iso: string): string {
  const date = new Date(iso)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function startsGroup(previous: ChatMessage | undefined, message: ChatMessage): boolean {
  if (!previous || previous.authorId !== message.authorId) return true
  const gap = Date.parse(message.createdAt) - Date.parse(previous.createdAt)
  return gap > GROUP_WINDOW_MS
}

/** Interleaves day separators and marks where each author run begins. */
export function buildThreadRows(messages: readonly ChatMessage[]): ThreadRow[] {
  const rows: ThreadRow[] = []
  messages.forEach((message, index) => {
    const previous = messages[index - 1]
    const newDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)
    if (newDay) {
      rows.push({ kind: 'date', key: `date-${dayKey(message.createdAt)}`, at: message.createdAt })
    }
    rows.push({
      kind: 'message',
      key: message.id,
      message,
      startsGroup: newDay || startsGroup(previous, message),
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
