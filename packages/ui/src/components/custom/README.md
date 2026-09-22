# `custom/*`: domain families

A directory here knows one domain's vocabulary and is shared by that domain's products. It composes
`ui/*` and may never be imported by it. A component with no domain concept in its props, types or
labels belongs in `ui/` (`CLAUDE.md`, Placement). Status here is `candidate` by rule (`MATURITY.md`).

| Family       | Domain                                                                  | Products                              | Index                  |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------- | ---------------------- |
| `Workout`    | sets, reps, mesocycles, goals                                           | voltras-mcp dashboard, voltras mobile | `Workout/README.md`    |
| `Fatigue`    | velocity loss, ROM, readiness                                           | voltras-mcp dashboard                 | `Fatigue/README.md`    |
| `ActiveWork` | initiatives, tasks, file activity                                       | active-work dashboard                 | `ActiveWork/README.md` |
| `charts`     | workout bar marks (`SetBarChart`, `live-rep-growth`, `flatBarGeometry`) | Workout, Fatigue                      | `charts/README.md`     |

## Generic directories awaiting a move to `ui/`

Tracked in `custom-families.baseline.json`; the list only shrinks. Do not add to it.
`Table`, `Metric`, `DateTime`, `Prose`, `Sidebar`, `stepper`, `TimerReadout`, `CircularTimer`,
`Scatter`, `Gauge`, `Treemap`. `Typography` and `ActiveWork/Eyebrow` left under migration M2 and
now live in `ui/typography` and `ui/eyebrow`; `EmptyState` left under migration M3 and now lives in
`ui/empty-state`. `custom/Typography` and `custom/EmptyState` are shims that disappear in 0.23.0.
