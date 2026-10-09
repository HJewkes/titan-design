/**
 * The agent roster as the console reads it, copied type for type from titan-platform
 * `packages/chat-protocol/src/agents/types.ts` (TP-847, merged as 9172151c). The source is a set of
 * zod schemas; this copy keeps the inferred shapes and the state lists, never the schemas, so the
 * design system takes no zod dependency. Re-copy the file whole when the source moves.
 */

/** Presence statuses, verbatim from the broker's registry. */
export const PRESENCE_STATES = ['working', 'available', 'blocked'] as const

/** Lifecycle states folded from history for an agent with no live presence. `failed` is an exit that never started. */
export const HISTORY_STATES = ['spawning', 'detached', 'exited', 'failed', 'retired'] as const

/** History states whose process may still be running; the rest are past. */
export const LIVE_HISTORY_STATES = ['spawning', 'detached'] as const

/** The roster's eight states: three from presence, five from history. The source calls it `AgentState`. */
export type AgentSummaryState = (typeof PRESENCE_STATES)[number] | (typeof HISTORY_STATES)[number]

/** Which of the two sources a row's state was read from. */
export type AgentStateSource = 'presence' | 'history'

/** `claudeSessionId` when Claude Code started the session, else `name@registeredAt`. */
export type AgentIdSource = 'claudeSessionId' | 'nameAtRegisteredAt'

/** `spawned` by the supervisor, `adopted` when a human-started session registered, `unknown` when no spawn row is in the window. */
export type AgentOrigin = 'spawned' | 'adopted' | 'unknown'

/** `session-analytics` prices the transcript; `exit-report` is the cost the agent's own exit row carried. */
export type AgentCostSource = 'session-analytics' | 'exit-report'

/** One roster row. Fields marked "a claim" are text a model typed: render them as plain text. */
export interface AgentRosterEntry {
  /** Stable across reconnects: see `idSource`. */
  id: string
  idSource: AgentIdSource
  name: string
  /** The broker's durable agent id; null when no spawn row is in the window. */
  agentId: string | null
  state: AgentSummaryState
  stateSource: AgentStateSource
  origin: AgentOrigin
  /** The session's declared line. A claim, not a fact. */
  workingOn: string | null
  cwd: string | null
  gitBranch: string | null
  seat: string | null
  surface: string | null
  profile: string | null
  /** A task id the session declared. A claim. */
  taskId: string | null
  spawnedBy: string | null
  claudeSessionId: string | null
  registeredAt: number | null
  spawnedAt: number | null
  /** Epoch ms of the newest presence or history signal. */
  lastEventAt: number | null
  idleMs: number | null
  dnd: boolean
  provisional: boolean
  tags: string[]
  costUsd: number | null
  costSource: AgentCostSource | null
}

/** How much history the fold saw; the broker caps it, so older spawns age out. */
export interface HistoryWindow {
  events: number
  limit: number
  oldestAt: number | null
}

export interface AgentRosterSnapshot {
  agents: AgentRosterEntry[]
  /** Under about 10 s the broker's registry is still refilling after a restart, so missing presence is not death. */
  brokerUptimeMs: number | null
  reconnecting: boolean
  history: HistoryWindow
  generatedAt: number
}
