# `ui/charts`: domain-free charts

Charts that paint data marks from a scale and know nothing about workouts, sessions or
initiatives. A chart whose prop, type or label names a domain concept lives in its
`custom/<Family>/` instead (`CLAUDE.md`, Placement).

| Member               | Kind   | Holds                                                                                                                      |
| -------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| `spark-bars/`        | atom   | `SparkBars`: a signed-series bar sparkline. Moved from `custom/charts` in M5 (TD-188).                                     |
| `dependency-matrix/` | notes  | API note and fixtures for the planned dependency matrix; no component yet.                                                 |
| `network-graph/`     | notes  | Pure model and layouts for the planned network graph; `d3-force` is imported by one file, `layouts/force-layout-model.ts`. |
| `kit/`               | module | Shared domain scales, tick rules, label thinning and entrance motion. See its README.                                      |

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
