# Addenda to the 2026-09-08 library critique

Two read-only follow-on audits (research briefs D1 and D2), condensed from the
agents' reports. Reviewed on `main` at 4267d69.

## D1 · External consumers of `@titan-design/react-ui`

Seven downstream checkouts, all consuming by package name (zero relative
imports into `packages/ui`):

| Checkout | Pin | Shape |
|---|---|---|
| audiobook/frontend | `file:../../titan-design/packages/ui` | source link, tracks HEAD |
| agent-chat | ^0.12.1 | tokens only (`/theme/tokens`); keeps local Pill/Badge/Section/Card |
| voltras-mcp | ^0.12.0 | heaviest component consumer |
| voltras-mcp-wave0 | ^0.9.3 | stale fork of voltras-mcp |
| voltras/mobile | ^0.6.0 | `getSemanticColors`/`alpha` + Card/Metric/Section |
| codewatch, codewatch-wt-c76 | ^0.2.7 | very old pin, worktree dupe |

Externally used: Pill, Badge, Chip, StatusPill (+ `StatusPillStatus` type),
PrBadge, MuscleGroupChip, Metric (heavy), MetricTiles (one site, plus the
`MetricTileData` type), Section, SectionHeader.

Externally dead: BaseBadge, WorkoutPill, SessionStatePill, WeightBadge,
SeverityLabel, CoChangeChip, HelpTip, LabelWithHelp, MetricCell, Tile,
Indicator, StatusDot.

Caveat: five of seven pin old versions, so "no consumer" for a recent export
can mean "nobody upgraded". Only audiobook, voltras-mcp and agent-chat see
current exports.

## D2 · Workout per-file drift ranking

Drift = `getSemanticColors` + `fontSize:` + raw hex + `rgba(` + raw `<Text` +
`greyRamp[` + `ramp.` + `boxShadow` + `backgroundColor:` per file, across 54
non-test, non-story files.

Highest: MesoStatusCard 40, setHeadingKit 34 (utility, not exported),
StatusDot 31, TempoDisplay 29, BodyMapDetailPanel 28, StrengthTrendChart 26.
Clean (0): ExerciseCardHeading, FatigueMeter, icons, metricText, MetricTiles,
SetStrip.

Render-path theme bug: only `WeightBadge.tsx` calls `getSemanticColors('dark')`
inside the component body (lines 46, 105-106). The other 37 files hoist it to
module scope: the same dark-only limitation, less acute.

Pattern to copy: `BodyMap.tsx` (three correct `resolveColor()` calls; one
leftover module-scope constant, `BRAND_PRIMARY`).

Zero of 168 Workout files use `Typography`. Port batches B1-B5 are in
`docs/library-roadmap.md` E3.
