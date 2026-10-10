# BarList API note

Source: TP-848 Round 0 contract (section 7), restated here and amended by the round 3, round 4 and round 5
reviews. Component: `ui/charts/bar-list/`, story `Components/Molecules/BarList`.

**Controlled versus uncontrolled.** Data in, list out. One internal state: the index of the row that holds
the list's roving tab stop, which exists only while the rows carry a tip (see _Tip_). Nothing else is kept.

**Composition.** Rows are `View`s; label, value, secondary and description are `Typography`; the bar is a
track `View` with a fill `View` whose width is a percentage. No SVG and no d3, so it renders on web and
native. Fixed anatomy is imported (Typography, Skeleton, EmptyState, Tooltip); the only slot is
`emptyState`. Wording that belongs to the consumer arrives through `formatValue`, `formatSecondary` and the
row's own `flag.label`.

**Props (13).** `rows`, `accessibilityLabel`, `max`, `sort`, `maxRows`, `layout`, `size`, `formatValue`,
`formatSecondary`, `isValueHidden`, `isLoading`, `emptyState`, `className`. `formatValue(value, row?)`
formats each row's value and, called without a row, the total of the rows past the cap. `isValueHidden`
takes the value out of the row; it never changes a name, it moves the text into the tip. `secondaryValue`
has no toggle: omit the data to hide it. A row's `flag` is `{ tone: 'warning' | 'error', label }`: the
tone paints the bar (`warning` near, `error` over), the label is read and shown in the tip, never printed in
the row.

**Row layout.** Inline: `flex-row items-center gap-inline-md` holding the label (`w-24`, 96 px), the track
(`flex-1`) and then up to two cells in the order value, secondary, each a direct child so one gap separates
everything. The value is `mono`, tabular, right-aligned, with `minWidth` of the widest value in `ch` set on
the Text itself (so `ch` is the mono font's own unit); the secondary is `caption` secondary, tabular,
right-aligned, `width` one `ch` wider than its widest text. A cell renders only when some shown row has the
part (and, for the value, `isValueHidden` is off); a row without the part leaves its cell empty, so the
tracks of a list share one length. Stacked: the header row holds the label (`flex-1`) and the same cells,
then the description, then the track. `ch` is a web unit; native drops the widths (inherited, follow-up).

**Tip.** When a shown row carries a flag, or `isValueHidden` is set, every data row (never the overflow row)
carries a tip built from `Tooltip` in controlled mode with `usePortal` and `placement="top"`,
`useHoverFocusState` for the open state and `useListNavigation` for the keys. Not `TipTrigger`: that would
make the row a button and describe it with its own text twice. The body comes from the pure
`rowTip(row, formatValue)`: line 1 the row label (`caption`, `leading-normal`) and its value (`mono`); last
line the flag label in `text-text-error`, when flagged. The body is wrapped in `hiddenFromAssistiveTech`,
carries no `role="tooltip"`, and the row has no `aria-describedby`: everything in the tip is already in the
row's name. Opens on hover (web), on a focus a key caused (web) and on long press (native); closes on hover
out, blur, press out and Escape. The cursor stays the default. A plain list (no flag, value shown) has no
`Pressable`, no tab stop and no tip.

**Keyboard map** (tips on). The list is one tab stop with a roving tabindex (`focusMode: 'roving'`,
`loop: false`): Tab enters at the row last visited; Down and Up move a row and stop at the ends; Home and
End go to the first and last row; a press on a row moves the stop to it; the focused row's tip is open;
Escape closes it. The key handler sits on the list root and reads the bubbled event, then calls any
`onKeyDown` the caller passed.

**Accessibility pattern.** No composite widget role. Native list semantics: root `role="list"` named
`"<accessibilityLabel>. <summary>"`, each row `role="listitem"` named by `rowLabel`:
`"<label>: <value>, <secondary>, <flag label>, rank <n> of <shown>"`, omitting absent parts. With
`sort: 'none'` the list is not ranked and the name carries no rank. The bar and the visible texts inside a
row are hidden from assistive tech so the row is read once. The overflow row is a list item reading
`"<count> more · <hidden total>"`, and the summary and the overflow row both format the hidden total with
`formatValue`. With tips on, the same role and name sit on the row's `Pressable`, so the focused element is
the named one. The empty state is a `role="group"` named by `accessibilityLabel`.

**Virtualization.** None. The cap bounds the mounted rows at `maxRows + 1`. Stated scale: 5,000 input rows.
A list that must show hundreds of rows is a `Table`, not a BarList.

**Where the logic lives.** `bar-list-model.ts`, pure, no React: `cleanValue` (null, NaN and Infinity are
missing), `resolveMax` (a finite positive `max`, else the largest finite positive value, else 1),
`barFraction` (clamped to 0..1; 0 for missing and negative), `rankRows` (stable sort or none, then the cap),
`rowTexts`, `columnChars` (the widest text of each trailing cell among the shown rows), `rowLabel`,
`rowTip`, `summarizeBarList`, and `buildBarListModel` that composes them and counts the shown flagged rows
(`flaggedCount`). The model never sees `isValueHidden`; `BarList.tsx` calls `buildBarListModel` in one
`useMemo`, resolves the columns, and paints.

**Rules fixed here.**

- The cap applies after the sort. With `sort: 'none'` it keeps the first N in input order.
- Hidden rows fold into one overflow row with a count and a sum and no bar. The sum of many small rows can
  exceed the largest row and would distort the scale.
- All-zero rows render with empty bars; they are data, not an empty list.
- Negative values draw no bar and keep their text. Diverging bars are out of scope.
- A flag is colour on the bar plus its label in the row's accessible name and tip. The label is never
  printed in the row (round 5: it cost space the colour and the tip already cover).
- An unflagged row's fill is `silverRed(mode).neutral`; a `warning` flag paints `.near` and an `error` flag
  `.over`, two steps apart on the red ramp (dark red[300] / red[400], light red[500] / red[700]). A row's
  own `color` wins over all three. The track is `bg-hairline` under every fill.
- The flag label is text the consuming app writes; BarList computes nothing from a limit.
- The label column of the inline layout is 96 px (`w-24`).
- Duplicate ids keep both rows, keyed by id and position.
- `maxRows` below 1 clamps to 1 and a fraction floors; `NaN` uses the default of 10.

**Primitives and tokens.** `Typography`, `Skeleton`, `EmptyState`, `Tooltip`, `useHoverFocusState`,
`useListNavigation`, `cn`, `resolveColor`, `formatCompact`, `useSurfaceMode` and `silverRed` from
`kit/silverRed.ts`. Existing tokens and ramp steps only: the silver/red tones (dark `grey[200]`, `red[300]`
and `red[400]`; light `grey[600]`, `red[500]` and `red[700]`), a `hairline` track and `text-error` for the
flag label in the tip. No brand token. On the base surface every fill measures at least 3:1 against the
track in both modes except the light near red, which measures 2.70 there (3.81 against the plane): the
owner's console round 6 pick, declared in `BarList.test.tsx`. The focus ring is the stylesheet's `*:focus-visible` outline
(`global.css`); no class set is added.

## Props audit (round 3)

Cut, with the reason:

- `color`: the list has one palette, the silver/red scheme; a single row still takes `row.color`.
- `labelWidth`: one width (96 px) until a consumer needs another.
- `formatOverflow`, `formatRowLabel`, `summarize`: wording overrides with no caller. The pure functions
  (`overflowLabel`, `rowLabel`, `summarizeBarList`) stay as the place to add one.
- `onRowPress`, `isDisabled`: no consumer presses a row, and the disabled row could not meet the shared
  disabled rule on react-native-web 0.19 (a `Pressable` button drops out of the tab order). BarList has no
  disabled state.

Added in round 4: `readouts`, a key list over the value and the flag label. Replaced in round 5 by
`isValueHidden`: with the flag label gone from the row, one boolean covers the only toggle left, in the
`isX` form the prop conventions ask for. The flag needed no new field to say near or over: `tone` already
does, and now paints two reds instead of one.

## Decided in review

- Bar hue: silver for every row, red for a flagged row (the silver/red scheme of the workout charts).
- Track: `hairline`, replacing the brand-tinted track that read as low contrast on white.
- Layout: `inline` and `stacked` both ship, default `inline`.
- Overflow wording `"2 more · 3"`, no rank numerals; default empty state is `EmptyState` with `py-4`.
- Round 4: the value sits next to the bar in a right-aligned column; a hidden readout turns the row tips on.
- Round 5: the value stays right-aligned, 8 px from the bar (agreed); the flag label is the app's text
  (agreed); the flag label leaves the row and the two flag tones paint two reds (revision; the near/over
  shades are the round 6 question).
