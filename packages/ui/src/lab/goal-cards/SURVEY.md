# VW-386 — Gate 1 overlap survey: `GoalLiftCard` / `MuscleGroupCard`

Unit: the first unit of the `#/goals` design wave. Branch `feat/VW-386-goal-cards`,
cut from `origin/main` at `0885fe4` (`3eb089b` is an ancestor).

## What triggered it

The human, 2026-09-14, on the rendered `#/goals` SPA page:

> Cards need to use the proper surfaces and elevations. There is a ton of distance between
> the labels on the right and the data on the left of those wide cards, it should be grouped
> more tightly and more elegantly, maybe a grid of paper cards per lift / muscle group rather
> than rows.

The consumer is `voltras-mcp` `src/dashboard/spa/goals/GoalsView.tsx` (commit `7b4cca3`,
not on that repo's checked-out branch — read via `git show`). Two shapes are in scope:

| Consumer block      | Today                                                                                                         | Data available per item                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `PerLiftTable`      | one full-width flex row per lift: label `flex:1`, `Pill` in a `width:140` box, `Caption` in a `width:220` box | exercise label, `status`, `nextMilestone.label` ("105 x 8 in week 5"), `committed`, `stretch`, `actuals[]` (with `isPR`) |
| `MuscleRollupPanel` | one full-width flex row per muscle: name `flex:1`, `Pill` at 140, `Caption` at 260                            | muscle name, `status`, `rollup.summary`, count of lifts on track                                                         |

The fixed 140/220/260 right-hand boxes inside a wall-width `PanelCard` are literally the "ton
of distance" — the label and its data are pinned to opposite edges of a ~1800px row.

`status` vocabulary (from `goals-model.ts`): `on_track · ahead · behind · tolerated ·
deload_week · calibrating · stalled`, mapped to four Pill tones (`success · info · warning`);
`ahead` is **info, never amber** (REJECTED.md "Amber holds").

## Inputs

- `packages/ui/src/arch/arch-graph.json` — **fresh**: `arch-graph.freshness.test.ts` passes
  4/4 against the current barrel hash, so no reindex was needed
  (and per the standing note, only the barrel hash is ever hand-updated, never a full `--reindex`).
- `packages/ui/MATURITY.md`, `packages/ui/REJECTED.md`, `packages/ui/DEPRECATIONS.md`,
  `packages/ui/docs/library-roadmap.md`.

## Overlap inventory

Everything stable or in lab that does similar work or shares an element with either candidate.

### Containers and depth

| Thing                            | Status                                | Overlap                                                                                                                                                                     | Use it?                                                                              |
| -------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Surface` (ui)                   | `stable`, atom                        | Owns the plane and the on-surface colour context. `PLANE_ORDER` is six: `frame · background · base · elevated · raised · overlay` (`inset` rejected 2026-09-10 at ΔE 1.10). | **Yes, for the page only.** `level` is documented "shell roots only".                |
| `Card` (ui)                      | `stable`, molecule, 10 lib dependents | Lifts `elevation` planes above the enclosing Surface, wears the lift (rim + ambient shadow) and republishes its own plane as context.                                       | **Yes, for every card.** Roadmap decision 1: "`Card` is the only content container." |
| `Section` / `SectionHeader` (ui) | `stable`                              | Titled block with `trailing`. Roadmap decision 1 says these become Card presets, not deletions.                                                                             | Yes, for the "Per-lift" / "Muscle priorities" group headings.                        |
| `PanelCard` (voltras-mcp)        | consumer-local                        | The current container. Not titan, does not step the Surface ladder — this is exactly the "proper surfaces and elevations" complaint.                                        | No. Replaced by page `Surface` + `Card`.                                             |

The human's first sentence resolves to: page is `<Surface level="base">`, each card is
`<Card elevation={1}>`. That satisfies both the brief and roadmap decision 1 — no raw
`Surface` per card.

### Status

| Thing                                   | Status                                                                    | Overlap                                                                                                                                                                      | Use it?                                        |
| --------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `Pill` (ui)                             | `stable`, atom, **11 lib dependents** — the most-used atom in the library | tone × variant × 4 sizes, `leading="dot"`, semantic tones incl. `info`.                                                                                                      | **Yes.** It is already what `GoalsView` calls. |
| `MesoStatusCard`'s private `StatusPill` | not exported                                                              | A hand-rolled duplicate of `Pill size="sm" variant="subtle"` with its own alpha maths and a raw `fontSize: 10` `<Text>`. Its own comment admits "this is Pill's `sm` shape". | No — see the promotion note below.             |
| `StatusPill` (custom/Workout)           | `candidate`, `keep-app`, **0 lib dependents**                             | Different vocabulary entirely (`productive · threshold · stop`), not the goals statuses.                                                                                     | No.                                            |
| `Indicator` (ui)                        | `stable`                                                                  | The generic dot. Standardised-on per gotcha #9.                                                                                                                              | Only via `Pill leading="dot"`.                 |
| `PrBadge` (custom/Workout)              | `candidate`, 3 dependents                                                 | The `isPR` affordance. `compact` prop exists; `GoalsView` already uses it in the header.                                                                                     | **Yes**, `compact`.                            |

### Metric pair (committed / stretch)

| Thing                                    | Status                                                    | Overlap                                                                                     | Use it?                                                                             |
| ---------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Tile` (ui)                              | **`candidate` — `@deprecated`** (DEPRECATIONS.md, AW-127) | label + value + `valueColor`. Exactly the shape needed.                                     | **No.** Its documented replacement is a "Card stat preset" that does not exist yet. |
| `Metric` / `MetricGroup` (custom/Metric) | `candidate`, atom, `keep-core`, 3 dependents              | `value` / `label` / `unit` / `trend` on `result-improve                                     | degrade                                                                             | inconclusive`, 3 sizes. | **Yes** — the closest live primitive, and `result-*` is the correct family for "a value got better/worse". |
| `MetricTiles` (custom/Workout)           | `candidate`, molecule, `keep-core`, 2 dependents          | `MetricTileData[]` + `gap`; a row of tiles. `GoalsView`'s `WholeBodyPanel` already uses it. | Yes as the compact pair, but it wraps the deprecated `Tile` shape.                  |
| `DataRow` (ui)                           | `stable`, atom, 2 dependents                              | label-left / value-right. This is the primitive the wide rows _should_ have used.           | Only inside a card, where the row is ~300px and the gap is small.                   |

### Trend

`CircularProgress` is not a trend primitive — but a small line primitive **does** exist, so the
"otherwise omit" branch of the brief does not apply:

| Thing                                        | Status                                                                            | Overlap                                                                                                                              | Use it?                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `Sparkline` (custom/Workout)                 | `candidate`, molecule, `keep-internal`, 3 dependents, flagged `deadByAssociation` | `data: number[]`, `width`/`height`/`color`, `showDots`, `highlightLast`, **and `referenceLines`** (value + colour + dashed + label). | **Yes.** `referenceLines` maps 1:1 onto committed and stretch. |
| `SparkBars` (custom/charts)                  | `candidate`, atom, `keep-internal`, 2 dependents                                  | The bar-shaped alternative, `maxBars`, `negativeColor`.                                                                              | Alternative only.                                              |
| `GhostSpark` / `DualGhostSpark` (ActiveWork) | `candidate`, `keep-internal` / `keep-app`                                         | Spark shapes, but ActiveWork-domain semantics.                                                                                       | No.                                                            |
| `GoalTrajectoryChart` (custom/Workout)       | `candidate`                                                                       | The full trajectory chart — the goals page header, rendered at 1200×340.                                                             | No. It is the hero; `Sparkline` is its card-scale sibling.     |

### The muscle side

| Thing                                 | Status                                     | Overlap                                                                                             | Use it?                                                                 |
| ------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `MuscleStrip` (#226)                  | `candidate`; not indexed in the arch graph | All 15 `MuscleGroupChip`s in one wrapping row, each `name sets/target`, coloured by `volumeStatus`. | No — different semantics, see below.                                    |
| `MuscleGroupChip`                     | `candidate`                                | name + `volumeStatus` colour + `onPress`.                                                           | No, same reason.                                                        |
| `muscleTaxonomy`                      | `candidate`                                | `MuscleGroup` enum + `MUSCLE_DISPLAY_NAMES`.                                                        | Reference only; the goals rollup keys off priority `ref`, not the enum. |
| `SessionRail` tiles / `ScheduleTiles` | `candidate`, `keep-internal`               | Tile-grid layout precedent.                                                                         | Layout reference only.                                                  |

`MuscleStrip` is **volume-landmark** semantics (sets against MAV), not **goal** semantics
(`status` + rollup summary + lifts-on-track). Same noun, different measurement — reusing it
would collide two meanings on one colour channel, the failure reference 02 warns about.

### The big one — `MesoStatusCard`

`custom/Workout`, organism, `candidate`, 2 lib dependents, flagged `deadByAssociation`, and
**#4 on the arch graph's `extractionTop`** (score 76: 17 raw `View`s, 11 raw `Text`s, 24 inline
styles, 453 LOC). It is already the `#/goals` header.

It renders name + status pill + subtitle + basis + a 2-up metric grid + gauges + a coaching box

- a next-target box, on `Card variant="outline" elevation={1}` with a brand gradient fill and a
  3px brand accent bar.

`GoalLiftCard`'s content is a strict **subset** of that: label, status, next milestone,
committed/stretch. So "a MesoStatusCard size variant" is a live and honest answer, and it is
rendered as **direction C** so the human can compare it rather than take my word for it.

Two things argue against it being the whole answer:

1. **Its chrome is hero chrome.** The brand gradient + 3px brand accent say "this is the one
   thing on the page." In a 3–4-up grid of peers, every card shouting that says nothing.
2. **Its internals are not primitives.** Private `StatusPill`, `MetricCell` and `Gauge` with
   raw `fontSize: 10/13/15` `<Text>`s. Adding a `density` prop threads a fifth axis through
   453 lines of already-flagged extraction debt instead of paying it down.

## Verdicts

### `GoalLiftCard` — **INVEST**, as a compact card, pending the rendered comparison

Three lines:

1. Nothing in the library renders a lift's goal state at card scale; the only thing close is
   `MesoStatusCard`, whose hero chrome and 453 lines of extraction debt are wrong for a peer grid.
2. It is pure composition — `Card` + `Pill` + `Typography` + `Metric` + `Sparkline` + `PrBadge`
   — so it adds a layout and a prop API, not new visual vocabulary.
3. **Conditional:** if the human picks direction C (MesoStatusCard variant) over A or B, this
   verdict flips to _merge-with-MesoStatusCard_ and the unit becomes a `density` prop plus an
   extraction pass on that file. The specimen exists to make that a rendered choice.

Must compose: `Card` (elevation 1) · `Pill` (status, `sm`) · `Typography` (`subtitle2` name,
`caption` milestone, `microLabel` metric labels) · `Metric` (committed/stretch) · `Sparkline`
(`referenceLines` at committed and stretch) · `PrBadge` (`compact`).

### `MuscleGroupCard` — **MERGE WITH `GoalLiftCard`**

Three lines:

1. Its data is the same five slots as a lift card — name, status, a summary sentence, a count,
   no series — so a second component would be the same layout with one field renamed.
2. `MuscleStrip`/`MuscleGroupChip` already own the muscle noun, but on **volume-landmark**
   semantics (sets vs MAV), not goal status; reusing them would overload one colour channel
   with two meanings.
3. Ship it as `<GoalLiftCard variant="rollup">` (or a thin `GoalRollupCard` wrapper over the
   same internals) — one card component, two content presets, which is also what keeps the
   grid visually coherent when both appear on one page.

## Elements that may need promotion to a shared primitive

Two, both justified by a second consumer rather than a note:

1. **A `Card` stat preset (the `Tile` replacement).** DEPRECATIONS.md already names
   "`Card` stat preset (decision 1)" as `Tile`'s successor and it has never been built. Two
   consumers today: the `Tile` migration itself (4 lib dependents), and this unit's
   committed/stretch pair. Until it exists the specimen uses `Metric`, which is the closest
   live primitive and carries the correct `result-*` family. **Recommend building it in the
   harden step**, not in the specimen.

2. **Collapsing `MesoStatusCard`'s private `StatusPill` onto `Pill`.** Two consumers:
   `MesoStatusCard` itself and this unit, which needs the identical sm subtle status capsule.
   The private copy's own comment concedes it is "Pill's `sm` shape". This is a deletion, not
   a promotion — worth ~40 lines and three raw `fontSize`es off the #4 extraction target.
   **Out of scope for this turn**; flagged for the harden step.

Not promoting: the milestone line ("105 x 8 in week 5") is a formatted string from the
consumer's read model, not a titan element. It stays `Typography`.

## Constraints carried into the specimen

- Layout via `style` (RNW drops Tailwind layout utilities); spacing via semantic
  `className` keys, which do survive — `MuscleStrip`'s own comment documents the split.
- `src/lab/**` is **not** enrolled in `titan/no-raw-spacing`. Written on the keys anyway,
  so the file passes the rule the day lab is enrolled.
- Colour from `Surface` / `useOnSurfaceColor` / semantic tokens only. No raw hex.
- `ahead` is `info`, never `warning` — REJECTED.md, "Amber holds".
- `Sparkline` takes a resolved colour string, so its colours come from `resolveColor(token)`,
  not a class (gotcha #5).
