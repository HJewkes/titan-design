# `custom/Agents` — agent sessions, presence and spend

Status: `status:candidate`. Built in slices of TP-858 (console S17). TP-858a holds the state and
metrics modules, the fixtures, `AgentStateLabel` and `AgentCard`. TP-858b adds `AgentRoster`,
`AgentRosterRow`, `AgentHoverCard` (with `AgentHoverCardContent`), `agent-roster.ts` and the
`AgentsView` composition story.

One record per agent session, joined by the host from two sources: presence and lifecycle from the
agent-chat broker's roster, and metrics from the session's transcript. A session can have presence
and no transcript; that is a normal session with unknown metrics, and the card says so instead of
printing zeros. The family holds no fetch and no clock: the host passes the data and `now`.

This README is the **index**: **composes ↓** and **used-by ↑**.

## Dependency map

| Member                  | Kind     | Composes ↓                                                                              | Used-by ↑                           |
| ----------------------- | -------- | --------------------------------------------------------------------------------------- | ----------------------------------- |
| `AgentCard`             | organism | `Card`, the two parts files below                                                       | console agents view (TP-864)        |
| `AgentCardIdentity.tsx` | parts    | `AgentStateLabel`, `Avatar`, `Pill`, `Typography` (header, task, branch, recency, tags) | `AgentCard`                         |
| `AgentCardMetrics.tsx`  | parts    | `CardInset`, `SparkBars`, `Progress`, `Typography` (metric cells, no-transcript notice) | `AgentCard`                         |
| `AgentStateLabel`       | molecule | `Indicator`, `Typography`, `Pill`                                                       | `AgentCard`, `AgentRosterRow`       |
| `AgentRoster`           | organism | `AgentRosterRow`, `Typography`, `SkeletonListItem`, `EmptyState`, `useListNavigation`   | console agents view (TP-864)        |
| `AgentRosterRow`        | molecule | `Avatar`, `AgentStateLabel`, `Typography`                                               | `AgentRoster`                       |
| `AgentHoverCard`        | molecule | `Tooltip` (controlled, portalled), `useHoverFocusState`, `TriggerSurface`               | board assignee, topology (TP-865)   |
| `AgentHoverCardContent` | molecule | the `AgentCardIdentity.tsx` parts, `Typography`                                         | `AgentHoverCard`, graph node detail |
| `agent-roster.ts`       | pure fns | `agent-state.ts`, `agent-metrics.ts`                                                    | `AgentRoster`, `AgentRosterRow`     |
| `agent-state.ts`        | pure fns | `IndicatorColor`                                                                        | every member                        |
| `agent-metrics.ts`      | pure fns | `formatCompact`, `formatUsd`, `formatTaskAge`, `formatSessionDuration` (`utils/`)       | every member                        |
| `agent-types.ts`        | types    | —                                                                                       | every member                        |
| `agent-fixture.ts`      | fixtures | `seededRandom` (`ui/charts/kit`)                                                        | tests and stories only              |

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

`isDnd` (the roster's `dnd`) is not a state: the session holds pushes, so a message sent to it
queues in its inbox until it reads it, whatever its status. `AgentStateLabel` shows it as a neutral
`DND` pill centred on the state word, because "available" alone would promise a prompt reply.

## States

| State    | `AgentCard`                                                                                                          | `AgentStateLabel` |
| -------- | -------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Loading  | `isLoading` passes to `Card`, which pulses and renders skeleton lines.                                               | Does not apply.   |
| Empty    | `metrics: null` renders `metricsEmpty` (default "No transcript for this session"); no task renders "No stated task". | Does not apply.   |
| Error    | Does not apply: no fetch. The host renders a failed roster read with `Alert`.                                        | Does not apply.   |
| Disabled | Does not apply: the card is not a control.                                                                           | Does not apply.   |

| State    | `AgentRoster` and `AgentRosterRow`                                                                                                                | `AgentHoverCard`                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Loading  | `isLoading` renders skeleton rows, never the empty state. The host maps the broker's reconnect grace here.                                        | Does not apply: it shows an agent the host holds.       |
| Empty    | `agents: []` renders `emptyState` (default `EmptyState`, "No agents"). A row skips a field the agent lacks; no transcript prints no metric field. | No transcript shows the notice, as the card does.       |
| Error    | Does not apply: no fetch.                                                                                                                         | Does not apply: no fetch.                               |
| Disabled | Does not apply: a row with no `onSelect` is inert text and takes no option role.                                                                  | `isDisabled` never opens, even when `isOpen` is `true`. |

Non-finite and negative numbers render the `—` placeholder, never `NaN`. An error rate above
`ERROR_RATE_FLAG_ABOVE` (5 percent) prints its share beside the count, so the flag is not colour
alone. The flagged figure sits in the subtle error `Pill` (`AgentMetricValue`), because
`text-error` alone measures about 3.7:1 on `CardInset` in dark, under AA at caption size.

## Accessibility

- `AgentCard` is a `group` named by `agentAccessibleSummary` (name, state, do not disturb, last
  event, cost). It is never a button: `onPress` makes the name a link, and `onPressTask` makes the
  task id pill a second link. Declared text (`task`, tags) renders as literal text.
- The state dot and the avatar are hidden from assistive tech; the state word and the name carry
  them.
- The activity spark is an image named by its interval count.
- `AgentRoster` is a WAI-ARIA single-select listbox with `Live` and `Past` groups. One tab stop, on the
  selected row or the first; Up, Down, Home and End move focus through TD-383's
  `useListNavigation` and stop at the ends; Enter, Space or a press selects; selection never
  follows focus. RNW presses an option on Enter but not on Space, so the list handles Space.
  Rows register a guarded focus target: a host re-sort while focus is elsewhere never pulls focus
  into the list.
- `AgentHoverCard` is a WAI-ARIA tooltip on TD-401's `useHoverFocusState`: hover or keyboard focus
  opens it, hover out or blur close it, Escape closes it at once, a long press opens it on touch.
  The open card's id is the trigger's `aria-describedby`. The trigger must be an element that
  forwards press, focus and hover props (a `Pressable`, a link); a string is wrapped in a
  focusable `Pressable`. The card holds no focusable element.

## Fixtures

`agent-fixture.ts` holds fixed, invented orchard-vocabulary agents: one per state, plus no
transcript, bare, zero calls, huge, non-finite, hostile and provisional, and the lists `AGENTS_MIXED`,
`AGENTS_DUPLICATE_IDS` and `AGENTS_LARGE` (200 agents from a seed, 12 live). Fixtures are never
exported from a barrel.

## Known gaps

- The roster's state tones are 858a's, pending the owner's TASTE item T1.

- `formatDurationMs` lands in `utils/time-format.ts` with TP-855a. Until then the recency label
  composes `formatSessionDuration` and `formatTaskAge`.
- Truncation is off (`titan/no-truncation`): a long name or branch breaks anywhere on web, and a
  long task wraps.
