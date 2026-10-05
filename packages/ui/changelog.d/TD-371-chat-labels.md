---
section: Added
---

`MessageList`, `MessageBubble`, `DateSeparator`, `TypingIndicator` and `UnreadBadge` take an optional
`labels` prop that replaces their built-in strings, so a consumer can localise or reword them. Text that
depends on names or counts is a function (`typing`, `newMessages`). Defaults are unchanged (TD-371).
