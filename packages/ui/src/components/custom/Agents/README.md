# `custom/Agents` — agent sessions, presence and spend

Status: `status:candidate`. Built in slices of TP-858 (console S17). TP-858a holds the state and
metrics modules, the fixtures, `AgentStateLabel` and `AgentCard`. TP-858b adds `AgentRoster`,
`AgentRosterRow`, `AgentHoverCard` and the `AgentsView` composition story.

One record per agent session, joined by the host from two sources: presence and lifecycle from the
agent-chat broker's roster, and metrics from the session's transcript. A session can have presence
and no transcript; that is a normal session with unknown metrics, and the card says so instead of
printing zeros. The family holds no fetch and no clock: the host passes the data and `now`.

This README is the **index**: **composes ↓** and **used-by ↑**.

## Dependency map

| Member                  | Kind     | Composes ↓                                                                              | Used-by ↑                               |
| ----------------------- | -------- | --------------------------------------------------------------------------------------- | --------------------------------------- |
| `AgentCard`             | organism | `Card`, the two parts files below                                                       | console agents view (TP-864)            |
| `AgentCardIdentity.tsx` | parts    | `AgentStateLabel`, `Avatar`, `Pill`, `Typography` (header, task, branch, recency, tags) | `AgentCard`                             |
| `AgentCardMetrics.tsx`  | parts    | `CardInset`, `SparkBars`, `Progress`, `Typography` (metric cells, no-transcript notice) | `AgentCard`                             |
| `AgentStateLabel`       | molecule | `Indicator`, `Typography`, `Pill`                                                       | `AgentCard`, `AgentRosterRow` (TP-858b) |
| `agent-state.ts`        | pure fns | `IndicatorColor`                                                                        | every member                            |
| `agent-metrics.ts`      | pure fns | `formatCompact`, `formatUsd`, `formatTaskAge`, `formatSessionDuration` (`utils/`)       | every member                            |
| `agent-types.ts`        | types    | —                                                                                       | every member                            |
| `agent-fixture.ts`      | fixtures | `seededRandom` (`ui/charts/kit`)                                                        | tests and stories only                  |

No new primitive and no new token.

## The type source

`agent-types.ts` copies the shapes of titan-platform `packages/chat-protocol/src/agents/types.ts`
(TP-847, merged as `9172151c`): the eight states, `AgentRosterEntry`, `AgentRosterSnapshot` and
`LIVE_HISTORY_STATES`. The source is zod; the copy keeps the inferred types only. The source's
`AgentState` is `AgentSummaryState` here. Re-copy the file whole when the source moves.

`AgentSummary` is the view model. Its fields follow `AgentRosterEntry` where the two share a meaning
and accept the roster's `null`; four are renamed (`workingOn` to `task`, `gitBranch` to `branch`,
`dnd` to `isDnd`, `provisional` to `isProvisional`). `agent-types.test-d.ts` fails if a roster field
stops fitting. The console (TP-864) owns the adapter and joins `metrics` from the transcript.

## The vocabulary owner

`agent-state.ts` owns every state word, dot and order (`AGENT_STATE_META`, `AGENT_STATE_ORDER`). A
component never spells a state label of its own. `agentStateMeta` falls back to the raw word and a
neutral dot for a state from a newer roster.

| State       | Source   | Live | Dot                 |
| ----------- | -------- | ---- | ------------------- |
| `blocked`   | presence | yes  | `warning`           |
| `working`   | presence | yes  | `success`, ping     |
| `available` | presence | yes  | `info`              |
| `spawning`  | history  | yes  | `default` (pending) |
| `detached`  | history  | yes  | `default` (pending) |
| `failed`    | history  | no   | `default` (pending) |
| `exited`    | history  | no   | `default`           |
| `retired`   | history  | no   | `default` (pending) |

"Pending" tones belong to the owner's TASTE item T1. An agent whose `stateSource` is `history` is
known only from durable history; its card takes the `subtle` variant (stays on the host plane, no
lift) instead of the `historical` state the contract first proposed.

## States

| State    | `AgentCard`                                                                                                          | `AgentStateLabel` |
| -------- | -------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Loading  | `isLoading` passes to `Card`, which pulses and renders skeleton lines.                                               | Does not apply.   |
| Empty    | `metrics: null` renders `metricsEmpty` (default "No transcript for this session"); no task renders "No stated task". | Does not apply.   |
| Error    | Does not apply: no fetch. The host renders a failed roster read with `Alert`.                                        | Does not apply.   |
| Disabled | Does not apply: the card is not a control.                                                                           | Does not apply.   |

Non-finite and negative numbers render the `—` placeholder, never `NaN`. An error rate above
`ERROR_RATE_FLAG_ABOVE` (5 percent) prints its share beside the count, so the flag is not colour
alone.

## Accessibility

- `AgentCard` is a `group` named by `agentAccessibleSummary` (name, state, do not disturb, last
  event, cost). It is never a button: `onPress` makes the name a link, and `onPressTask` makes the
  task id pill a second link. Declared text (`task`, tags) renders as literal text.
- The state dot and the avatar are hidden from assistive tech; the state word and the name carry
  them.
- The activity spark is an image named by its interval count.

## Fixtures

`agent-fixture.ts` holds fixed, invented orchard-vocabulary agents: one per state, plus no
transcript, bare, zero calls, huge, non-finite, hostile and provisional, and the lists `AGENTS_MIXED`,
`AGENTS_DUPLICATE_IDS` and `AGENTS_LARGE` (200 agents from a seed, 12 live). Fixtures are never
exported from a barrel.

## Known gaps

- `formatDurationMs` lands in `utils/time-format.ts` with TP-855a. Until then the recency label
  composes `formatSessionDuration` and `formatTaskAge`.
- Truncation is off (`titan/no-truncation`): a long name or branch breaks anywhere on web, and a
  long task wraps.
