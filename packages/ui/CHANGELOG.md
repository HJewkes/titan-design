# Changelog

All notable changes to `@titan-design/react-ui` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## 0.15.0

> **Native consumers:** spacing values now emit in `px` instead of `rem` (#220, AW-142
> wave one). On web nothing moves. On native, NativeWind resolves `rem` at a 14px base,
> so every Tailwind spacing step (`m-4`, `p-2`, …) was already rendering at 14/16 of its
> web size — this bump corrects that divergence, and every native spacing value grows to
> match web on your next titan bump. Review spacing on-device when you take this release.

### Breaking Changes

See `DEPRECATIONS.md` for migration detail on each entry below.

- **`getHeatmapColor` signature, twice in one release.** #219 (VW-371) made the palette
  mode a required third parameter (`getHeatmapColor(status, intensity, mode)`); #216
  (VW-333) then dropped `intensity` entirely (`getHeatmapColor(status, mode)`). Only the
  final two-argument form ships in 0.15.0. See `DEPRECATIONS.md` §"BodyMap heatmap —
  `getHeatmapColor` takes a mode (VW-371)" and §"VW-333 — one `VolumeStatus`".
- **`WORKOUT_TOKENS.heatmap` removed** (#219, VW-371), replaced by `heatmapColors(mode)`
  in `theme/workout-tokens.ts`. Never on the package barrel, so internal-only impact.
- **`TONE_COLOR` replaced by `TONE_TOKEN`** (#213, VW-316). `TONE_COLOR` resolved colours
  at import time, which the new `titan/no-frozen-theme` lint rule bans; no alias was
  possible. See `DEPRECATIONS.md` §"Fatigue tokens — `TONE_COLOR` replaced by
  `TONE_TOKEN` (VW-316)".
- **`paceToneColor(tone)` → `paceToneColor(tone, mode)`** (#214, VW-316), mode required
  rather than defaulted so no caller silently stays frozen. See `DEPRECATIONS.md`
  §"Workout pace tone — `paceToneColor` takes a mode (VW-316)".
- **`liveAuraColor(category)` → `liveAuraColor(category, mode)`** (#218, VW-316), same
  shape and reasoning as `paceToneColor`. See `DEPRECATIONS.md` §"Live aura flood —
  `liveAuraColor` takes a mode (VW-316)".
- **One `VolumeStatus`, replacing two overlapping unions** (#216, VW-333). The former
  figure taxonomy (`under | maintenance | productive | over`) is renamed
  `VolumeLandmarkZone`; the chip's five-value union becomes the shared six-value
  `VolumeStatus` (a pure widening, adding `approaching`). No public prop is renamed —
  `MuscleGroupChip.volumeStatus` still accepts every value it did before — but its
  rendered colour moves from the `status-*` family onto `dataviz-diverging-0..4`. See
  `DEPRECATIONS.md` §"VW-333 — one `VolumeStatus`, shared by the figure and the chip".

### Added

- `GoalTrajectoryChart` organism: the goal-progress chart with expected band, committed
  and stretch rules, actual line with PR markers, meso boundary rules and deload shading
  (#223, VW-353).
- `size?: 'phone' | 'wall'` on `BodyMap` and `TrainingStatusPage`, scaling the figure to
  480×960px with a matching 2x type ramp for wall display; phone geometry is unchanged
  (#217, VW-334).
- Stats-derived `expectedRange` text trailer on `SetStripSet`'s `active`/`todo` variants,
  distinct from the plan's prescribed rep range (#206, VW-311).
- `statusBadge` gains an `info` variant and an optional `basis` line on `MesoStatusCard`
  (#215, VW-354).
- Eighteen new `dataviz-*` semantic tokens — `dataviz-diverging-0..4`,
  `dataviz-sequential-0..5`, `dataviz-categorical-0..6` — promoting the diverging,
  sequential and categorical chart palettes to theme-aware roles. Phase 1 is plumbing
  only: light and dark carry identical values, so nothing changes on screen yet (#219,
  VW-371 phase 1).
- Spacing and sizing token foundation — `inset`, `squish`, `stack`, `inline`, `control`,
  `section`, `gutter` situations plus the Tailwind wiring, `Foundations/Spacing` story
  and lint rule. No component pixel moves on web (#220, AW-142 wave one).
- New semantic spacing classes: `p-inset-*`, `gap-stack-*`, `gap-inline-*`,
  `px-squish-x-*` (paired with `py-squish-y-*`), `px-control-x-*` (paired with
  `py-control-y-*`), `py-section-*`, `px-gutter-*` (#220, AW-142 wave one).
- `titan/no-raw-spacing` eslint rule, flagging inline `paddingVertical`/`margin`-style
  numeric literals outside an `// optical: <why>` escape hatch (#220, AW-142 wave one).

### Changed

- `Pill`, `Badge` and `Chip` unified onto the `squish` spacing ramp; several size rungs
  move (Pill `md`/`lg`, all three `Badge` rungs) to land on the ramp (#222, AW-142 wave
  two part A). Exact deltas (px, `padding-x / padding-y`):
  - Pill `md`: 10/4 → 12/4. Pill `lg`: 12/6 → 16/6.
  - Badge `sm`: 6/2 → 8/2. Badge `md`: 8/2 → 12/4. Badge `lg`: 10/4 → 16/6.
  - Chip is unchanged at every rung — it already sat on the ramp.
- `Card`, `ListItem`, `Popover`, `Menu`, `Tooltip`, `HelpTip`, `Modal`, `Drawer`, `Alert`,
  `Toast`, `Section`, `Input`/`FormField`, `Progress` and `Tile` onto the `inset-*` /
  `gap-stack-*` tokens; `Drawer`'s header/footer/body band grows from 16/12 to 24/16 to
  match `Modal` (#225, AW-142 wave two part B).
- Solid-fill components (`Pill`, `Button`) now resolve their label colour against a
  dedicated `*-solid` token per tone instead of a single shared white/dark label, fixing
  WCAG AA contrast failures that alternated between the two components depending on tone
  (#204). `Button`'s solid label moves from white to the dark `on-*` token on **every**
  tone — primary buttons flip from white to near-black text. `brand-secondary` and
  `status-error` solid fills lift one ramp rung (dark mode: `cyan[600]`→`cyan[500]`,
  `red[600]`→`red[500]`) so the shared dark label clears AA on all six tones.
- `TimerReadout`, `Treemap`, `Indicator` and `Spinner` colours now resolve at render time
  from the current surface mode instead of a frozen `getSemanticColors('dark')` module
  read (#221, VW-316 part 5).
- Ten Workout components' colours resolved at render time instead of frozen at import
  time (#218, VW-316 part 4).
- `BodyMap` and `TrainingStatusPage` heatmap fills now resolve from the `dataviz-*`
  semantic roles at render time instead of a frozen primitive map (#219, VW-371 phase 1).
- Six Workout components' colours resolved at render time (#214, VW-316 part 3).
- All seven frozen-theme call sites in the Fatigue family resolved at render time (#213,
  VW-316 part 2).
- Seven of the approved VW-82 tokens shipped, plus six grey-snap corrections (#203).
- `LiveFatigueCard`'s section gap is now capped and content-driven instead of an
  unbounded flex spacer; the row dimension converges on one token (#205, VW-276).

### Deprecated

- `Pill`'s `size="xl"` is deprecated and renders as `lg` — the `squish` ramp tops out at
  `lg` because nothing in the library or its consumers ships a capsule above 16/6 (#222,
  AW-142 wave two part A).

### Fixed

- `WorkoutPill`'s active-status pulse now holds still under `prefers-reduced-motion`,
  removing a source of flaky Layer-1 screenshot-baseline diffs and doubling as an
  accessibility improvement (#211, VW-312).

### Internal

- Added `titan/no-frozen-theme`, ratcheted across every component family, banning the
  module-scope `getSemanticColors('dark')` pattern that produces the breaking changes
  above (#210, VW-316 part 1).
- Added `titan/no-upward-tier-import`, enforcing the `theme -> icons -> ui -> custom ->
shell -> pages` dependency direction (#207, VW-315).
- Added `titan/no-deprecated-import`, ratcheted, flagging new imports of an
  `@deprecated`-tagged export (#209, VW-318).
- Added `titan/no-local-formatter`, ratcheted, and deduplicated six local numeric
  formatters onto the shared formatter module (#212, VW-317).
- Ignored three untracked root files from a different agent harness that duplicated
  already-committed `CLAUDE.md`/`.claude/skills/` content (#208).
