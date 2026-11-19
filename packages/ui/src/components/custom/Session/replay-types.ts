import type {
  CompactionMark,
  TimelineAgentSpan,
  TimelineMessage,
  TimelineToolCall,
  TimelineToolOutcome,
  TimelineTurn,
  TimelineTurnOrigin,
  TokenTimeline,
  ToolFamily,
} from './session-types'

/** The shapes of the replay event model; the logic lives in `replay-model.ts`. */

export type ReplayEventKind =
  | 'prompt'
  | 'injected'
  | 'message'
  | 'assistant'
  | 'tool'
  | 'error'
  | 'agent'
  | 'compaction'

/** The kinds in the order a legend lists them. */
export const REPLAY_KIND_ORDER: ReplayEventKind[] = [
  'prompt',
  'injected',
  'message',
  'assistant',
  'tool',
  'error',
  'agent',
  'compaction',
]

export interface ReplayMoment {
  /** 1-based position in the list. */
  position: number
  total: number
  turnIndex: number | null
  atMs: number | null
  /** Since the first timed event; null when either time is unknown. */
  elapsedMs: number | null
  /** Prompt size of the last API request at or before this event; null when unknown. */
  contextTokens: number | null
}

export type ReplayPayload =
  | { type: 'message'; message: TimelineMessage; origin: TimelineTurnOrigin; turn: TimelineTurn }
  | { type: 'tool'; call: TimelineToolCall; agent: TimelineAgentSpan | null }
  | {
      type: 'compaction'
      /** Null when a compaction opener has no mark before it. */
      mark: CompactionMark | null
      /** The opener with origin 'compaction' that follows the mark, when there is one. */
      summaryMessage: TimelineMessage | null
      tokensBefore: number | null
      tokensAfter: number | null
    }

export interface ReplayEvent {
  /** Stable across renders and unique within a list: 'm:<seq>', 't:<seq>', 'c:<byteOffset>'. */
  id: string
  kind: ReplayEventKind
  /** One line. First line of the text, the tool name, or 'Context compaction'. */
  title: string
  /** One line. The input summary, or the start of a summary. */
  subtitle: string | null
  moment: ReplayMoment
  payload: ReplayPayload
}

export interface ReplayInput {
  turns: TimelineTurn[]
  tokens?: Pick<TokenTimeline, 'points' | 'compactions'>
  agents?: TimelineAgentSpan[]
}

/** What decides a kind. A call's outcome and family, an opener's origin and marker. */
export type KindSource =
  | { type: 'opener'; origin: TimelineTurnOrigin; injectedMarker: string | null }
  | { type: 'assistant' }
  | { type: 'call'; outcome: TimelineToolOutcome; family: ToolFamily }
  | { type: 'mark' }

export interface MessageEntry {
  seq: number
  byteOffset: number
  payload: Extract<ReplayPayload, { type: 'message' }>
}

export interface ToolEntry {
  seq: number
  byteOffset: number
  payload: Extract<ReplayPayload, { type: 'tool' }>
}

export type SourceEntry = MessageEntry | ToolEntry

/** A source entry, or a compaction mark with the opener it merged with. */
export type Placed =
  | { slot: 'entry'; entry: SourceEntry }
  | { slot: 'mark'; mark: CompactionMark; opener: MessageEntry | null }
