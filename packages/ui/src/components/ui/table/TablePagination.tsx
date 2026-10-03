import { View, Text, Pressable } from 'react-native'
import { cn } from '../../../utils/cn'
import { pageRange } from './useTableState'

export interface TablePaginationProps {
  /** Current page (0-indexed) */
  page: number
  /** Items per page */
  pageSize: number
  /** Total number of items */
  totalItems: number
  /** Available page size options */
  pageSizeOptions?: number[]
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void
  /** Additional className */
  className?: string
}

/**
 * Pagination controls for table.
 *
 * @example
 * <TablePagination
 *   page={page}
 *   pageSize={pageSize}
 *   totalItems={100}
 *   onPageChange={setPage}
 *   onPageSizeChange={setPageSize}
 * />
 */
export function TablePagination({
  page,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  className,
}: TablePaginationProps) {
  const { startItem, endItem, canGoPrevious, canGoNext } = pageRange(page, pageSize, totalItems)

  return (
    <View
      className={cn(
        'flex-row items-center justify-between px-4 py-3 border-t border-divider',
        className
      )}
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-text-secondary">Rows per page:</Text>
        <View className="flex-row gap-1">
          {pageSizeOptions.map((size) => (
            <PageSizeOption
              key={size}
              size={size}
              isSelected={pageSize === size}
              onPress={() => onPageSizeChange?.(size)}
            />
          ))}
        </View>
      </View>

      <View className="flex-row items-center gap-4">
        <Text className="text-sm text-text-secondary">
          {startItem}-{endItem} of {totalItems}
        </Text>

        <View className="flex-row gap-1">
          <PageStepButton
            label="Previous page"
            glyph="←"
            isEnabled={canGoPrevious}
            onPress={() => onPageChange(page - 1)}
          />
          <PageStepButton
            label="Next page"
            glyph="→"
            isEnabled={canGoNext}
            onPress={() => onPageChange(page + 1)}
          />
        </View>
      </View>
    </View>
  )
}

interface PageSizeOptionProps {
  size: number
  isSelected: boolean
  onPress: () => void
}

function PageSizeOption({ size, isSelected, onPress }: PageSizeOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'px-2 py-1 rounded',
        isSelected
          ? 'bg-brand-primary-subtle text-brand-primary'
          : 'text-text-secondary web:hover:bg-interactive-hover'
      )}
    >
      <Text
        className={cn(
          'text-sm font-medium',
          isSelected ? 'text-brand-primary' : 'text-text-secondary'
        )}
      >
        {size}
      </Text>
    </Pressable>
  )
}

interface PageStepButtonProps {
  label: string
  glyph: string
  isEnabled: boolean
  onPress: () => void
}

function PageStepButton({ label, glyph, isEnabled, onPress }: PageStepButtonProps) {
  return (
    <Pressable
      disabled={!isEnabled}
      onPress={onPress}
      accessibilityLabel={label}
      className={cn(
        'p-2 rounded',
        isEnabled ? 'web:hover:bg-interactive-hover active:bg-interactive-active' : 'opacity-50'
      )}
    >
      <Text className="text-text-secondary">{glyph}</Text>
    </Pressable>
  )
}
