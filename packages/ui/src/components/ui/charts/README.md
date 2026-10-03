# `ui/charts`: domain-free charts

Charts that paint data marks from a scale and know nothing about workouts, sessions or
initiatives. A chart whose prop, type or label names a domain concept lives in its
`custom/<Family>/` instead (`CLAUDE.md`, Placement).

| Member               | Kind     | Holds                                                                                                                                                                                                                       |
| -------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spark-bars/`        | atom     | `SparkBars`: a signed-series bar sparkline. Moved from `custom/charts` in M5 (TD-188).                                                                                                                                      |
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
