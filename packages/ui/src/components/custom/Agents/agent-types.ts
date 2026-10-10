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
  /** How `id` was formed. */
  idSource: AgentIdSource
  /** The broker name. Unique among live sessions only; a retired name can be spawned again. */
  name: string
  /** The broker's durable agent id; null when no spawn row is in the window. */
  agentId: string | null
  /** The presence status, or the lifecycle state folded from history. */
  state: AgentSummaryState
  /** Which source `state` was read from. */
  stateSource: AgentStateSource
  /** How the session came to be. */
  origin: AgentOrigin
  /** The session's declared line. A claim, not a fact. */
  workingOn: string | null
  /** The session's working directory; null for a history-only row. */
  cwd: string | null
  /** The branch observed in `cwd`. */
  gitBranch: string | null
  /** The seat whose name prefix this agent carries; null when none matches. */
  seat: string | null
  /** Where the process is presented (`headless`, `iterm-pane`, ...). */
  surface: string | null
  /** The spawn profile. */
  profile: string | null
  /** A task id the session declared. A claim. */
  taskId: string | null
  /** The spawner's name; `human` for an adopted session. */
  spawnedBy: string | null
  /** Joins the session's transcript. */
  claudeSessionId: string | null
  /** Epoch ms the session registered with the broker. */
  registeredAt: number | null
  /** Epoch ms of the spawn row. */
  spawnedAt: number | null
  /** Epoch ms of the newest presence or history signal. */
  lastEventAt: number | null
  /** Presence only: milliseconds since the session last spoke. */
  idleMs: number | null
  /** Presence only: holding pushes. */
  dnd: boolean
  /** Presence only: the name was derived from the directory, not chosen. */
  provisional: boolean
  /** Presence only: tag labels, never authorization. */
  tags: string[]
  /** The session's cost in US dollars. */
  costUsd: number | null
  /** Where `costUsd` came from. */
  costSource: AgentCostSource | null
}

/** How much history the fold saw; the broker caps it, so older spawns age out. */
export interface HistoryWindow {
  /** Events the fold read. */
  events: number
  /** The broker's cap on history events. */
  limit: number
  /** Epoch ms of the oldest event read. */
  oldestAt: number | null
}

/** The roster as one read: every agent, plus the broker's health and the history window. */
export interface AgentRosterSnapshot {
  /** One row per agent. */
  agents: AgentRosterEntry[]
  /** Under about 10 s the broker's registry is still refilling after a restart, so missing presence is not death. */
  brokerUptimeMs: number | null
  /** True while the console is reconnecting to the broker. */
  reconnecting: boolean
  /** How much history the fold saw. */
  history: HistoryWindow
  /** Epoch ms the snapshot was built. */
  generatedAt: number
}
