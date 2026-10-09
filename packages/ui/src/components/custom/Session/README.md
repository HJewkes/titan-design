# `custom/Session` — agent session transcripts

Status: `status:candidate`. Built in slices of TP-855 (console S14). TP-855a holds the shared
seams and the three small components. TP-855b adds `ConversationTurn` and `SessionConversation`,
and TP-855c adds the viewport hook.

A session is one agent run, read back from its transcript as a list of turns. A turn opens with
one message and holds the agent's assistant messages and tool calls, interleaved by `seq`. This
family renders that read model. It holds no fetch, no clock and no search input; the host passes
data in.

This README is the **index**: **composes ↓** and **used-by ↑**.

## Dependency map

| Member                  | Kind     | Composes ↓                                                     | Used-by ↑                      |
| ----------------------- | -------- | -------------------------------------------------------------- | ------------------------------ |
| `SessionConversation`   | organism | `ConversationTurn`, `GapIndicator`, `Skeleton`, `EmptyState`   | console Sessions page (TP-862) |
| `ConversationTurn`      | organism | `ToolCallRow`, `MarkdownProse`, `Card`, `Pill`, `Collapse`     | `SessionConversation`          |
| `ToolCallRow`           | molecule | `ToolBadge`, `Indicator`, `DateTime`, `Typography`, `Collapse` | `ConversationTurn`             |
| `GapIndicator`          | molecule | `Divider`, `Typography`, `DateTime`                            | `SessionConversation`          |
| `ToolBadge`             | atom     | `Pill`                                                         | `ToolCallRow`, tool legends    |
| `session-vocabulary.ts` | words    | `IndicatorColor`                                               | every member                   |
| `conversation-model.ts` | pure fns | `formatDurationMs`, `formatCompact`, `formatDateTime`          | every component                |
| `session-types.ts`      | types    | —                                                              | every member                   |
| `session-fixture.ts`    | fixtures | `seededRandom` (`ui/charts/kit`)                               | tests and stories only         |

No new primitive and no new token.

## The type source

`session-types.ts` is a copy of titan-platform
`packages/session-analytics/src/timeline-types.ts`, plus `ToolFamily` from
`packages/session-read/src/tool-family.ts`, at commit `218cbacd`. The read model landed as
titan-platform #387 (TP-843). The copy keeps every type and field name, so a `SessionTimeline`
from the package is assignable to these props with no adapter, and a changed field fails the
console's type-check. Components take the narrowest slice they read (a call, a turn, the turns),
never the whole timeline. Re-copy the file whole, with the new sha, when the source moves.

`ToolFamily` is a strict 12-value union for the vocabulary map. Every prop that reaches render
takes `ToolFamily | string` and falls back to `other_tool`, so a family from a newer read model
draws a badge rather than a blank.

## The vocabulary owner

`session-vocabulary.ts` owns every word and mark: `TOOL_FAMILY_META` (label and glyph),
`TOOL_OUTCOME_META` (label, `IndicatorColor`, pulse), `TURN_ORIGIN_META`, and the `Channel`
label for an injected opener whose marker is `channel`. A component never spells a label of its
own. `unknown` and `pending` outcomes take the neutral mark, since neither is a success.

## How this differs from `custom/ActiveWork`'s sessions

`ActiveWork`'s `SessionList`, `SessionDetail` and the `SessionReader` story render an active-work
session log: a markdown record with a track and a title. This family renders an agent
transcript: turns, tool calls and tokens. The two share a word and nothing else; no component
here is called `SessionReader`.

## Fixtures

`session-fixture.ts` builds every fixture from a seed with `makeSessionTimeline(spec)`; the
aggregates (buckets, gaps, tools, files, errors, agents, totals) are derived from the turns in
`session-fixture-derive.ts`, so they cannot disagree. All text comes from the invented
orchard-inventory word list in `session-fixture-words.ts`. `session-fixture.test.ts` checks the
structural invariants of every fixture except `SESSION_HOSTILE`, and its leak guard fails on any
word outside that list or the tool names. Fixtures are never exported from a barrel.

## Accessibility

- `ToolBadge` is an image named by the family label; the glyph is hidden.
- `ToolCallRow` is a group (or, with `onPress`, a native button) named "Read,
  src/orchard/tree-ledger.ts, succeeded, 1.2 s". The dot is hidden, and the outcome is always
  printed in words. The error text is a separate disclosure beside the row and renders as
  literal text.
- `GapIndicator` is a separator named by the idle time.
- `SessionConversation` is a `list` named by `accessibilityLabel`; each turn is an `article`
  named "Turn 12, 02:03 PM, 6 tool calls, 1 error". While `searchQuery` is set, a polite status
  line reads "3 of 24 turns match". Dimmed turns stay in reading order and stay focusable.
- A turn's tool group is a disclosure named by its summary ("Tool calls: 6 calls, 1 error,
  14 s"). Keyboard is Tab and Enter or Space only: no arrow keys and no roving focus.

## Rules the reader keeps

- Gap rows come from `gapBeforeMs`; the reader never recomputes the 10-minute threshold.
- User and opener text is plain text; assistant text goes through `MarkdownProse`. Injected,
  channel and compaction openers carry their own label, never "User".
- Search is a case-insensitive plain substring over user and assistant text, tool names, input
  summaries, file paths and error messages. It is never a `RegExp`, and it never opens a tool
  group: a match inside a closed group un-dims the turn only.
- A message cut by the read model shows "Text cut at 4,000 characters", and "Load full text"
  only when the host passes `onRequestFullText`. Nothing here fetches.
- Not virtualised. A closed tool group mounts no rows and an open one at most `maxToolRows` plus
  a "Show N more calls" row; `SessionConversation.test.tsx` bounds the mount of 500 turns.

## Known gaps

- `CollapseButton` does not expose `aria-expanded` on web (react-native-web drops
  `accessibilityState.expanded`; see `ui/collapse/Collapse.test.tsx`). The error disclosure
  inherits that until `Collapse` is fixed.
- A tint per tool family needs fill and on-fill tokens. That is an
  owner question (C12), so `ToolBadge` is neutral.
- A channel opener renders as a quiet `Channel` label and preview. The contract's `BusMessageRow`
  (TD-498) and the turn's `channel` field do not exist yet.
- Scrolling to `activeTime` and reporting the visible range are TP-855c.
