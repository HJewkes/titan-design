import { createContext } from 'react'
import type { SortDirection } from './useTableState'

/**
 * Row height / cell padding axis. `comfortable` is the default reading density;
 * `dense` is the scannable-grid density for tables whose job is to fit many rows
 * on screen at once (a backlog, a log, an audit list).
 */
export type TableDensity = 'comfortable' | 'dense'

/** Cell padding per density, shared by header cells and data cells so a row's two halves cannot drift. */
export const CELL_PADDING: Record<TableDensity, string> = {
  comfortable: 'px-4 py-3',
  dense: 'px-2 py-1',
}

// minWidth 0 lets a flexible cell shrink below its nowrap text, so long content truncates instead of pushing the row past the table.
export const FLEX_CELL = { flex: 1, minWidth: 0 } as const

export interface TableContextType {
  sortColumn?: string
  sortDirection: SortDirection
  onSort?: (column: string) => void
  selectedRows: Set<string>
  onSelectRow?: (id: string, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  selectable: boolean
  allRowIds: string[]
  density: TableDensity
}

export const TableContext = createContext<TableContextType>({
  sortDirection: null,
  selectedRows: new Set(),
  selectable: false,
  allRowIds: [],
  density: 'comfortable',
})
