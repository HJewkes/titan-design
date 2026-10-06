# BarList API note

Source: TP-848 Round 0 contract (section 7), restated here. Component: `ui/charts/bar-list/`, story
`Components/Molecules/BarList`.

**Controlled versus uncontrolled.** Data in, list out. No internal state.

**Composition.** Rows are `View`s; label, value, secondary and description are `Typography`; the bar is a
track `View` with a fill `View` whose width is a percentage. No SVG and no d3, so it renders on web and
native. Rows are not interactive: there is no `Pressable` and no tab stop. Fixed anatomy is imported
(Typography, Skeleton, EmptyState); the only slot is `emptyState`. Wording that belongs to the consumer
arrives through `formatValue` and `formatSecondary`.

**Props (13).** `rows`, `accessibilityLabel`, `max`, `referenceMarker`, `sort`, `maxRows`, `layout`, `size`,
`formatValue`, `formatSecondary`, `isLoading`, `emptyState`, `className`. `formatValue(value, row?)` formats each row's
value and, called without a row, the total of the rows past the cap.

**Accessibility pattern.** No composite widget. Native list semantics: root `role="list"` named
`"<accessibilityLabel>. <summary>"`, each row `role="listitem"` named by `rowLabel`:
`"<label>: <value>, <secondary>, <flag label>, rank <n> of <shown>"`, omitting absent parts. With
`sort: 'none'` the list is not ranked and the name carries no rank. The bar and the visible texts inside a
row are hidden from assistive tech so the row is read once. The overflow row is a list item reading
`"<count> more · <hidden total>"`, and the summary and the overflow row both format the hidden total with
`formatValue`. No keyboard map: nothing in the list takes focus.

**Virtualization.** None. The cap bounds the mounted rows at `maxRows + 1`. Stated scale: 5,000 input rows.
A list that must show hundreds of rows is a `Table`, not a BarList.

**Where the logic lives.** `bar-list-model.ts`, pure, no React: `cleanValue` (null, NaN and Infinity are
missing), `resolveMax` (a finite positive `max`, else the largest finite positive value, else 1),
`barFraction` (clamped to 0..1; 0 for missing and negative), `rankRows` (stable sort or none, then the cap),
`rowLabel`, `summarizeBarList`, and `buildBarListModel` that composes them. `BarList.tsx` calls
`buildBarListModel` in one `useMemo` and paints.

**Rules fixed here.**

- The cap applies after the sort. With `sort: 'none'` it keeps the first N in input order.
- Hidden rows fold into one overflow row with a count and a sum and no bar. The sum of many small rows can
  exceed the largest row and would distort the scale.
- All-zero rows render with empty bars; they are data, not an empty list.
- Negative values draw no bar and keep their text. Diverging bars are out of scope.
- A flag is always colour plus the flag's label as text, and the label is in the row's accessible name.
- An unflagged row's fill is `silverRed(mode).neutral` and a flagged row's is `silverRed(mode).flag`, the
  same red for both tones; the flag label, written in `text-text-error`, carries the tone in words. A row's
  own `color` wins over both. The track is `bg-hairline` under every fill.
- The label column of the inline layout is 96 px (`w-24`).
- Duplicate ids keep both rows, keyed by id and position.
- `maxRows` below 1 clamps to 1 and a fraction floors; `NaN` uses the default of 10.

**Primitives and tokens.** `Typography`, `Skeleton`, `EmptyState`, `cn`, `resolveColor`, `formatCompact`,
`useSurfaceMode` and `silverRed` from `kit/silverRed.ts`. Existing tokens and ramp steps only: the silver/red
pair (dark `grey[200]` and `red[400]`, light `grey[600]` and `red[600]`), a `hairline` track and
`text-error` flag labels. No brand token. On the base surface both fills measure at least 3:1 against the
track in both modes (`BarList.test.tsx`); on the light `background-base` and `surface-raised` planes and the
dark `surface-raised` and `surface-overlay` planes at least one fill measures between 2.7 and 3.0.

## Reference marker

`referenceMarker: { value, label, formatValue? }` (TD-440) draws one labelled line on the value axis: a cutoff,
a budget, a target. It is the thirteenth prop, added after the round 3 audit below. Rules:

- The marker never changes the scale. `resolveMax` ignores it. A marker above the resolved maximum draws no
  line; the legend and the readout still state it. Pass `max` to keep the line visible.
- The marker never recolours a row and never sets a flag.
- One marker. An array is a later change.
- A `value` that is not finite or is at or below zero ignores the marker. A blank `label` becomes "Reference".
- The line is drawn in each row's bar at `value / max`, on the aligned track. The legend sits after the
  overflow row ("Limit 100"). Both are hidden from assistive tech.
- The list name gains ` <label>: <valueText>. <n> of <N items> at or above.` and a row at or above the
  marker gains `at or above <label>` after its flag and before its rank. `reachedCount` covers hidden rows.
- Without a marker the bar is the bare track; the wrapper that positions the line exists only with one.

## Props audit (round 3)

Cut, with the reason:

- `color`: the list has one palette, the silver/red scheme; a single row still takes `row.color`.
- `labelWidth`: one width (96 px) until a consumer needs another.
- `formatOverflow`, `formatRowLabel`, `summarize`: wording overrides with no caller. The pure functions
  (`overflowLabel`, `rowLabel`, `summarizeBarList`) stay as the place to add one.
- `onRowPress`, `isDisabled`: no consumer presses a row, and the disabled row could not meet the shared
  disabled rule on react-native-web 0.19 (a `Pressable` button drops out of the tab order). BarList has no
  disabled state.

## Decided in review

- Bar hue: silver for every row, red for a flagged row (the silver/red scheme of the workout charts).
- Track: `hairline`, replacing the brand-tinted track that read as low contrast on white.
- Layout: `inline` and `stacked` both ship, default `inline`.
- Overflow wording `"2 more · 3"`, no rank numerals; default empty state is `EmptyState` with `py-4`.
