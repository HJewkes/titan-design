# VW-393 round 2: chat research

A short pass over the apps and libraries the owner named. Web search only, one query
per topic, so each finding is what a search result states, not a hands-on audit of the
app. Concepts are cribbed; no code is copied from any of these.

## Sources and licences

| Source                                                                                                                                                                                                                                                                                       | Licence / use                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [Apple Support: Messages timestamps](https://appleinsider.com/articles/14/05/26/ios_quick_tips_how_to_show_timestamps_and_start_a_phone_call_in_messages.html), [Gadget Hacks](https://ios.gadgethacks.com/how-to/theres-hidden-gesture-show-when-any-message-was-sent-your-iphone-0206181/) | Product behaviour only, no code                       |
| [Apple Support: iMessage overview](https://support.apple.com/guide/iphone/about-imessage-iph4e9799206/ios)                                                                                                                                                                                   | Product behaviour only                                |
| [Stream Chat React: MessageList](https://getstream.io/chat/docs/sdk/react/components/core-components/message_list/)                                                                                                                                                                          | Docs read for the concept; SDK is not a dependency    |
| [react-native-gifted-chat](https://github.com/FaridSafi/react-native-gifted-chat)                                                                                                                                                                                                            | MIT; concepts only                                    |
| [Telegram desktop issue #2827](https://github.com/telegramdesktop/tdesktop/issues/2827)                                                                                                                                                                                                      | Behaviour description only (GPL client, no code read) |
| [Telegram Bot API inline keyboards](https://grammy.dev/plugins/keyboard)                                                                                                                                                                                                                     | Docs                                                  |
| [Slack Block Kit](https://dev.to/sapotacorp/block-kit-basics-building-slack-message-ui-23gn)                                                                                                                                                                                                 | Docs summary                                          |
| [Discord Message Resource](https://docs.discord.com/developers/resources/message)                                                                                                                                                                                                            | Docs                                                  |
| [WhatsApp Cloud API interactive messages](https://doc.woztell.com/docs/integrations/whatsapp/wa-message-types/)                                                                                                                                                                              | Third-party docs summary                              |

WeChat was not searched. Nothing below is attributed to it.

## Findings, and what round 2 does with each

### 1. Timestamps: iMessage shows them at breaks and on drag

Search results agree that Messages shows a time only for the first message after a gap,
and that holding and swiping left slides the thread over and reveals every message's
time at the right edge. There is no setting to pin them on.

Crib: a centred time row at a break (`TIME_BREAK_MS`, one hour), no per-bubble time, and a
drag-left reveal. The per-line times stay in the DOM, offscreen to the right, so a screen
reader still reaches them. The delivery line (Sent, Read) stays under the newest own
message only.

### 2. Avatars: last of a run, group chats only

Stream Chat labels each message `top | middle | bottom | single` within its author run so
a theme can decide which ones carry the avatar. Telegram's group clients put the avatar
on the last message of a run (issue #2827 calls it "often confusing" in busy groups, so the
author name stays on the first). iMessage group threads do the same. gifted-chat shows
avatars for other users only and has a separate flag for the viewer's own.

Crib: `ThreadRow` carries `endsGroup` next to `startsGroup`. In a group thread, the name
sits above the first bubble and a small avatar sits beside the last. In a direct thread
there is no per-message avatar or name; identity sits once at the top of the thread, as the
owner asked.

### 3. Day and time separators

gifted-chat exposes one `renderDay` slot for both the inline day row and a floating header.
Stream Chat injects a `DateSeparator` from the list and lets a caller turn it off.

Crib: one separator component, two triggers (new day, or a gap over the break). A day
break reads `Today 08:00`; a same-day break reads `08:00`.

### 4. Structured cards

Slack Block Kit builds a message from a few block types: section, header, context (small
secondary line), actions (a row of buttons, 3 to 4 in practice). Discord embeds carry
title, description, fields and footer, with buttons in a separate components row. WhatsApp
interactive replies are header, body, optional footer and up to three buttons. Telegram
inline keyboards put buttons under the message without sending a message.

Every one of them fixes a small anatomy and lets the app fill it. Crib: `ChatCard` has a
fixed anatomy (status slot, title, subtitle, body, footnote, up to three actions). The
check-in is one instance, and its lockup (scheduled pill, agenda bullets, Confirm and
Reschedule) stays story-local, because it is specific to the coach app.

### 5. Composer: send appears with text

Apple's Messages shows the send button only once there is text to send, inside the field.
The HIG page found by search covers iMessage app extensions and did not state the rule, so
this one rests on the observed product behaviour, not a cited guideline.

Crib: the field is wider, and a round send button appears inside it at the trailing edge
once the draft has text. Sending state keeps it visible.

### 6. Provenance: no dedicated mark

None of the apps above marks a message as "endorsed by a person". The nearest analogue is
a bubble treatment: iMessage colours a bubble by service (blue for iMessage, green for
SMS, per the Apple Support page above). Other apps tinting the viewer's bubble is general
knowledge, not from these searches. Crib: three bubble treatments for `provenance.endorsedBy: 'human'`
(outline, fill, emphasis), plus the plain bubble as the control. The owner picks.

### 7. Wall layout

No source covers a wall display. Slack and Discord desktop both cap message column width
and centre it on wide windows, and keep a side panel at a fixed width. Round 2 renders both
a fixed max-width drawer and a centred wide column.

## Not adopted

- Reactions, replies, threads and read receipts per recipient: out of scope for unit 1.
- Message-effect animations: no product reason.
- A third-party chat UI as a dependency: each assumes its own message model, and
  `@titan-design/chat-protocol` is ours.
