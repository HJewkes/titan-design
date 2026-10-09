import { seededRandom } from '../../ui/charts/kit/seededRandom'
import type { AgentMetrics, AgentSummary } from './agent-metrics'
import type { AgentSummaryState } from './agent-types'

/**
 * Agent fixtures for tests and stories. Every name, task and branch is invented orchard vocabulary;
 * no value comes from a real session. Fixed values only: no clock, no unseeded randomness.
 */

/** The reference instant for every story and test: 2026-07-01 12:00 UTC. */
export const AGENTS_NOW = Date.UTC(2026, 6, 1, 12, 0, 0)

const MINUTE = 60_000
const HOUR = 60 * MINUTE

const RISING = [1, 2, 2, 3, 5, 4, 6, 8, 7, 9, 12, 10, 11, 14, 13, 15, 18, 16, 17, 20, 19, 22, 21, 24]

const FULL_METRICS: AgentMetrics = {
  tokensIn: 1_240_000,
  tokensOut: 86_400,
  toolCalls: 312,
  errors: 4,
  activity: RISING,
  contextFraction: 0.62,
}

export const AGENT_WORKING: AgentSummary = {
  id: 'sess-orchard-planner',
  name: 'orchard-planner',
  state: 'working',
  stateSource: 'presence',
  agentId: 'msg-0001',
  origin: 'spawned',
  profile: 'implementer',
  task: 'Reconcile the orchard ledger totals against the harvest log',
  taskId: 'ORC-41',
  branch: 'feat/orchard-ledger-totals',
  cwd: '~/orchard/.worktrees/ledger-totals',
  seat: 'orchard-coord',
  surface: 'headless',
  spawnedBy: 'orchard-coord',
  lastEventAt: AGENTS_NOW - 2 * MINUTE,
  tags: ['ledger', 'harvest'],
  costUsd: 4.81,
  costSource: 'session-analytics',
  metrics: FULL_METRICS,
}

export const AGENT_AVAILABLE: AgentSummary = {
  id: 'sess-quarry-scout',
  name: 'quarry-scout',
  state: 'available',
  stateSource: 'presence',
  origin: 'adopted',
  task: 'Waiting for the next survey batch',
  branch: 'main',
  cwd: '~/quarry',
  spawnedBy: 'human',
  lastEventAt: AGENTS_NOW - 42 * MINUTE,
  costUsd: 1.2,
  costSource: 'session-analytics',
  metrics: { tokensIn: 98_000, tokensOut: 6_100, toolCalls: 40, errors: 0, activity: Array(24).fill(3) },
}

export const AGENT_BLOCKED: AgentSummary = {
  id: 'sess-kiln-watcher',
  name: 'kiln-watcher',
  state: 'blocked',
  stateSource: 'presence',
  origin: 'spawned',
  isDnd: true,
  task: 'Needs approval to rotate the kiln schedule',
  taskId: 'ORC-57',
  branch: 'fix/kiln-schedule',
  cwd: '~/orchard/.worktrees/kiln-schedule',
  spawnedBy: 'orchard-coord',
  lastEventAt: AGENTS_NOW - 9 * MINUTE,
  costUsd: 2.05,
  costSource: 'session-analytics',
  metrics: { tokensIn: 410_000, tokensOut: 22_000, toolCalls: 120, errors: 11, activity: RISING.slice(0, 12) },
}

export const AGENT_SPAWNING: AgentSummary = {
  id: 'name:cellar-mapper@1782907000000',
  name: 'cellar-mapper',
  state: 'spawning',
  stateSource: 'history',
  origin: 'spawned',
  task: 'Map the cellar shelves',
  spawnedBy: 'orchard-coord',
  lastEventAt: AGENTS_NOW - 20_000,
}

export const AGENT_DETACHED: AgentSummary = {
  id: 'name:barn-sweeper@1782900000000',
  name: 'barn-sweeper',
  state: 'detached',
  stateSource: 'history',
  origin: 'spawned',
  task: 'Sweep stale barn records',
  spawnedBy: 'orchard-coord',
  lastEventAt: AGENTS_NOW - 3 * HOUR,
}

export const AGENT_EXITED: AgentSummary = {
  id: 'sess-press-tuner',
  name: 'press-tuner',
  state: 'exited',
  stateSource: 'history',
  origin: 'spawned',
  task: 'Tune the cider press pressure curve',
  taskId: 'ORC-38',
  branch: 'feat/press-curve',
  spawnedBy: 'orchard-coord',
  lastEventAt: AGENTS_NOW - 5 * HOUR,
  costUsd: 3.4,
  costSource: 'exit-report',
  metrics: { tokensIn: 720_000, tokensOut: 41_000, toolCalls: 210, errors: 3, activity: [...RISING, 0, 0, 0] },
}

export const AGENT_FAILED: AgentSummary = {
  id: 'name:hive-counter@1782800000000',
  name: 'hive-counter',
  state: 'failed',
  stateSource: 'history',
  origin: 'spawned',
  spawnedBy: 'orchard-coord',
  lastEventAt: AGENTS_NOW - 30 * HOUR,
}

/** Known from history only: no cwd, no branch, cost from the exit row. */
export const AGENT_RETIRED: AgentSummary = {
  id: 'name:grove-pruner@1782000000000',
  name: 'grove-pruner',
  state: 'retired',
  stateSource: 'history',
  origin: 'spawned',
  task: 'Prune the grove inventory',
  cwd: null,
  branch: null,
  spawnedBy: 'orchard-coord',
  lastEventAt: AGENTS_NOW - 9 * 24 * HOUR,
  costUsd: 12.75,
  costSource: 'exit-report',
  metrics: null,
}

export const AGENT_NO_TRANSCRIPT: AgentSummary = {
  id: 'name:seed-sorter@1782909000000',
  name: 'seed-sorter',
  state: 'working',
  stateSource: 'presence',
  task: 'Sort the seed catalogue by season',
  branch: 'feat/seed-seasons',
  lastEventAt: AGENTS_NOW - 4 * MINUTE,
  metrics: null,
}

export const AGENT_BARE: AgentSummary = { id: 'sess-bare', name: 'bare-agent', state: 'available' }

export const AGENT_ZERO_CALLS: AgentSummary = {
  id: 'sess-idle-fresh',
  name: 'fresh-sprout',
  state: 'available',
  lastEventAt: AGENTS_NOW - MINUTE,
  metrics: { tokensIn: 1_200, tokensOut: 80, toolCalls: 0, errors: 0, activity: [] },
}

export const AGENT_HUGE: AgentSummary = {
  ...AGENT_WORKING,
  id: 'sess-huge',
  name: 'granary-indexer',
  costUsd: 4_812.5,
  metrics: {
    tokensIn: 1.2e9,
    tokensOut: 3.4e8,
    toolCalls: 98_000,
    errors: 1_200,
    activity: Array.from({ length: 500 }, (_, i) => (i * 7) % 31),
    contextFraction: 1.4,
  },
}

export const AGENT_NON_FINITE: AgentSummary = {
  id: 'sess-non-finite',
  name: 'broken-gauge',
  state: 'working',
  lastEventAt: Number.NaN,
  costUsd: Number.NaN,
  metrics: {
    tokensIn: Number.POSITIVE_INFINITY,
    tokensOut: Number.NaN,
    toolCalls: 10,
    errors: -3,
    activity: [1, 2, 3],
    contextFraction: Number.NaN,
  },
}

export const AGENT_HOSTILE: AgentSummary = {
  id: 'sess-hostile',
  name: 'o'.repeat(180),
  state: 'blocked',
  isDnd: true,
  task: (
    '<script>alert("orchard")</script> [click](javascript:void0) **bold** \n' +
    'שלום مرحبا ' +
    'prune the grove and log every branch cut. '.repeat(14)
  ).slice(0, 600),
  taskId: 'ORC-99',
  branch: `feat/${'x'.repeat(135)}`,
  tags: Array.from({ length: 12 }, (_, i) => `tag-${i + 1}`),
  lastEventAt: AGENTS_NOW - 3 * MINUTE,
  costUsd: 0.004,
  metrics: { tokensIn: 5_000, tokensOut: 600, toolCalls: 7, errors: 1 },
}

export const AGENT_PROVISIONAL: AgentSummary = {
  ...AGENT_AVAILABLE,
  id: 'sess-provisional',
  name: 'orchard',
  isProvisional: true,
}

export const AGENTS_EMPTY: AgentSummary[] = []

export const AGENTS_ONE: AgentSummary[] = [AGENT_WORKING]

/** Every state once, plus a second working agent; spawnedBy links back to the coordinator. */
export const AGENTS_MIXED: AgentSummary[] = [
  AGENT_EXITED,
  AGENT_WORKING,
  AGENT_RETIRED,
  AGENT_AVAILABLE,
  AGENT_FAILED,
  AGENT_BLOCKED,
  AGENT_DETACHED,
  AGENT_SPAWNING,
  AGENT_NO_TRANSCRIPT,
]

/** A repeated id (the first wins) and a retired name spawned again under a new id. */
export const AGENTS_DUPLICATE_IDS: AgentSummary[] = [
  AGENT_WORKING,
  { ...AGENT_WORKING, task: 'A stale copy of the same session' },
  AGENT_RETIRED,
  { ...AGENT_RETIRED, id: 'name:grove-pruner@1782950000000', state: 'working', stateSource: 'presence' },
]

const PAST_STATES: AgentSummaryState[] = ['exited', 'failed', 'retired']
const LIVE_STATES: AgentSummaryState[] = ['working', 'available', 'blocked']
const WORDS = ['orchard', 'quarry', 'kiln', 'cellar', 'barn', 'press', 'hive', 'grove', 'seed']

function largeAgent(i: number, live: boolean, next: () => number): AgentSummary {
  const states = live ? LIVE_STATES : PAST_STATES
  return {
    id: `sess-large-${i}`,
    name: `${WORDS[i % WORDS.length]}-${i}`,
    state: states[Math.floor(next() * states.length)],
    stateSource: live ? 'presence' : 'history',
    lastEventAt: AGENTS_NOW - Math.floor(next() * 40 * 24 * HOUR),
    costUsd: Math.round(next() * 2_000) / 100,
    metrics: live ? { ...FULL_METRICS, toolCalls: Math.floor(next() * 400), errors: 2 } : null,
  }
}

/** 200 agents from a fixed seed, the first 12 live: the stated roster scale. */
export function makeLargeAgents(count = 200, liveCount = 12, seed = 858): AgentSummary[] {
  const next = seededRandom(seed)
  return Array.from({ length: count }, (_, i) => largeAgent(i, i < liveCount, next))
}

export const AGENTS_LARGE: AgentSummary[] = makeLargeAgents()
