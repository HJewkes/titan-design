# Table — component family

The generic data grid: a controlled styled shell (`Table` and its cells) over a headless state module
(`useTableState.ts`). It is the first component split into the Q9 default shape of a headless hook under a
styled shell, so new stateful components should copy this layout.

This README is the **index**. It maps each part's dependencies (**composes ↓**) and consumers (**used-by ↑**).
Storybook's `Components/Organisms/Table` autodocs repeats the Composes line.

## The split

| Layer | File | Owns |
| --- | --- | --- |
| Headless | `useTableState.ts` | Sort order (`sortRows`, stable, blanks last both ways), the sort cycle (`nextSortDirection`), paging (`pageSlice`, `pageRange`), the selection tri-state (`selectionState`), a header's sort display (`columnSortState`), and the `useTableState` hook. The hook is exported publicly as `useTable`. |
| Context | `TableContext.ts` | What the shell hands its cells: sort, selection and density, plus the shared cell padding. |
| Styled shell | `Table.tsx` and one file per cell | Rendering only. Every decision comes from the headless module or the context. |

Everything here is pure except `useTableState`'s `useState` calls and the header's hover flag, which is view
state. Put new state logic (filtering, windowing) in `useTableState.ts` as a pure function first, then wire it
into the hook. Unit-test it there without rendering.

## Composition tree

```
Table ........................ organism → TableContext
├─ TableHeader / TableBody ... layout
├─ TableRow .................. layout
├─ TableHeaderCell ........... molecule → Tooltip, columnSortState
├─ TableCell ................. atom
├─ TableSelectAllCell ........ molecule → selectionState
├─ TableSelectCell ........... molecule
└─ (loading skeleton) ........ internal
TablePagination .............. molecule → pageRange
TableEmptyState .............. molecule
useTable (= useTableState) ... headless → sortRows, pageSlice, nextSortDirection
useColumnFit / fitColumns .... headless (column-fit.ts)
```

## Dependency map

| Component | Composes ↓ | Used-by ↑ |
| --- | --- | --- |
| `Table` | TableContext | `ActiveWork/TaskTable` |
| `TableHeaderCell` | Tooltip, `columnSortState` | `ActiveWork/TaskTable` |
| `TableCell` | TableContext | `ActiveWork/TaskRow` |
| `useTable` | `useTableState.ts` | `ActiveWork/TaskTable` |
| `useColumnFit`, `useMeasuredWidth` | `column-fit.ts` | `ActiveWork/TaskTable` |
| `TablePagination` | `pageRange` | stories only |
| `TableSelectAllCell`, `TableSelectCell`, `TableEmptyState` | TableContext | stories only; not in the family barrel |

## Watch-list (known gaps)

- Sort, paging and checkbox glyphs are unicode characters, not `components/icons`.
- `TableProps` has 14 own props, one over the Q9 seed of 13. Changing that is an API change, not a refactor.
- `tests/visual/stories.spec.ts` does not cover this family (TD-3).
- No virtualization or filtering yet (TD-33). Both belong in `useTableState.ts`.
