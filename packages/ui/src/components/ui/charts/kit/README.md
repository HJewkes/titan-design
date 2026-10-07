# Chart kit

Shared logic for the domain-free charts under `ui/charts/`. The kit is `.ts` only: it holds no
component, story or barrel export, so the anatomy detector never treats it as a ui unit. A chart
imports what it needs by path, for example `../kit/scaleMath`.

## What the kit owns

| Module             | Exports                                                           | Owns                                                                                                                                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scaleMath.ts`     | `linearDomain`, `timeDomain`, `cappedTicks`                       | Axis domains with the degenerate rules: one value, all-equal input, `includeZero`, reference values, and px padding so no mark sits on a plot edge. A lone timestamp widens symmetrically. Ticks capped at target + 1.                                             |
| `thinMath.ts`      | `thinLabels`, `decimateMinMax`                                    | Label thinning by a minimum px gap that keeps the first and last label. Min/max decimation per pixel column that keeps spikes, the first and the last point, and returns at most `2 * columns + 2` points.                                                         |
| `chartEntrance.ts` | `useChartEntrance`, `drawStyle`, `fadeStyle`, `popStyle`, timings | The entrance: a line draw, a fade and a point pop as CSS transitions. Reduced motion or `animate={false}` disables it and every style is empty. Entrance motion is web-only: off web the styles are empty too, so native renders the final state with no entrance. |
| `compareText.ts`   | `compareText`                                                     | The code-unit string order every network-graph layout breaks ties with.                                                                                                                                                                                            |
| `seededRandom.ts`  | `seededRandom`                                                    | A deterministic `() => number` in [0, 1) from an integer seed (LCG), for fixtures and seeded layouts. Shared by the chart fixtures; a layout that must repeat across renders uses it at run time.                                                                  |

Scale construction (`d3-scale`) and path building (`d3-shape`) stay in each chart; the kit only
decides the domains and ticks they are given.

Line-specific logic (segment splitting, facets, nearest point, key stepping, the summary) belongs in
the chart that needs it, not here. Move a helper into the kit when a second chart needs it.

## Intended consumers

- `LineChart` (`ui/charts/line-chart/`, TD-34).
- `GoalTrajectoryChart`, rebased onto the kit later (TD-34 S8). Its `cappedTicks` and
  `goalTrajectoryMotion.ts` are the sources these modules were ported from, and stay in place until
  that rebase deletes them.
- The charts that move into `ui/charts/` under the library roadmap's chart milestone.
