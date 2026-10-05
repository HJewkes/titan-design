# `custom/*`: domain families

A directory here knows one domain's vocabulary and is shared by that domain's products. It composes
`ui/*` and may never be imported by it. A component with no domain concept in its props, types or
labels belongs in `ui/` (`CLAUDE.md`, Placement). Status here is `candidate` by rule (`MATURITY.md`).

| Family       | Domain                                                                                           | Products                                | Index                  |
| ------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------- | ---------------------- |
| `Workout`    | sets, reps, mesocycles, goals                                                                    | voltras-mcp dashboard, voltras mobile   | `Workout/README.md`    |
| `Fatigue`    | velocity loss, ROM, readiness                                                                    | voltras-mcp dashboard                   | `Fatigue/README.md`    |
| `ActiveWork` | initiatives, tasks, task stages, file activity                                                   | active-work dashboard                   | `ActiveWork/README.md` |
| `Chat`       | chat messages and participants (`ChatMessage`, `Participant` from `@titan-design/chat-protocol`) | coach chat preset (`CoachPreset` story) | `Chat/README.md`       |
| `charts`     | workout bar marks (`SetBarChart`, `live-rep-growth`, `flatBarGeometry`)                          | Workout, Fatigue                        | `charts/README.md`     |

## Generic directories awaiting a move to `ui/`

Tracked in `custom-families.baseline.json`; the list only shrinks. Do not add to it.
`Metric`, `Prose`, `Sidebar`, `stepper`, `TimerReadout`, `CircularTimer`. `Typography` and `ActiveWork/Eyebrow` left under migration M2 and now live in
`ui/typography` and `ui/eyebrow`; `EmptyState` left under migration M3 and now lives in
`ui/empty-state`; `Table` left under migration M4 and now lives in `ui/table`. `DateTime` left under migration M7 (TD-428) and now lives in
`ui/date-time`; `custom/DateTime` is a shim. `Scatter`, `Treemap` and `Gauge` left under migration M8 (TD-471) and now live in
`ui/charts/scatter`, `ui/charts/treemap` and `ui/charts/gauge`; their `custom/` directories are shims. `custom/Typography`,
`custom/EmptyState` and `custom/Table` are shims that disappear in 0.23.0.
