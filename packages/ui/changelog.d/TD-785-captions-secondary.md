---
section: Changed
---

Captions and helper text that carry content now paint `text-secondary` instead of `text-tertiary`: the `SectionHeader` subtitle, the valid `FormField` and `Autocomplete` helper text, the `Autocomplete` empty text and option descriptions, unreached `Progress` step labels, the Chat captions (`ChatCard`, `ConversationIdentity`, `DateSeparator`, `MessageBubble` writing and delivery, `RevealRow`, `TypingIndicator`) and the `InitiativeHeader` ship and updated captions. `text-tertiary` stays on redundant text: units, separators, placeholders and glyphs. A new test, `src/test/tertiary-role.test.ts`, fails on a new tertiary caption, `body2`, `overline`, `microLabel` or `monoLabel`, or a tertiary `text-xs` / `text-sm` class string, unless `tertiary-role-allowlist.json` names it (TD-785).
