# Library roadmap — decided 2026-09-08

The operator reviewed a deep critique of `packages/ui` (attached as
`docs/audits/2026-09-08-library-critique.md`) and answered its sixteen
competing-system questions. This file is the record. When a change touches
one of these areas, it follows the decision here or reopens it explicitly.

## Standing policies

**Colour.** Every colour used anywhere comes from a colour ramp (`greyRamp`,
the OKLCH ramps in `theme/tokens/primitives.ts`). Semantic tokens and palettes
reference ramp steps; components use only semantic tokens. No file declares
its own colour. The eslint token-purity error block extends to every family;
the raw-colour baseline (`titan/no-raw-color`) shrinks per PR and is deleted at
zero. Workout and Fatigue are not dark-only by design: they become theme-correct.

**Consumers.** We own every downstream consumer of `@titan-design/react-ui`
(audiobook, source-linked; voltras-mcp; agent-chat, tokens only; voltras
mobile; codewatch; two stale forks). Breaking changes are allowed. A component
being retired is marked `@deprecated` in code first so no new usage appears,
and each consumer gets a follow-up task to migrate.

**Depth.** See Foundations/Depth. Tone plus lift (rim 0.12, ambient shadow
scaled by planes crossed) on every raised plane; floating surfaces carry the
rim and no hairline ring; lift sparingly, inset inside cards; light mode is
deferred to its own pass.

## Decisions (critique §B)

| # | Question | Decision |
|---|---|---|
| 1 | Container | `Card` is the only content container. `Surface` is for shell roots (shell, page, rail). `Tile` becomes a Card stat preset. `Section`/`SectionHeader` become Card presets (voltras mobile uses them), not deleted. |
| 2 | numeric vs named elevation | Both public: `level` is absolute for shell roots, `raise`/`elevation` are relative. Landed in #166. |
| 3 | Pills | One `Pill` primitive (tone / size / leading slot). `Badge`, `Chip`, `StatusPill`, `PrBadge`, `MuscleGroupChip` survive as thin presets (external users). `BaseBadge`, `WorkoutPill`, `SessionStatePill`, `WeightBadge`, `SeverityLabel`, `CoChangeChip` fold in or are deleted. |
| 4 | Divider | Every rule is a `Divider`. `border-hairline*` is legal only on Card `outline`/`subtle`, Table rules, and input borders. |
| 5 | HelpTip | Delete `HelpTip` and `LabelWithHelp`; a Tooltip story shows the pattern. |
| 6 | Theme source | `SurfaceContext`/`ThemeProvider` only. `utils/useTheme.ts` is deleted (Card no longer uses it after #166). |
| 7 | Workout/Fatigue dark-only? | No. Full theme-correct port (E3), in the batches below. |
| 8 | Colour math | One `theme/color-math.ts` with CIELAB L* as the sanctioned metric; duplicate `hexToRgb` ×4, `mixHex` ×4, luminance ×3, test `lstar` ×3 deleted. |
| 9 | Typography | `Typography` and `Eyebrow` move into `ui/`; re-export shims stay in `custom/`. |
| 10 | Dot | `Indicator` survives. `StatusDot`'s consumers migrate; its inline glows route through `getGlowShadow`. Fatigue README corrected. |
| 11 | Metric | One `Metric` with size / align / trend. `MetricTiles` becomes a preset (one external site); `MetricCell` deleted (no consumers). |
| 12 | paperSheet | Stays hero-only. Cards use the lift (rim 0.12); grain is not on ordinary cards. |
| 13 | Formatters | `utils/format/{number,time,workout}`. No component-local `formatX` or inline `toFixed`; lint enforces after migration. |
| 14 | Storybook tree | Six groups: `Foundations/` · `Components/Atoms|Molecules|Organisms/` (ui/* only) · `Custom/<Family>/` · `Shell/` · `Pages/` · `Lab/<Family>/` (src/lab only). |
| 15 | Lint | One mechanism: the per-family token-purity error block, extended everywhere; baseline retired at zero. |
| 16 | Light mode | Deferred. Task filed. Not a target for any family until the dark port is done. |

## Epics, in order

**E1 · Depth follow-ups** (after #166; starts now)
- 13 `ui/*` overlays (autocomplete, drawer, help-tip, indicator, menu, modal, popover, select, switch, tabs, toast, toolbar-button, tooltip) move from Tailwind `shadow-*` + hairline ring to the floating lift recipe. Done when `grep -rE "shadow-(sm|md|lg|xl|2xl)" src/components/ui` is empty.
- Delete `utils/useTheme.ts`.
- Replace literal-hex pins in `Surface.test.tsx`, `surface.contract.test.ts`, `Card.test.tsx`, `elevation.test.ts` with `greyRamp[...]` references.
- Purge stale comments: `SessionRail.stories.tsx:40`, `utils/colors.ts:4`, `SessionRail.tsx:16-17`, the skill's `gotchas.md` "Neumorphic depth" section.
- Delete the `lab/north-star/surfaces.ts` fork and `DualGhostLine`'s local copies; point lab at `theme/materials`.
- Glow shadows (StatusDot ×7, Indicator, MesoCard, BodyMap, ZoneTrack, IntensityBar, PrHistoryModal) route through `getGlowShadow`.

**E4 · Storybook reorganisation** (can run beside E1 on non-overlapping files)
- Retitle onto the six-group tree; fix `Composes` links.
- Move the 8 `Lab/`-titled files out of `src/components` (they publish to npm today).
- Delete duplicate `Lab/ActiveWork/*` (6), `Lab/Components/*` (3), `Lab/Archive/Surface`, each with a REJECTED.md entry.
- ASCII titles; one naming convention per family.
- `autodocs` + a `Composes` line on every hardened story; decorators compose `<Surface level="base">`.
- Thin per-state stories to Default + controls (Input 15, Card 14, Alert 14, Toast 13).

**E5 · Governance refresh** (after E4 so tags land on final titles)
- Regenerate `arch-graph.json`; CI fails when it is older than the newest `index.ts`.
- REJECTED.md backfill for the ten archived directions plus retired `inset`, `tonalFill`/`ditherTile`, `data-1..10`.
- `status:` tags; MATURITY review for `ui/*` (38 primitives, not 52).
- READMEs for `ui/*`, charts, Prose; fix Fatigue README's StatusDot line.
- Update the workflow skill's `gotchas.md` and `06-lint-guardrails.md`.

**E2 · Consolidation** (decisions 1, 3, 4, 5, 10, 11)
- Card as sole container; Tile and Section as presets; loose `bg-surface-*` Views (58 sites) onto Card.
- Pill primitive + presets; `Chip` loses `neutral-*`/`text-white`.
- Divider everywhere (21 rules). Indicator over StatusDot. Metric absorbs MetricTiles; MetricCell deleted. HelpTip deleted.
- Each retired export: `@deprecated` first, then a consumer-update task per downstream repo.

**E3 · Port Workout and Fatigue** (decisions 7, 8, 9, 13, 15)
- Typography + Eyebrow into `ui/`; `theme/color-math.ts`; `utils/format/*`.
- Workout batches from the 2026-09-08 audit, smallest drift and most consumers first:
  - B1 (S): MetricCell, SetStrip, SetTableHeader, SetsRepsLoad, ExerciseHeading, ExerciseIndicator, ExerciseCardHeading, PrBadge.
  - B2 (M): SegmentedBar, MuscleGroupChip, PlaceholderStrip, ScheduleTiles, StatusPill, SupersetWrapper, MesoProgressBar, Sparkline, VolumeLandmarkBar, SessionHeader, WeekRow, WorkoutCard.
  - B3 (M): StatusDot (6 cross-family consumers), WeightBadge (the one render-path `getSemanticColors('dark')` bug, lines 46 and 105), ExerciseCard, SetRow, SetBar, WorkoutPill.
  - B4 (M/L): InputBar, PrHistoryModal, RestTimer, SessionRail, BodyMap (the pattern to copy: three correct `resolveColor` calls; one leftover module constant), MesoCard.
  - B5 (L): MesoStatusCard (drift 40, highest), TempoDisplay, BodyMapDetailPanel, StrengthTrendChart, ZoneTrack, CapacityBandChart, IntensityBar, ReadinessCheck, the five page organisms, VelocityStrip (1,468 lines).
- Fatigue: 9 module constants, local colour math.
- `ui/*`: 81 raw `Text` onto Typography; Button `#ffffff`, Alert `bg-black`, Tooltip `bg-neutral-800`, Spinner hex.
- Lint: every family in the error block; delete `raw-color-baseline.json` at zero.
- Move `velocity-story-kit.tsx` and `setHeadingKit.tsx` out of `components/`.

**E6 · Code-quality floor** (independent)
- Split the 29 functions over 100 lines (four charts >300 lines; VelocityStrip).
- eslint warnings 81 → 0. `axe` in the 16 test files lacking it. Delete the 18 gitignored `tmp-*.mjs`.

## Consumer follow-ups (one task per repo when E2 lands)

audiobook/frontend (Badge, Chip, StatusPill) · voltras-mcp (Pill, Badge, PrBadge, MuscleGroupChip, MetricTiles, StatusPill type) · voltras mobile (Card, Metric, Section, SectionHeader, `getSemanticColors`/`alpha`) · codewatch (Badge, Metric) · voltras-mcp-wave0 and codewatch-wt-c76 (stale forks: retire or repoint).
