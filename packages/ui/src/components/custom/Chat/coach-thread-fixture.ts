/**
 * A two-party coach thread in @titan-design/chat-protocol shape, spanning
 * yesterday and today. Shared by the stories and the tests so the two cannot drift.
 * Times are built in local time so day separators land the same in every zone.
 */
import type { ChatMessage, ChatPart, DeliveryState, Participant } from '@titan-design/chat-protocol'

export const THREAD_ID = 'thread-coach-1'

export const COACH: Participant = {
  id: 'coach',
  role: 'assistant',
  displayName: 'Coach',
  kind: 'agent',
}

export const ATHLETE: Participant = {
  id: 'athlete',
  role: 'user',
  displayName: 'Alex Rivera',
  kind: 'human',
  address: { scheme: 'telegram', value: 'alex' },
}

export const PARTICIPANTS: Participant[] = [COACH, ATHLETE]

/** The reader's frozen clock: 09:00 today. */
export const NOW = localIso(0, 9, 0)

/** An ISO instant `daysAgo` days before the fixture's today, at a local wall-clock time. */
export function localIso(daysAgo: number, hours: number, minutes: number): string {
  return new Date(2026, 8, 17 - daysAgo, hours, minutes).toISOString()
}

/** Titan-specific content rides a `data-*` part; the key carries no second hyphen. */
export interface CheckinData {
  title: string
  scheduledFor: string
  durationMinutes: number
  agenda: string[]
}

export const CHECKIN_PART_TYPE = 'data-checkin'

export const CHECKIN: CheckinData = {
  title: 'Sunday check-in',
  scheduledFor: localIso(-3, 18, 30),
  durationMinutes: 15,
  agenda: [
    "Review last week's four sessions",
    "Pick next week's anchored slots",
    'Re-ask the if-then plan',
  ],
}

function text(body: string): ChatPart {
  return { type: 'text', text: body, state: 'done' }
}

function read(at: string): DeliveryState[] {
  return [{ participantId: COACH.id, status: 'read', at }]
}

export function chatMessage(
  id: string,
  author: Participant,
  createdAt: string,
  parts: ChatPart[],
  delivery?: DeliveryState[]
): ChatMessage {
  return {
    id,
    threadId: THREAD_ID,
    authorId: author.id,
    role: author.role,
    createdAt,
    parts,
    delivery,
  }
}

export const COACH_THREAD: ChatMessage[] = [
  chatMessage('m1', COACH, localIso(1, 18, 2), [
    text('Good session. Your top bench set moved at **0.52 m/s**, right on target.'),
  ]),
  chatMessage(
    'm2',
    ATHLETE,
    localIso(1, 18, 10),
    [text('Set 3 felt heavy though.')],
    read(localIso(1, 18, 11))
  ),
  chatMessage('m3', COACH, localIso(1, 18, 11), [
    text('That tracks: speed fell **18%** by the last rep. Rest up tonight.'),
  ]),
  chatMessage('m4', COACH, localIso(0, 8, 0), [
    text('Morning. Your weekly check-in is booked:'),
    { type: CHECKIN_PART_TYPE, id: 'checkin-1', data: CHECKIN },
  ]),
  chatMessage('m5', COACH, localIso(0, 8, 1), [text('Reply here if that slot does not work.')]),
  chatMessage(
    'm6',
    ATHLETE,
    localIso(0, 8, 14),
    [text('Works for me.')],
    [{ participantId: COACH.id, status: 'accepted', at: localIso(0, 8, 14) }]
  ),
]
