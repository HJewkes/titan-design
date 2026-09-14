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

| Export                                     | Replacement                                                          | Known consumers     | Task   |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------- | ------ |
| `DashboardShell` (+ `DashboardShellProps`) | `WorkoutShell` (+ `WorkoutShellProps`) — identical props, alias kept | in-repo `lab/` only | AW-132 |
| `defaultNavItems`                          | `workoutNavItems`                                                    | in-repo shell only  | AW-132 |

**Two breaking prop changes, no alias possible** (a deprecated shim would put a
workout import back inside the generic shell, which is the cycle this task
removes):

| Change                                                                     | Replacement                              | Known consumers    |
| -------------------------------------------------------------------------- | ---------------------------------------- | ------------------ |
| `TopBar` lost `state` / `devices` / `onSelectDevice`                       | `WorkoutTopBar` — identical prop shape   | in-repo shell only |
| `SideNav.items` is required (was defaulted to the four workout categories) | pass `workoutNavItems`, or the app's own | in-repo shell only |

`SessionStatePill` keeps its own AW-127 `@deprecated` tag (use `Pill`); it moved
directory but its export is unchanged.

## Fatigue tokens — `TONE_COLOR` replaced by `TONE_TOKEN` (VW-316)

**Breaking, no alias possible.** `TONE_COLOR` held colours resolved at import
time, which is exactly the frozen theme `titan/no-frozen-theme` bans — a
compatibility alias would be a module-scope `getSemanticColors('dark')` call and
would re-enter the frozen-theme baseline.

| Export                                         | Replacement                                        | Known consumers                                                     |
| ---------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| `TONE_COLOR` (`Record<DimensionTone, string>`) | `TONE_TOKEN` (`Record<DimensionTone, ColorToken>`) | `voltras-mcp` `src/dashboard/spa/planner/SessionSummaryPage.tsx:55` |

Migration is one line at the point of use — hold a live palette and index it:

```ts
const t = getSemanticColors(useSurfaceMode())
const color = t[TONE_TOKEN[tone]] // was TONE_COLOR[tone]
```

The three values are `status-success` / `status-warning` / `status-error`, which
are byte-identical in dark and light, so no rendered colour changes.

## Workout pace tone — `paceToneColor` takes a mode (VW-316)

**Breaking signature change, no overload kept.** `paceToneColor` held a resolved
palette at module scope; an optional `mode` defaulting to `'dark'` would have
left every existing caller frozen while looking migrated, so the parameter is
required.

| Change                | Replacement                                           | Known consumers                                                                        |
| --------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `paceToneColor(tone)` | `paceToneColor(tone, mode)` — pass `useSurfaceMode()` | in-repo only: `SegmentedProgressBar`, `SessionHeader`, `SegmentedProgressBar.test.tsx` |

No downstream consumer: `grep -rn paceToneColor` over the `voltras-mcp` checkout
returns nothing. Its two values come from `status-success` / `status-warning`,
mode-invariant today, so no rendered colour changes.

`tsconfig.json` excludes `**/*.test.ts(x)`, so a required-parameter change is
**invisible to `tsc`** in a test: the old call kept compiling and resolved
`getSemanticColors(undefined)` — the LIGHT branch — passing only because these
roles are mode-invariant. Grep the call sites when changing a signature.

## Live aura flood — `liveAuraColor` takes a mode (VW-316)

**Breaking signature change**, same shape and same reasoning as `paceToneColor`
above: the resolved palette moved out of module scope, and the mode is required
rather than defaulted so no caller stays frozen by accident.

| Change                    | Replacement                                               | Known consumers                                         |
| ------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| `liveAuraColor(category)` | `liveAuraColor(category, mode)` — pass `useSurfaceMode()` | in-repo only: `LiveAuraFrame`, `LiveAuraFrame.test.tsx` |

No downstream consumer: `grep -rn liveAuraColor` over the `voltras-mcp` checkout
returns nothing. Its two values are `status-warning` / `status-error`,
mode-invariant today, so no rendered colour changes.

## BodyMap heatmap — `getHeatmapColor` takes a mode (VW-371)

**Breaking signature change**, same shape and same reasoning as `paceToneColor`
and `liveAuraColor` above. The palette moved from a frozen primitive map onto the
`dataviz-diverging-*` semantic roles, and `mode` is required rather than
defaulted to `'dark'`: every one of the four call sites omitted it, so a default
would have left the whole figure frozen while looking migrated — and
`titan/no-frozen-theme` cannot see a default parameter.

`intensity` also loses its `= 0` default, because a required third parameter
after an optional second is not expressible.

| Change                                | Replacement                                                          | Known consumers                                     |
| ------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| `getHeatmapColor(status, intensity?)` | `getHeatmapColor(status, intensity, mode)` — pass `useSurfaceMode()` | in-repo only: `BodyMap` ×3, `TrainingStatusPage` ×1 |

No downstream consumer: `grep -rn getHeatmapColor` over the `voltras-mcp`
checkout returns nothing. Light and dark resolve to identical values until
VW-371 phase 2, so no rendered colour changes.

Per the `paceToneColor` warning above, the call sites were grepped rather than
trusted to `tsc` — **no test, story, or lab file calls it**, so unlike the two
entries above this change touches no test.

`buildSlugParts` in `BodyMap.tsx` is a plain helper behind a `useMemo`, not a
component, so it takes `mode` as a parameter (added to the memo deps) rather
than calling the hook. `BodyMap`'s own local is named `surfaceMode` because
`mode` is already its `detailed`/`simple` prop.

`WORKOUT_TOKENS.heatmap` is **gone**, replaced by `heatmapColors(mode)` in
`theme/workout-tokens.ts`. It was never on the package barrel, so this is
internal only.
