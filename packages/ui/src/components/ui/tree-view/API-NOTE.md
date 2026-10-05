# TreeView API note

Source: TD-32 Round 0 contract, Part B (decided 2026-09-19), restated in our own words with amendments
A1 to A6. `TreeView` is a domain-free navigator over a containment hierarchy that arrives as a flat
list of rows with a `parentId`. Fixtures are in `fixtures.ts`, which no barrel exports. Nothing in this
directory is exported yet: the model, the hook and the shell are in place, and the barrel export lands
with the functional gate (S6).

Decided in Round 0 and not reopened: 32.1 the APG Tree pattern, not treegrid; trailing values are
read-only and belong to the row's description. 32.2 lazy children ship in v1 (`onLoadChildren`,
`loadingIds`), because rows whose children are not loaded are the normal shape of the data.

## Amendments

Each amendment records where `main` or a later decision differs from the Round 0 text, and the rule
that now holds.

- **A1. The window comes from `computeWindow`.** Status: decided (design-coord under the owner's
  delegation, 2026-10-03). Round 0 asked for one shared fixed-height window function. It is
  `computeWindow` in `utils/fixed-window.ts` (TD-81), shared with the dependency matrix (TD-35) and
  the virtualised table (TD-33). It lives in `utils/`, not `ui/`, because it is a pure function with
  no JSX. The tree feeds it a `ScrollView.onScroll` offset, the row height of the active density,
  the visible row count and an overscan; it does not use `FlatList`.
- **A2. Trailing content is the row's description, with a fallback.** Status: decided (design-coord
  under the owner's delegation, 2026-10-03). `renderTrailing` output renders inside an element with a
  stable id, and the `treeitem` points at it with `aria-describedby`. react-native-web has not been
  shown to pass `aria-describedby` through, so the shell slice proves it in jsdom first. If it does
  not reach the DOM, the fallback appends the trailing text to the row's accessible name as a suffix
  after the label. Either way the consumer passes text-bearing nodes, a null value reads as its
  reason and never as zero, and a test asserts the text is in the row's description or name.

  Spike result (S4, 2026-10-04): in jsdom we rendered a react-native-web `View` with
  `role="treeitem"`, `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded`,
  `aria-selected`, `tabIndex={0}` and `aria-describedby="d1"`, next to a `Text` with `nativeID="d1"`,
  inside a `View` with `role="tree"`. The DOM showed every attribute on the row's `div`
  (`aria-describedby="d1"`, `aria-level="2"`, `tabindex="0"`, and so on), the sibling as
  `<div id="d1">`, and `role="tree"` on the container. `aria-describedby` reaches the DOM, so the
  shell uses it and the fallback is not needed. The row's name is its label (`aria-label`), and
  `TreeView.test.tsx` keeps the check as its first test.

- **A3. `*` expands every sibling, loaded or not.** Status: decided (design-coord under the owner's
  delegation, 2026-10-03). `*` expands every expandable sibling of the focused row. For each sibling
  that has `childCount > 0` and no loaded children, it calls `onLoadChildren(id)` once, as a single
  expand would; a sibling already in `loadingIds` is not asked again. The consumer may batch the
  calls. Focus does not move.
- **A4. A truncation notice row.** Status: decided (design-coord under the owner's delegation,
  2026-10-03). When `isTruncated` is set, a notice row follows the last visible row. It shows a
  default text saying the list was cut and not every row is shown, which an optional
  `truncatedNotice?: ReactNode` slot replaces. The notice is not a `treeitem`, not in the tab order
  and not reachable with the arrow keys; it does not count toward `aria-setsize`. It sits inside the
  scrolling body, so it is windowed like a row.
- **A5. Keyboard tests run in jsdom, and in a real browser through a play story.** Status: decided
  (design-coord under the owner's delegation, 2026-10-03). Round 0 owed the APG keyboard tests as
  Storybook play functions. The jsdom APG tests (every key below moves `document.activeElement` and
  holds one `tabindex="0"`) satisfy the task's done-when on their own. The real-browser check also
  runs: an interaction story tagged `play`, in the `storybook` Vitest project that CI's
  `storybook-play` job runs.
- **A6. `height` is optional.** Status: decided (design-coord, 2026-10-03, from a consumer asking for
  a 15-row tree in a detail card). Without `height`, the tree renders every visible row at its
  natural height with no window and no scroll container, and the page scrolls. A large tree must
  pass `height`: windowing, and the bound on mounted rows, only apply when it is set.

## Placement

`ui/tree-view`, tier organism, story `Components/Organisms/TreeView`. It knows ids, parents and
labels, and nothing about files, metrics or the code index. `Sidebar` (flat, and `custom/` tier) and
`Collapse` (each node nests its own children, which cannot be windowed) were considered and are not a
base. `Treemap` is the other view of the same hierarchy, so the tree shares its identity vocabulary
(`id`, `selectedId`) and one selection can drive both.

## Props

Names and types from Round 0, plus `truncatedNotice` (A4):

- `nodes: TreeNode<T>[]`, where `TreeNode<T>` is `{ id; parentId; label; kind?; childCount?; data?: T }`
  with `parentId: string | null`. `childCount` counts children in the full tree, loaded or not.
- `rootId?: string | null`
- `expandedIds`, `defaultExpandedIds` (`ReadonlySet<string>`) and `onExpandedChange(ids, change)`, where
  `change` is `{ id, isExpanded }`
- `selectedId`, `defaultSelectedId` (`string | null`) and `onSelect(id)`
- `revealId?: string`: expands the loaded ancestors of that id and scrolls it into view
- `onLoadChildren?(id)`, `loadingIds?: ReadonlySet<string>`
- `renderLeading?(node)`, `renderTrailing?(node)`, `emptyState?: ReactNode`
- `isTruncated?: boolean`, `truncatedNotice?: ReactNode`
- `isLoading?: boolean`, `isDisabled?: boolean`
- `height?: number` (A6), `density?: 'comfortable' | 'dense'`
- `accessibilityLabel: string`, `className?: string`, and `ViewProps`

`TreeNode` is defined in `fixtures.ts` for now; the model slice moves it to `types.ts` and the
fixtures import it from there.

## Controlled versus uncontrolled

Expansion and selection are two independent slices, each with a value, a default and a change
callback. A consumer that keeps selection in the URL controls it. Expansion is normally uncontrolled;
`revealId` covers arriving at a deep node with its ancestors closed, so the consumer does not have to
take control of expansion for that one case.

Selection never follows focus. Selecting a row is a network round trip for the consumer, and the APG
advises against following focus when selection triggers a load. Arrow keys move focus; Enter, Space
or a press selects. Selection is single only; multi-select is out of scope.

## Composition slots

`renderLeading` (a kind icon), `renderTrailing` (a value, a delta, a count) and `emptyState`, which
defaults to `EmptyState` from `ui/empty-state`. The label is a string, not a slot, because typeahead
and the accessible name need text. Trailing content is part of the row's description (A2). The
truncation notice is `truncatedNotice` (A4).

## Accessibility

WAI-ARIA APG Tree View (https://www.w3.org/WAI/ARIA/apg/patterns/treeview/). A `tree` container with
`accessibilityLabel`, `treeitem` rows, `aria-expanded` only on rows that can expand (a row with
`childCount > 0` and no loaded children counts), `aria-selected`, and one tab stop with a roving
`tabindex`. State goes on the DOM as direct ARIA props, never `accessibilityState`, which
react-native-web drops. Rows are a flat windowed list, not nested `group`s, so every row carries
`aria-level`, `aria-setsize` and `aria-posinset`, which the APG allows for exactly this case.

Keys: Down and Up move through the visible rows and do not wrap. Right opens a closed row, and on an
open row moves to its first child. Left closes an open row, and on a closed row moves to its parent.
Home and End go to the first and last visible row. Enter selects. Printable characters run typeahead
over visible labels, from the row after focus, case-insensitive. `*` expands the siblings (A3).

The treegrid pattern (https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) is not built in v1. The
hook's row shape carries level, set size and position so a treegrid shell can wrap it later without a
rewrite.

## Virtualisation

Expansion flattens the tree into the list of visible rows. Each density has one fixed row height, so
the window is arithmetic over that list with overscan (A1). The focused id lives in state, so a row
that scrolls out and back regains `tabindex="0"`. A key that moves focus to a row outside the window
scrolls first, then focuses once the row mounts; `revealId` scrolls its row in the same way without
taking DOM focus. A consumer that collapses an ancestor of the focused row from outside the tree
(controlled expansion) moves focus to the nearest visible ancestor, and the hook keeps no hidden
focus to return to on re-expand. A pointer or wheel scroll that takes the focused row out of the
window is never undone. The focused row stays mounted outside the window at its own offset in the
scroll content, so it keeps DOM focus and stays the one tab stop; at most one row more than the
window is mounted.

## Where the logic lives

Pure functions in `tree-model.ts`:

- `indexNodes`: validate, drop orphans and duplicate ids, break cycles, report each problem. Cycle
  members are dropped and reported in `problems` (S2) rather than one being promoted to a root; S5
  decides whether that stays.
- `visibleRows`: nodes and the expanded set in; ordered rows with level, set size and position out.
- `ancestorsOf`.
- `nextFocus`: the row list, the focused id and a key in; the next focused id and an optional expand,
  collapse or load intent out.
- `typeaheadMatch`.

The headless hook `useTreeNavigation` wires them to the two state slices and returns row and tree
props. Properties: `visibleRows` never emits a child before its parent or under a collapsed ancestor;
`nextFocus` always returns a visible id; expanding then collapsing restores the list; hostile input
never throws.

## Primitives composed

`Pressable`, `View`, `Text`, `ScrollView`, `Typography`, `Skeleton`, `Spinner`, `EmptyState`, the
chevron from `icons/`, focus ring and hover from the `interactive-*` tokens, and the selected row from
the existing `surface-*` tokens. Indent is the 4px numeric scale times the level.

S4 starting values, for the S5 rounds to decide: rows are `h-control-md` (40 px) comfortable and
`h-control-sm` (32 px) dense; indent is 16 px (`pl-4`) per level; the expander is
`ChevronRightIcon` turned 90 degrees when open; selected is `bg-surface-raised`; hover is
`bg-interactive-hover`; focus is a `ring-interactive-focus` inset ring on `focus-visible`.

## States

- Loading: `isLoading` swaps the rows for `Skeleton` rows. A row in `loadingIds` shows a `Spinner`
  in place of its expander.
- Empty: `nodes: []` renders `emptyState`.
- Error: not a prop. A failed child load is the consumer's to show (for example with `Alert`); it
  clears `loadingIds`, and the tree collapses the row so the expander can be retried. The collapse
  waits one commit after the id leaves `loadingIds`, so nodes that arrive just after the clear keep
  the row open.
- Disabled: `isDisabled` sets `aria-disabled`, stops selection and expansion, and leaves the tree
  focusable and readable.

## Test layers owed

- Logic: unit tests per key and fast-check properties for the model.
- Keyboard: jsdom APG tests for every key, plus a `play` interaction story in a real browser (A5).
- axe on every fixture and state.
- Visual baselines for Default and Deep.
- Scale: 5,000 rows mount at most the window plus overscan (`expectBoundedMount` in `src/test/scale`).
- Types: `TreeNode<T>` carries `T` into both render slots, in a `TreeView.test-d.ts` file.

## Open questions to the data provider

A metric's range across a subtree and a sibling rank with ties would both make good trailing content,
and `hierarchy.get` does not compute either today. Filed with the provider.

## Fixtures

`fixtures.ts` holds 11 fixtures: Default, Deep, Wide, One item, Empty, Null with reason, Missing
baseline, Incomparable baseline, Very large, Long label and Hostile.

- Real rows are titan-platform's public source at `7dc61b4a`, shaped by hand to the `hierarchy.get`
  result: directories and `.ts`/`.tsx` files with real paths, non-blank line counts as `loc` and
  `childCount` from the tree. A file's `childCount` is its top-level export count, standing in for
  symbol rows the fixtures do not load. Round 0's index snapshot is not on the public history; this
  commit has the same layout (18 packages, 2 products, 46 files in `session-read/src`).
- Missing baseline in Round 0 had two cases. Missing baseline has no deltas; Incomparable baseline
  carries synthetic deltas with `comparable: false`.
- Very large is generated: the three embedded real packages repeated under new ids, shallowest
  first, cut at exactly 5,000 rows with `isTruncated`. Round 0's real 2,900-row depth-8 set is not
  embedded; the generated set covers the same scale.
- Synthetic rows carry `synthetic: true` in `data`, and each fixture names its `source`.
- Hostile is the only fixture with an orphan, a duplicate id, a cycle, a root listed after its child,
  an unknown `kind` or a `childCount` of 0 with children present. `HOSTILE_CASES` names the ids.

## Mapping a `hierarchy.get` result

Illustrative only; the consumer owns it.

```ts fragment
const fromHierarchyGet = (res: HierarchyResult): TreeNode<HierarchyRow>[] =>
  res.nodes.map((row) => ({
    id: row.id,
    parentId: row.parentId,
    label: row.name,
    kind: row.kind,
    childCount: row.childCount,
    data: row,
  }))
// <TreeView nodes={fromHierarchyGet(res)} isTruncated={res.truncated}
//   onLoadChildren={(id) => fetchHierarchy({ root: id, depth: 1 })} ... />
```
