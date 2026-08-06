# ActiveWork — component family

Presentational components for surfacing `active-work` initiative/task data (portfolio status, per-initiative
rollups). Read-only: every component takes plain data as props and has no fetch/store dependency of its own —
wiring to a live source (the active-work session-mining export, or a future API) is entirely the caller's
concern. Components live flat on disk; the tiering below is a documentation contract, not a directory layout.

## Composition tree

```
PortfolioOverview ................ organism
├─ Eyebrow ....................... molecule → Typography (overline)
├─ Card + Metric .................. (existing primitives, used inline for the KPI row)
└─ InitiativeCard ................ card
   ├─ Card ........................ (existing primitive)
   ├─ Pill ........................ (existing primitive)
   ├─ StatusDot .................... (Workout family primitive)
   └─ SegmentedBar ................. (Workout family primitive)
```

## Dependency map

| Component           | Tier     | Composes ↓                                      | Used-by ↑                                                       |
| ------------------- | -------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `PortfolioOverview` | organism | Card, Metric, Eyebrow, InitiativeCard           | app root (`Lab/ActiveWork/Portfolio Overview` specimen)         |
| `InitiativeCard`    | card     | Card, Pill, StatusDot, SegmentedBar, Typography | PortfolioOverview                                               |
| `Eyebrow`           | molecule | Typography (`overline`)                         | PortfolioOverview, and any section header needing a micro-label |

## Shared substrates introduced here (reusable beyond this family)

- **`Eyebrow`** — a generic uppercase micro-label. Not active-work-specific; exported at
  `Components/Molecules/Eyebrow` (not nested under `ActiveWork/`) so any family can reach for it instead of
  hand-rolling `Typography` + tracking/uppercase classes again.

## Reuse audit

| Concern            | Uses                                    | Not                                                             |
| ------------------ | --------------------------------------- | --------------------------------------------------------------- |
| status dot + label | `StatusDot` (Workout family)            | the original Lab specimen's hand-rolled `DotLabel` (deleted)    |
| severity mix bar   | `SegmentedBar` (Workout family)         | the original Lab specimen's hand-rolled `SeverityBar` (deleted) |
| stat tiles         | `Card` `variant="filled"` + `Metric`    | a new stat-tile primitive (existing composition already fits)   |
| card chrome        | `Card` (`accent` / `outline`)           | ad-hoc bordered `View`                                          |
| colors             | `getSemanticColors` / `greyRamp` tokens | magic hex                                                       |

**Watch-list (known gaps):**

- `InitiativeCard`'s state→`StatusDot` variant mapping (`focused → on-track`, `backburner → future`,
  `paused → deviation`, `done → success`) is a first-pass color choice, not yet operator-confirmed against a
  render — flagged for Gate 2 review rather than blocking hardening on a separate round-trip.
- The live data wiring (active-work → `PortfolioOverview` props) still lives only in the
  `titan-aw-dashboard` Lab specimen's story file, not in a shared adapter. Promoting that mapping out of the
  specimen is a follow-up, not part of this unit.

## Testing

- Unit: `*.test.tsx` per component (render/behavior/a11y via `jest-axe`); branch coverage on state/rank/topTask
  presence and the all-zero-severity case.
- Visual: not yet added to `tests/visual/stories.spec.ts` — see follow-up in the PR description.
- Lint guardrails: no inline hex outside the `SEVERITY_COLOR` map (token-sourced), no re-implemented status
  dot or segmented bar.
