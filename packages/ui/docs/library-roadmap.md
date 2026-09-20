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
| 9 | Typography | `Typography` and `Eyebrow` move into `ui/`; re-export shims stay in `custom/`. Scheduled by the 2026-09-19 decision below (M2). Landed in #PRNUM. |
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

## Decision, 2026-09-19: component placement and migration

Placement is decided by what a component knows, not by how much it composes (`CLAUDE.md`,
Placement). `ui/` is domain-free at any size and may compose `ui/` siblings, `theme`, `utils`,
`hooks` and `icons`; `custom/<Family>/` knows one domain's vocabulary; `shell/` is the application
frame; `src/lab/` is unpublished. The chart substrate is `ui/charts/<chart>/` with a shared `kit/`;
`d3-*` imports are legal only there. Stable eligibility stays coupled to placement: only `ui/*` is
eligible, and once TD-26 lands its test layers become a fifth condition (`MATURITY.md`, clause 2).

Thirteen `custom/` directories plus `ActiveWork/Eyebrow` are domain-free and move to `ui/` over
time (`custom/README.md`, "Generic directories awaiting a move to `ui/`"). In-repo importer counts
are grep counts against `src/` at merge time, excluding the directory's own files.

| #   | Move                                                                                                                | In-repo importers        | When                                      |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------- |
| M1  | `usePrefersReducedMotion` to `src/hooks/usePrefersReducedMotion.ts`                                                 | 3                        | Landed in #276                            |
| M2  | Typography to `ui/typography`, Eyebrow to `ui/eyebrow`, with a one-release re-export shim in `custom/Typography`; marks decision 9 landed when its PR merges | Typography 68, Eyebrow 8 | Landed in #PRNUM                          |
| M3  | EmptyState to `ui/empty-state`                                                                                      | 1                        | now                                       |
| M5  | Create `ui/charts/` with its README; move SparkBars; add a `d3-*`-import lint scoped to `ui/charts/**`              | 2                        | now                                       |
| M4  | Table (headless `useTableState` plus a styled shell, TD-29, #271) to `ui/table`                                     | 8                        | now that TD-29 has landed                 |
| M6  | Generic singles: Metric (2), DateTime (8), Prose (5), Sidebar (1), stepper (1), TimerReadout (2), CircularTimer (2) | 21 total                 | behind the shrinking baseline, follows M2 |
| M7  | Charts that are already generic: Scatter (1), Gauge (1), Treemap (3), into `ui/charts/`                             | 5 total                  | behind the shrinking baseline             |

M1, M2, M3 and M5 land as separate PRs on disjoint files and can run in parallel. M4 was gated on
TD-29, which has since landed (#271); it is now unblocked. M6 and M7 have no deadline;
`custom-families.baseline.json` (the placement lint, below) tracks the ten directories so they are
not forgotten.

**Placement lint (new epic, tracked as a follow-up task, not implemented by this decision's docs
PR).** A separate tooling PR adds, each ratcheted with a committed baseline in the repo's existing
pattern (`eslint-rules/*-baseline.json`):

- `no-upward-tier-import`'s failure message names the fix: "move the shared code to `ui/` (see
  Placement in `CLAUDE.md`); use a slot only for consumer vocabulary."
- `no-upward-tier-import`'s `tierOf` classifies `hooks/` and `utils/` as a foundation tier beside
  `theme`, so they cannot import `components/`.
- A `custom-families.test.ts` structure test: a top-level `custom/` directory must be a declared
  domain family (`Workout`, `Fatigue`, `ActiveWork`, `charts`) or appear in the committed baseline
  of misplaced generics, which may only shrink. Baseline: whatever is left of the 13 directories
  above plus `ActiveWork/Eyebrow` when the lint lands — `custom/README.md` carries the live list,
  which M2 has already shortened. A new generic directory in `custom/` fails.
- `story-title-prefix` restricts `Components/` to `ui/*` and `Custom/` to `custom/*`, ratcheted
  against the `custom/` stories already titled `Components/...` — nine at the decision, eight after
  M2 moved `Eyebrow` into `ui/`.
- A `no-restricted-imports` block confines `d3-*` to `src/components/ui/charts/**`, baselining
  today's one exception (`GoalTrajectoryChartGeometry.ts` and its test, outside `custom/charts`).
- `shell/` is forbidden from importing `shell/<app>/`, baselining the barrel (exempt by design) and
  `SideNav.stories.tsx`.
