import { useContext } from 'react'
import { View, Text, Pressable } from 'react-native'
import { cn } from '../../../utils/cn'
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
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: allSelected ? true : someSelected ? 'mixed' : false }}
        onPress={() => onSelectAll?.(!allSelected)}
        className={cn(
          'w-5 h-5 rounded border-2 items-center justify-center',
          allSelected
            ? 'bg-brand-primary border-brand-primary'
            : someSelected
              ? 'bg-brand-primary-subtle border-brand-primary'
              : 'border-hairline-strong bg-transparent'
        )}
      >
        {(allSelected || someSelected) && (
          <Text className="text-on-brand-primary text-xs font-bold">{allSelected ? '✓' : '−'}</Text>
        )}
      </Pressable>
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
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        onPress={() => onSelectRow?.(rowId, !isSelected)}
        className={cn(
          'w-5 h-5 rounded border-2 items-center justify-center',
          isSelected
            ? 'bg-brand-primary border-brand-primary'
            : 'border-hairline-strong bg-transparent web:hover:border-brand-primary'
        )}
      >
        {isSelected && <Text className="text-on-brand-primary text-xs font-bold">✓</Text>}
      </Pressable>
    </View>
  )
}
