---
section: Added
---

`ui/motion` gains the pure value layer: `interpolate` (eased, clamped by default) and `keyframes`, the closed-form `spring`, `stagger`, and `sequence`, which lays `{ durationS }` items end to end with an optional `overlapS` (default 0, so phases never overlap) and returns each item's `startS` and `endS` plus `totalS` (TD-839).
