import { buildReplayEvents } from './replay-model'
import type { ReplayEvent } from './replay-types'
import {
  SESSION_ALL_ERRORS,
  SESSION_DEFAULT,
  SESSION_EMPTY,
  SESSION_HOSTILE,
  SESSION_LARGE,
  SESSION_LONG_TEXT,
  SESSION_NULL_TIMES,
  SESSION_ONE_TURN,
  SESSION_ORIGINS,
  SESSION_PENDING,
  SESSION_SNAPSHOT_BASIS,
} from './session-fixture'
import type { SessionTimeline } from './session-types'

/** The replay events of a fixture timeline, built the way a host builds them from `sessions.timeline`. */
export function replayEventsOf(timeline: SessionTimeline): ReplayEvent[] {
  return buildReplayEvents({
    turns: timeline.turns,
    tokens: timeline.tokens,
    agents: timeline.agents,
  })
}

/** All eight kinds' worth of data except `message`: 24 turns, 96 calls, 4 errors, 2 subagents, 1 compaction. */
export const REPLAY_DEFAULT = replayEventsOf(SESSION_DEFAULT)
export const REPLAY_EMPTY = replayEventsOf(SESSION_EMPTY)
/** A prompt and a reply. */
export const REPLAY_ONE = replayEventsOf(SESSION_ONE_TURN)
export const REPLAY_ALL_ERRORS = replayEventsOf(SESSION_ALL_ERRORS)
/** A prompt, an injected block, a channel message, a compaction summary and a prompt. */
export const REPLAY_ORIGINS = replayEventsOf(SESSION_ORIGINS)
export const REPLAY_PENDING = replayEventsOf(SESSION_PENDING)
export const REPLAY_NULL_TIMES = replayEventsOf(SESSION_NULL_TIMES)
/** A snapshot basis: no token points, so context and compaction sizes are unknown. */
export const REPLAY_NO_TOKENS = replayEventsOf(SESSION_SNAPSHOT_BASIS)
export const REPLAY_LONG_TEXT = replayEventsOf(SESSION_LONG_TEXT)
/** The stated scale: thousands of events. */
export const REPLAY_LARGE = replayEventsOf(SESSION_LARGE)
export const REPLAY_HOSTILE = replayEventsOf(SESSION_HOSTILE)

function idWhere(events: ReplayEvent[], match: (event: ReplayEvent) => boolean): string {
  const found = events.find(match)
  if (!found) throw new Error('REPLAY_DEFAULT is missing an event the ids name')
  return found.id
}

/** Named ids in `REPLAY_DEFAULT`, so tests and stories address the same events. */
export const REPLAY_IDS = {
  first: REPLAY_DEFAULT[0]!.id,
  prompt: idWhere(REPLAY_DEFAULT, (e) => e.kind === 'prompt'),
  assistant: idWhere(REPLAY_DEFAULT, (e) => e.kind === 'assistant'),
  failedCall: idWhere(REPLAY_DEFAULT, (e) => e.kind === 'error'),
  subagentCall: idWhere(REPLAY_DEFAULT, (e) => e.kind === 'agent'),
  compaction: idWhere(REPLAY_DEFAULT, (e) => e.kind === 'compaction'),
  last: REPLAY_DEFAULT[REPLAY_DEFAULT.length - 1]!.id,
} as const
