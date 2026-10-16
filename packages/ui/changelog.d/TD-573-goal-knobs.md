---
section: Removed
---

`GoalTrajectoryChart` no longer takes `leftShadowSpread`, `baseline`, `bandFade` or `bandCurve`. These were design-exploration settings that have now been decided. The chart always draws the chosen treatment: a 4% left shadow, the `lip` baseline, the `centre-14` band fade and `monotone` band edges. The rendered output is unchanged. This is a breaking change to the props type, so it needs a minor bump. Before removing the props, the consumers were searched with `grep -rn "leftShadowSpread\|bandFade\|bandCurve\|baseline=" ~/projects/voltras-mcp/src ~/projects/titan-platform --include=*.tsx --include=*.ts`. voltras-mcp returned two comment hits and titan-platform returned only installed copies of this package, so nothing uses the props (TD-573).
