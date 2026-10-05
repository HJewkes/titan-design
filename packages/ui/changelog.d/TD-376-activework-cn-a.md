---
section: Fixed
---

`CoChangeChip`, `FileHistoryExplorer`, `InitiativeCard`, `PortfolioOverview` and `SessionListItem` merge the caller's `className` through `cn()`, so a conflicting class replaces the root's own instead of sitting beside it; `SessionListItem` gains the `className` prop (TD-376).
