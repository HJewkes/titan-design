# `custom/charts` — shared chart substrate

Two marks and one hook, extracted so every value-height bar family in the library
draws the same bar rather than each re-rolling geometry and entrance animation.
This is a substrate family: it holds no domain knowledge, and colour, reference
overlays and labels are passed in by the consumer.

This README is the **index**: **composes ↓** and **used-by ↑** for each member,
so the tree navigates both ways and a hand-rolled bar shows up as a gap. Counts
come from [`src/arch/arch-graph.json`](../../../arch/arch-graph.json).

## Dependency map

| Member            | Kind | Composes ↓                                      | Used-by ↑                                              | Exported     |
| ----------------- | ---- | ----------------------------------------------- | ------------------------------------------------------ | ------------ |
| `SparkBars`       | atom | `resolveColor`, `cn`                            | FileActivityDetail, FileActivityRow (ActiveWork)       | yes          |
| `SetBarChart`     | atom | `barPaper`, `SurfaceContext`, `live-rep-growth` | RomProgressionChart (Fatigue), VelocityStrip (Workout) | no — by path |
| `live-rep-growth` | hook | `Animated`, `Easing`                            | SetBarChart, VelocityStrip                             | no — by path |

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
12% `PEAK_OVERSHOOT` for a new-peak bar and honours `prefers-reduced-motion`.

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
