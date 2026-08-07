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
```

## Dependency map

| Component             | Tier     | Composes ↓                                                             | Used-by ↑                                                  |
| --------------------- | -------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| `PortfolioOverview`   | organism | Card, Metric, Eyebrow, InitiativeCard                                  | app root (`Lab/ActiveWork/Portfolio Overview` specimen)    |
| `InitiativeCard`      | card     | Card, Pill, StatusDot, SegmentedBar, Typography                        | PortfolioOverview                                          |
| `FileHistoryExplorer` | organism | Card, Tile, Divider, Eyebrow, FileActivityRow/Detail, CoChangeChip     | app root (`Lab/ActiveWork/File History Explorer` specimen) |
| `FileActivityDetail`  | card     | Card, Tile, Pill, DataRow, DateTime, SparkBars, FilePathLabel, Eyebrow | FileHistoryExplorer                                        |
| `FileActivityRow`     | row      | FilePathLabel, SparkBars, Typography                                   | FileHistoryExplorer                                        |
| `CoChangeChip`        | molecule | Card, Pill, FilePathLabel, Typography                                  | FileHistoryExplorer                                        |
| `FilePathLabel`       | molecule | Typography (`mono`)                                                    | FileActivityRow, FileActivityDetail, CoChangeChip          |
| `Eyebrow`             | molecule | Typography (`overline`)                                                | PortfolioOverview, FileHistoryExplorer, FileActivityDetail |

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

Two distinct colour vocabularies live in this family and must not be conflated: `FILE_EVENT_COLOR`
(read / write / edit — _what kind of event_) and `GROWTH_COLOR` (added / removed / neutral — _char deltas_).
Both are token-sourced. Reusing the event palette for growth stats reads as a category the numbers aren't.

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
- Lint guardrails: no inline hex outside the token-sourced `SEVERITY_COLOR` / `FILE_EVENT_COLOR` /
  `GROWTH_COLOR` maps; no
  re-implemented status dot, segmented bar, or sparkline.
