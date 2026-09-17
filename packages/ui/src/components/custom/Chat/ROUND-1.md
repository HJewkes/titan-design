# VW-393 `custom/Chat`, specimen round 1

Agent-built specimen round. Nothing here is design-locked. The human's Chrome
rounds and the lock come after this PR. Every story carries
`status:candidate` (`tags: ['autodocs', 'status:candidate', '!status:review']`).
Under MATURITY.md, `custom/*` cannot reach `stable` yet.

## What was built

| Component         | Composes                                                           | Storybook                                    |
| ----------------- | ------------------------------------------------------------------ | -------------------------------------------- |
| `MessageList`     | MessageBubble, DateSeparator, TypingIndicator, UnreadBadge, Button | `Custom/Chat/MessageList`                    |
| `MessageBubble`   | Surface, Avatar, MarkdownProse, DateTime, Typography               | `Custom/Chat/MessageList/MessageBubble`      |
| `Composer`        | Surface, Input, Button                                             | `Custom/Chat/Composer`                       |
| `TypingIndicator` | Surface, Indicator (in `Animated.View`), Typography                | `Custom/Chat/MessageList/TypingIndicator`    |
| `DateSeparator`   | Divider, DateTime, Typography                                      | `Custom/Chat/MessageList/DateSeparator`      |
| `UnreadBadge`     | Pill                                                               | `Custom/Chat/MessageList/UnreadBadge`        |
| coach preset      | MessageList + Composer + a story-local check-in Card               | `Custom/Chat/CoachPreset` (Phone, WallPanel) |

No new primitive, no new token, and no token file was touched.

## Protocol fit

`@titan-design/chat-protocol@0.1.0` matches the VW-390 synthesis note. It
exports `ChatMessage` (`UIMessage` parts plus `threadId`, `authorId`,
`delivery[]` and `provenance`), `Participant`, `DeliveryState` with six
statuses, and `DATA_PART_KEY_PATTERN` (`^data-[A-Za-z_][A-Za-z0-9_]*$`, so no
hyphen after `data-`). No protocol fork and no extra props were needed:
delivery state is already on the envelope.

The package's runtime entry imports `zod` (a peer), and react-ui does not
depend on zod. All imports in this family are therefore `import type`, and
`isDataPart` re-implements the prefix check instead of importing
`isDataPartType`. The fixture's part key is `data-checkin`.

## RNW hazards and how they are handled

- **Inverted FlatList is broken on RNW.** `MessageList` is a plain,
  non-inverted `ScrollView`, windowed to the newest `pageSize` messages (default 50) with a "Show earlier" button.
- **Follow and jump.** `useStickToBottom` scrolls to the end on mount and on
  content growth while the reader is within 48 px of the end. After the reader
  scrolls up, it counts appends from other participants and shows the count as
  an `UnreadBadge` jump. A message from the viewer always pulls the list down.
  The count is derived from a scroll anchor set in the scroll handler. A first
  draft used setState inside an effect, and the React-compiler lint rejected it.
- **KeyboardAvoidingView is a no-op on web.** `Composer` renders in
  `MessageList`'s `composer` slot, in normal flow under the scroll area.
- **Animated.View drops className.** The typing dots animate opacity by style
  only, and the dot itself is an `Indicator`.

## What I saw in the browser

Isolated Storybook on port 6101. Provenance check: `index.json` listed the 30
`custom-chat-*` entries, which exist only in this worktree. All checks used
Playwright in dark mode.

- **CoachPreset / Phone** mounts already scrolled to the newest message. It
  shows the "Today" rule, the Coach name and avatar, the "Morning…" bubble, the
  Sunday check-in card and the follow-on bubble without an avatar. The
  athlete's "Works for me." bubble is right-aligned in brand tint, with
  "08:14 AM Sent" under it. The composer sits at the bottom. The only console
  error is the favicon 404.
- **Sending.** I typed into the composer and pressed Enter. The message was
  appended right-aligned with "Sent", the input cleared, the list followed to
  the end, and the staggered dots showed "Coach is typing".
- **MessageList / NewMessagesWhileScrolledUp.** On mount, scrollTop was 196.5
  (scrollHeight 668 minus clientHeight 472). I scrolled to the top and
  simulated two replies. scrollTop stayed at 0 and a "2 new messages" capsule
  appeared at the bottom centre. Clicking it scrolled to 368.5 of 368, removed
  the capsule, and left "Reply 2" as the last message.
- **Fixed during the round.** The first screenshot showed the avatar
  bottom-aligned beside the timestamp. It is now top-aligned with the name.

## Tests

55 vitest cases across 7 files: behaviour plus a jest-axe check per component.
Coverage for `custom/Chat` is 99.6% statements and 98.8% branches.

**Mutation check.** I applied two mutations together. The first flipped
`aggregateDelivery` from worst-of to best-of. The second removed the filter
that stops the viewer's own messages counting as unseen. Five tests failed,
including "reports the least-advanced recipient", "flags an undeliverable
message" and "does not count the viewer's own message as unseen". I reverted
both from git.

jsdom has no layout, so the scroll tests stub `scrollHeight` and
`clientHeight` on the scroll node and spy on `node.scroll`. That is how RNW's
`scrollToEnd` moves the node.

## Known limits

- **Light mode is unverified, and not because of this family.** With the
  Storybook theme global set to light, `Surface` planes stay dark because
  `SurfaceContext` defaults to `mode: 'dark'` and the toolbar never sets it.
  Light text then lands on dark planes. `Custom/Workout/GoalLiftCard` on main
  does the same.
- Prepending an earlier page does not hold the scroll position.
  `maintainVisibleContentPosition` is not available on RNW 0.19.
- Only text and `data-*` parts render. Reasoning, tool, file and source parts
  are skipped. ToolCallCard and ApprovalCard are the harness wave.
- `provenance` is not rendered yet (see question 4).
- The story's sent message uses the real clock, while the fixture is frozen at
  09:00 on 2026-09-17. It only falls under "Today" because this round ran on
  that date.

## Open design questions for the Chrome round

1. **Viewer bubble fill.** It is `brand-primary-subtle` with primary text.
   Should it be a solid brand fill with `on-brand` text instead?
2. **Body text size.** `MarkdownProse` renders bubble text smaller than the
   check-in card's body2 text. Should bubble prose step up a size?
3. **Avatar and name placement.** They sit on the first message of a run.
   Should they move to the last message (the iMessage convention), or should
   the coach avatar be dropped in a two-party thread?
4. **Endorsement.** Should an agent message with
   `provenance.endorsedBy: 'human'` carry a visible mark?
5. **Check-in card.** Should it be promoted to a library component
   (`custom/Chat/CheckinCard` or an accountability family), or stay a
   consumer-supplied renderer?
