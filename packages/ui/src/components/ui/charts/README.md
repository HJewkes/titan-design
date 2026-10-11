# `ui/charts`: domain-free charts

Charts that paint data marks from a scale and know nothing about workouts, sessions or
initiatives. A chart whose prop, type or label names a domain concept lives in its
`custom/<Family>/` instead (`CLAUDE.md`, Placement).

| Member               | Kind     | Holds                                                                                                                                                                                                                       |
| -------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bar-list/`          | molecule | `BarList`: a ranked horizontal bar list with a top-N cap and an optional reference marker.                                                                                                                                  |
| `spark-bars/`        | atom     | `SparkBars`: a signed-series bar sparkline. Moved from `custom/charts` in M5 (TD-188).                                                                                                                                      |
| `scatter/`           | atom     | `Scatter`: points on two linear axes, sized and coloured per datum. Moved from `custom/Scatter` in M8 (TD-471).                                                                                                             |
| `treemap/`           | atom     | `Treemap`: squarified tiles sized by value on a linear, sqrt or log scale. Moved from `custom/Treemap` in M8 (TD-471).                                                                                                      |
| `gauge/`             | atom     | `Gauge`: a segmented dial read against threshold bands. Moved from `custom/Gauge` in M8 (TD-471).                                                                                                                           |
| `dependency-matrix/` | notes    | API note and fixtures for the planned dependency matrix; no component yet.                                                                                                                                                  |
| `network-graph/`     | organism | `NetworkGraph`: a directed node-link graph with pressable nodes and edges, one selection, keyboard traversal and an edge pulse. See its `API-NOTE.md`. `d3-force` is imported by one file, `layouts/force-layout-model.ts`. |
| `kit/`               | module   | Shared domain scales, tick rules, label thinning and entrance motion. See its README.                                                                                                                                       |

## Layouts are values

`NetworkGraph` takes its layout as a value, `GraphLayout = { key, compute }`, so a consumer bundles
only the layouts it imports. `compute` is pure and synchronous; `key` is a string of the factory's
options and is what the component memoises on. One layout is one file,
`network-graph/layouts/<name>-layout-model.ts`, exporting a factory.

## Rules

- **`d3-*` imports are legal only here.** The `titan/no-raw-composition` rule (`d3Import`) fails
  a `d3` or `d3-*` import, re-export, dynamic import or `require` anywhere else under `src/`,
  and `src/lab/` is exempt. Offenders that predate the rule sit in
  `eslint-rules/composition-baseline.json`, which only shrinks. Scale construction and path
  building stay in each chart; shared domains and ticks go in `kit/`.
- **SVG path math is legal only here.** The same rule's `pathMath` check flags a computed path `d`
  string outside this directory.
- **A chart is `ui/charts/<name>/`** with the usual `Name.tsx`, test, story and `index.ts`, and a
  row in [`ui/README.md`](../README.md). `kit/` holds `.ts` only.
- **State coverage** follows `docs/component-states.md`. A new line chart follows
  _Line charts_ in [`custom/charts/README.md`](../../custom/charts/README.md).

Workout bar marks (`SetBarChart`, `live-rep-growth`, `flatBarGeometry`) stay in
`custom/charts` because they carry workout vocabulary.

## Text readout pattern

Every chart here gives assistive tech a readout in words. The pattern is written once; a chart
follows it and does not invent its own.

1. Marks are hidden from assistive tech (`aria-hidden`, `accessibilityElementsHidden`).
2. The chart root carries the name `"<accessibilityLabel>. <summary>"`.
3. `summary` comes from a pure `summarize<Name>(model)` in `<name>-model.ts`, and a `summarize?`
   prop overrides it.
4. Each item's name comes from a pure `format...Label` function, with a prop override.
5. No hidden data table, same as the line chart.
6. An interactive chart with an active item uses one tab stop and `aria-activedescendant`, with a
   polite live region as the fallback if a screen reader ignores it.

`bar-list/` is the reference: `summarizeBarList` and `rowLabel` in `bar-list-model.ts`.

Two seams of this pattern (S-c) are left open in BarList: the prop overrides of items 3 and 4
(S-c(3) `summarize`, S-c(4) the item-label override). BarList ships the pure functions and neither
prop, because its props audit found no caller for them (TP-848). A chart adds the prop when a
consumer needs its own wording.
