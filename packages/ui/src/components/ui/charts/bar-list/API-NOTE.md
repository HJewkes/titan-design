# BarList API note

Source: TP-848 Round 0 contract (section 7), restated here. Component: `ui/charts/bar-list/`, story
`Components/Molecules/BarList`.

**Controlled versus uncontrolled.** Data in, list out. No internal state.

**Composition.** Rows are `View`s; label, value, secondary and description are `Typography`; the bar is a
track `View` with a fill `View` whose width is a percentage. No SVG and no d3, so it renders on web and
native. With `onRowPress` each row is a `Pressable`. Fixed anatomy is imported (Typography, Skeleton,
EmptyState); the only slot is `emptyState`. Wording that belongs to the consumer arrives through the
`format*` functions.

**Accessibility pattern.** No composite widget. Native list semantics: root `role="list"` named
`"<accessibilityLabel>. <summary>"`, each row `role="listitem"` with the name from `formatRowLabel`
(default: `"<label>: <value>, <secondary>, <flag label>, rank <n> of <shown>"`, omitting absent parts). The
bar and the visible texts inside a row are hidden from assistive tech so the row is read once. The overflow
row is a list item named by `formatOverflow`. With `onRowPress`, the row is a `button` inside the list item.
Keyboard map: Tab and Shift+Tab move between pressable rows in order; Enter or Space presses. No arrow keys,
no roving focus: the cap bounds the tab stops at `maxRows`. Without `onRowPress` there are no tab stops.

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
- A flag recolours the fill (`status-warning` or `status-error`) and a row's own `color` wins; the
  track stays `brand-primary-muted` under every fill.
- Duplicate ids keep both rows, keyed by id and position.
- `maxRows` below 1 clamps to 1 and a fraction floors; `NaN` uses the default of 10.

**Primitives and tokens.** `Typography`, `Skeleton`, `EmptyState`, `Pressable`, `cn`, `resolveColor`,
`formatCompact`. Existing tokens only: one bar hue for every row (`brand-primary`), a `brand-primary-muted`
track, `status-warning` and `status-error` for flagged rows.

## Reference marker

`referenceMarker: { value, label, formatValue? }` draws one labelled line on the value axis: a cutoff, a
budget, a target. Rules:

- The marker never changes the scale. `resolveMax` ignores it. A marker above the resolved maximum draws no
  line; the legend and the readout still state it. Pass `max` to keep the line visible.
- The marker never recolours a row and never sets a flag.
- One marker. An array is a later change.
- A `value` that is not finite or is at or below zero ignores the marker. A blank `label` becomes "Reference".
- The line is drawn in each row's bar at `value / max`, on the aligned track, 2 px wide. The legend sits after
  the overflow row ("Limit 100"). Both are hidden from assistive tech.
- The list name gains ` <label>: <valueText>. <n> of <N items> at or above.` and a row at or above the
  marker gains `at or above <label>` after its flag and before its rank. `reachedCount` covers hidden rows.
- `formatRowLabel` and `summarize` overrides receive `reachesMarker`, `markerLabel` and `model.marker`.

## Deviation from the shared disabled rule (S-h)

`isDisabled` should keep reading and focus and report `aria-disabled`. BarList cannot: with `isDisabled`,
a pressable row leaves the tab order and renders a native `disabled` button. react-native-web 0.19.13's
`Pressable` overwrites `aria-disabled` with its own `disabled`, does not handle `accessibilityState`, and
`createDOMProps` adds native `disabled` plus `tabIndex` -1 to any `<button>` carrying `aria-disabled`. The
row stays readable through its list item name.

## Taste items awaiting the owner's review round

Implemented at the contract's recommended default; the alternative is a story control where one exists.

- T1 bar hue: `brand-primary` for every row (the `color` prop switches it).
- T2 track: a visible `brand-primary-muted` track.
- T3 layout: `inline` and `stacked` both ship, default `inline`; the `layout` control switches them.
- T4 bar thickness, row height and the default `labelWidth` (96 px): first guesses.
- T5 overflow wording ("2 more · 3"), no rank numerals.
- T6 default empty state height: `EmptyState` with `py-4`.
