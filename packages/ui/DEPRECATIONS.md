# Deprecations

Exports marked `@deprecated` in code but **not yet removed**. Consumer policy
(`docs/library-roadmap.md`, Standing policies → Consumers): we own every
downstream consumer, so breaking is allowed, but a retiring export is marked
`@deprecated` first so no new usage appears, and each downstream repo gets its
own migration task before the deletion PR.

Consumer column is from `docs/audits/2026-09-08-critique-addenda.md` §D1. Every
export below was found to have **no external consumer**; the listed repos are
in-repo call sites only. Caveat from D1: five of the seven downstream checkouts
pin old versions, so "no consumer" can also mean "nobody upgraded yet".

## Pill family — replaced by the one `Pill` primitive (roadmap decision 3)

| Export                                                                                       | Replacement                       | Known consumers          | Task   |
| -------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------ | ------ |
| `BaseBadge` (+ `BaseBadgeProps`, `BaseBadgeVariant`, `BaseBadgeSize`, `baseBadgeSizeConfig`) | `<Pill tone="…" variant="…">`     | in-repo Workout only     | AW-127 |
| `WorkoutPill` (+ `WorkoutPillProps`, `WorkoutPillStatus`)                                    | `<Pill tone="…" leading="dot">`   | in-repo Workout only     | AW-127 |
| `SessionStatePill`                                                                           | `<Pill tone="…" leading="dot">`   | in-repo shell only       | AW-127 |
| `WeightBadge` (+ `WeightBadgeProps`, `WeightBadgeSize`)                                      | `<Pill tone="neutral">`           | in-repo Workout only     | AW-127 |
| `SeverityLabel`                                                                              | `<Pill tone="…" leading="dot">`   | in-repo ActiveWork only  | AW-127 |
| `CoChangeChip`                                                                               | `<Pill tone="brand" size="xs">`   | in-repo ActiveWork only  | AW-127 |
| `StatusDot` (+ `StatusDotVariant`, `StatusDotProps`)                                         | `Indicator` (roadmap decision 10) | in-repo Workout, Fatigue | AW-127 |

`StatusDot` is marked on the `custom/Workout` barrel rather than in
`StatusDot.tsx`: that module is being edited under E1 in parallel.

## Other consolidations

| Export                                                                         | Replacement                                 | Known consumers      | Task   |
| ------------------------------------------------------------------------------ | ------------------------------------------- | -------------------- | ------ |
| `HelpTip` (+ `HelpTipProps`, `HelpTipSize`, `HelpTipPlacement`, `HelpTipIcon`) | `Tooltip` (roadmap decision 5)              | in-repo `ui/` only   | AW-127 |
| `LabelWithHelp` (+ `LabelWithHelpProps`)                                       | `Tooltip` beside your own label             | in-repo `ui/` only   | AW-127 |
| `MetricCell` (+ `MetricCellProps`)                                             | `<Metric size="…" align="…">` (decision 11) | in-repo Workout only | AW-127 |
| `Tile` (+ `TileProps`)                                                         | `Card` stat preset (decision 1)             | in-repo `ui/` only   | AW-127 |

## Theme presets — replaced by `ThemeProvider` + semantic tokens

| Export                                                  | Replacement                          | Known consumers    | Task   |
| ------------------------------------------------------- | ------------------------------------ | ------------------ | ------ |
| `applyThemePreset`                                      | `ThemeProvider` with semantic tokens | audiobook/frontend | AW-129 |
| `defaultPreset`                                         | the shipped `:root` token set        | audiobook/frontend | AW-129 |
| `audiobookPreset`                                       | audiobook-owned token overrides      | audiobook/frontend | AW-129 |
| the `theme/presets` barrel and its `ThemePreset*` types | —                                    | audiobook/frontend | AW-129 |

## Surviving as presets over `Pill`

`Badge`, `Chip`, `StatusPill` and `MuscleGroupChip` have external consumers, so
they keep their public props and are **not** deprecated; they now render `<Pill>`
internally.

`PrBadge` is the fifth survivor. It was being ported by a parallel agent when
this PR was written and is left untouched — porting it onto `Pill` is a
follow-up.

## Softly deprecated on `Pill` itself

`PillProps.color` (use `tone`) and `PillProps.leftElement` (use `leading`) carry
`@deprecated` tags but keep working; they are the compatibility surface for
existing call sites and for `voltras-mcp`, which imports `Pill` directly.

## Shell family — generic shell + a workout shell that composes it (AW-132)

`shell/` is now generic and `shell/workout/` holds the workout app's chrome. All
exports keep their names on the package barrel, so imports of
`@titan-design/react-ui` are unchanged; only the props below moved.

| Export                                   | Replacement                                    | Known consumers      | Task   |
| ---------------------------------------- | ---------------------------------------------- | -------------------- | ------ |
| `DashboardShell` (+ `DashboardShellProps`) | `WorkoutShell` (+ `WorkoutShellProps`) — identical props, alias kept | in-repo `lab/` only  | AW-132 |
| `defaultNavItems`                        | `workoutNavItems`                              | in-repo shell only   | AW-132 |

**Two breaking prop changes, no alias possible** (a deprecated shim would put a
workout import back inside the generic shell, which is the cycle this task
removes):

| Change                                                  | Replacement                                     | Known consumers    |
| ------------------------------------------------------- | ----------------------------------------------- | ------------------ |
| `TopBar` lost `state` / `devices` / `onSelectDevice`    | `WorkoutTopBar` — identical prop shape          | in-repo shell only |
| `SideNav.items` is required (was defaulted to the four workout categories) | pass `workoutNavItems`, or the app's own | in-repo shell only |

`SessionStatePill` keeps its own AW-127 `@deprecated` tag (use `Pill`); it moved
directory but its export is unchanged.
