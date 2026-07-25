# Workout component family

Training-specific components (badges, bars, timers, cards, charts, and page-level
screens) built on titan's atoms. They live flat on disk — the tiering below is a
documentation contract, not a directory layout, so promoting or composing a
component is pure import churn with no file moves.

## Tier map

**Atoms** — single-purpose, no cross-component state:
BaseBadge · WeightBadge · PrBadge · StatusDot · PlaceholderStrip ·
DeviationBar · IntensityBar · WorkoutPill · MuscleGroupChip · Sparkline ·
SupersetWrapper · InputBar · MetricCell · SetsRepsLoad · ExerciseIndicator · SetBar

**Molecules** — compose atoms, own a little local state:
VelocityStrip · DualVelocityStrip · SetRow · TempoDisplay · RestTimer · MesoProgressBar ·
WeekRow · WorkoutCard · SetStrip · ExerciseHeading · ExerciseCardHeading

**Organisms** — full features, often with their own data contract:
ExerciseCard · SessionRail · MesoCard · MesoStatusCard · PrHistoryModal ·
ReadinessCheck · StrengthTrendChart · CapacityBandChart · BodyMap · BodyMapDetailPanel

**Pages** — phone-shaped reference screens (whole-screen compositions):
ActiveWorkoutPage · ExerciseDetailPage · ProgramPlanningPage · TrainingStatusPage

## Subpaths

Two families are kept off the root barrel so `@titan-design/react-ui` stays free
of their heavy runtime dependencies. In both cases the value exports move to the
subpath while type-only re-exports remain on the root, so consumers can still
type props without pulling the dependency.

- **`@titan-design/react-ui/bodymap`** — isolates
  `react-native-body-highlighter` (a native SVG dep). BodyMap, BodyMapDetailPanel,
  TrainingStatusPage, and the muscle taxonomy live here.
- **`@titan-design/react-ui/pages`** — isolates the page-level organisms
  (ActiveWorkoutPage, ExerciseDetailPage, ProgramPlanningPage). They are full app
  screens orphaned by both consumers, kept as reference implementations while their
  successors (the responsive level views) are built. TrainingStatusPage is the
  exception — it stays under `/bodymap` because of the body-highlighter dep.

## Notes

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

  ExerciseCard state="rail"  ──delegates to──▶  ExerciseCardHeading
  ```

  `ExerciseCard`'s `rail` state is now a thin adapter that delegates to
  `ExerciseCardHeading` (so the heading is reusable without the card). `SetBar`
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
  `SetStrip`/`SetBar` colors are the real titan ramp pins (`primitiveRamps` red-600 /
  orange-400 / amber-300 / green-300); the rail surfaces bind to the charcoal ramp +
  a subtle neumorphic inset (`neumorphicShadows.charcoal.pressed.subtle`). The heading
  design is locked in `coordination/.../S3-sessionrail/DECISIONS-ExerciseRow.md`; the
  exploration specimens live under `Custom/Workout/Explorations/*` (do not repoint yet).
  In Storybook the family nests by composition under **`Shell/SessionRail/…`**
  (organism → `ExerciseCardHeading` → `ExerciseHeading` → its atoms/molecules →
  `MetricCell`, and `SetStrip` → `SetBar`; `ExerciseCard` sits as a leaf whose
  Composes link points at `ExerciseCardHeading`), each node's autodocs carrying a
  **Composes** link down the tree — matching the S1/S2 shell families. (The component
  files stay flat on disk in `custom/Workout/`; only the story `title`s build the tree.)

- **`DualSessionRail` — dual-Voltra composition (not a new organism)** — a
  dual-bench session drives TWO Voltra devices at once (e.g. Left Arm / Right
  Arm), each with its own exercise list, set progress and set markers.
  `SessionRail` itself stays single-device (unchanged); `DualSessionRail` is a
  thin composition of two `SessionRail` columns side by side, separated by the
  same charcoal-300 hairline the rail uses between exercise rows. Each
  `DualSessionRailSlot` carries its own `label` (rendered as that column's
  title), `exercises`, `setsDone`, and `metrics` — devices progress
  independently. Only the session clock (`elapsedMs`/`budgetMs`/`running`/
  `next`) is shared, since both devices run against the same wall clock. No new
  set-marker vocabulary: `SetStrip`/`SetBar`/`SetStripSet` are untouched, so
  `done`/`active`/`todo`/`range`/`drop`/`myo`/`myo-upcoming` render identically
  in each column. Each `SessionRail` instance is given a per-slot `testID`
  (`dual-session-rail-slot-0`/`-1`, via `SessionRail`'s inherited `ViewProps`
  passthrough — no `SessionRail` code change needed) so slots stay queryable in
  tests. Story: `Shell/SessionRail/DualSessionRail`.
- **VelocityStrip set-type modes (`set` prop)** — beyond the flat `velocities`
  array (unchanged, still the source of truth for `SetRow` / `ExerciseCard`), the
  strip accepts an optional structured `VelocitySet` descriptor and renders the
  strength set-type vocabulary as a typed slot list. Slots are
  `rep` (velocity-coloured) · `todo` (charcoal-300 grey) · `variable` /
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
  `rail` (compact — no velocity labels / reference lines, slot names in a narrow gutter).
  **Rep-index alignment is the invariant:** column *i* is rep *i* on
  both sides, so the set-type slot *kinds* carry through (rep / todo / variable / continue,
  coloured as in the single strip) but the wide-notch chunk **gaps** (drop / myo / cluster
  boundaries) are intentionally NOT rendered — per-side horizontal gaps would break the
  mirrored L↔R column alignment. Single-voltra sets keep using `VelocityStrip`
  `variant="hero"`. Documented by the `Playground` / `Hero*` / `Rail` stories on the wall
  background (`Workout/DataViz/DualVelocityStrip`).

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
  `bar`. `Ring*` (RestTimer) + `Custom/CircularTimer` stories on the wall background.
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
- **`ExerciseCard`'s `collapsed` / `upcoming` state representations** — the rail now
  owns the live-list heading (`rail` state → `ExerciseCardHeading`) and the expanded
  view is moving to `ExpandedDrawer`. Once the responsive unification (TD-03.56)
  lands a single responsive card, the `collapsed`/`upcoming` branches of
  `ExerciseCard` are the superseded representations to retire.
