# LineChart API note

Source: TD-34 Round 0 contract, Part B (owner-decided), restated in our own words with amendments A1
to A8. This is a design note for a component that does not exist yet (`ui/charts/line-chart/`, story
`Components/Organisms/LineChart`). Nothing here is exported from a barrel.

Decided in Round 0 and not reopened: 34.1 a change of index version breaks the line, draws a labelled
boundary rule, and the summary says the span is not comparable. 34.2 more than six series render as
built-in facets of at most six. 34.3 the interactive readout ships in v1.

## Amendments

Each amendment records where `main` differs from the Round 0 text, and the rule that now holds.

- **A1. Render target.** Status: confirmed. Round 0 lists `react-native-svg`, but no file in `src/`
  imports it and every chart on `main` paints one DOM `<svg aria-hidden>`. LineChart does the same:
  web and React Native Web only. A native port is a later kit task.
- **A2. Kit placement.** Status: confirmed. Scales, ticks, label thinning, decimation and entrance
  motion live in `ui/charts/kit/` (TD-180), shared with later charts. Line-specific logic stays here.
  The kit holds `.ts` only, so the anatomy check never treats it as a component.
- **A3. Series colour.** Status: confirmed. Series take `categoricalPalette.default` in order, on both
  themes; `default` is the palette for marks on a surface. Never `data-1..10` (superseded,
  `TOKENS.md` section 1). `color?: ColorToken` overrides one series through `resolveColor`.
- **A4. Module names.** Status: confirmed. `line-chart-model.ts` and `summary-model.ts`, not
  `geometry.ts` and `summary.ts`, so planned mutation testing reaches them (`docs/test-layers.md`).
  The hook is `useLineChart`.
- **A5. Announcing the active point.** Status: confirmed. The focus target names the active point
  through `aria-activedescendant`. A polite live region carrying the same text stays in the design as
  the fallback until the S4 spike shows whether screen readers honour `aria-activedescendant` here.
- **A6. Controlled active point.** Status: confirmed. `activePointId`, `defaultActivePointId`,
  `onActivePointChange`, per the repo's controlled-state rule. `null` means no active point.
- **A7. Prerequisites.** Status: confirmed. The `d3-*` lint scoped to `ui/charts/**` already landed
  (TD-71). The rest of M5 (move `SparkBars`, the charts README) gates only the final export slice.
- **A8. Gap reason.** Status: confirmed. `LinePoint` gains `missing?: string`. Round 0 gives every
  null a reason, and the readout and summary read it.

## Props

- `series: LineSeries[]`; `LineSeries = { id: string; label: string; points: LinePoint[]; color?: ColorToken; stroke?: 'solid' | 'dashed' }`
- `LinePoint = { id?: string; x: number | Date; y: number | null; missing?: string (A8); segmentKey?: string }`
- `width: number`, `height: number`, `size?: 'full' | 'compact'`
- `xScale?: 'time' | 'linear'` (default `time`), `formatX?`, `formatY?: (y: number) => string`, `unit?: string`
- `includeZero?: boolean` (default false), `referenceLines?: { y: number; label: string }[]`,
  `boundaries?: { x: number | Date; label?: string }[]`
- `metricLabel: string`, `summarize?: (series: LineSeries[]) => string`
- `activePointId?: string | null`, `defaultActivePointId?: string`, `onActivePointChange?: (id: string | null) => void` (A6)
- `onPointPress?: (point: LinePoint, series: LineSeries) => void`
- `showLegend?: boolean`, `facetColumns?: number` (a layout hint; facets start above six series)
- `animate?: boolean`, `isLoading?: boolean`, `emptyState?: ReactNode`, `className?: string`; extends `ViewProps`

`emptyState` is a state slot with a default built from `ui/empty-state`, as every state slot in the
library has. The default node's text is the accessible content, so no separate empty label exists.

## Controlled versus uncontrolled

Data in, picture out. The only state is the active point (hover or keyboard). It is uncontrolled by
default; `activePointId` with `onActivePointChange` controls it, so a page can sync a crosshair across
charts (A6). No zoom, pan or brush in v1.

## Composition slots

`summarize`, `formatX`, `formatY`, `emptyState`. No render prop for marks: the canvas is one image
painted from geometry, and a mark slot would start a second line vocabulary (the `Sparkline` lesson in
`REJECTED.md`). Overlays are data (`referenceLines`, `boundaries`), not children.

## Accessibility

No APG widget applies to a chart. The canvas is one `image` whose name is a generated sentence:
metric, latest value, change over the span, gap count, and non-comparable spans. Decorative layers are
hidden. Points form one tab stop beside the image. Left and Right step through a series. Up and Down
change series and cross facet edges. Home and End reach the first and last point. Enter and Space call
`onPointPress`; Escape clears the active point. Keys never wrap. A null point is reachable and reads
"no value" with its reason (A8). The active point is announced per A5. Each facet has its own image
and sentence. Colour never carries identity alone: direct end labels by default, `stroke: 'dashed'`
as a second encoding.

## Virtualisation

None. At 2,000 points one path is cheap. Above the plot's pixel width, decimation keeps each pixel
column's minimum and maximum, plus the first and last point. Keyboard steps the undecimated points.

## Where the logic lives

The kit (A2): `scaleMath.ts` (`linearDomain`, `timeDomain`, `cappedTicks`), `thinMath.ts`
(`thinLabels`, `decimateMinMax`), `chartEntrance.ts` (`useChartEntrance`).
Here (A4): `line-chart-model.ts` holds `cleanSeries`, `projectSeries`, `facetSeries`, `nearestPoint`
and `nextPoint`. `cleanSeries` drops non-finite values and counts them, sorts stably by x and keeps
duplicate x. It splits at nulls and at `segmentKey` changes. `summary-model.ts` builds the sentences,
one per facet in facet mode. `useLineChart` memoises them and owns the active point. Properties: every
coordinate is finite and inside the plot. No segment bridges a null or a `segmentKey` change.
Decimation keeps the global extremes. No facet holds more than six series.

`thinLabels` keeps only the first label when the first and last are closer than the label gap, so no
slice may promise that both ends are always labelled.

## Primitives composed

DOM `<svg>` (A1), `d3-scale`, `d3-shape`, the kit (A2), `categoricalPalette` and
`CATEGORICAL_CVD_SAFE_MAX` (A3), `useSurface`/`useSurfaceMode` and `resolveColor` (never
`getSemanticColors('dark')`), `EmptyState`, `Skeleton`, `Tooltip`, `Typography`,
`usePrefersReducedMotion`.

## States

Loading: `Skeleton` of the same size. Empty: no series, or no finite point, renders `emptyState`
(default from `ui/empty-state`, testID `line-chart-empty`). Error does not apply: the consumer shows
`Alert`. Disabled does not apply to a picture; the tab stop stays so reading is never blocked.

## Fixtures

`fixtures.ts` holds 15 fixtures: Empty, One point, Two points, Flat, All-equal, Default, Missing
baseline, Clustered time, Gaps, Index change, Many series (18), Very large (2,000 points), Hostile,
NaN and Real history. Real values come from a public 17-snapshot code-metric history: three nodes, 51
points per metric, 10 gaps. Node names are relabelled to neutral ones. Synthetic and derived fixtures
say so in `note`. Only Hostile and NaN carry non-finite values. Real snapshots share instants (five on
one), so duplicate x is normal data, not only hostile data.

The Default fixture's reference line is a synthetic, labelled `Budget` at 10,000 drawn over real
values: a file-level limit would force the y domain down and make the default story degenerate.

## Mapping from a snapshot list plus per-node answers

Illustrative only; not shipped. A node the snapshot predates answers an error envelope, which maps to
a gap with a reason.

```ts
function fromSnapshots(
  snapshots: Snapshot[],
  answers: Map<number, NodeAnswer>,
  metric: string
): LinePoint[] {
  return snapshots.map((s) => {
    const answer = answers.get(s.id)
    const value = answer?.ok ? answer.data.metrics.find((m) => m.name === metric) : undefined
    return {
      id: String(s.id),
      x: new Date(s.takenAt),
      y: value?.value ?? null,
      missing: answer?.ok ? value?.missing : 'not-in-snapshot',
      segmentKey: s.indexVersion,
    }
  })
}
```
