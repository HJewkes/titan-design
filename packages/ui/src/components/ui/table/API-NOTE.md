# Table API note

Source: TD-33 Round 0 contract, Part B (decided 2026-09-19), restated in our own words with amendments
A1 to A5. It describes the TD-33 additions to the `Table` family: filtering, a filter bar, a windowed
body and a grid keyboard mode. The landed surface is in `README.md`. Fixtures are in `fixtures.ts`,
which no barrel exports.

Decided in Round 0 and not reopened: 33.1 small tables keep `TablePagination` in `client` mode. 33.2
the APG Table pattern stays the default and `navigation="grid"` opts into the APG Grid pattern.

## Amendments

Each amendment records where `main` differs from the Round 0 text, and the rule that now holds.

- **A1. State reaches the DOM as direct ARIA props.** Status: confirmed. react-native-web drops
  `accessibilityState` silently, so state is set only as `aria-disabled`, `aria-checked`,
  `aria-pressed` and `aria-sort`. `isDisabled` sets `aria-disabled="true"` on the table, disables
  sort, filter and selection, and leaves scrolling and reading alone. The selection checkboxes move
  from `accessibilityState.checked` to `aria-checked` (`true`, `false`, `mixed`); that change lands in
  TD-243, and TD-33 keeps and tests it. Round 0 Part A section 5 said state is reported through
  `accessibilityState`.
- **A2. Row count through context.** Status: confirmed. `TableVirtualBody` knows the count and
  `Table` owns the `role="table"` node, so the body registers the count through `TableContext`: a
  setter `Table` holds in state, called only when the filtered count changes. `Table` gains no
  `rowCount` prop; `TableProps` stays frozen except `navigation` and `isDisabled`.
- **A3. Pure functions in `table-model.ts`.** Status: confirmed. New pure functions live in
  `table-model.ts`, inside the mutation-testing scope (`*-model.ts`, `docs/test-layers.md`).
  `useTableState.ts` re-exports and composes them. Landed functions stay where they are, under their
  landed names: Round 0's `toggleSortState` is `nextSortDirection`. The README lines that place
  filtering in `useTableState.ts` change when the functions land.
- **A4. Row heights from `size.control`.** Status: mechanism confirmed; values provisional. Default
  row heights come from `size.control`, with no new token: dense 32 (`control-sm`), comfortable 48
  (`control-lg`). A `rowHeight` prop on `TableVirtualBody` overrides. The values 32 and 48 hold until
  the TD-167 review round, which compares 32, 40 and 48. Selection cells follow the row's density
  padding, so a dense selectable row fits 32; today `TableSelectCell` hard-codes `py-3.5` and clips a
  dense row, which the virtual-body slice fixes.
- **A5. Latency is counted, not timed, in CI.** Status: confirmed. jsdom counts work and never times
  it: `filterRows` calls each accessor at most once per row per active filter, and a scroll does not
  re-run it. A play function on Very large types a text filter and logs how long the live region takes
  to settle; the figure, against a 250 ms target, is read at the functional gate and never fails a run.

## Placement

`ui/table`. The filter bar and the virtual body are parts of the `Table` family, exported from this
directory, not separate components.

## Controlled versus uncontrolled

Sort, filters and selection are three independent slices, each with a value, a default and a change
callback (`x`, `defaultX`, `onXChange`). `mode` decides who computes rows and which stage closes the
pipeline:

- `client` filters and sorts `rows` in the hook and ends in `pageSlice` (33.1).
- `manual` only holds state and emits changes, and ends in `windowSlice` over sparse server-paged
  rows. The consumer refetches.

Any sort or filter change resets scroll to the top and clears requested ranges, as `useTable` already
resets the page.

## Composition slots

Cells stay children, as today. `renderRow(row, index)` for the virtual body, `renderPlaceholderRow`,
`emptyState`, `filteredEmptyState`, and the filter bar's children. The consumer composes filter
controls from `TableFilterSet` and `TableFilterText`, so a table without filters pays nothing.
`emptyState` and `filteredEmptyState` default to `TableEmptyState`.

## Accessibility

v1 keeps the WAI-ARIA APG Table pattern (https://www.w3.org/WAI/ARIA/apg/patterns/table/), with
sortable headers as in the APG sortable table example: a button inside each `columnheader` and
`aria-sort` on the header. Windowing adds `aria-rowcount` on the table (A2) and `aria-rowindex` on
each row (header row 1, data rows `index + 2`), which ARIA requires when not every row is in the DOM.
A polite live region announces the result count after a filter change. Each facet group is a labelled
`group` of toggle buttons with `aria-pressed`. State is set through direct ARIA props (A1).

`navigation="grid"` opts into the APG Grid pattern (https://www.w3.org/WAI/ARIA/apg/patterns/grid/):
one tab stop, arrow keys move by row and cell. It is a control on the same story, with its own
keyboard tests.

## Virtualisation

Fixed row height per density (A4), windowed with `computeWindow` (`utils/fixed-window.ts`, shared with
TreeView). The header stays outside the scrolling body. Variable-height rows are out of scope: cells
truncate, as `FLEX_CELL` already makes them. `onRangeNeeded` is debounced and asks in aligned blocks,
so a consumer can map one block to one page request of up to 500 rows.

## Where the logic lives

Pure functions (A3), composed by `useTableState` in this fixed order: `filterRows` (new), `sortRows`
(landed, unchanged), then `pageSlice` (landed, `client`) or `windowSlice` (new, `manual`). Also
`nextSortDirection` (landed), `toggleSetFilter`, `facetOptions` and `alignRange`. `facetOptions`
merges facet counts with the active selection, so a selected value with count 0 stays visible.

Properties: filtering never adds rows. Sort is stable and nulls stay last in both directions. Clearing
filters restores the input. Every range asked for is inside `0..rowCount`.

## Primitives composed

The decomposed `Table` shell, `Chip`, `Pill`, `Input`, `Select`, `Skeleton`, `EmptyState` (through
`TableEmptyState`), `Tooltip`, `ScrollView`.

## States

Loading: in `manual` mode, rows outside the loaded range render through `renderPlaceholderRow`
(`Skeleton` composed). Empty: `emptyState`. Filtered to nothing: `filteredEmptyState`, a state distinct
from Empty. Disabled: `isDisabled` (A1). The fixtures cover each state.

## Test layers owed

- Logic: unit and property tests, including `filterRows` and `windowSlice`.
- Play functions: sort, filter, clear, and keyboard in both `navigation` modes.
- axe on every fixture.
- Visual baselines for Default and Filtered empty.
- Scale: 10,000 rows in both `manual` windowed and `client` paginated mode (`expectBoundedMount`),
  plus the work counts of A5.
- Types: `ColumnDef<Row>` accessors and `renderRow`.

`TaskTable` and the external consumers must pass unchanged.

## Open question to the data provider

Whether a facet's own field excludes that field's active selection when counting ("facet
self-filter"). The fixtures assume it does not: every facet counts the unfiltered source.

## Fixtures

`fixtures.ts` holds 11 fixtures: Default, One item, Empty, Filtered empty, Null cells, Missing
baseline, Baseline, Very large, Sparse window, Long content and Hostile. Rows are code-check findings.

- Real rows are the 60 findings recorded from this repository at 028e30b1. Only row fields are kept;
  each is stored as `[rule, path, value, threshold]` and expanded to the full row. Default keeps the
  recorded facet answer literally.
- Very large is 10,000 synthetic findings on the real paths, built from a seeded generator so every
  build is identical. Sparse window is its rows 0 to 499 with `total` 10,000 and Very large's facets.
- Fixtures with synthetic rows or fields say so in `label`. `total` is the unfiltered source count, so
  every facet sums to it.
- Hostile is the only fixture with duplicate ids, impossible facets, non-finite values or a shrinking
  row count.

## Mapping a findings page

Illustrative only; the consumer owns it.

```ts
const fromFindingsPage = (res: FindingsPage, offset: number) => ({
  rowCount: res.total,
  facets: res.facets,
  rows: new Map(res.rows.map((row, i) => [offset + i, row])),
})
// useTable({ mode: 'manual', rowCount, getRow: (i) => rows.get(i), getRowId: (r) => r.id,
//   onRangeNeeded: ({ start, end }) => fetchFindings({ offset: start, limit: end - start }) })
```
