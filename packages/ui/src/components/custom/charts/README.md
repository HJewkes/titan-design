# `custom/charts`: workout bar marks

Two marks and one hook (`SparkBars` moved to [`ui/charts/spark-bars`](../../ui/charts/README.md)
in migration M5; the table row below stays so the dependency map is complete), extracted so every value-height bar family in the library
draws the same bar rather than each re-rolling geometry and entrance animation.
`SetBarChart` and `live-rep-growth` carry workout vocabulary (the set-type slot,
mesocycle framing) and stay in this family for that reason (`CLAUDE.md`,
Placement); colour, reference overlays and labels are still passed in by the
consumer rather than hard-coded.

This README is the **index**: **composes ↓** and **used-by ↑** for each member,
so the tree navigates both ways and a hand-rolled bar shows up as a gap. Counts
come from [`src/arch/arch-graph.json`](../../../arch/arch-graph.json).

## Dependency map

| Member            | Kind   | Composes ↓                                      | Used-by ↑                                              | Exported     |
| ----------------- | ------ | ----------------------------------------------- | ------------------------------------------------------ | ------------ |
| `SparkBars`       | atom   | `resolveColor`, `cn`                            | FileActivityGrowthWell, FileActivityRow (ActiveWork)   | moved, shim  |
| `SetBarChart`     | atom   | `barPaper`, `SurfaceContext`, `live-rep-growth` | RomProgressionChart (Fatigue), VelocityStrip (Workout) | no — by path |
| `live-rep-growth` | hook   | `Animated`, `Easing`, `usePrefersReducedMotion` | SetBarChart, VelocityStrip                             | no — by path |
| `flatBarGeometry` | module | —                                               | SegmentedBar (Workout), SetBarChart                    | no — by path |

`SetBarChart` and `live-rep-growth` are deliberately absent from `index.ts`: they
are workout-internal and imported by path, so the public barrel stays one mark
wide. Adding them to the barrel is a decision, not a tidy-up.

## What each owns

**`SetBarChart`** owns the chart _geometry_ — value→height scaling, the shared
`scaleMax` override, plot-width-driven adaptive bar width and gap stepping, value
label thinning — plus the shared bar _language_: paper treatment, the
grow-from-bottom live rep, up/down orientation, the set-type slot vocabulary. Bar
colour and the reference overlay (velocity VL bands, ROM working/short lines) are
props. A spacing or entrance improvement therefore lands once for both consumers.
Value-height only: `VelocityStrip`'s flat 3 px `mini` strip stays its own mark.

**`SparkBars`** is a signed-series sparkline: bars over a baseline, negatives in
`result-degrade`, a `MIN_BAR_HEIGHT` floor so an almost-empty series still reads
as a series, and `maxBars` because a sparkline is a recent-history glance.

**`live-rep-growth`** is the newest-rep entrance, promoted out of `VelocityStrip`
so every value-height family animates the live rep identically. It carries the
12% `PEAK_OVERSHOOT` for a new-peak bar and honours `prefers-reduced-motion` through
`usePrefersReducedMotion` from [`src/hooks`](../../../hooks/usePrefersReducedMotion.ts).

**`flatBarGeometry`** is the single source for the default height/gap/radius
`SegmentedBar` (set-level) and `SetBarChart` (rep-level) each declare, documented
as intentionally different sizes rather than left to drift apart unnoticed (VW-86).

## Reuse audit

| Leaf                  | Should compose        | Status                                                                                                                                   |
| --------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Bar geometry          | `SetBarChart`         | **Closed** for Fatigue and VelocityStrip's expanded charts; `VelocityStrip` mini is a deliberate exception.                              |
| Live-rep entrance     | `live-rep-growth`     | **Closed.** Both consumers use the hook.                                                                                                 |
| Colour blending       | `theme/color-math`    | **Open.** `SetBarChart.tsx` carries a local `mixHex`. Roadmap decision 8 collapses the four copies into one module; this is one of them. |
| Surface-relative fill | `SurfaceContext`      | **Closed.** `SetBarChart` reads `useSurface`/`useOnSurfaceColor` rather than assuming a plane.                                           |
| Inline colour         | `resolveColor(token)` | **Closed** for `SparkBars`; the family is in the token-pure eslint error block.                                                          |

## Watch list

- **`mixHex` duplication** (above) is the family's only open token debt. Until
  decision 8 lands, do not add a third copy — import the one in `SetBarChart`.
- **`SetBarChart` has no story.** `SparkBars` does; the chart is only seen through
  its consumers' stories (`Custom/Fatigue/*`, `Custom/Workout/VelocityStrip`).
  That is why it reads `status:candidate` — see [`MATURITY.md`](../../../../MATURITY.md).
- **Both marks are `keep-internal`** in the arch graph: two in-repo consumers
  each, zero external. Neither is public API yet; treat prop changes as cheap
  while that holds.

## Line charts

This family has no line-chart substrate yet. The two line charts ship in
`custom/Workout`: `GoalTrajectoryChart` (VW-385, rebuilt as a d3-backed SVG in
#248) and `StrengthTrendChart` (older). A new line chart extends
**`GoalTrajectoryChart`'s structure**. The table below lists where the two
differ, so the older chart's choices are not copied by accident.

### What both do

- **Size comes from the consumer.** `width` and `height` are px props; neither
  chart measures itself. Both extend `ViewProps` and take `className`.
- **Geometry is one memoised step.** All px maths runs once from the props, in
  `useMemo`, before anything is painted.
- **The y scale is linear and padded** so marks clear the plot edges. A value
  label gutter sits on the left (`PLOT_LEFT`).
- **Empty data renders a placeholder**, not an empty plot: a `View` of the same
  width and height with `accessibilityRole="image"`, a sentence
  `accessibilityLabel`, and a `*-empty` testID. `GoalTrajectoryChart` shows it
  when there is neither a band nor an actual, whatever its `status`; the words
  ("Calibrating — no band yet") and the label are fixed, not taken from `status`.
- **The canvas is one accessible image.** Its `accessibilityLabel` is a
  generated summary (metric, latest value, status or trend). Decorative layers
  are hidden from it: `GoalTrajectoryChart`'s `<svg>` is `aria-hidden`, so
  nothing inside it carries a label.
- **The line draws left to right on mount**, and a prop turns the entrance off
  (`animate`, `animateOnMount`) so visual baselines capture the final frame.
- **Mesocycle boundaries and PR stars** are overlays on the same plot.

### Where they differ

| Concern         | `GoalTrajectoryChart` (extend this)                                                                                                                                                                                                                                                                         | `StrengthTrendChart`                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geometry module | `GoalTrajectoryChartGeometry.ts`: pure functions, no React, no colour, unit-tested on its own. `GoalTrajectoryMini` reuses it at a smaller size.                                                                                                                                                            | `buildGeometry` inside the component file.                                                                                                                           |
| Scales          | `scaleLinear` from `d3-scale`; `line`, `area` and `curveMonotoneX` from `d3-shape`. x is the week index (`weekIndex`, or `ts` placed against week start dates).                                                                                                                                             | Hand-written linear `toX` / `toY`. x is `Date.parse` of each point's date.                                                                                           |
| y padding       | The floor steps down by `VALUE_STEP` (5) until the lowest mark clears the bottom edge. The ceiling rises until every rule label and marker clears the top. Both derive from the label font and plot height.                                                                                                 | 15% of the range on each side.                                                                                                                                       |
| Marks           | One DOM `<svg>` in `GoalTrajectoryPlot.tsx` that only paints paths from the geometry.                                                                                                                                                                                                                       | React Native `View`s: each segment is a rotated `View`, revealed by an `Animated.View` width.                                                                        |
| Colour          | Resolved at render time from the nearest `Surface`: `useSurface()` feeds `trajectoryPalette(mode, level, status)`, which reads `getSemanticColors(mode)` and makes washes with `alpha()`.                                                                                                                   | Dark palette frozen at module scope (`getSemanticColors('dark')`). It is grandfathered in `eslint-rules/frozen-theme-baseline.json`; do not copy it.                 |
| Responsive      | Above `WALL_BREAKPOINT` (720 px) a `DENSITY` table raises stroke width, star size, gridline count and the week-label budget.                                                                                                                                                                                | None; width only stretches the x axis.                                                                                                                               |
| Motion          | `useTrajectoryEntrance` honours `prefers-reduced-motion` through `usePrefersReducedMotion` from `src/hooks`.                                                                                                                                                                                                | `Animated.timing` for 600 ms, with no reduced-motion check.                                                                                                          |
| Degenerate data | Non-finite values are dropped. A band needs at least two slices; a band thinner than `BAND_MIN_THICKNESS` is flagged `bandIsDegenerate`. `GoalTrajectoryDegenerate.test.tsx` covers committed equal to stretch (VW-414).                                                                                    | Empty when `data` is empty, even if a projection exists. A single timestamp widens the x domain by 1 ms; a flat series uses `max(1, 10% of the value)` as its range. |
| Interaction     | `GoalTrajectoryWeekTips` lays one `TipTrigger` per week over the canvas, outside the `<svg>`: a roving tab stop, arrow keys, Home and End move between weeks. Each opens that week's plan, reading, PR and deload flags, and the next target on its week. The next-target marker itself is not interactive. | Each point is a `Pressable` with a label and opens a tooltip.                                                                                                        |

This section moves to `ui/charts/README.md` when M5 lands (roadmap decision of 2026-09-19).
