# `custom/Chat` — chat threads over `@titan-design/chat-protocol`

Status: `status:candidate` (round 3, VW-393). The round 2 picks are the defaults; see
"Decisions" below. Light mode and the live drag gesture are still unverified.

The family renders `ChatMessage` documents from `@titan-design/chat-protocol`: a
Vercel AI SDK `UIMessage` (`parts[]`) plus the envelope (thread, participant,
per-recipient delivery, provenance). It never redefines a message shape. Imports
from the protocol are **type-only**, so its zod peer stays out of the runtime
bundle; `isDataPart` mirrors the protocol's `isDataPartType` for that reason.

This README is the **index**: **composes ↓** and **used-by ↑**.

## Dependency map

| Member                 | Kind     | Composes ↓                                                                                           | Used-by ↑                 |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------------- | ------------------------- |
| `MessageList`          | organism | `MessageBubble`, `DateSeparator`, `TypingIndicator`, `UnreadBadge`, `ConversationIdentity`, `Button` | coach preset story        |
| `MessageBubble`        | molecule | `Surface`, `Avatar`, `MarkdownProse`, `Typography`                                                   | `MessageList`             |
| `ConversationIdentity` | molecule | `Avatar`, `Typography`                                                                               | `MessageList`             |
| `ChatCard`             | molecule | `Card`, `Button`, `Typography`                                                                       | caller `data-*` renderers |
| `Composer`             | molecule | `Surface`, `Input`, `Button`                                                                         | coach preset story        |
| `TypingIndicator`      | atom     | `Surface`, `Indicator`, `Typography`                                                                 | `MessageList`             |
| `DateSeparator`        | atom     | `Divider`, `DateTime`, `Typography`                                                                  | `MessageList`             |
| `UnreadBadge`          | atom     | `Pill`                                                                                               | `MessageList`             |
| `chatThread.ts`        | pure fns | —                                                                                                    | all of the above          |
| `useStickToBottom`     | hook     | —                                                                                                    | `MessageList`             |

No new primitive and no new token.

## How the pieces fit

- **Non-inverted list.** Inverted lists are broken on react-native-web, so
  `MessageList` is a plain `ScrollView`, oldest first. `useStickToBottom` scrolls
  to the end on mount and on each append while the reader is within 48 px of the
  end. Once the reader scrolls away, appends from others are counted and shown as
  an `UnreadBadge` jump. A message the viewer sends always pulls the list down.
- **Windowing.** Only the newest `pageSize` messages (default 50) mount. "Show
  earlier" reveals another page.
- **Keyboard.** `KeyboardAvoidingView` is a no-op on web. `Composer` goes in the
  `composer` slot, which sits in normal flow under the scroll area, so the
  browser keeps it above the on-screen keyboard.
- **`data-*` parts.** `MessageBubble` hands each one to the caller's
  `renderDataPart(part, message)`. A part with no renderer is dropped, never
  dumped as JSON. `titan/no-raw-device-data-in-chat` guards this directory.
- **Delivery.** Shown under the viewer's newest message only, as the least-advanced
  recipient state; an undeliverable message always shows it. Absent `delivery`
  means untracked and shows nothing.
- **Grouping.** Consecutive messages from one author less than 5 minutes apart
  form one run. A group thread names the author and shows a small avatar on the
  first message of a run; a direct thread shows neither and heads the list with
  `ConversationIdentity`. A new calendar day always starts a run.
- **Times.** There is no per-bubble time. A time row opens each day and follows
  any pause of over an hour (`TIME_BREAK_MS`). Dragging the list left slides it to
  show each message's own time, which stays in the tree for screen readers;
  `revealTimes` holds it open.

## Reuse audit

| Leaf                       | Primitive it composes                  |
| -------------------------- | -------------------------------------- |
| message body               | `MarkdownProse`                        |
| timestamp, older day label | `DateTime`                             |
| bubble (other party)       | `Surface raise={1}`                    |
| bubble (viewer)            | plain `View`, `bg-brand-primary-muted` |
| author avatar              | `Avatar colorFromName`                 |
| typing dots                | `Indicator` in `Animated.View`         |
| day rule                   | `Divider`                              |
| unread count / jump        | `Pill` (solid, brand)                  |
| input and send             | `Input multiline`, `Button`            |

## Watch-list

- The viewer bubble is a `View`, not a `Surface`: a brand-tinted plane has no
  ramp step. Revisit if `Surface` grows a tone.
- The check-in card in the coach preset is story-local. It becomes a library
  component only once a second consumer needs it.
- Surfaces do not follow the Storybook light toggle (library-wide; `SurfaceContext`
  defaults to dark). The family is only verified in dark mode.

## Decisions (owner, rounds 1 to 2)

| Question         | Decision                                                      |
| ---------------- | ------------------------------------------------------------- |
| Own bubble fill  | Stronger brand tint (`brand-primary-muted`) with primary text |
| Bubble text      | One step up: `MarkdownProse size="md"`                        |
| Direct thread    | Identity once at the top; no per-message avatar or name       |
| Group thread     | Name and small avatar on the first message of a run           |
| Timestamps       | Time rows at pauses, drag-left reveal, as in Messages         |
| Endorsed message | Accent edge on the bubble; no dedicated mark                  |
| Structured card  | Generic `ChatCard`; the check-in lockup stays app-specific    |
| Composer         | Send button inside the field once text is typed               |
| Wall size        | A phone-shaped drawer capped at 480 px                        |

Unchosen variants (solid own fill, last-of-run avatar, outline and fill endorsement,
wide wall layout) were removed, not kept as props. See `ROUND-2-RESEARCH.md`.
