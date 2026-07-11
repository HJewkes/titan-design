# Component maturity taxonomy

A component's **maturity status** records whether its design has been formally
reviewed and approved for consumption — separate from whether it merely exists
and compiles. It exists so app surfaces (the MCP dashboard, the mobile app) can
depend on the design system without _incidentally pulling in unvetted material_.

## The four statuses

| Status             | Meaning                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| `status:stable`    | Formally reviewed **and approved**; safe to consume in app surfaces.      |
| `status:review`    | **Default.** Exists and may be tested, but not yet formally reviewed.     |
| `status:candidate` | Ported in for review (e.g. from the mobile app or a Lab exploration).     |
| `status:lab`       | WIP exploration. Lives under `Lab/*` and is excluded from publish builds. |

Status is carried as a Storybook **tag**, so it is machine-readable and drives
the sidebar tag-filter (the funnel control) — you can slice the whole library to
just Stable, or just Needs-Review, at a glance.

## Default posture: everything is Needs-Review

`.storybook/preview.tsx` sets a project-level `tags: ['status:review']`, so
**every story inherits `status:review`** with zero per-file annotation. Nothing
is Stable until it is _formally promoted_. This is deliberate: the burden of
proof is on promotion, not on flagging.

## Promoting a component

Promotion is a **one-line edit** on the component's story `meta`, negating the
inherited default and adding the new status:

```ts
const meta: Meta<typeof Foo> = {
  title: 'Workout/Foo',
  tags: ['status:stable', '!status:review'], // ! negates the inherited default
  // ...
}
```

Use `status:candidate` the same way for material ported in for review.

**Do not promote ad hoc.** Promotion happens in a scheduled review session,
working the ranked candidate list below _in order_. See
[the review protocol](#formal-review-protocol).

## Formal review protocol

The Stable list is **not yet applied** — every component currently reads
Needs-Review. The ranked list below is the agenda for a future review session,
scheduled for **after the live workout dashboard ships** (`VW-27`), once the
mobile components and Lab items have been decomposed and ported into Storybook
as `status:candidate`. That lets us review _the full field_ of component
direction in one comprehensive pass rather than blessing today's set in
isolation.

Each session: walk the list top-to-bottom (highest confidence first), and for
each component either promote it (`status:stable`) or record why it stays under
review. Confidence ranking = test coverage · token-cleanliness (no raw hex) ·
design stability · prior vetting.

---

## Ranked Stable candidates (45) — ordered by confidence

Proposed for promotion, highest confidence first. **None are promoted yet.**
Signals: `t`=unit tests, `hex`=raw hex literals in the `.tsx` (token-debt).

### Tier 1 — Very high confidence (heavy coverage, zero token-debt, or session-vetted)

| #   | Component          | Family  | Signals    | Note                                       |
| --- | ------------------ | ------- | ---------- | ------------------------------------------ |
| 1   | VelocityStrip      | Workout | 62t · 0hex | Operator-vetted this session (#96/#97/#98) |
| 2   | ExerciseCard       | Workout | 35t · 0hex | Unified + operator-vetted (#98)            |
| 3   | RestTimer          | Workout | 25t · 0hex |                                            |
| 4   | StrengthTrendChart | Workout | 20t · 0hex |                                            |
| 5   | MesoProgressBar    | Workout | 18t · 0hex |                                            |
| 6   | PrBadge            | Workout | 17t · 0hex |                                            |
| 7   | SetRow             | Workout | 16t · 0hex | Union redesign + operator-vetted (#98)     |
| 8   | SetBar             | Workout | 14t · 0hex |                                            |
| 9   | Sparkline          | Workout | 14t · 0hex |                                            |
| 10  | WeekRow            | Workout | 14t · 0hex |                                            |

### Tier 2 — High confidence (strong coverage, clean or trivial single-hex)

| #   | Component          | Family  | Signals    | Note                                |
| --- | ------------------ | ------- | ---------- | ----------------------------------- |
| 11  | IntensityBar       | Workout | 28t · 2hex | Deep coverage; 2 hex to token-audit |
| 12  | WeightBadge        | Workout | 24t · 1hex |                                     |
| 13  | BodyMapDetailPanel | Workout | 23t · 1hex |                                     |
| 14  | CapacityBandChart  | Workout | 18t · 1hex |                                     |
| 15  | PrHistoryModal     | Workout | 15t · 0hex |                                     |
| 16  | ReadinessCheck     | Workout | 15t · 1hex |                                     |
| 17  | WorkoutCard        | Workout | 15t · 1hex |                                     |
| 18  | MesoCard           | Workout | 15t · 1hex |                                     |
| 19  | SessionHeader      | Workout | 13t · 1hex |                                     |
| 20  | TempoBar           | Workout | 13t · 1hex |                                     |
| 21  | ExerciseHeading    | Workout | 10t · 0hex |                                     |
| 22  | ExerciseIndicator  | Workout | 10t · 0hex |                                     |

### Tier 3 — Solid (good coverage + clean, or minor debt to confirm)

| #   | Component            | Family  | Signals    | Note                             |
| --- | -------------------- | ------- | ---------- | -------------------------------- |
| 23  | InputBar             | Workout | 16t · 1hex |                                  |
| 24  | BodyMap              | Workout | 14t · 0hex | Review `resolveColor` usage (×3) |
| 25  | PlaceholderStrip     | Workout | 11t · 0hex |                                  |
| 26  | SetStrip             | Workout | 11t · 0hex |                                  |
| 27  | MuscleGroupChip      | Workout | 10t · 2hex |                                  |
| 28  | BaseBadge            | Workout | 10t · 2hex |                                  |
| 29  | SegmentedBar         | Workout | 8t · 0hex  |                                  |
| 30  | SegmentedProgressBar | Workout | 8t · 0hex  |                                  |
| 31  | ExerciseCardHeading  | Workout | 7t · 0hex  |                                  |
| 32  | SessionRail          | Workout | 7t · 2hex  |                                  |

### Tier 4 — Stable-leaning, lighter coverage (simple + clean, fewer tests)

| #   | Component      | Family  | Signals   | Note           |
| --- | -------------- | ------- | --------- | -------------- |
| 33  | MetricTiles    | Workout | 6t · 0hex |                |
| 34  | SetsRepsLoad   | Workout | 6t · 0hex |                |
| 35  | SetTableHeader | Workout | 5t · 0hex | Reworked (#98) |
| 36  | ScheduleTiles  | Workout | 3t · 0hex | Coverage light |

### Shell family (S1 top-bar build — workflow-vetted, uniformly token-clean)

| #   | Component        | Family | Signals   | Note |
| --- | ---------------- | ------ | --------- | ---- |
| 37  | SideNav          | Shell  | 6t · 0hex |      |
| 38  | NavItem          | Shell  | 5t · 0hex |      |
| 39  | DashboardShell   | Shell  | 5t · 0hex |      |
| 40  | TopBar           | Shell  | 4t · 0hex |      |
| 41  | DeviceMenu       | Shell  | 4t · 0hex |      |
| 42  | DeviceRow        | Shell  | 4t · 0hex |      |
| 43  | BrandLockup      | Shell  | 3t · 0hex |      |
| 44  | DeviceIndicator  | Shell  | 3t · 0hex |      |
| 45  | SessionStatePill | Shell  | 3t · 0hex |      |

---

## Explicitly Needs-Review (not stable candidates yet)

These stay `status:review` with a specific reason — resolve the reason before
they become promotion candidates.

| Component                 | Reason                                                     |
| ------------------------- | ---------------------------------------------------------- |
| StatusDot                 | Token-debt: 7 raw hex literals                             |
| TempoDisplay              | Token-debt: 9 raw hex literals                             |
| WorkoutPill               | Token-debt: 3 raw hex literals                             |
| DeviationBar              | Token-debt: 2 raw hex literals (prior-audit flag)          |
| setHeadingKit             | Helper, no tests, 22 raw hex — heavy token-debt            |
| MesoStatusCard            | 465 LOC, needs decomposition review (prior-audit flag)     |
| SupersetWrapper           | Prior-audit "stale" flag — confirm still composed anywhere |
| MetricCell (`metricText`) | Untested                                                   |
| ActiveWorkoutPage         | Page surface under active redesign (`VW-27`)               |
| ExerciseDetailPage        | Page/integration surface, not a reusable component         |
| ProgramPlanningPage       | Page/integration surface                                   |
| TrainingStatusPage        | Page/integration surface                                   |

`icons` (custom/Workout) is a pure re-export helper, not a component — excluded
from the taxonomy.

## Generic primitives (`Components/Atoms|Molecules|Organisms|DataViz`)

The ~52 generic primitives (Button, Card, Input, Modal, Table, …) are a separate
foundation tier and are out of scope for this Voltras-workout review pass. They
default to `status:review` like everything else; assess them in their own pass.
