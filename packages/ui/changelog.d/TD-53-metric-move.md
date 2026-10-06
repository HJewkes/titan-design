---
section: Added
---

`Metric` moves to `ui/metric` and takes `align` (`start`, `center` or `end`, default `center`) and `tone` (the value colour from a semantic token). Existing callers render unchanged. The `custom/Metric` path is a `@deprecated` shim, removed in 0.23.0 (migration M6 in `DEPRECATIONS.md`) (TD-53).
