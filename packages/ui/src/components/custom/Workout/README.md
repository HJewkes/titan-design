# Workout component family

Training-specific components (badges, bars, timers, cards, charts, and page-level
screens) built on titan's atoms. They live flat on disk — the tiering below is a
documentation contract, not a directory layout, so promoting or composing a
component is pure import churn with no file moves.

## Tier map

**Atoms** — single-purpose, no cross-component state:
BaseBadge · WeightBadge · PrBadge · StatusDot · PlaceholderStrip · TempoBar ·
DeviationBar · IntensityBar · WorkoutPill · MuscleGroupChip · Sparkline ·
SupersetWrapper · InputBar · MetricCell · SetsRepsLoad · ExerciseIndicator · SetBar

**Molecules** — compose atoms, own a little local state:
VelocityStrip · SetRow · TempoDisplay · RestTimer · MesoProgressBar · WeekRow ·
WorkoutCard · SetStrip · ExerciseHeading · ExerciseCardHeading

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

- Badge icons (WeightBadge's dumbbell, PrBadge / PrHistoryModal's star) are inline
  SVGs (`./icons.tsx`), not `lucide-react` — that dependency was dropped in 0.5.0
  to keep the root barrel light. The SVG paths mirror lucide's glyphs so rendering
  is unchanged.

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
