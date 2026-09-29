# DependencyMatrix API note

Source: TD-35 Round 0 contract (owner-decided), restated here in our own words. This is a design
note for a component that does not exist yet (`ui/charts/dependency-matrix/`, story
`Components/Organisms/DependencyMatrix`). It is not exported from any barrel.

## Pending owner confirmation

Three amendments to the Round 0 contract. Each carries a recommended answer.

1. **Fill mechanism for the four intensity steps.** The contract says to make the steps with `alpha()`
   washes of a token. `alpha()` handles only hex and `rgb()` and returns anything else unchanged, and
   `resolveColor` returns `var(--color-...)` on web, so that route paints full-opacity fills on web.
   Recommended: a fill layer under the value text whose `backgroundColor` is `resolveColor(token)` and
   whose `opacity` is set per step. It works on web and native and keeps the number opaque. No new
   token; open a token proposal only if the four steps fail to separate on both themes.
2. **Synthetic labelled fixtures until a scope-edges command exists.** No data source serves edges
   inside a directory or package today. Recommended: build v1 on the synthetic fixtures in
   `fixtures.ts` (invented names, contract-sized shapes). The component takes edges as data, so a real
   source later changes only the consumer.
3. **Window function source.** The contract wants one shared fixed-size window function, applied
   twice here (rows and columns). Recommended: use `computeWindow` from
   `packages/ui/src/utils/fixed-window.ts`, added by titan-design#308 (open, not yet merged), rather
   than a local list virtualiser, since a two-axis grid cannot use one.

## Purpose

A square matrix over one ordered item list. Rows and columns carry the same items. A filled cell says
one item depends on another; its value says how strongly. The component draws the order it is given
and knows nothing about files, imports or any data provider.

## Props

| Prop                 | Type                                                                  | Default                   | Notes                                                                                 |
| -------------------- | --------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| `items`              | `MatrixItem[]`                                                        | required                  | `{ id: string; label: string; group?: string }`. Array order is display order.        |
| `cells`              | `MatrixCell[]`                                                        | required                  | `{ from: string; to: string; value: number \| null; flag?: 'cycle' \| 'violation' }`. |
| `scale`              | `'linear' \| 'sqrt' \| 'log'`                                         | `'sqrt'`                  | Damps heavy-tailed weights before binning.                                            |
| `direction`          | `'row-depends-on-column' \| 'column-depends-on-row'`                  | `'row-depends-on-column'` | Which reading convention the grid uses. Flips which side of the diagonal is "upward". |
| `showValues`         | `boolean`                                                             | unset                     | Show the number as text in cells.                                                     |
| `maxItems`           | `number`                                                              | 60                        | Items past the limit fold into one "+M more" row and column that sums its cells.      |
| `width`, `height`    | `number`                                                              | required                  | Pixel size of the viewport.                                                           |
| `density`            | `'comfortable' \| 'dense'`                                            | unset                     | Cell size.                                                                            |
| `activeCell`         | `MatrixCellRef \| null`                                               | uncontrolled              | `MatrixCellRef = { from: string; to: string }`.                                       |
| `defaultActiveCell`  | `MatrixCellRef`                                                       | unset                     | Initial value when uncontrolled.                                                      |
| `onActiveCellChange` | `(cell: MatrixCellRef \| null) => void`                               | unset                     | Fires on every move.                                                                  |
| `onCellPress`        | `(cell: MatrixCell \| MatrixCellRef) => void`                         | unset                     | Receives the cell when it has data, else the bare reference.                          |
| `onHeaderPress`      | `(itemId: string) => void`                                            | unset                     | For drilling from a package matrix to a package's files.                              |
| `formatCellLabel`    | `(from: MatrixItem, to: MatrixItem, value: number \| null) => string` | built-in sentence         | Slot for the cell's accessible name.                                                  |
| `isLoading`          | `boolean`                                                             | `false`                   | Renders a `Skeleton` of the same size; no partial matrix.                             |
| `isDisabled`         | `boolean`                                                             | `false`                   | Keeps focus and reading, stops presses, reports `aria-disabled`.                      |
| `emptyState`         | `ReactNode`                                                           | built from `ui/`          | Shown when `items` is empty.                                                          |
| `accessibilityLabel` | `string`                                                              | required                  | Names the grid.                                                                       |
| `className`          | `string`                                                              | unset                     | Also extends `ViewProps`.                                                             |

There is no per-cell render prop: cells are fixed-size painted marks, and a slot per cell would defeat
windowing.

## Behaviour

- **Colour.** One hue in four binned steps by weight on the chosen `scale`. A `null` value fills at the
  lowest step and reads "weight unknown". The exact number is text, not colour. Groups are header bands
  and hairline rules, never categorical colour. Edge kinds are a filter the consumer applies before
  passing `cells`.
- **Cycle flag.** Drawn with `status-warning` plus a non-colour mark, and announced in words, since
  colour alone fails WCAG 1.4.1. A mutual pair is found by mirroring cells across the diagonal.
- **Legend.** Part of the component: the four steps, the cycle mark, and a caption stating the active
  `direction` in words.
- **Cell names.** Default sentences: "a depends on b, N references" (`row-depends-on-column`), "b is a
  dependency of a, N references" (`column-depends-on-row`), or "no dependency". Empty cells are
  focusable because "no dependency" is an answer.
- **States.** Loading and disabled as in the table above. Empty `items` show `emptyState`. Items with
  no cells show the grid with a one-line caption, not the empty state. Error is not a prop: the consumer
  shows its own alert rather than a matrix with silent holes.

## Accessibility

WAI-ARIA APG data grid. `role="grid"` with `aria-rowcount` and `aria-colcount`; `row`, `rowheader`,
`columnheader`, `gridcell` with `aria-rowindex` and `aria-colindex`, set as direct props, because
windowing keeps most cells out of the DOM. One tab stop with roving `tabIndex`. Arrow keys move one
cell and do not wrap. Home and End move within the row. Control+Home and Control+End reach the
corners. Page Up and Page Down move by one viewport of rows. Enter or Space presses the cell. Focus
follows the active cell and mounts it when it is off-window.

## Virtualisation

Fixed square cells, windowed on both axes by two calls to the shared window function. Row and column
headers are sticky and windowed on one axis each. Mounted cell count is bounded by the viewport and
overscan whatever the item count. At 600 px and dense density that is about 900 cells.

## Internal modules (planned)

`matrix-model.ts`, pure: `indexCells` (validate, drop unknown ids, merge duplicates, separate the
diagonal), `foldItems`, `binValue`, `mutualPairs`, `groupBands`, `nextCell`, `cellLabel`.
`useMatrixNavigation` owns the active cell. Properties to test: `nextCell` never leaves the matrix,
folding preserves total weight, `binValue` is monotonic, hostile input never throws.

## Fixtures

`fixtures.ts` holds thirteen synthetic fixtures: Default, Hub, Heaviest cell, Cycle, Wide, Package
level, One item, No edges, Empty, Very large (386 items), Long label, Null weight, Hostile. All names
are invented. Every fixture except Hostile references only ids present in its `items`.

## Mapping from an upstream `deps.matrix` payload

Illustrative only; the helper is not shipped. Assumes a payload of `groups` (node references),
`cells` as `[row, col, edgeCount, weight]` tuples, and `cycles` as index lists.

```ts
function fromDepsMatrix(payload: {
  groups: { id: string; name: string }[]
  cells: [number, number, number, number | null][]
}) {
  const items = payload.groups.map((g) => ({ id: g.id, label: g.name }))
  const cells = payload.cells.map(([row, col, , weight]) => ({
    from: items[row].id,
    to: items[col].id,
    value: weight,
  }))
  return { items, cells }
}
```
