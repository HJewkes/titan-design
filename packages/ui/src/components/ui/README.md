# `ui/*` — the generic primitive family

The domain-free tier: components of any size, atom to organism, that know nothing about workouts,
sessions or initiatives. `ui/*` may import `theme`, `utils`, `hooks`, `icons` and `ui/*` siblings,
and never `custom/*` or `shell/*`. Placement rule: `CLAUDE.md`, Placement.

This README is the **index**. It maps each primitive's dependencies
(**composes ↓**) and its consumers (**used-by ↑**) so the tree navigates in both
directions and a hand-rolled element that should have reached for an existing
primitive is visible. Storybook mirrors it under
`Components/Atoms|Molecules|Organisms/…`; each primitive's autodocs page repeats
its Composes links.

Counts below are generated, not hand-kept: they come from
[`src/arch/arch-graph.json`](../../arch/arch-graph.json) (regenerate with
`pnpm arch:graph`, which `arch-graph.freshness.test.ts` keeps honest). **In-repo**
is in-library consumers; **external** is import sites in the three checkouts the
graph scans (voltras mobile, voltras-mcp, codewatch dashboard). It is a floor,
not a census: `docs/audits/2026-09-08-critique-addenda.md` §D1 found seven
downstream checkouts, and audiobook/frontend — the one that tracks HEAD — is not
among the three.

## The one rule this family exists to enforce

A primitive here is the _only_ implementation of its shape. When a family needs
a rule, a pill, a dot or a plane, it composes `ui/*` — it does not draw one. The
audit that produced this file found four container primitives competing and
twelve pill-shaped components; roadmap decisions 1, 3, 4, 5, 10 and 11 collapsed
them, and the survivors are marked as presets below.

## Dependency map

| Component        | Tier     | Composes ↓      | Used-by ↑ (in-repo)                                                                                                                                            | In-repo | External |
| ---------------- | -------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- |
| `alert`          | atom     | —               | — (app-facing leaf)                                                                                                                                            | 0       | 6        |
| `autocomplete`   | molecule | Surface         | —                                                                                                                                                              | 0       | 0        |
| `avatar`         | atom     | —               | —                                                                                                                                                              | 0       | 0        |
| `badge`          | molecule | Pill, Indicator | BodyMapDetailPanel, MesoCard, ReadinessCheck                                                                                                                   | 3       | 3        |
| `breadcrumbs`    | atom     | —               | —                                                                                                                                                              | 0       | 0        |
| `button`         | atom     | —               | examples                                                                                                                                                       | 1       | 17       |
| `card`           | molecule | Surface         | CoChangeChip, FileActivityDetail, FileHistoryExplorer, InitiativeCard, MesoCard, MesoStatusCard, PortfolioOverview, ReadinessCheck, SessionDetail, WorkoutCard | 10      | 74       |
| `checkbox`       | atom     | —               | examples                                                                                                                                                       | 1       | 0        |
| `chip`           | molecule | Pill            | — (external-only preset)                                                                                                                                       | 0       | 0        |
| `collapse`       | atom     | —               | SessionDetail                                                                                                                                                  | 1       | 0        |
| `data-row`       | atom     | —               | FileActivityDetail, VolumeLandmarkBar                                                                                                                          | 2       | 2        |
| `divider`        | atom     | —               | FileHistoryExplorer, OpenLoops, SessionDetail, SessionList, TopBar                                                                                             | 5       | 2        |
| `drawer`         | molecule | Surface         | PrHistoryModal                                                                                                                                                 | 1       | 6        |
| `empty-state`    | molecule | —               | EmptyLiveView (lab)                                                                                                                                            | 1       | 11       |
| `eyebrow`        | molecule | Typography      | FileActivityDetail, FileHistoryExplorer, InitiativeBrief, OpenLoops, PortfolioOverview, SessionList, TaskTable                                                 | 8       | 0        |
| `form-field`     | atom     | —               | examples                                                                                                                                                       | 1       | 0        |
| `help-tip`       | molecule | Surface         | — **deprecated**, use Tooltip                                                                                                                                  | 0       | 0        |
| `icon-box`       | atom     | —               | —                                                                                                                                                              | 0       | 0        |
| `indicator`      | atom     | —               | Badge, DeviceRow, SessionStatePill, SeverityLabel                                                                                                              | 6       | 0        |
| `input`          | atom     | —               | examples                                                                                                                                                       | 1       | 1        |
| `link`           | atom     | —               | —                                                                                                                                                              | 0       | 0        |
| `list-item`      | atom     | —               | — (app-facing leaf)                                                                                                                                            | 0       | 9        |
| `menu`           | molecule | Surface         | —                                                                                                                                                              | 0       | 0        |
| `modal`          | molecule | Surface         | —                                                                                                                                                              | 0       | 0        |
| `pill`           | atom     | —               | Badge, Chip, CoChangeChip, FileActivityDetail, InitiativeCard, InitiativeHeader, MuscleGroupChip, OpenLoops, SessionDetail, StatusPill, TaskRow                | 11      | 1        |
| `popover`        | molecule | Surface         | DeviceMenu                                                                                                                                                     | 1       | 0        |
| `progress`       | atom     | —               | CircularTimer                                                                                                                                                  | 1       | 2        |
| `radio`          | atom     | —               | examples                                                                                                                                                       | 1       | 2        |
| `section`        | atom     | —               | — (app-facing leaf)                                                                                                                                            | 0       | 10       |
| `select`         | molecule | Surface         | examples                                                                                                                                                       | 2       | 1        |
| `skeleton`       | atom     | —               | —                                                                                                                                                              | 0       | 0        |
| `spinner`        | atom     | —               | — (app-facing leaf)                                                                                                                                            | 0       | 2        |
| `stack`          | atom     | —               | MetricTiles, ScheduleTiles                                                                                                                                     | 2       | 27       |
| `surface`        | atom     | —               | Autocomplete, Card, DashboardShell, Drawer, HelpTip, LiveFatigueCard, Menu, Modal, Popover, Select, SessionHeader, SessionRail, Toast, ToolbarButton, Tooltip  | 15      | 29       |
| `switch`         | atom     | —               | —                                                                                                                                                              | 0       | 0        |
| `tabs`           | atom     | —               | —                                                                                                                                                              | 0       | 0        |
| `tile`           | atom     | —               | FileActivityDetail, FileHistoryExplorer, MetricTiles, ScheduleTiles — **deprecated**, use a Card stat preset                                                   | 4       | 0        |
| `toast`          | molecule | Surface         | —                                                                                                                                                              | 0       | 0        |
| `toolbar-button` | molecule | Surface         | —                                                                                                                                                              | 0       | 0        |
| `tooltip`        | molecule | Surface         | FatigueLights, GoalMilestoneWeekStrip, GoalPriorityIcon, GoalTrajectoryChart, PrimaryGoalCard, SessionDetail, SessionListItem, Table, TaskRow, ZoneTrack       | 8       | 1        |
| `typography`     | atom     | —               | Every family — 49 in-repo call sites across `custom/`, `shell/` and `lab/`                                                                                     | 49      | 11       |

Two roots carry the family: **`surface`** (15 in-repo consumers — every floating
and raised plane) and **`pill`** (11 — every pill-shaped label since decision 3).
Nothing else in `ui/*` is composed by more than six.

`trigger` (`TriggerSurface`) has no row. It is an internal helper, not exported
from the barrel and without a story, that `Menu`, `Popover` and `Tooltip` use to
hand interaction to a composed child instead of nesting a second `Pressable`.

`typography` keeps the story title `Foundations/Typography` rather than moving under
`Components/`. It is a foundation in the six-group taxonomy (`CLAUDE.md`, Storybook
Pattern), and seven in-repo autodocs links already point at `foundations-typography--docs`.
`eyebrow` was already titled `Components/Molecules/Eyebrow` before the move.

## Reuse audit — where `ui/*` still hand-rolls

| Leaf                                                     | Should compose                    | Status                                                                                                                                                                             |
| -------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text runs (79 raw `<Text>` in 27 files)                  | `Typography`                      | **Unblocked** (#277), not yet done. Migration M2 moved `Typography` into `ui/typography`, so the import is legal now; the 79 runs are still hand-styled.                          |
| Pill-shaped labels                                       | `Pill`                            | **Closed** (#172). `Badge` and `Chip` now render `<Pill>`; the six folded-in variants are in `DEPRECATIONS.md`.                                                                    |
| Status dots                                              | `Indicator`                       | **Closed** for `ui/*`. `StatusDot` (Workout) is deprecated toward `Indicator` (decision 10).                                                                                       |
| Raised / floating planes                                 | `Surface` (`raise` / `elevation`) | **Closed** (#166, #173). Eleven molecules compose `Surface` rather than setting `bg-surface-*` themselves.                                                                         |
| Rules and separators (20 `border-hairline*` in 12 files) | `Divider`                         | **Partly open.** Decision 4 allows `border-hairline` only on Card `outline`/`subtle`, Table rules and input borders — `Select`, `Radio`, `Drawer` and `Tabs` still draw their own. |
| Tooltip-with-a-label lockup                              | `Tooltip` + your own label        | **Closed** by deprecation. `HelpTip` and `LabelWithHelp` are retired (decision 5).                                                                                                 |

## Watch list

- **`Typography` can be composed here now.** Migration M2 (#277) moved it to
  `ui/typography` and `Eyebrow` to `ui/eyebrow`, so the tier order no longer forbids
  the import. The 79 raw `<Text>` runs above are unblocked, not fixed — converting
  them is its own task.
- **Fourteen primitives read as dead** — `autocomplete`, `avatar`, `breadcrumbs`,
  `chip`, `help-tip`, `icon-box`, `link`, `menu`, `modal`, `skeleton`, `switch`,
  `tabs`, `toast`, `toolbar-button`. That is not automatically a delete: the graph
  sees three of seven downstream checkouts, and `Chip` in particular has a known
  consumer (audiobook/frontend, §D1) the graph cannot see. Settle per component
  under roadmap E6.4, not by reading this table.
- **`modal` and `menu` read dead while `drawer` and `popover` do not.** The
  overlay set is mid-migration onto the floating lift (E1); recheck after the
  trigger work lands rather than treating the split as a decision.

## Maturity

Status tags on these stories are derived, not chosen — the rule is in
[`MATURITY.md`](../../../MATURITY.md). Membership in the dependency map above is
one of its three inputs, so **adding a primitive here without adding its row
leaves it `status:candidate`**.
