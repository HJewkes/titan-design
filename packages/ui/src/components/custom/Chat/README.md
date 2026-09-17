# `custom/Chat` — chat threads over `@titan-design/chat-protocol`

Status: `status:candidate` (round 1, VW-393). Not yet design-locked.

The family renders `ChatMessage` documents from `@titan-design/chat-protocol`: a
Vercel AI SDK `UIMessage` (`parts[]`) plus the envelope (thread, participant,
per-recipient delivery, provenance). It never redefines a message shape. Imports
from the protocol are **type-only**, so its zod peer stays out of the runtime
bundle; `isDataPart` mirrors the protocol's `isDataPartType` for that reason.

This README is the **index**: **composes ↓** and **used-by ↑**.

## Dependency map

| Member             | Kind     | Composes ↓                                                                   | Used-by ↑          |
| ------------------ | -------- | ---------------------------------------------------------------------------- | ------------------ |
| `MessageList`      | organism | `MessageBubble`, `DateSeparator`, `TypingIndicator`, `UnreadBadge`, `Button` | coach preset story |
| `MessageBubble`    | molecule | `Surface`, `Avatar`, `MarkdownProse`, `DateTime`, `Typography`               | `MessageList`      |
| `Composer`         | molecule | `Surface`, `Input`, `Button`                                                 | coach preset story |
| `TypingIndicator`  | atom     | `Surface`, `Indicator`, `Typography`                                         | `MessageList`      |
| `DateSeparator`    | atom     | `Divider`, `DateTime`, `Typography`                                          | `MessageList`      |
| `UnreadBadge`      | atom     | `Pill`                                                                       | `MessageList`      |
| `chatThread.ts`    | pure fns | —                                                                            | all of the above   |
| `useStickToBottom` | hook     | —                                                                            | `MessageList`      |

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
- **Delivery.** Shown on the viewer's own messages only, as the least-advanced
  recipient state. Absent `delivery` means untracked and shows nothing.
- **Grouping.** Consecutive messages from one author less than 5 minutes apart
  share one avatar and name. A new calendar day always starts a group.

## Reuse audit

| Leaf                       | Primitive it composes                   |
| -------------------------- | --------------------------------------- |
| message body               | `MarkdownProse`                         |
| timestamp, older day label | `DateTime`                              |
| bubble (other party)       | `Surface raise={1}`                     |
| bubble (viewer)            | plain `View`, `bg-brand-primary-subtle` |
| author avatar              | `Avatar colorFromName`                  |
| typing dots                | `Indicator` in `Animated.View`          |
| day rule                   | `Divider`                               |
| unread count / jump        | `Pill` (solid, brand)                   |
| input and send             | `Input multiline`, `Button`             |

## Watch-list

- The viewer bubble is a `View`, not a `Surface`: a brand-tinted plane has no
  ramp step. Revisit if `Surface` grows a tone.
- The check-in card in the coach preset is story-local. It becomes a library
  component only once a second consumer needs it.
- Surfaces do not follow the Storybook light toggle (library-wide; `SurfaceContext`
  defaults to dark). The family is only verified in dark mode.
