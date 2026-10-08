---
section: Internal
---

`pnpm verify:changed` runs the checks CI fails on for the files changed against `origin/main`: prettier, eslint, type-check with the examples, catalog freshness, the decomposition ratchet, `arch:check` and the related tests, one process at a time (TD-646).
