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

export const PHYSIO: Participant = {
  id: 'physio',
  role: 'user',
  displayName: 'Sam Okafor',
  kind: 'human',
  address: { scheme: 'telegram', value: 'sam' },
}

export const PARTICIPANTS: Participant[] = [COACH, ATHLETE]

export const GROUP_PARTICIPANTS: Participant[] = [COACH, ATHLETE, PHYSIO]

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
  delivery?: DeliveryState[],
  extra: Partial<ChatMessage> = {}
): ChatMessage {
  return {
    ...extra,
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

/** A coach message a human read and approved, as the broker stamps it. */
const ENDORSED = { authored: 'agent', endorsedBy: 'human', attestedBy: 'maria' } as const

/** One plain coach message, one endorsed, one reply: each treatment shows against a control. */
export const ENDORSEMENT_THREAD: ChatMessage[] = [
  chatMessage('e1', COACH, localIso(0, 8, 0), [
    text('Your top bench set moved at **0.52 m/s**, right on target.'),
  ]),
  chatMessage(
    'e2',
    COACH,
    localIso(0, 8, 1),
    [text('Approved: add **2.5 kg** to squat on Thursday.')],
    undefined,
    { provenance: ENDORSED }
  ),
  chatMessage('e3', ATHLETE, localIso(0, 8, 6), [text('Will do.')], read(localIso(0, 8, 7))),
]

/** A three-party thread for the group layout: a coach, a physio and the athlete. */
export const GROUP_THREAD: ChatMessage[] = [
  chatMessage('g1', COACH, localIso(0, 8, 0), [text('Sam, how is the left shoulder?')]),
  chatMessage('g2', COACH, localIso(0, 8, 1), [text('Alex wants to add overhead work.')]),
  chatMessage('g3', PHYSIO, localIso(0, 8, 4), [
    text('Fine to start light. No pain above **90°**.'),
  ]),
  chatMessage('g4', PHYSIO, localIso(0, 8, 5), [text('Stop if it pinches.')]),
  chatMessage(
    'g5',
    ATHLETE,
    localIso(0, 8, 9),
    [text('Got it, starting at 20 kg.')],
    read(localIso(0, 8, 10))
  ),
]

/** A day with two pauses of more than an hour, so the thread shows time rows. */
export const BREAKS_THREAD: ChatMessage[] = [
  chatMessage('b1', COACH, localIso(0, 7, 0), [text('Session plan is up for today.')]),
  chatMessage('b2', ATHLETE, localIso(0, 7, 4), [text('Thanks.')], read(localIso(0, 7, 5))),
  chatMessage(
    'b3',
    ATHLETE,
    localIso(0, 7, 5),
    [text('Heading in at noon.')],
    read(localIso(0, 7, 6))
  ),
  chatMessage('b4', COACH, localIso(0, 12, 40), [text('How did the warm-up feel?')]),
  chatMessage(
    'b5',
    ATHLETE,
    localIso(0, 12, 42),
    [text('Loose. Starting bench.')],
    read(localIso(0, 12, 43))
  ),
  chatMessage('b6', COACH, localIso(0, 15, 10), [text('Nice work today. Rest up.')]),
]
