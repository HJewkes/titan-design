import { formatCompact, formatUsd } from '../../../utils/number-format'
import { formatSessionDuration, formatTaskAge } from '../../../utils/time-format'
import type {
  AgentCostSource,
  AgentOrigin,
  AgentStateSource,
  AgentSummaryState,
} from './agent-types'

/** Transcript-derived numbers for one session. Cost lives on the summary, since it may come from the exit row. */
export interface AgentMetrics {
  /** Input tokens, cache reads included. */
  tokensIn: number
  /** Output tokens. */
  tokensOut: number
  /** Tool calls made. */
  toolCalls: number
  /** Tool calls that failed. */
  errors: number
  /** Tool calls per bucket, oldest first. */
  activity?: number[]
  /** 0 to 1, share of the context window in use. Out-of-range values are clamped. */
  contextFraction?: number
}

/**
 * The view model every Agents component renders. Field names follow `AgentRosterEntry` where the two
 * share a meaning; `task`, `branch`, `isDnd` and `isProvisional` are the renamed ones. Every optional
 * field accepts the roster's `null`.
 */
export interface AgentSummary {
  /** Stable across reconnects; the roster's `id`. */
  id: string
  /** The broker name. */
  name: string
  /** Presence status or lifecycle state. */
  state: AgentSummaryState
  /** `history` marks an agent known only from durable history; the card recedes. */
  stateSource?: AgentStateSource
  /** The broker's durable agent id. */
  agentId?: string | null
  /** Spawned, adopted or unknown. */
  origin?: AgentOrigin
  /** The spawn profile. */
  profile?: string | null
  /** The session holds pushes. */
  isDnd?: boolean
  /** The name was derived from a directory, not chosen. */
  isProvisional?: boolean
  /** Declared by the model (`workingOn`): rendered as text, never as a link target. */
  task?: string | null
  /** A task id the session declared. A claim; the card makes it a link only through `onPressTask`. */
  taskId?: string | null
  /** The observed git branch (`gitBranch`). */
  branch?: string | null
  /** The working directory. */
  cwd?: string | null
  /** The seat the agent belongs to. */
  seat?: string | null
  /** Where the process is presented. */
  surface?: string | null
  /** The spawner's name. */
  spawnedBy?: string | null
  /** Epoch ms of the newest presence or history signal. */
  lastEventAt?: number | null
  /** Tag labels, rendered as plain text. */
  tags?: string[]
  /** The session's cost in US dollars. */
  costUsd?: number | null
  /** Where `costUsd` came from. */
  costSource?: AgentCostSource | null
  /** null or absent: no transcript was found. Never read as zero. */
  metrics?: AgentMetrics | null
}

/** An error rate above this share of tool calls is flagged. Exactly at it is not. */
export const ERROR_RATE_FLAG_ABOVE = 0.05

const PLACEHOLDER = '—'
const DAY_MS = 86_400_000

function isCount(n: number): boolean {
  return Number.isFinite(n) && n >= 0
}

/** Errors per tool call, clamped to 0 to 1. Null when there are no calls or either count is invalid. */
export function errorRate(metrics: Pick<AgentMetrics, 'toolCalls' | 'errors'>): number | null {
  const { toolCalls, errors } = metrics
  if (!isCount(toolCalls) || !isCount(errors) || toolCalls === 0) return null
  return Math.min(1, errors / toolCalls)
}

/** True when a rate is above {@link ERROR_RATE_FLAG_ABOVE}. */
export function isErrorRateFlagged(rate: number | null): boolean {
  return rate !== null && rate > ERROR_RATE_FLAG_ABOVE
}

/** A count as a compact number, or the placeholder for a negative or non-finite value. */
export function agentCountLabel(n: number): string {
  return isCount(n) ? formatCompact(n) : PLACEHOLDER
}

/** The error count, followed by its share of calls when that share is flagged, so the flag is never colour alone. */
export function agentErrorsLabel(metrics: Pick<AgentMetrics, 'toolCalls' | 'errors'>): string {
  const count = agentCountLabel(metrics.errors)
  const rate = errorRate(metrics)
  return rate !== null && isErrorRateFlagged(rate) ? `${count} · ${Math.round(rate * 100)}%` : count
}

/** A cost, or the placeholder when it is missing, negative or non-finite. */
export function agentCostLabel(costUsd: number | null | undefined): string {
  return costUsd != null && isCount(costUsd) ? formatUsd(costUsd) : PLACEHOLDER
}

/** Time since the newest signal: `just now`, `42m ago`, `3d ago`, or the placeholder. */
export function agentLastEventLabel(lastEventAt: number | null | undefined, now: number): string {
  if (lastEventAt == null || !Number.isFinite(lastEventAt) || !Number.isFinite(now)) {
    return PLACEHOLDER
  }
  const then = new Date(lastEventAt).toISOString()
  if (now - lastEventAt >= DAY_MS) return formatTaskAge(then, now)
  const span = formatSessionDuration(then, new Date(now).toISOString())
  return span === '' || span === '0m' ? 'just now' : `${span} ago`
}

/** The context share clamped to 0 to 1, or null when absent or non-finite. */
export function clampedContextFraction(metrics: AgentMetrics): number | null {
  const f = metrics.contextFraction
  if (f == null || !Number.isFinite(f)) return null
  return Math.min(1, Math.max(0, f))
}
