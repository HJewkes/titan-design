# BarList API note

Source: TP-848 Round 0 contract (section 7), restated here and amended by the round 3 and round 4 reviews.
Component: `ui/charts/bar-list/`, story `Components/Molecules/BarList`.

**Controlled versus uncontrolled.** Data in, list out. One internal state: the index of the row that holds
the list's roving tab stop, which exists only while the rows carry a tip (see _Tip_). Nothing else is kept.

**Composition.** Rows are `View`s; label, value, secondary, flag label and description are `Typography`; the
bar is a track `View` with a fill `View` whose width is a percentage. No SVG and no d3, so it renders on web
and native. Fixed anatomy is imported (Typography, Skeleton, EmptyState, Tooltip); the only slot is
`emptyState`. Wording that belongs to the consumer arrives through `formatValue`, `formatSecondary` and the
row's own `flag.label`.

**Props (13).** `rows`, `accessibilityLabel`, `max`, `sort`, `maxRows`, `layout`, `size`, `formatValue`,
`formatSecondary`, `readouts`, `isLoading`, `emptyState`, `className`. `formatValue(value, row?)` formats
each row's value and, called without a row, the total of the rows past the cap. `readouts` is a list of
`BarListReadout` (`'value' | 'flag'`), default both: the texts a row prints after its bar. Hiding one never
changes a name; it moves the text into the tip. `secondaryValue` has no toggle: omit the data to hide it.

**Row layout.** Inline: `flex-row items-center gap-inline-md` holding the label (`w-24`, 96 px), the track
(`flex-1`) and then up to three cells in the order value, secondary, flag, each a direct child so one gap
separates everything. The value is `mono`, tabular, right-aligned, with `minWidth` of the widest value in
`ch` set on the Text itself (so `ch` is the mono font's own unit); the secondary is `caption` secondary,
tabular, right-aligned, `width` one `ch` wider than its widest text; the flag label is `caption` in
`text-text-error` at `leading-normal`, `width` one `ch` wider than its widest text, so every row pitches
alike. A cell renders only when some shown row has the part and `readouts` shows it; a row without the part
leaves its cell empty, so the tracks of a list share one length. Stacked: the header row holds the label
(`flex-1`) and the same cells, then the description, then the track. `ch` is a web unit; native drops the
widths (inherited, follow-up).

**Tip.** When `readouts` leaves out a readout, every data row (never the overflow row) carries a tip built
from `Tooltip` in controlled mode with `usePortal` and `placement="top"`, `useHoverFocusState` for the open
state and `useListNavigation` for the keys. Not `TipTrigger`: that would make the row a button and describe
it with its own text twice. The body comes from the pure `rowTip(row, formatValue)`: line 1 the row label
(`caption`, `leading-normal`) and its value (`mono`); last line the flag label in `text-text-error`, when
flagged. The body is wrapped in `hiddenFromAssistiveTech`, carries no `role="tooltip"`, and the row has no
`aria-describedby`: everything in the tip is already in the row's name. Opens on hover (web), on a focus a
key caused (web) and on long press (native); closes on hover out, blur, press out and Escape. The cursor
stays the default. With both readouts shown there is no `Pressable`, no tab stop and no tip.

**Keyboard map** (tips on). The list is one tab stop with a roving tabindex (`focusMode: 'roving'`,
`loop: false`): Tab enters at the row last visited; Down and Up move a row and stop at the ends; Home and
End go to the first and last row; the focused row's tip is open; Escape closes it. The key handler sits on
the list root and reads the bubbled event.

**Accessibility pattern.** No composite widget role. Native list semantics: root `role="list"` named
`"<accessibilityLabel>. <summary>"`, each row `role="listitem"` named by `rowLabel`:
`"<label>: <value>, <secondary>, <flag label>, rank <n> of <shown>"`, omitting absent parts. With
`sort: 'none'` the list is not ranked and the name carries no rank. The bar and the visible texts inside a
row are hidden from assistive tech so the row is read once. The overflow row is a list item reading
`"<count> more · <hidden total>"`, and the summary and the overflow row both format the hidden total with
`formatValue`. With tips on, the same role and name sit on the row's `Pressable`, so the focused element is
the named one.

**Virtualization.** None. The cap bounds the mounted rows at `maxRows + 1`. Stated scale: 5,000 input rows.
A list that must show hundreds of rows is a `Table`, not a BarList.

**Where the logic lives.** `bar-list-model.ts`, pure, no React: `cleanValue` (null, NaN and Infinity are
missing), `resolveMax` (a finite positive `max`, else the largest finite positive value, else 1),
`barFraction` (clamped to 0..1; 0 for missing and negative), `rankRows` (stable sort or none, then the cap),
`rowTexts`, `columnChars` (the widest text of each trailing cell among the shown rows), `rowLabel`,
`rowTip`, `summarizeBarList`, and `buildBarListModel` that composes them. The model never sees `readouts`;
`BarList.tsx` calls `buildBarListModel` in one `useMemo`, resolves the columns from `readouts`, and paints.

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
- The flag label is text the consuming app writes; BarList computes nothing from a limit.
- The label column of the inline layout is 96 px (`w-24`).
- Duplicate ids keep both rows, keyed by id and position.
- `maxRows` below 1 clamps to 1 and a fraction floors; `NaN` uses the default of 10.

**Primitives and tokens.** `Typography`, `Skeleton`, `EmptyState`, `Tooltip`, `useHoverFocusState`,
`useListNavigation`, `cn`, `resolveColor`, `formatCompact`, `useSurfaceMode` and `silverRed` from
`kit/silverRed.ts`. Existing tokens and ramp steps only: the silver/red pair (dark `grey[200]` and
`red[400]`, light `grey[600]` and `red[600]`), a `hairline` track and `text-error` flag labels. No brand
token. On the base surface both fills measure at least 3:1 against the track in both modes
(`BarList.test.tsx`); on the light `background-base` and `surface-raised` planes and the dark
`surface-raised` and `surface-overlay` planes at least one fill measures between 2.7 and 3.0. The focus
ring is the stylesheet's `*:focus-visible` outline (`global.css`); no class set is added.

## Props audit (round 3)

Cut, with the reason:

- `color`: the list has one palette, the silver/red scheme; a single row still takes `row.color`.
- `labelWidth`: one width (96 px) until a consumer needs another.
- `formatOverflow`, `formatRowLabel`, `summarize`: wording overrides with no caller. The pure functions
  (`overflowLabel`, `rowLabel`, `summarizeBarList`) stay as the place to add one.
- `onRowPress`, `isDisabled`: no consumer presses a row, and the disabled row could not meet the shared
  disabled rule on react-native-web 0.19 (a `Pressable` button drops out of the tab order). BarList has no
  disabled state.

Added in round 4: `readouts`. It has a named requester (the round 3 review), no existing prop can express
it (`flag` also colours the bar, so dropping the data is not a substitute), and the key-list form already
exists in titan. Two booleans would cost two props for the same reach.

## Decided in review

- Bar hue: silver for every row, red for a flagged row (the silver/red scheme of the workout charts).
- Track: `hairline`, replacing the brand-tinted track that read as low contrast on white.
- Layout: `inline` and `stacked` both ship, default `inline`.
- Overflow wording `"2 more · 3"`, no rank numerals; default empty state is `EmptyState` with `py-4`.
- Round 4: the value sits next to the bar in a right-aligned column, the flag label right of the value as
  the alert indicator; `readouts` toggles both; a hidden readout turns the row tips on.
