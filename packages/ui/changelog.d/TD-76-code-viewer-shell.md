---
section: Internal
---

`ui/code-viewer/CodeViewer`: the shell over the line model. A Card frame with `role="region"`, line numbers from `startLine`, a visible summary of the flagged ranges, a gutter that is an APG Listbox for selecting a range of lines (per-line buttons on native), fixed-row windowing above 500 lines, `focusLine`, and loading, empty and disabled states. Adds `expandTabs`, `contentWidth`, `highlightSummary`, `useLineWindow` and `useFocusLine`, and `selectLine` on `useLineRange`. Not yet exported (TD-76).
