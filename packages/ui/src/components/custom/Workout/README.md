# Workout component family

Training-specific components (badges, bars, timers, cards, charts, and page-level
screens) built on titan's atoms. They live flat on disk — the tiering below is a
documentation contract, not a directory layout, so promoting or composing a
component is pure import churn with no file moves.

## Tier map

**Atoms** — single-purpose, no cross-component state:
BaseBadge · WeightBadge · PrBadge · StatusDot · PlaceholderStrip ·
DeviationBar · IntensityBar · WorkoutPill · MuscleGroupChip · Sparkline · MuscleGlyph ·
SupersetWrapper · InputBar · MetricCell · SetsRepsLoad · ExerciseIndicator · SetBar

**Molecules** — compose atoms, own a little local state:
VelocityStrip · DualVelocityStrip · SetRow · TempoDisplay · RestTimer · MesoProgressBar ·
WeekRow · WorkoutCard · SetStrip · ExerciseHeading · ExerciseCardHeading

**Organisms** — full features, often with their own data contract:
ExerciseCard · SessionRail · MesoCard · MesoStatusCard · GoalCard (GoalLiftCard · PrimaryGoalCard) · GoalMuscleCard · PrHistoryModal ·
ReadinessCheck · StrengthTrendChart · CapacityBandChart · BodyMap · BodyMapDetailPanel

**Pages** — phone-shaped reference screens (whole-screen compositions):
ActiveWorkoutPage · ExerciseDetailPage · ProgramPlanningPage · TrainingStatusPage

## Subpaths

Two families are kept off the root barrel so `@titan-design/react-ui` stays free
of their heavy runtime dependencies. Their component/page value exports move to
the subpath while type-only re-exports remain on the root, so consumers can
still type props without pulling the dependency — except `MuscleGroup`, which
IS a runtime value at root (VW-388): it's a plain enum with no
`react-native-body-highlighter` dependency of its own, so re-exporting it as
`export type` only hid the runtime binding without buying anything. See
`muscleTaxonomy.ts`'s re-export in this directory's `index.ts` for the exact
split.

- **`@titan-design/react-ui/bodymap`** — isolates
  `react-native-body-highlighter` (a native SVG dep). BodyMap, BodyMapDetailPanel,
  TrainingStatusPage, the muscle taxonomy, and (VW-386) `MuscleGlyph` and
  `GoalMuscleCard` live here.
- **`@titan-design/react-ui/pages`** — isolates the page-level organisms
  (ActiveWorkoutPage, ExerciseDetailPage, ProgramPlanningPage). They are full app
  screens orphaned by both consumers, kept as reference implementations while their
  successors (the responsive level views) are built. TrainingStatusPage is the
  exception — it stays under `/bodymap` because of the body-highlighter dep.

## Notes

- **GoalLiftCard (VW-386, merged into GoalCard in VW-385 round 5)** — the per-lift
  grid cell, now `GoalCard size="compact"` under the name the SPA already imports.
  It maps the lift-shaped props onto the merged card and adds nothing of its own.

  **Its chart is `GoalWeekColumnsChart` (D1), not a `Sparkline`.** The compact
  card's summary hands its week cells to the chart, which stands them on its own
  plane over its own week columns — one row that is both the week history and the
  x axis. The `Sparkline` went because it was a second chart vocabulary on the
  same page as `GoalTrajectoryChart`; the other variants (plane-only, ticked,
  inset) are in `REJECTED.md`.

  _used-by ↑_ voltras-mcp `#/goals` `PerLiftTable`.

  **It leads with the meso target block, not its own hero.** The hand-rolled
  `reps x load` figure and its `in week 8` line said less in more space and said
  it in a second vocabulary. `milestoneBlock()` adapts the card's own props onto
  the summary's — the target is the milestone, the block runs to its due week, and
  the best set is the last reading at the target's reps, because
  `top_load_at_reps` is a load AT those reps. A caller holding the real set passes
  `latest`.

  **The PR star sits in the title row** beside the status affordance, in the order
  every goal card uses. It used to hang over the hero, absolutely positioned so it
  could not push the unit down; with the hero gone there is nothing to displace.

  Its props map 1:1 onto `GoalProgressView`: `status` is `GoalProgressStatus`
  verbatim, and `milestone` takes the structured `reps` / `load` / `unit` /
  `goalWeek` that voltras-mcp #433 added to `GoalMilestone` — the card never
  parses the milestone `label`.

  Two things that are decisions, not accidents:
  - **The status mark collapses on measured WIDTH, not density.** Below
    `STATUS_COLLAPSE_WIDTH` (320) the pill becomes its `Indicator`. Keying it to
    density alone left a narrow comfortable cell rendering a full pill, which
    shoved the title into a wrap. The mark is never absent, only reshaped.
  - **The block's hero is `body1` plus the heading face, not `h4`.** `h1`-`h6`
    emit `accessibilityRole="header"` (gotcha #11b) and a milestone number is not
    a heading; a four-column grid would have put eight bogus headings on the page.

  `onLayout` does not fire under jsdom, so the width collapse is covered by the
  explicit `statusForm` override in tests and by the `Widths` story live.

- **GoalCard (VW-385 unit 1)** — one goal at card scale, in two sizes.
  `PrimaryGoalCard` is `size="full"`, `GoalLiftCard` is `size="compact"`; both
  names are kept as presets because voltras-mcp imports them.

  _composes ↓_ `Card` (elevation 1) · `GoalPriorityIcon` · `Pill` + `TipTrigger` ·
  `PrBadge` · `GoalMilestoneSummary` · `GoalTrajectoryChart` (full) · `Sparkline`
  (compact) · `Typography`. _used-by ↑_ voltras-mcp `#/goals`.

  **One title row for both sizes** (round 5): the lift on the left, then the
  priority mark, the PR star and the status badge FURTHEST RIGHT. Two cards on one
  page ordering their marks differently is the kind of thing a design system
  exists to prevent.

  **It deletes a block rather than restyling it.** The old header printed the
  week, the priority word, the status basis, committed, stretch and the next
  milestone as text above the chart — every one of which the chart already shows
  or can show (human call, 2026-09-17). The week is the chart's axis and the
  summary's facts line; committed and stretch are its rules; next week is the
  hollow marker; the basis and its RP citation are the status pill's tip; the
  priority word is `GoalPriorityIcon`.

  **The week cells stand on the chart's columns, and they are the week labels.**
  They share the plot's x-scale through `trajectoryWeekScale` — not a second copy
  of the arithmetic — so the full card passes `showWeekLabels={false}` and the
  axis stops printing every week a second time a row lower. A cell is the header
  of its week's column, which is only true if it is over that column at every
  width; `PrimaryGoalCard.test.tsx` asserts the centres at 1888 and 328.

  **The axis insets by half a column PLUS half a gap.** Half a column alone put
  the n columns exactly edge to edge, which left the outer cells `gap / 2` of air
  against the plane while their neighbours had `gap` — and that read as the end
  cells being clipped. Nothing was ever clipped: measured in the browser, every
  cell was the same width and no ancestor carried an overflow rule (VW-385 round
  6). `WEEK_COLUMN_GAP` lives in the geometry module because the inset that
  evens the rhythm is what has to know it.

  **The badge reads the milestone's verdict, not the band's.** A band's committed
  edge and the block's target are different numbers, and judging the badge by the
  band printed "Hit" over a hero reading "2.5 lb to goal". Both now come from
  `milestoneReach`.

  **The fold left the tile behind.** An inset plane inside a card that already
  has one (the chart's) read as two unrelated wells; the summary now sits
  straight on the card. `GoalMilestoneTile` still exists for anything that wants
  the framed form — it is that same summary in its plane.

  `onLayout` does not fire under jsdom, so `chartWidth` pins the measured width
  for tests. Without it the full card renders its title row and nothing else,
  which is also what one frame of a real mount looks like.

- **GoalPriorityIcon (VW-385 unit 1)** — specialize / maintain / deprioritize as
  a mark, sized and placed like `PrBadge`'s compact star.

  _composes ↓_ `TargetIcon` / `EqualIcon` / `ChevronsDownIcon` (new, shared) ·
  `TipTrigger` · `Typography`. _used-by ↑_ `PrimaryGoalCard`.

  **Priority is not pace, so it never takes a `status-*` tone.** The accent goes
  to the one level worth the attention; the other two step back through the text
  ramp. A test asserts none of the three is a status colour.

- **The goal verdict has one definition** — `valueReach` / `milestoneReach` in
  `goalMilestone.ts`. A reading short of the committed target leaves the pace
  tone alone; exactly on it is success green with the hit label; past it is the
  `ahead` blue labelled `Beyond goal`. `GoalTrajectoryChart` (line, pill),
  `GoalMilestoneSummary` (hero), `GoalMilestoneTile` (hit mark) and
  `PrimaryGoalCard` (header pill) all read it off that helper — the maths is not
  duplicated anywhere.

- **GoalMilestoneSummary vs GoalMilestoneTile** — the summary is the content
  (hero, facts row, week cells); the tile is the summary in its inset plane, with
  the header and the Hit/Missed mark. The folded card composes the summary; the
  per-lift slot composes the tile (`layout="compact"`, which carries the week
  cells at the phone scale). Add behaviour to the summary, not to both.

- **GoalMuscleCard (VW-386)** — a muscle priority's goal state at card scale:
  the figure lit by its status, the lifts-on-track count beneath it as a label,
  and every contributing lift to its right.

  _composes ↓_ `Card` (elevation 1) · `Pill` / `Indicator` · `Typography` ·
  `MuscleGlyph`. _used-by ↑_ voltras-mcp `#/goals` `MuscleRollupPanel`.

  **A sibling of `GoalLiftCard`, not a variant of it.** The survey's original
  claim was one card with two content presets; the built prop APIs killed it.
  They share `name` and `status` and nothing else — the lift card takes a
  milestone, a band and a series, the muscle card takes a roster — so one
  component would key every remaining prop off a discriminator. And this one
  pulls `react-native-body-highlighter`, which is quarantined behind `/bodymap`
  precisely so the root barrel stays free of it; folding it into `GoalLiftCard`
  would drag that dep onto every consumer of the lift card.

  **A lift row prints its own week only when it differs** from `commonGoalWeek`.
  It is a per-TARGET due week, so on most muscles every row matches and the week
  vanishes — printing it on every row read as if it meant something.

  **The figure is lit by GOAL status, never `getHeatmapColor`.** That function is
  the volume-landmark measurement (sets against MAV) and lives on a read model
  `#/goals` never fetches. `MuscleGlyph` takes a resolved colour so the two
  vocabularies cannot share a default.

- **MuscleGlyph (VW-386)** — the card-scale figure, ~44x88, with one muscle lit.
  The library had no mini muscle svg: `BodyMap` renders the same artwork only at
  160x320 and 480x960 and always with its legend, and the icon set's one body
  glyph has no muscle regions. This is the same `react-native-body-highlighter`
  drawing and the same `MUSCLE_TO_SVG_SLUGS` mapping at a smaller scale, so the
  figure still has exactly one source; `BodyMap` can compose it later.

  The svg subtree is `aria-hidden` and the wrapper carries the name — the
  package puts `aria-label` on bare `<path>` elements, which axe rejects.

- **BaseBadge is an internal composition primitive** — the shared shell that
  WeightBadge and PrBadge build on. It is exempt from orphan accounting; it is not
  meant to be consumed directly even though it is exported for composition.
- **MetricCell is an internal composition primitive** — the shared Inter · 600 ·
  letter-spacing-1 value/separator cell. `TempoDisplay` (tempo digits) and
  `SetsRepsLoad` (sets × reps @ load) both compose it so the two read as one
  visual language. Exported for composition, not for direct app use.
- **TempoDisplay is deliberately NOT decomposed further** — it is the single tempo
  component (the standalone `TempoBar` was retired into it). It renders two modes from
  one chip: the static phase-coloured **prescription** and, with the `live` prop, the
  running tempo (per-phase countdown/count-up to 0.1s, a bottom-anchored phase-progress
  fill, semantic pacing tones, and banked/frozen finals). Its internal parts —
  `LiveTempoRow`, `LiveTempoCell`, `CellFill` (the fill behind a number), and the
  `activeNumberTone` pacing helper — are **TempoDisplay-private with no second consumer**,
  so per the ≥2-consumer rule they stay internal rather than becoming top-level primitives.
  The only already-shared primitive is `MetricCell`.

  **If reuse emerges, decompose along these seams** (in likely order):
  1. **`CellFill` → a shared `ProgressCell`/`FillBehind` primitive** — the moment a
     second component needs "a bottom-anchored progress fill behind centred text" (e.g. a
     generic timer/meter cell). Cleanest extraction; pure presentation, no tempo semantics.
  2. **`activeNumberTone` + `ON_TARGET_MS` → a `tempo-pacing` util** — if another surface
     needs the same yellow/green/red "time-to-target" tone (a coach card, a rep-tempo
     summary). It is pure logic, trivially portable.
  3. **`LiveTempoRow` → a `TempoLiveRow` molecule** — only if a consumer wants the running
     row _without_ the chip chrome (label/background/padding). Until then the chrome and the
     row belong together as one component with a `live` prop, not two.

  Not worth splitting today (speculative extraction the workflow warns against); this note
  is the trigger list for when it stops being speculative.

- **S3 session-rail family** — `SessionRail` (organism) composes the standalone
  `ExerciseCardHeading` molecule per exercise, which composes an `ExerciseHeading`
  info block + a `SetStrip`:

  ```
  SessionRail
  └─ ExerciseCardHeading            (complete standalone heading)
     ├─ ExerciseHeading             (name/indicator + metrics, no strip)
     │  ├─ ExerciseIndicator
     │  ├─ SetsRepsLoad → MetricCell
     │  └─ TempoDisplay  (showLabel={false}) → MetricCell
     └─ SetStrip
        └─ SetBar × N               (one set's per-rep colour bar)

  ExerciseCard (all three representations)  ──delegates to──▶  ExerciseCardHeading
  ```

  **TD-03.55 / TD-03.56 — one row, three densities, and interaction states.**
  `ExerciseCardHeading` IS the exercise row. Its `density` prop carries the only
  axis that ever separated the three call sites:

  | `density`  | shape                                               | was                            |
  | ---------- | --------------------------------------------------- | ------------------------------ |
  | `rail`     | two lines: name, then prescription beside the tempo | `ExerciseCardHeading`          |
  | `compact`  | one line: name + prescription, strip below          | `ExerciseCard`'s CollapsedCard |
  | `upcoming` | `compact`, dimmed, previous best pinned right       | `ExerciseCard`'s UpcomingCard  |

  `CollapsedCard` and `UpcomingCard` are deleted; `ExerciseCard` maps its props onto
  the row, so **its own prop shape is unchanged** and no consumer migrates. Three
  things converged in the process, each a consistency gain rather than a new idea:
  the collapsed row's freeform `3×6 @ 175 lbs` caption became the shared
  `SetsRepsLoad` line; its hand-rolled `VelocityStrip` + `PlaceholderStrip` row
  became one `SetStrip` (so `velocityZones` no longer tints the collapsed glance —
  the expanded header already ignored it); and `isPR` surfaces through the
  `ExerciseIndicator` chip, which is what the expanded header already did.

  The prescription is a **discriminated union**: either the structured
  `sets`/`reps`/`load` triple, or a free-text `prescription` string for an exercise
  whose numbers aren't loaded, or neither. Mixing them is a type error rather than a
  half-rendered line.

  Interaction states are `interactive-*` token washes on the row —
  **press > selection > hover** — plus an `isLive` name tone (`status-live`). Every
  one is static: this row renders on the wall during a set, where titan's "the grain
  never animates" rule applies. Hover is web-only; RN Pressable's `onHoverIn` never
  fires on a touch surface, so a touch consumer simply gets no hover state and
  `isSelected` carries the same "this one" meaning. Selection has **no ARIA**:
  `aria-selected` is not allowed on `role="button"`, so the wash is the whole signal
  and list semantics stay the rail's job.

  The dim depths have since converged on ONE token, `primitiveOpacity.dim` (0.6,
  VW-276) — the foundations decision that was owed. It is whole-element opacity, not
  an alpha colour, because a row fades as one thing; 0.6 over 0.55 because nothing
  distinguishes them side by side and the shallower dim costs less contrast.

  One follow-up is deliberately NOT taken here:
  `exerciseRowState.ts` (the `interactive-*` → literal-hex map, written in the
  shape of `onSurfaceColors`) should be **promoted into the surface module** the
  moment a second family needs row washes.

  `SetBar`
  owns the per-set colour/pulse logic; `SetStrip` lays several side by side.
  Beyond the flat `done`/`active`/`todo` sets, `SetStripSet` models set-type
  prescriptions: `range` (variable rep-range — range-max segments, committed-todo grey
  vs. variable-todo cyan), `drop` (one set, sub-loads split by 2px notches), `myo`
  (done rest-pause — activation + clusters split by 3px cluster gaps), and
  `myo-upcoming` (planned myo, length unknown — grey activation + a fading, right-open
  cyan "clusters-to-failure" trail). The chunk-size _pattern_ carries set-type identity:
  **butted reps (0) < notch (2px) < cluster gap (3px) < set gap (5px)**. `cyan-900`
  (`SET_STRIP_VARIABLE_COLOR`) is the shared "variable / unknown / opportunity" pin.
  `SegmentedBar` carries these via additive `leadingGap` (per-segment left margin) and
  static `opacity` props — the flat sets stay byte-identical.
  `active`/`todo` sets optionally carry the plan's prescribed rep RANGE (`repsLow`/
  `repsHigh`, VMCP-03.04), rendered as a small label above the bar (`8–12`, or `8` when
  equal/only one is given) via the shared `formatRepsRange` helper — independent of
  `range`'s `floor`/`max` value range.
  They may also carry `expectedRange` (`{ low, high, n }`, VW-301) — a **stats-derived**
  expected rep range computed from the lifter's own history of reps completed to the
  velocity-loss threshold, **not the plan's prescription**. Rendered via
  `formatExpectedRange` as `~5–15 expected` beneath the prescribed label, deliberately
  lighter/smaller (`text-3xs`/`text-tertiary`, regular weight vs. the prescription's
  `text-2xs`/`text-secondary`/semibold) so it never reads as a second prescription —
  per Jukic et al. 2023 its limits of agreement run about ±5 reps. `n` (sample size)
  is surfaced only to screen readers (`accessibilityLabel`), to keep the visible label
  short.
  `SetStrip`/`SetBar` colors are the real titan ramp pins (`primitiveRamps` red-600 /
  orange-400 / amber-300 / green-300); the rail surfaces bind to the grey ramp and the
  list is a well cut with the shared `insetWell` material. The heading
  design is locked in `sources/design/shell/S3-sessionrail/DECISIONS-ExerciseRow.md`; the
  exploration specimens live under `Custom/Workout/Explorations/*` (do not repoint yet).
  In Storybook the family nests by composition under **`Shell/SessionRail/…`**
  (organism → `ExerciseCardHeading` → `ExerciseHeading` → its atoms/molecules →
  `MetricCell`, and `SetStrip` → `SetBar`; `ExerciseCard` sits as a leaf whose
  Composes link points at `ExerciseCardHeading`), each node's autodocs carrying a
  **Composes** link down the tree — matching the S1/S2 shell families. (The component
  files stay flat on disk in `custom/Workout/`; only the story `title`s build the tree.)

- **Dual at the RAIL level — rejected, removed** — `DualSessionRail` (two
  `SessionRail` columns side by side) was explored and rejected: bilateral
  asymmetry is a property of how a SET was performed, not of the session's
  structure, so the rail stays single and consistent and the dual distinction is
  surfaced per-set/per-rep instead (`DualVelocityStrip`). Deleted 2026-07-26 —
  see `packages/ui/REJECTED.md` for the full reasoning. Do not reintroduce a
  rail-level split without reading it first.

- **VelocityStrip set-type modes (`set` prop)** — beyond the flat `velocities`
  array (unchanged, still the source of truth for `SetRow` / `ExerciseCard`), the
  strip accepts an optional structured `VelocitySet` descriptor and renders the
  strength set-type vocabulary as a typed slot list. Slots are
  `rep` (velocity-coloured) · `todo` (`border-prominent` grey) · `variable` /
  `continue` (`SET_STRIP_VARIABLE_COLOR` cyan-900; `continue` adds a cyan-800
  outline to read as "keep going"). Types: `straight` (done + grey todo to
  `planned`), `range` (committed grey + a cyan variable window `floor..max`),
  `amrap` (reps + a trailing cyan continue), `drop` (sub-loads split by a wide
  notch), `myo` (activation + clusters split by wide gaps, `open` adds a continue),
  `cluster` (fixed count grouped by wide intra-rest gaps). The gap hierarchy is
  **butted reps (`REP_GAP` 2px) < chunk boundary (`WIDE_GAP` 7px)**, applied as
  per-slot `marginLeft` (the mini container drops its uniform `gap` so wide gaps
  render; a no-`set` strip is `[0, 2, 2, …]`, i.e. byte-identical to before). The
  done-velocity array (`velocities`, or subloads/activation+clusters flattened) is
  derived from the `set` and drives the mean · loss · zone summary either way. The
  `mini` variant is the primary set-type surface; `expanded` gives `straight` the
  active-set spotlight (velocity-height done reps + short grey stubs) and renders
  the advanced types as a short mini-style encoding. Every modality is documented
  with a copy-paste `set` config in **`Workout/DataViz/VelocityStrip/Set
Modalities`** (each card carries a `Collapse` accordion; promoted from the
  now-deleted `S3SetModalities` Lab specimen).
- **VelocityStrip `hero` variant** — the across-the-room, single-set **wall**
  treatment (the north-star live page's velocity hero). Tall bars (default 220px
  plot) with a per-bar velocity value label, a dashed **running-best reference
  line** (unlabeled — the tallest bar already shows the number, and the container
  a11y label carries it), and dashed **placeholders for the reps still to come**
  driven by a new `targetReps` prop. Absorbs the R2 `HeroVelocityBars` candidate
  into the atom rather than shipping a parallel component. Reuses the shared zone
  scale (`barColorFor`) and the extracted `useLiveRepPop` entrance (now shared with
  the framed `expanded` chart). **Layout:** width-fluid (flex bars, capped at 52px,
  left-packed) with a caller-set fixed height; the eyebrow/section title is
  organism chrome, not part of the primitive. **Live-update model:** the plan's
  slots are pre-allocated (`max(done, target)` columns), so a landing rep converts
  placeholder→bar in the _same_ slot with a pop — no reflow within the plan; pair
  with `scale="fixed"` so heights never rescale either. The one reflow case is
  set-expansion **beyond** `targetReps` (AMRAP overflow adds a column and flex-
  narrows the rest — currently snaps; smooth overflow reflow is a deferred
  follow-up). Documented by the `HeroPlayground` / `Hero*` stories on the wall
  background.
- **DualVelocityStrip** (molecule) — the two-device (LEFT + RIGHT voltra) **diverging**
  wall/rail chart. `composes ↓` the `VelocityStrip` machinery in the same file
  (`buildSlots`/`VelocitySlot` slot model, the `makeBarColorFor` zone scale, the hero
  geometry constants, the shared `useLiveRepPop` entrance, and the extracted
  `DashedReferenceLine`) rather than restating it. `used-by ↑` the north-star dual-voltra
  live page (organism chrome). ONE diverging chart shares a horizontal centre axis: LEFT
  reps grow **up**, RIGHT reps grow **down**, one mirrored pair per rep index, so the L/R
  asymmetry reads pre-attentively as the silhouette. **Side is POSITION only, never hue** —
  both wings colour reps by velocity zone through the same resolver as the single strip.
  Each side takes a `DualVelocityStream` (`velocities` OR a structured `set` — the same
  shapes `VelocityStrip` accepts — plus an optional `label`). The **vertical edge label is
  data**: each side renders its `DualVelocityStream.label` (a slot name, e.g. "Left Arm"),
  NOT a hardcoded LEFT/RIGHT — a side with no `label` (or an empty one) renders no tag, and
  when neither side carries one the gutter is omitted entirely. The label keeps the prior
  vertical (rotated) orientation so it never overlaps the bars. Two scales: `hero` (tall
  wings, per-rep m/s velocity labels, a dashed running-best reference line per side) and
  `dual-expanded` (compact — no velocity labels / reference lines, slot names in a narrow
  gutter).
  **Rep-index alignment is the invariant:** column _i_ is rep _i_ on
  both sides, so the set-type slot _kinds_ carry through (rep / todo / variable / continue,
  coloured as in the single strip) but the wide-notch chunk **gaps** (drop / myo / cluster
  boundaries) are intentionally NOT rendered — per-side horizontal gaps would break the
  mirrored L↔R column alignment. Single-voltra sets keep using `VelocityStrip`
  `variant="hero"`. Documented by the `Playground` / `Hero*` / `DualExpanded` stories on the
  wall background (`Custom/Workout/DataViz/DualVelocityStrip`).

  **`variant="rail"` → `variant="dual-expanded"` (VW-97).** `rail` was a verified misnomer —
  this variant is the value-height strip a session-rail row _expands into_, not the rail
  itself (the rail stays 246px and never changes width; expansion lives in a separate detail
  pane, per the VW-97 rail-width decision). `rail` is kept as a **deprecated alias** for one
  release (same renderer, same output) so existing call sites keep working; migrate to
  `dual-expanded` and expect `rail` to be removed in a future release.

  **Reuse audit — `DashedReferenceLine` (in-file today, top-level follow-up).** The dashed
  running-best line was hand-rolled three times inside `VelocityStrip.tsx` (the single
  `hero`, plus the dual's L and R wings); it is now one in-file `DashedReferenceLine`
  (`anchor: 'top' | 'bottom'`, pixel `offset`, `testID`) those three sites share. A FOURTH
  consumer exists across files — `Sparkline`'s `referenceLines` prop renders the same dashed
  overlay (with an added opacity, an optional label, and a data-domain→Y projection), and two
  Lab specimens duplicate it again. Promoting `DashedReferenceLine` to a **top-level
  `ReferenceLine` overlay primitive** and migrating `Sparkline` (keeping its label/opacity
  options as props) is the ≥2-consumer extraction the DoD favours — deliberately deferred to
  a follow-up so the hero PR stays focused (the cross-file migration touches `Sparkline`'s
  test surface and the Lab specimens, which are out of this branch's scope). Proposed API:
  `<ReferenceLine anchor offset color dashed opacity? label? testID />`.

- **RestTimer `ring` variant** — the across-the-room **wall** rest treatment (the
  north-star rest page). Built as a **three-tier decomposition** (not a one-off):
  `CircularProgress` (atom, gained a **`children`** center slot + a **`fill`**
  responsive mode) → **`CircularTimer`** (new molecule, `custom/CircularTimer/` — a
  batteries-included circular countdown/countup; owns `useTimer`, renders the mm:ss
  readout into the ring center, flips a completed `down` timer to a full `doneColor`
  ring reading its `doneLabel`, and takes an optional `controls` slot) → **RestTimer
  `ring`** which composes `CircularTimer` (`doneLabel="GO"`, `doneColor="success"`,
  `controls={<RestActions/>}`) and adds the rest-specific next-set footer caption.
  No third copy of the arc math and no `react-native-svg` — it rides
  `CircularProgress`'s web-`<svg>` + free `stroke-dashoffset` transition. Absorbs
  the R2 `RestRing` candidate into the atom; the mobile `CircularTimer` countup fork
  is the natural second consumer of the new molecule (via `mode="up"`). `displayOnly`
  hides the shared `RestActions` (+30s/Skip, extracted, used by both variants);
  `size` (default 180) sets the diameter; the eyebrow/section title is organism
  chrome. Web/RNW-only (like `CircularProgress`) — the wall variant; mobile keeps
  `bar`. `Ring*` (RestTimer) + `Components/Molecules/CircularTimer` stories on the wall background.
- **`size="wall"` density (FatigueMeter · ZoneTrack)** — the across-the-room
  dashboard scale, added as the idiomatic titan `size` union (a JS number-map per
  component; **`default` values are byte-identical** to before, so existing consumers are
  untouched). **ZoneTrack** (the shared gauge primitive) gained `size` that scales track,
  needle, tick lines and tick labels together; its _other_ consumers (TrainingLoadGauge,
  RpeCalibration) default to `default` and are unaffected. **FatigueMeter** passes `size`
  through and lets `trackHeight` flow from it. `Wall*` / `WallDensity` stories on the wall
  background. (**TempoBar** was retired here — the standalone active-tempo bar is superseded
  by `TempoDisplay`'s live mode; see the TempoDisplay note.)
- Badge icons (WeightBadge's dumbbell, PrBadge / PrHistoryModal's star) are inline
  SVGs (`./icons.tsx`), not `lucide-react` — that dependency was dropped in 0.5.0
  to keep the root barrel light. The SVG paths mirror lucide's glyphs so rendering
  is unchanged.
- **`ExerciseIndicator` taxonomy (LOCKED, TD-03.51)** — one precedence-ranked slot
  per exercise, six distinct kinds over four tier colors (bound to titan status
  tokens, read as literal hex via `getSemanticColors('dark')`, not `resolveColor`,
  so tests can assert them). Glyph = the specific signal; color = the severity tier. Chips are
  outlined (border + glyph, no fill) so they never collide with the _filled_
  velocity strip, and static (no pulse — they are chrome). Precedence, high → low:

  | #   | kind            | tier                       | glyph (mirrors lucide) |
  | --- | --------------- | -------------------------- | ---------------------- |
  | 1   | `imbalance`     | danger (`status-error`)    | `Scale`                |
  | 2   | `overshoot`     | danger (`status-error`)    | `AlertTriangle`        |
  | 3   | `velocity-loss` | warning (`status-warning`) | `TrendingDown`         |
  | 4   | `missed-reps`   | warning (`status-warning`) | `CircleSlash`          |
  | 5   | `pr`            | success (`status-success`) | `Award`                |
  | 6   | `info`          | info (`status-info`)       | `Info`                 |

  `resolveIndicator(candidates)` collapses the active signals to the single
  highest-precedence kind to show (`undefined` when none). Alerts outrank `pr`. The
  glyphs are new inline SVGs in the shared `components/icons` set (not the local
  `./icons.tsx` badge glyphs). The old generic `issue` kind is superseded by the
  specific danger/warning kinds and was removed.

## Shell/SessionRail feature area

The live-workout rail is a **feature assembly**: the genuinely rail-specific parts
(header / pace / expand drawer / set-table header) nest under `Shell/SessionRail/*`,
while reused leaves stay in their `Workout/*` tier and are **referenced via Composes
links, not re-homed** (`SetRow`, `ExerciseCardHeading`). This is the one deliberate
exception to the flat `Shell` taxonomy — the NEW components below are the only
ones that nest.

```
Shell/SessionRail                       (organism — SessionRail.tsx)
├─ SessionHeader                        (NEW · real — title, stat tiles, chunked pace bar, ⏱ readout)
└─ ExerciseCardHeading × N              (Workout/ · linked, NOT re-homed)

Shell/SessionRail/ExpandedDrawer        (NEW · 🚧 WIP — opens when an exercise expands)
├─ TableHeader                          (NEW · 🚧 WIP — exported as `SetTableHeader`; the generic
│                                         `TableHeader` name is owned by the DataViz `Table`)
└─ SetRow × N                           (Workout/ · linked, NOT re-homed)
```

- `SessionHeader` is the rail's session glance: the title over a stat row (Volume/Load/
  Fatigue live, Date/Time/Until upcoming) and a per-exercise chunked pace bar with a
  mono sets label + ⏱ readout. It composes the merged primitives (`MetricTiles` /
  `ScheduleTiles` + `SegmentedProgressBar` + `TimerReadout`); the old footer pace tile is
  gone — the header carries the glance. It is the REAL (non-WIP) new component.
- `SetTableHeader` (story leaf `.../ExpandedDrawer/TableHeader`) is the expanded-set
  column-header row extracted from `ExerciseCard`'s `expanded` state; `ExerciseCard`
  now consumes it too (backward-compatible — it passes its own
  `testID="exercise-card-column-headers"`).
- Each new node's autodocs carry a `**Tier.** Composes […] / Used-by ↑ […]` line; the
  WIP two (`ExpandedDrawer`, `TableHeader`) are prefixed `**🚧 WIP / placeholder.**`.

## Dead candidates (do NOT remove yet — pending TD-03.56 responsive unification)

Superseded by the target Shell/SessionRail scaffold; flagged now, removed only when the
responsive level views land (removal is out of scope for this scaffold ticket):

- **`setHeadingKit.tsx`** — the throwaway CSS R&D kit (raw HTML `<div>`s at the rail
  width). Its own header says it moves into real components "when these decisions
  harden" — which has now happened (`SessionRail` / `SessionHeader` /
  `ExerciseCardHeading` / `ExerciseHeading` / `SetStrip` / `SetBar` /
  `SetTableHeader`).
- **The five `Lab/Explorations` specimens that import it** — `S3FullRail`
  (Full Rail), `S3SessionRailHeading` (Session Rail Heading), `S3WorkoutExpansion`
  (Workout Expansion), `S3SetTypes` (Set Types), `S3SessionPace` (Session Pace).
  Each is superseded by a real Shell/SessionRail component + its Storybook stories;
  `S3SessionPace` in particular is superseded by the `SessionHeader` pace glance.
- **`ExerciseCard`'s `collapsed` / `upcoming` state representations** — DONE
  (TD-03.56). Both hand-rolled sub-cards are deleted; `ExerciseCard` now delegates
  all three representations to `ExerciseCardHeading` and its `density` prop. What
  remains to retire is the expanded view, which is moving to `ExpandedDrawer`.
