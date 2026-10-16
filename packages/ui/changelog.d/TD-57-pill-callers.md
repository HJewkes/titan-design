---
section: Changed
---

`PrBadge` renders a brand subtle `Pill` instead of `BaseBadge`; its props are unchanged. `WeekRow`'s workout chips, `WorkoutTopBar`'s session state, `TaskRow`'s severity cell and `FileHistoryExplorer`'s co-change pairs render `Pill` instead of `WorkoutPill`, `SessionStatePill`, `SeverityLabel` and `CoChangeChip`, so each takes a Pill capsule (fill, padding, radius). `WeekRowWorkout.status` is spelled out rather than borrowed from `WorkoutPillStatus`, with the same six values (TD-57).
