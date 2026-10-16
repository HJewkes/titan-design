---
section: Added
---

`useTable` filters, holds controlled state and serves a window. New options: `columns`, `getRowId`, `mode` (`client` default, or `manual` with `rowCount`, `getRow` and a debounced `onRangeNeeded` that asks once per aligned block), and controlled pairs `filters`/`defaultFilters`/`onFiltersChange`, `selectedIds`/`defaultSelectedIds`/`onSelectedIdsChange` and `sort`/`onSortChange`. New return fields: `filters`, `setFilter`, `toggleFilterValue`, `clearFilters`, `activeFilterCount`, `facetOptions`, `visibleRowCount`, `rowAt`, `windowRange`, `setWindowRange`, `windowRows`, `clearRequestedRanges` and selection helpers. A filter or sort change returns to the first page, the top of the window and forgets requested ranges. With no new option the hook behaves as before. `table-model.ts` gains `facetCounts` (TD-163).
