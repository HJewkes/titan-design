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
