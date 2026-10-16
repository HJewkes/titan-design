import { useContext } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Checkbox } from '../checkbox'
import { TableContext } from './TableContext'
import { selectionState } from './useTableState'

export interface TableSelectAllCellProps {
  className?: string
}

/**
 * Checkbox cell for selecting all rows in header.
 */
export function TableSelectAllCell({ className }: TableSelectAllCellProps) {
  const { selectedRows, onSelectAll, allRowIds, selectable } = useContext(TableContext)

  if (!selectable) return null

  const selection = selectionState(allRowIds, selectedRows)
  const allSelected = selection === 'all'
  const someSelected = selection === 'some'

  return (
    <View className={cn('w-12 px-4 py-3 items-center justify-center', className)}>
      <Checkbox
        isChecked={allSelected}
        isIndeterminate={someSelected}
        onCheckedChange={(checked) => onSelectAll?.(checked)}
      />
    </View>
  )
}

export interface TableSelectCellProps {
  /** Row ID for selection */
  rowId: string
  className?: string
}

/**
 * Checkbox cell for selecting individual rows.
 */
export function TableSelectCell({ rowId, className }: TableSelectCellProps) {
  const { selectedRows, onSelectRow, selectable } = useContext(TableContext)

  if (!selectable) return null

  const isSelected = selectedRows.has(rowId)

  return (
    <View className={cn('w-12 px-4 py-3.5 items-center justify-center', className)}>
      <Checkbox
        isChecked={isSelected}
        onCheckedChange={(checked) => onSelectRow?.(rowId, checked)}
      />
    </View>
  )
}
