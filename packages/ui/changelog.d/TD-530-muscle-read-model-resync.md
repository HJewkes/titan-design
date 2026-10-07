---
section: Changed
---

Breaking for code that builds these shapes: `muscleReadModels` is re-synced with voltras-mcp and its mirrored types gain required fields. `MuscleStrengthExerciseRow` (and so `StrengthExerciseRow`) adds `setCount`, `currentLevel`, `relativeIndex`, `daysSinceTrained` and `recency`; `MuscleStrengthSection` adds `relativeIndexBySide` and `daysSinceTrained`; `MusclePlanSection` adds `frequency` (`plannedPerWeek`, `observedThisWeek`). A pinned sha and field-list type test now fail CI when the mirror drifts (TD-530).
