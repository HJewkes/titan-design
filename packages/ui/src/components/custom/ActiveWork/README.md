# ActiveWork — component family

Presentational components for surfacing `active-work` data: initiative/task rollups (portfolio status) and
per-file mined history (the file-history explorer). Read-only: every component takes plain data as props and
has no fetch/store dependency of its own — wiring to a live source (the active-work session-mining export, or
a future API) is entirely the caller's concern. Components live flat on disk; the tiering below is a
documentation contract, not a directory layout.

## Composition trees

```
PortfolioOverview ................ organism
├─ Eyebrow ....................... molecule → Typography (overline)
├─ Card + Metric .................. (existing primitives, used inline for the KPI row)
└─ InitiativeCard ................ card
   ├─ Card ........................ (existing primitive)
   ├─ Pill ........................ (existing primitive)
   ├─ StatusDot .................... (Workout family primitive)
   └─ SegmentedBar ................. (Workout family primitive)

FileHistoryExplorer .............. organism
├─ Tile .......................... (existing primitive, KPI strip)
├─ Card + Divider ................ (existing primitives)
├─ Eyebrow ....................... molecule
├─ FileActivityRow ............... row          (listbox `option`)
│  ├─ FilePathLabel .............. molecule → Typography (mono)
│  └─ SparkBars .................. atom         (Components/Charts — new shared primitive)
├─ FileActivityDetail ............ card
│  ├─ Tile / Pill / DataRow / DateTime .... (existing primitives)
│  ├─ SparkBars .................. atom
│  ├─ FilePathLabel .............. molecule
│  └─ Eyebrow .................... molecule
└─ CoChangeChip .................. molecule
   ├─ Card + Pill ................ (existing primitives)
   └─ FilePathLabel .............. molecule

TaskTable ........................ organism
├─ Eyebrow ....................... molecule
├─ Table (density="dense") ....... (existing primitive, Table family)
│  └─ useTable ({ comparators }) . (existing hook, Table family)
├─ SeverityLabel ................. molecule      (legend tallies)
└─ TaskRow ....................... row
   ├─ TableRow + TableCell ....... (existing primitives, Table family)
   ├─ SeverityLabel .............. molecule → Indicator
   └─ Pill ....................... (existing primitive)
```

## Dependency map

| Component             | Tier     | Composes ↓                                                                   | Used-by ↑                                                             |
| --------------------- | -------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `PortfolioOverview`   | organism | Card, Metric, Eyebrow, InitiativeCard                                        | app root (`Lab/ActiveWork/Portfolio Overview` specimen)               |
| `InitiativeCard`      | card     | Card, Pill, StatusDot, SegmentedBar, Typography                              | PortfolioOverview                                                     |
| `FileHistoryExplorer` | organism | Card, Tile, Divider, Eyebrow, FileActivityRow/Detail, CoChangeChip           | app root (`Lab/ActiveWork/File History Explorer` specimen)            |
| `FileActivityDetail`  | card     | Card, Tile, Pill, DataRow, DateTime, SparkBars, FilePathLabel, Eyebrow       | FileHistoryExplorer                                                   |
| `FileActivityRow`     | row      | FilePathLabel, SparkBars, Typography                                         | FileHistoryExplorer                                                   |
| `CoChangeChip`        | molecule | Card, Pill, FilePathLabel, Typography                                        | FileHistoryExplorer                                                   |
| `FilePathLabel`       | molecule | Typography (`mono`)                                                          | FileActivityRow, FileActivityDetail, CoChangeChip                     |
| `TaskTable`           | organism | Table, useTable, TableHeader/Row/HeaderCell, TaskRow, SeverityLabel, Eyebrow | app root (`Custom/ActiveWork/TaskTable`)                              |
| `TaskRow`             | row      | TableRow, TableCell, SeverityLabel, Pill, Typography                         | TaskTable                                                             |
| `SeverityLabel`       | molecule | Indicator, Typography (`caption`)                                            | TaskRow, TaskTable (legend), InitiativeCard (vocabulary)              |
| `Eyebrow`             | molecule | Typography (`overline`)                                                      | PortfolioOverview, FileHistoryExplorer, FileActivityDetail, TaskTable |

## Shared substrates introduced here (reusable beyond this family)

- **`Eyebrow`** — a generic uppercase micro-label. Not active-work-specific; exported at
  `Components/Molecules/Eyebrow` (not nested under `ActiveWork/`) so any family can reach for it instead of
  hand-rolling `Typography` + tracking/uppercase classes again.
- **`SparkBars`** (`components/custom/charts`, `Components/Charts/SparkBars`) — a bar-mark sparkline for a
  signed series, the counterpart to `Sparkline`'s line mark. Domain-neutral and exported top-level, not
  nested under `ActiveWork/`. `custom/charts` gained an `index.ts` that deliberately exports **only**
  `SparkBars`: `SetBarChart` and `live-rep-growth` stay workout-internal and imported by path.
- **`formatCompact` / `formatSignedCompact`** (`utils/number-format`) — `1234 → "1.2k"`, `+514689 → "+514.7k"`.
  Generic dense-readout formatting; no equivalent existed (`workout-format` is domain-specific).

## Changes to existing primitives

- **`DataRow.label` widened from `string` to `ReactNode`** (plus a new `labelClassName`), mirroring how
  `value` already worked. The co-change rows need a rich `FilePathLabel` on the left; the alternative was
  passing `label=""` and hand-rolling the row, which defeats the primitive. Backwards compatible — `string`
  is a `ReactNode` and the string branch is unchanged.
- **`Table` gained a `density` axis** (`comfortable` | `dense`, default `comfortable`). Cell padding is
  chosen once in `CELL_PADDING` and read from context by both `TableHeaderCell` and `TableCell`, so a row's
  header and body halves cannot drift. `TaskTable` is a scannable backlog grid, not a reading table; without
  this it would have had to hand-roll the whole grid to get 34px rows.
- **`useTable` gained per-column `comparators`.** It previously sorted on the raw field value only, which
  cannot express "rank severity critical→low" (alphabetically `low` lands between `high` and `medium`),
  "tie-break on priority", or "read this date newest-first". Columns absent from the map keep the default
  compare, so this is additive. Two ordering rules were also made explicit while in there: `desc` **inverts**
  the comparator rather than reversing the array (reversing also flips tied rows), and blank values rank last
  in **both** directions rather than reading as the smallest value when the column flips.
- **`status-error-vivid` fixed from `#D14343` to `#FF4757`** (both themes). It pointed at `ramp.red[600]`,
  the exact value of `status-error`, so the two rendered as one colour — Critical and High were
  indistinguishable, and so were `DeviceRow`/`DeviceIndicator`'s `lost` state and a plain error. Three other
  places already encoded the correct vivid red (`--color-status-error-vivid-rgb`, the `-subtle` rgba, and
  `Indicator`'s `glow` shadow); only the value anyone rendered was wrong. Found 2026-08-31 by measuring the
  Storybook render, not by reading tokens. Guarded by `theme/status-distinctness.test.ts`, which asks whether
  tokens LOOK different — a question the existing presence/parity tests structurally cannot ask, since a
  collapsed token is present and parity-matched.

## Severity vocabulary has one owner

`SeverityLabel.tsx` owns `TaskSeverity`, `SEVERITY_ORDER`, `SEVERITY_RANK`/`severityRank`, `SEVERITY_META`
(dot colours) and `SEVERITY_BAR_COLOR` (area-mark fills). `InitiativeCard` previously declared its own copy
of the type plus private `SEVERITY_ORDER`/`SEVERITY_COLOR` constants; it now imports them. The two colour
maps stay separate on purpose — `low` is `status-info` as a dot (it must stay legible among four) and
`text-tertiary` as a bar segment (it should recede) — but the _set_ of severities is defined once.

## Reuse audit

| Concern            | Uses                                                | Not                                                                                                                   |
| ------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| status dot + label | `StatusDot` (Workout family)                        | the original Lab specimen's hand-rolled `DotLabel` (deleted)                                                          |
| severity mix bar   | `SegmentedBar` (Workout family)                     | the original Lab specimen's hand-rolled `SeverityBar` (deleted)                                                       |
| bar sparkline      | `SparkBars` (new, `Components/Charts`)              | the specimen's hand-rolled `MiniBars` (deleted); `Sparkline` is a _line_ mark, `SetBar`/`SetStrip` are workout-domain |
| KPI stat boxes     | `Tile` (bare — it already carries `surface-raised`) | the specimen's redundant `Card variant="filled"` wrapper around `Tile`                                                |
| label ↔ value rows | `DataRow` (label widened to `ReactNode`)            | a hand-rolled `flex-row justify-between`                                                                              |
| short dates        | `DateTime` `format="short"` + `fallback`            | the specimen's hand-rolled `shortDate` (deleted)                                                                      |
| compact numbers    | `formatCompact` / `formatSignedCompact` (new util)  | the specimen's inline `compact` / `signedCompact` (deleted)                                                           |
| count badges       | `Pill` `variant="subtle"`                           | ad-hoc bordered `View`                                                                                                |
| card chrome        | `Card` (`accent` / `outline` / `filled`)            | ad-hoc bordered `View`                                                                                                |
| colors             | `getSemanticColors` / `greyRamp` tokens             | magic hex                                                                                                             |

### Colour vocabularies

Two live here and must not be conflated:

- **`FILE_EVENT_COLOR`** — read / write / edit, i.e. _what kind of event_. Two variants ship:
  `FILE_EVENT_COLOR_CATEGORICAL` (**the default** — the canonical CVD-safe palette taken in order, on the
  grounds that the three kinds are peer categories) and `FILE_EVENT_COLOR_SEMANTIC` (the alternative —
  colours by importance, greying reads out). Overridable per component via `eventColors`. Note the default
  spends three of `CATEGORICAL_CVD_SAFE_MAX`: a view that also plots series must start from index 3.
- **`GROWTH_COLOR`** — added / removed / neutral, i.e. _char deltas_. Uses `result-*`, because a file that
  net-shrank was refactored, not broken. `status-error` would say something is wrong. See TOKENS.md §1.

All colours resolve through `resolveColor(token)`, never `getSemanticColors('dark')` — the latter freezes
to the dark hex and silently breaks light theme.

### Surfaces and depth

Follows _Foundations → Depth_ (the current model, fixed in TD-07.16), whose three mechanisms are, in
reach-for order: **tone** (the grey ramp), **hairline** (1px alpha — "what replaced the solid dark border
tokens"), **material** (`paperSheet` / `insetWell`, sparingly). Drop-shadow is not a mechanism below
`FLOATING_ELEVATION_MIN`; nothing here floats, so nothing here casts one.

| Surface                      | Treatment                                                           |
| ---------------------------- | ------------------------------------------------------------------- |
| List pane, detail pane       | `Card variant="subtle"` — a 1px hairline, content-level             |
| Growth block (grouped stats) | `insetWell()` — its stated purpose is grouped/awaiting-data regions |
| KPI tiles, co-change chips   | tone only (`Tile`'s `surface-raised`, `Card variant="filled"`)      |

These were all `Card variant="outline"` first, which was `border-2 border-hairline-strong` — 2px at the
strongest hairline, the heaviest chrome the Card offers, on every surface at once. That is the
"everything is a bordered box" look the depth model explicitly rejects.

**The `Card` primitive was corrected too.** `variant="outline"` is now `border border-hairline-strong`.
The 2px was a defect: a hairline is 1px by definition, and the system varies edge _contrast_
(`hairline-subtle` / `hairline` / `hairline-strong`), not width — `materials.ts` fixed the same class of
mistuned edge by raising an alpha rather than thickening a line. `subtle` and `accent` were already
correctly 1px; `outline` was the outlier, and now sits on that same single axis. This restyles the three
production consumers (`MesoCard`, `MesoStatusCard`, `ReadinessCheck`).

### Token discipline

This family is on the **token-pure** eslint list (`eslint.config.js`, error-level): no raw hex, no
arbitrary spacing/radius/type values, no hardcoded inline `fontSize`, no `getSemanticColors` in a
component. It was brought to zero violations when F1 was hardened — including retrofitting T1, which had
carried 19 arbitrary values in from its specimen. Adding a family to that list is the last step of
hardening it; see TOKENS.md §6.

**Watch-list (known gaps):**

- `InitiativeCard`'s state→`StatusDot` variant mapping (`focused → on-track`, `backburner → future`,
  `paused → deviation`, `done → success`) is a first-pass color choice, not yet operator-confirmed against a
  render — flagged for Gate 2 review rather than blocking hardening on a separate round-trip.
- The live data wiring (active-work → `PortfolioOverview` / `FileHistoryExplorer` props) still lives only in
  the `titan-aw-dashboard` Lab specimen story files, not in a shared adapter. Promoting that mapping out of
  the specimens is a follow-up, not part of this unit.
- `FilePathLabel` is domain-neutral (a file path is not an active-work concept) but every consumer today is
  in this family, so it stays here. Promote it top-level the moment a second family needs it.
- The KPI strip now uses bare `Tile` while `PortfolioOverview` still uses `Card` + `Metric`. The family is
  internally inconsistent until T1 is revisited — deliberate, since changing T1 is out of this unit's scope.

## Accessibility notes

- The ranked list is a real **`listbox`** and each `FileActivityRow` a real **`option`** carrying
  `aria-selected`. This uses raw `role` / `aria-selected` props rather than `accessibilityState={{ selected }}`,
  because **RNW silently drops the latter** — the gap `components/shell/README.md` flags as unresolved for
  `NavItem`, where active state is asserted via an accent-bar testID instead. The same fix applies there.
- React Native's `Role` union has `'option'` but omits `'listbox'`, so `FileHistoryExplorer` casts once
  through a named `LISTBOX_ROLE` constant rather than dropping the ARIA parent.

## Testing

- Unit: `*.test.tsx` per component (render/behavior/a11y via `jest-axe`). Branch coverage on state/rank/topTask
  presence and the all-zero-severity case (T1); on controlled-vs-uncontrolled selection, unmatched
  `selectedPath`, empty `files`, empty `coEdges`, missing touch dates, no-co-change, net-negative growth, and
  `maxRows` / `maxCoEdges` capping (F1).
- Fixtures: `file-history-fixture.ts` — a small hand-trimmed slice of a real mine with fixed values (no
  `Date.now()`, no randomness) so visual baselines stay deterministic.
- Visual: not yet added to `tests/visual/stories.spec.ts` — see follow-up in the PR description.
- Lint guardrails: the token-pure rule set above; no
  re-implemented status dot, segmented bar, or sparkline.
