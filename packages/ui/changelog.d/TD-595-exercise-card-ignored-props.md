---
section: Removed
---

`ExerciseCard` no longer takes `onNavigateDetail` or `supersetColor`; no card variant read either, so passing them did nothing. The audit's `git grep -E "onNavigateDetail|supersetColor"` found 0 hits in all 5 consumers. Superset colour belongs to `SupersetWrapper`'s `color` (TD-595).
