# titan-design `packages/ui` — deep critique and fix roadmap

Reviewed on `main` at 4267d69, 2026-09-08. Read-only. Gates on main: `tsc` 0 errors, prettier clean, eslint 0 errors / 81 warnings, targeted depth tests 115/115 pass.
Scope: 191 story files, 170 test files (~2,196 `it()`), 143 shipped component files (38 `ui/` dirs, 96 `custom/` files, 9 `shell/`).

---

## A. Executive findings (ranked by impact on cohesive application of the fundamentals)

**1. The foundations are sound, but only ~3 families consume them; Workout (the largest family, 54 components) is frozen to the pre-ramp era.**
Workout carries 39 files with module-scope `const t = getSemanticColors('dark')` (55 such constants repo-wide, 71 call sites in components), 149 literal `fontSize:` values, 81 `rgba(` literals, 34 raw hex, 31 files setting `backgroundColor:` inline, 16 inline `boxShadow`, 12 files indexing `greyRamp[...]` directly, 19 raw `<Text>` and zero `Typography`. It is the family with the highest drift and the highest consumer count. Only ActiveWork, Prose and charts are held to the token-pure lint (`eslint.config.js:215-219`); Workout is exempt from every rule except the ratchet.

**2. `Card` is not on the surface system at all.** It reads theme from a DOM class observer (`utils/useTheme.ts`, its only consumer is `Card.tsx:96,373`), never touches `SurfaceContext`, derives its fill from the deleted-tomorrow `lighten()` ladder, and writes `backgroundColor` into `style` (`Card.tsx:190`) so a caller's `bg-*` class is discarded. `filled` and `elevated` are byte-identical (`Card.tsx:46-52`), `outline`/`accent`/`subtle` silently clamp to level 1 or 0 (`Card.tsx:102-104,117-119`), and light mode is a hard-coded `#FAFAFA` (`Card.tsx:115`). 13 shipped files import it. No test covers the className override (`Card.test.tsx` asserts variants render, not what they render).

**3. Four container primitives compete and none is the default.** `Card` (13 consumers), `Surface` (3 shipped: DashboardShell, SessionHeader, SessionRail), `Tile` (3, hand-rolls `bg-surface-raised` + 10px uppercase label), `Section` (0). ActiveWork lists set `bg-surface-raised` on plain `View`s for selection (`SessionListItem.tsx:138`, `FileActivityRow.tsx:96`) because no primitive expresses "one plane up". The north-star §5b asked for exactly one un-misconfigurable `<Card>`; the repo has four ways and 58 loose `bg-surface-*` classes across 25 families.

**4. Twelve pill-shaped components.** `Pill`, `Badge`, `Chip`, `BaseBadge`, `StatusPill`, `WorkoutPill`, `SessionStatePill`, `WeightBadge`, `PrBadge`, `MuscleGroupChip`, `SeverityLabel`, `CoChangeChip`. In-repo consumers: Pill 6, Badge 2, SeverityLabel 2, the rest 0-1. `Chip.tsx:38-41` styles with `bg-neutral-600`/`text-neutral-700` (Tailwind's default cool grey, since the config is in `extend` mode) plus `text-white` ×7; `WorkoutPill.tsx` carries 10 `rgba(` literals. Five Workout badges are titled under `Components/Atoms/*` while the family's other 49 stories sit under `Workout/*`.

**5. Storybook has no single tree.** Nine top-level groups (Components 487 entries, Workout 326, Lab 125, Custom 54, Foundations 40, ActiveWork 30, Shell 27, Pages 16, Docs 1). ActiveWork alone is split four ways (`ActiveWork/*` 7, `Custom/ActiveWork/*` 11, `Components/Molecules/Eyebrow`, `Lab/ActiveWork/*` 6 stale duplicates of the hardened readers). Eight `Lab/`-titled story files live in shipped dirs (`Workout/S3*.stories.tsx` ×5, `ExerciseCardUnified`, `RowInventory`, `shell/SessionRailSpecimen`) and therefore publish to npm, because `package.json` `files` only excludes `src/lab`. Three titles use `·`, which `gotchas.md #8` says mangles story ids. 833 story exports across ~140 component story files (Input 15, Card 14, Alert 14) against the skill's "one Default args story + controls".

**6. Every governance signal is inert or stale.** Zero of 191 story files carry a `status:` tag; all 1,106 Storybook entries read `status:review`, so the sidebar filter MATURITY.md is built around slices nothing. `arch-graph.json` was last regenerated 2026-07-09 (91 components; now ~143), omits the entire ActiveWork family, `Tile`, `SetBarChart`, `SparkBars`, `LiveFatigueCard`, `MarkdownProse`, and its `dead` list names `Pill` (6 consumers today), `Tooltip` (8), `Modal`, `Collapse`, `SideNav`, `TopBar`. The workflow skill's Gate 1 requires a current graph. `REJECTED.md` has 3 entries; the Storybook has 10 archived directions with none.

**7. Colour math is copied, not shared.** `hexToRgb` ×4 (`theme/color-utils.ts:27`, `Fatigue/fatigue-tokens.ts:133`, `lab/north-star/fatigue-lab-shared.tsx:262`, `lab/archive/GrindingLine…:205`), `mixHex` ×4, `perceivedLuminance` ×3 (`materials.ts:87`, `lab/north-star/surfaces.ts:15`, `DualGhostLine…:45`), `lstar` ×3 (all in tests/lab, none exported from theme though the north-star makes ΔL\* the sanctioned metric), `parseHex` (`materials.ts:69`) beside `hexToRgb`. `lab/north-star/surfaces.ts` is a verbatim fork of `materials.ts` (`paperSheet`/`insetWell`/`grainForTone`) and `DualGhostLine` has a third copy.

**8. `ui/*` atoms cannot use `Typography` because it lives in `custom/`.** 81 raw `<Text>` in `ui/*`, 0 `Typography`; `CardTitle`, `SectionHeader` (`Section.tsx:29`), `Menu.tsx:210`, `Tile` all hand-roll heading/eyebrow styles. `Eyebrow` exists but only ActiveWork uses it. The tier order (ui → custom) forbids the fix the skill prescribes.

**9. 185 functions exceed 30 lines (29 exceed 100).** Workout 78, ui 31. Top: `BodyMapDetailPanel` 371, `StrengthTrendChart` 368, `CapacityBandChart` 328, `VelocityStrip` 313 (file is 1,468 lines), `Autocomplete` 204, `Tooltip` 161, `Card` 136, `calculateElevationShadow` 91. Two story-only kits ship as components: `Workout/velocity-story-kit.tsx` (438 lines) and `Workout/setHeadingKit.tsx` (364 lines, raw HTML `<div>`, 15 hex literals, no tests, no stories).

**10. Tests pin implementation and skip a11y where the rules say they must not.** 16 component test files have no `axe` (all four shell sub-parts, six Fatigue, five Workout pages, TimerReadout) despite CLAUDE.md's "every component test file must include an accessibility test". 43 assertions compare to literal hex (`Surface.test.tsx:79,97-100,139-140` pins `#2C2A28`/`#31302F`, so the depth change breaks them by design, not by behaviour). Comments describe deleted code: `SessionRail.stories.tsx:40` cites `neumorphicShadows`, `utils/colors.ts:4` cites `shadows.ts`, `SurfaceContext.ts:19-20` lists pre-re-space hexes, `Surface.tsx:27-35,63,90` documents the lighten model, `elevation.ts:19` says light from upper-right while the offsets are top-left.

---

## B. Competing systems and operator questions

| # | Pair | What each does / who uses it | Question for the operator |
|---|---|---|---|
| 1 | `Card` vs `Surface` vs `Tile` vs `Section` | Card: lighten ladder + 5 variants, 13 consumers. Surface: named planes + on-surface context, 3 shipped. Tile: bare View + `bg-surface-raised`, 3. Section: 0. | Is `Card` the only content container app code may use (Surface reserved for shell roots; Tile becomes a Card preset; Section deleted)? |
| 2 | numeric `elevation` vs named `level` | `elevation=` 15 uses (Card + Surface stories); `level=` 31 uses. Both public. | After the depth fix, does the public API expose only named planes plus a relative "one up", with numeric elevation internal? |
| 3 | 12 pill/badge/chip components | Pill 6 consumers, Badge 2, SeverityLabel 2, others 0-1. Three token-impure. | One `Pill` primitive (tone/size/icon/dot slots) with domain pills as thin wrappers, or keep domain pills as separate components? |
| 4 | `Divider` vs hairline border classes | Divider 5 consumers; 21 hand-rolled `h-px`/`border-t border-hairline` rules in 9 families; 56 `border-hairline*` uses. | Is every rule a `Divider`, with `border-hairline` reserved for the opt-in `outline` edge? |
| 5 | `Tooltip` vs `HelpTip` vs `Popover` | Tooltip 8 consumers, HelpTip 0 (+ `LabelWithHelp`), Popover 1. HelpTip is a Tooltip preset. | Delete HelpTip, or keep it as a documented Tooltip preset? |
| 6 | `useTheme` (DOM observer) vs `SurfaceContext`/`ThemeProvider` | useTheme: Card only. Context: Surface, Typography-adjacent, charts. | Is the Surface/ThemeProvider context the single theme source, so `utils/useTheme.ts` is deleted? |
| 7 | `getSemanticColors('dark')` constants vs `resolveColor` vs `className` tokens | 55 module constants (Workout 39, Fatigue 9); resolveColor in 14 files. TOKENS.md calls it a "known migration". | Are Workout and Fatigue dark-only by design (document and exempt) or must they be theme-correct (migrate 55 files)? |
| 8 | colour math ×5 modules | `theme/color-utils` (HSV), `utils/colors` (`alpha`, 137 call sites), `materials` (`parseHex`, Rec.601 luminance), `fatigue-tokens` (`mixHex`), `SetBarChart` (`mixHex`), 3 lab forks, 3 test `lstar`. | One `theme/color-math` module with CIELAB L\* as the sanctioned metric, everything else re-exported or deleted? |
| 9 | `Typography` (custom) vs raw `<Text>` in `ui/*` | 81 raw Text in ui, 0 Typography. Tier order forbids the import. | Move `Typography` (and `Eyebrow`) into `ui/` so atoms compose it, or exempt `ui/*` from the Typography rule? |
| 10 | `Indicator` vs `StatusDot` | 6 vs 5 consumers. Skill 03 says "standardize on Indicator"; `Fatigue/README.md:41` says fatigue lights are `StatusDot`. Contradiction is live. | Which dot survives? |
| 11 | `Metric` vs `MetricCell` vs `MetricTiles`+`Tile` vs Gauge value | Four label-over-value lockups; Metric 3 consumers, MetricCell 3, MetricTiles 1. | One stat primitive with `size`/`align`/`trend`, or keep Workout's `MetricCell` separate? |
| 12 | `materials.ts` vs `lab/north-star/surfaces.ts` fork vs elevation shadows | materials: 4 shipped call sites. Fork: lab only. Depth decision 2 makes paperSheet's rim the default. | Is `paperSheet` still hero-only (materials header) once every lifted plane carries the rim, or does it collapse into the depth recipe? |
| 13 | Formatters | `utils/number-format` (2), `utils/workout-format` (7), `ActiveWork/format-time` (2), `DateTime.formatDateTime`, 8 local `formatX` in components, 14 `toFixed`. | One `utils/format` module per domain (number / time / workout), with components forbidden from local formatters? |
| 14 | Storybook groups ×9 | Components/Atoms\|Molecules\|Organisms\|DataViz\|Charts, Custom/, Workout/, ActiveWork/, Pages/, Docs/, Shell/, Foundations/, Lab/. | Approve the target tree in §C-E4, or name a different top level for domain families? |
| 15 | Lint mechanisms ×3 | `titan/no-raw-color` ratchet (baseline JSON, 0 errors), family-scoped `no-restricted-syntax` errors (3 families), shell/icons warn. | One mechanism: extend the per-family error block to every family and retire the baseline, or keep the ratchet and delete the scoped blocks? |
| 16 | Light mode | `semantic.ts` defines a full light map; Workout has 1 file that mentions light; Card hard-codes light hex. | Is light mode a supported target for every family, or only for `ui/*` + Foundations? |

---

## C. Epics and task lists

Sizes: S ≤ half a day, M ≤ 2 days, L > 2 days. "Depends" refers to epic.task ids or operator questions Q#.

### E1. Depth correction (in flight, aw-depth) — blast-radius inventory

Everything below is what the four depth decisions touch. Nothing in E2-E6 may edit these files until E1 lands.

**Consumers by family (shipped source, excluding tests/stories):**

| Family | `<Card>` | `<Surface>` | `bg-surface-*` | inline `boxShadow` | tailwind `shadow-*` | materials |
|---|---|---|---|---|---|---|
| ActiveWork | 6 files (CoChangeChip filled; FileActivityDetail subtle; FileHistoryExplorer subtle; InitiativeCard accent/outline; PortfolioOverview filled; SessionDetail outline) | 0 | 2 (SessionListItem:138, FileActivityRow:96) | 0 | 0 | `insetWell()` FileActivityDetail:124 |
| Workout | 4 (MesoCard outline e2 + borderColor + style boxShadow:191; MesoStatusCard outline e1 + borderColor; ReadinessCheck outline e2; WorkoutCard accent e1 + bgColor) | 2 (SessionHeader level=background; SessionRail level=elevated + `insetWell(surface-base)`:137) | 14 files | 16 lines (StatusDot:55-61 ×7 glows; DeviationBar:75; MesoStatusCard:275; BodyMapDetailPanel:337; BodyMap:200; ZoneTrack:241; IntensityBar:181; PrHistoryModal:84; setHeadingKit:308) | 0 | SessionRail |
| Fatigue | 0 | 0 | 0 | 0 | 0 | `barPaper` LiveFatigueCard:58 |
| charts | 0 | 0 (uses `useSurface`) | 0 | 0 | 0 | `barPaper` SetBarChart:494 |
| shell | 0 | 1 (DashboardShell:67 level=base) | 2 | 0 | 0 | 0 |
| ui/* floating overlays | — | — | 14 files | Indicator:92 glow; ToolbarButton:264 | 13 files: autocomplete, drawer, help-tip, indicator (5 arbitrary glow shadows), menu, modal, popover, select, switch, tabs, toast, toolbar-button, tooltip (`shadow-lg` ×9, `-sm` ×2, `-xl`, `-2xl`) | 0 |
| theme stories | — | 4 | 1 | 10 | 0 | Depth.stories:130-141, DepthCalibration:396-588 (+ local `Card` at :480) |
| lab | 21 story uses of Card | 0 | 2 | 12 | 0 | 17 call sites + 2 forks |

Prop-form totals across all files: `variant=` outline 19 / filled 16 / subtle 5 / accent 2 / elevated 1; Card `elevation=` {1}×2 {2}×6 {3}×3; `CardInset` −1×3 −2×3 (stories/tests only); Surface `level=` background 14 / base 9 / raised 5 / elevated 3; `elevation={2}` ×5, `{3}` ×1; `pressed` ×23. Elevation helpers (`getElevationSurface/Shadow`, `getBaseSurfaceColor`, `getValidatedElevation`, `getPressedRecessShadow`, `getGlowShadow`) are called only from `Card.tsx` and `Surface.tsx`; the blast radius of deleting `lighten()` is contained to those two files plus `elevation.test.ts` and `Depth*.stories.tsx`.

Tasks (for aw-depth's plan, not a redesign):
- **E1.1** Card reads `useSurface()` and resolves parent+1; delete `utils/useTheme.ts`. Files: `Card.tsx`, `utils/useTheme.ts`, `utils/index.ts`. S. Done when: no `useTheme` import remains and `Card` inside `<Surface level="base">` renders `surface-elevated`.
- **E1.2** Fix className/style precedence bug + regression test. Files: `Card.tsx:187-205`, `Card.test.tsx`. S. Done when: `<Card className="bg-surface-raised">` computed background is greyRamp[875] in jsdom.
- **E1.3** Collapse variants: `filled` = `elevated`; `outline` becomes opt-in edge, not a level clamp. `Card.tsx:46-52,102-104`. Depends Q1. S.
- **E1.4** Floating overlays (13 ui files) move from `shadow-lg` + `border-hairline` to the level-4/5 recipe. M. Done when: `grep -rE "shadow-(sm|md|lg|xl|2xl)" src/components/ui` = 0.
- **E1.5** Replace hex pins in `Surface.test.tsx`, `surface.contract.test.ts`, `elevation.test.ts` with `greyRamp[...]` references. S.
- **E1.6** Purge stale comments: `Surface.tsx:27-35,63,90`, `SurfaceContext.ts:19-20`, `SessionRail.stories.tsx:40`, `utils/colors.ts:4`, `elevation.ts:19`, `gotchas.md` "Neumorphic depth" section, `SessionRail.tsx:16-17`. S.
- **E1.7** Delete `lab/north-star/surfaces.ts` fork and `DualGhostLine` local copies; point lab at `theme/materials`. S.
- **E1.8** Decide glow shadows (StatusDot ×7, Indicator, MesoCard, BodyMap, ZoneTrack, IntensityBar, PrHistoryModal): they are emphasis, not depth. Route through `getGlowShadow` or leave. Depends on aw-depth. S.
- **E1.9** Rewrite `Foundations/Depth` and `Depth Calibration` to the new model; delete DepthCalibration's local `Card`. M.

### E2. One container, one pill, one dot (depends E1; Q1, Q3, Q4, Q5, Q10, Q11)
- **E2.1** `Card` becomes the sole content container: fold `Tile` into a `Card` stat preset, delete `Section`/`SectionHeader` (0 consumers) or make `SectionHeader` compose `Eyebrow`. M.
- **E2.2** Replace loose `bg-surface-*` on `View`s with the container (58 sites, 25 families; start ActiveWork 2, shell 2, ui 14). L.
- **E2.3** `Pill` gains `tone`/`size`/`leading` slots; `Badge`, `Chip`, `BaseBadge`, `StatusPill`, `WorkoutPill`, `WeightBadge`, `PrBadge`, `MuscleGroupChip`, `SeverityLabel`, `SessionStatePill`, `CoChangeChip` become wrappers or are deleted per Q3. L. Done when: `Chip.tsx` has no `neutral-*`/`text-white`, and each survivor's story is titled under the same parent.
- **E2.4** `Divider` everywhere: replace 21 hand-rolled rules. S.
- **E2.5** `Indicator` vs `StatusDot`: migrate the loser's 5-6 consumers; fix `Fatigue/README.md:41`. M.
- **E2.6** `HelpTip` → Tooltip preset or delete. S.
- **E2.7** Stat lockup: `Metric` absorbs `MetricCell` + `MetricTiles`. M.

### E3. Port Workout and Fatigue onto the foundations (depends E1; Q7, Q8, Q9, Q15, Q16)
- **E3.1** Move `Typography` + `Eyebrow` to `ui/`; leave re-export shims in `custom/`. S.
- **E3.2** `theme/color-math.ts`: single `hexToRgb`, `mixHex`, `alpha`, `lstar`, `deltaL`; delete 4 duplicate `hexToRgb`, 4 `mixHex`, 3 `perceivedLuminance`, 3 test `lstar`. M.
- **E3.3** Workout: replace 39 module-scope `getSemanticColors('dark')` with `resolveColor`/`useOnSurfaceColor` (or document dark-only per Q7). L.
- **E3.4** Workout: 149 literal `fontSize:` → `Typography` variants; 19 raw `<Text>`. L. Files ranked by count: ReadinessCheck 7, TempoDisplay 10, ExerciseCard 5, VelocityStrip 4.
- **E3.5** Fatigue: 9 module constants, 9 `fontSize:`, local `hexToRgb/mixHex`. M.
- **E3.6** `ui/*`: 81 raw `<Text>` → `Typography`; `Button` 6× `#ffffff` + `text-white`, `Alert` `bg-black`, `Tooltip` `bg-neutral-800`, `Spinner` hex. M.
- **E3.7** Lint: add every family to the token-pure error block (or per Q15 keep only the ratchet); delete `raw-color-baseline.json` when it reaches zero; update TOKENS.md §6 to list Prose and `no-raw-color`. S.
- **E3.8** Delete `Workout/velocity-story-kit.tsx` and `setHeadingKit.tsx` from `components/` (move to `src/lab/` or into the stories that use them). S.

### E4. Storybook reorganisation (independent of E1; Q14)
Target tree:
```
Foundations/{Color,Typography,Icons,Depth,Spacing,Choosing Tokens}
Components/Atoms|Molecules|Organisms/<Name>          (ui/* only, one Default + controls)
Custom/<Family>/<Name>                                (ActiveWork, Workout, Fatigue, Charts, Prose, DataViz)
Shell/<Name>
Pages/<Name>
Lab/<Family>/<Name>                                   (src/lab only; status:lab)
Docs/Architecture
```
- **E4.1** Retitle: `ActiveWork/*` and `Components/Molecules/Eyebrow` → `Custom/ActiveWork/*`; `Workout/*` and the 5 Workout atoms under `Components/Atoms/*` → `Custom/Workout/*`; `Workout/Fatigue/*` → `Custom/Fatigue/*`; `Components/Charts|DataViz` → `Custom/Charts`. Fix `Composes` links. M.
- **E4.2** Move the 8 `Lab/`-titled files out of `components/` into `src/lab/` (or delete: `S3*` explorations are superseded by hardened SessionRail). S.
- **E4.3** Delete duplicates: `Lab/ActiveWork/*` (6), `Lab/Components/{Ghost Spark,Velocity Hero,Verdict Hero}` (3), `Lab/Archive/Surface` vs `Lab/North Star/1 · Surface System`. Record each in REJECTED.md. S.
- **E4.4** Rename `·` titles to ASCII; normalise spaces vs PascalCase within a family (`Initiative Reader` vs `InitiativeBrief`). S.
- **E4.5** Add `tags: ['autodocs']` to the 11 hardened ActiveWork stories and the 43 other files without it; add a `Composes` line to the 142 story files lacking one (ui/* first). M.
- **E4.6** Decorators compose `<Surface>`; today 0 do and ~30 hand-roll `backgroundColor`/`bg-*` (`SessionRail.stories.tsx:26-29` also uses `#6B7280`). M.
- **E4.7** Thin per-state stories to one `Default` + controls where the skill says so (Input 15, Card 14, Alert 14, Toast 13). M.

### E5. Governance refresh (independent)
- **E5.1** Regenerate `arch-graph.json` via `scripts/arch-graph.mjs`; add a CI check that fails when the graph is older than the newest `index.ts`. S.
- **E5.2** REJECTED.md entries for: Fable Directions, Feature Explorations, Foundations (superseded), Screen Prototypes, Shell Specimens, Curves ×2, Grinding Line, Rep Breakdown, Hero Tempo, retired `inset` level, `tonalFill`/`ditherTile`, `data-1..10`. S.
- **E5.3** Apply `status:` tags: `status:lab` on every `src/lab` story, `status:candidate` on ported items, and run the MATURITY review session for `ui/*` (MATURITY says "~52 primitives"; there are 38). M. Depends E4.
- **E5.4** README per family for ui/*, ActiveWork (exists), Fatigue (exists, fix StatusDot line), charts, Prose. M.
- **E5.5** Update the skill: `gotchas.md` cites `neumorphicShadows`/`shadows.ts`/`charcoal`/`neutral-100` (none exist); `06-lint-guardrails.md` predates the ratchet. S.

### E6. Code quality floor (independent)
- **E6.1** Split the 29 functions over 100 lines (start with the four charts >300 lines and `VelocityStrip.tsx` 1,468 lines). L.
- **E6.2** eslint warnings 81 → 0 (39 unused-vars, 37 explicit-any; `elevation.ts` 5, `useTheme.ts` 4). S.
- **E6.3** `axe` in the 16 test files lacking it. S.
- **E6.4** Dead-export decision after external-consumer check (brief D1): 40+ components with 0 in-repo consumers. Delete or mark `status:candidate`. M. Depends D1.
- **E6.5** Delete the 18 gitignored `tmp-*.mjs` in the package root. S.

Sequencing: E1 → (E2, E3) in parallel; E4, E5, E6 can start now on files E1 does not list. E5.3 waits for E4.1 so tags land on final titles.

---

## D. Follow-on research briefs (read-only explorer)

**D1. External consumers of the barrel.** Path: the voltras-mcp SPA and the mobile app checkouts (locate via `active-work paths`). For each name in `packages/ui/src/components/ui/index.ts` and `custom/index.ts`, count imports from `@titan-design/react-ui`. Output: table name → external files. Purpose: settle E6.4 and Q3/Q5/Q11 with real usage, since in-repo counts show 40+ zero-consumer exports.

**D2. Workout per-file token audit.** Path: `packages/ui/src/components/custom/Workout/*.tsx` (exclude tests/stories). For each file count: `getSemanticColors(`, `fontSize:`, `#[0-9a-f]{6}`, `rgba(`, `<Text`, `greyRamp[`, `primitiveRamps`, `boxShadow`, `backgroundColor:`, functions >30 lines. Rank; propose the port order for E3.3-E3.4 (smallest, most-consumed first).

**D3. Story duplicate and lab audit against the live index.** `curl localhost:6006/index.json`; group entries by component import path; list titles whose component is also rendered under another title; list every `Lab/` entry whose `importPath` is under `src/components`. Output: delete/move list for E4.2-E4.3.

**D4. Test quality sample.** For 20 test files chosen by highest `toHaveStyle(` count, classify each `it()` as behaviour / implementation / smoke. Count assertions on literal hex or pixel values that would break under a token re-space. Output: list for E1.5 beyond the three files already named.

**D5. Theme presets liveness.** Path: `src/theme/presets/*`, `src/stories/ThemePresets.stories.tsx`, `PresetShowcase.stories.tsx`. Does anything outside stories call `applyPreset`? Does `audiobook.ts` reference retired tokens? Output: keep / move to Lab / delete recommendation and a REJECTED.md draft.

**D6. Light-mode reality.** Render `Pages/*` and `Custom/Workout/*` docs pages with the Storybook theme toggle set to light (Playwright, do not restart the server). Screenshot 10; list components whose fills or text stay dark-frozen. Output: evidence for Q16.

---

## E. Evidence appendix (run from `packages/ui`; zsh needs `bash -c` or `noglob` for `--include`)

```
# story titles → tree tally
grep -rnoE "^\s*title:\s*['\"][^'\"]+['\"]" src --include='*.stories.tsx' | perl -pe 's/^([^:]+):(\d+):\s*title:\s*[\x27"]([^\x27"]+)[\x27"]/$3\t$1:$2/' | sort
  → 191 meta titles; top-level: Components 54 files, Workout 53, Lab 37, Custom 14, Shell 10, Foundations 9, ActiveWork 7, Pages 5, Docs 1
curl -s localhost:6006/index.json → 1106 entries (969 stories, 137 docs); all tagged status:review
grep -rlE "status:[a-z]+" src --include='*.stories.tsx' | wc -l → 0
grep -rLE "'autodocs'" src --include='*.stories.tsx' | wc -l → 54 ;  grep -rlE "Composes" … → 49
grep -rnE "title: 'Lab/" src/components --include='*.stories.tsx' → 8 files

# depth inventory (SRC = *.ts/*.tsx minus tests/stories)
grep -rlE "<Card[ >]" src $SRC → ActiveWork 6 (+Card.tsx), Workout 4 ; imports of Card: 13 shipped files
grep -rhoE "<Card[^>]*variant=\"[a-z]+\"" src --include='*.tsx' → outline 19, filled 16, subtle 5, accent 2, elevated 1
grep -rhoE "bg-surface-[a-z]+" src $SRC | sort | uniq -c → elevated 28, raised 22, base 6, input 2 (58; 118 incl stories)
grep -rnE "boxShadow" src $SRC | grep -v ^src/theme → Workout 16, lab 12, ui 2
grep -rhoE "\bshadow-(sm|md|lg|xl|2xl|inner|\[[^]]*\])" src $SRC → 13 ui files
grep -rnE "paperSheet\(|insetWell\(|barPaper\(|grainForTone\(" src → 4 shipped call sites, 17 lab, 2 forks
grep -rnE "getElevationShadow|getElevationSurface|getBaseSurfaceColor|getValidatedElevation" src | grep -v ^src/theme → Card.tsx, Surface.tsx only
grep -rhoE "border(-[trblxy])?-hairline(-[a-z]+)?" src $SRC → default 38, strong 13, subtle 5

# drift
grep -rnE "^const [a-zA-Z_]+ = getSemanticColors\('dark'\)" src $SRC | wc -l → 55 (Workout 39, Fatigue 9)
grep -rE "getSemanticColors\(" src/components src/lab $SRC | wc -l → 71
grep -rnE "fontSize: [0-9]" src $SRC → Workout 149, lab/surface 56, lab/north-star 28, Fatigue 9
grep -rnoE "#[0-9a-fA-F]{6}\b" src $SRC | grep -v ^src/theme → lab/surface 63, Workout 34, ui 21
grep -rnoE "rgba\(" src $SRC | grep -v ^src/theme → Workout 81, lab/surface 31
raw <Text vs <Typography per dir → ui 81/0, Workout 19/0, ActiveWork 0/47, Table 9/0
grep -rnE "neutral" src/components/ui/chip/Chip.tsx → lines 38-41 ; tailwind.config.js:7 `extend:`
grep -rnE "^(export )?function (hexToRgb|mixHex|perceivedLuminance|lstar|parseHex)" src → 4/4/3/3/1 copies

# consumers (files in src/components + src/lab rendering <X, excluding own file)
Pill 6, Badge 2, Chip 0, BaseBadge 0, StatusPill 1, WorkoutPill 0, WeightBadge 0, PrBadge 1, MuscleGroupChip 0, SeverityLabel 2, CoChangeChip 1
Card 4 (+9 more via import), Surface 3, Tile 3, Section 0, Stack 0, HStack 2
Indicator 6, StatusDot 5, Tooltip 8, HelpTip 0, Popover 1, Divider 5, Eyebrow 8, Typography 22
Metric 3, MetricCell 3, MetricTiles 1

# code quality
TypeScript-AST scan (scratchpad longfn.mjs) → 185 functions >30 lines in 114 files; 29 >100
pnpm exec eslint src/ -f json → 0 errors, 81 warnings (no-unused-vars 39, no-explicit-any 37, no-restricted-syntax 4)
grep -rL "axe(" $(find src/components -name '*.test.tsx') | wc -l → 16 of 139
grep -rE "toHaveStyle\([^)]*#[0-9a-fA-F]" src --include='*.test.tsx' | wc -l → 43
grep -rnE "\b(TODO|FIXME|HACK)\b" src → 1 (a test name) ; commented-out code candidates → 0
ls tmp-*.mjs | wc -l → 18 (gitignored)

# governance
git log -1 --format='%cs %h' -- packages/ui/src/arch/arch-graph.json → 2026-07-09 bc3aeb4 ; components 91, edges 72, no timestamp field
node -e "…summary.dead" → Autocomplete, Avatar, Breadcrumbs, Chip, Collapse, HelpTip, IconBox, Link, Menu, Modal, Pill, ReadinessCheck, SideNav, Skeleton, Spinner, Stepper, Switch, Tabs, Toast, ToolbarButton, Tooltip, TopBar, Treemap
REJECTED.md → 3 entries, last 2026-07-27 ; MATURITY.md → 2026-09-03 ; TOKENS.md → 2026-08-29
gates: pnpm exec tsc --noEmit → 0 ; prettier --check → clean ; vitest (card, surface, elevation, materials, grey-ramp) → 115 passed
```
