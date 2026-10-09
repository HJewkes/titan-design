---
section: Added
---

`custom/Session` gains `ConversationTurn` and `SessionConversation`, the agent-session conversation reader: gap rows from the read model, search dimming with a polite match count (`searchTurns` is exported for the host's count), tool groups as disclosures keyed by turn index (`expandedTurns`, `defaultExpandedTurns`, `onExpandedTurnsChange`; `expanded`, `defaultExpanded`, `onExpandedChange` on a single turn), loading and empty states, and a mount bound at 500 turns. `TimelineTurn`, `TimelineMessage` and `TimelineTokens` are exported (TP-855b).
