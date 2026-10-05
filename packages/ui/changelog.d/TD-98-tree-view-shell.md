---
section: Internal
---

`ui/tree-view/TreeView.tsx`: the windowed APG Tree View shell over `useTreeNavigation`. `role="tree"` with `treeitem` rows carrying `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded` only when a row can expand, `aria-selected`, a roving `tabindex` and the trailing slot as `aria-describedby`, all as direct DOM props. With `height` it windows through `computeWindow` and a key that moves focus off the window scrolls first, then focuses; without `height` every row mounts at natural height. Spinner rows for `loadingIds`, a truncation notice, `isLoading`, empty and `isDisabled` states, `density`, a `Default` story, a play interaction story and `tests/interaction/tree-view.spec.ts`. `useTreeNavigation` now collapses a row that leaves `loadingIds` with no children one commit later, and drops a focused row hidden by a controlled collapse in favour of its nearest visible ancestor. Not yet exported (TD-98).
