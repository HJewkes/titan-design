---
section: Internal
---

`ui/table/table-model.ts`: pure `filterRows`, `toggleSetFilter`, `clearFilters`, `activeFilterCount`, `facetOptions`, `alignRange`, `missingRanges` and `windowSlice` for the Table filtering slice, with unit and property tests. `nextCell` moves from the DependencyMatrix model to `utils/grid-navigation.ts` so the Table grid mode can share it. Not yet exported (TD-162).
