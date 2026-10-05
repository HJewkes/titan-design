---
section: Fixed
---

The six ESLint baseline updaters share one regen helper (`scripts/lib/regen-eslint-baseline.mjs`) that compares each file's keys, not its total, so swapping a grandfathered violation for a new one of another key is refused instead of absorbed silently (TD-513).
