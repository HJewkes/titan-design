---
section: Internal
---

`ui/tree-view/useTreeNavigation.ts`: the headless TreeView hook over the tree model. Expansion and selection each controlled or uncontrolled, a focused row with a roving tab stop, `revealId`, one `onLoadChildren` per unloaded expand, and a 500 ms typeahead buffer; selection never follows focus. `TreeRenderSlot<T>` joins `tree-view/types.ts`, and `TreeView.test-d.ts` checks `T` reaches both render slots. Not yet exported (TD-97).
