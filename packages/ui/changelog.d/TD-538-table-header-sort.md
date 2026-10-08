---
section: Fixed
---

`TableHeaderCell` names its sort button from a new `sortLabel` prop instead of stringifying element children, and a non-sortable header now passes `testID` and `accessibilityLabel` through. `useTable` moves back to the last page with rows when `data` shrinks, and an empty table's range starts at 0 (TD-538).
