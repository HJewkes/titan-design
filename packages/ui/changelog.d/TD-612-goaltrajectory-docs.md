---
section: Internal
---

`GoalTrajectoryChart` docs and dead props: the charts README now describes its empty state, hidden `<svg>` and week-tip interaction as the code has them. Drops a dead `aria-label` on the current-week mark (inside an `aria-hidden` svg) and the unused `PlotStyle.referenceLabelSide`; `weekSpan` is now on the geometry. Nothing renders differently (TD-612).
