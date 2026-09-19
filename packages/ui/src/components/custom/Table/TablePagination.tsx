import { View, Text, Pressable } from 'react-native'
import { cn } from '../../../utils/cn'

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
  const totalPages = Math.ceil(totalItems / pageSize)
  const startItem = page * pageSize + 1
  const endItem = Math.min((page + 1) * pageSize, totalItems)

  const canGoPrevious = page > 0
  const canGoNext = page < totalPages - 1

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
            <Pressable
              key={size}
              onPress={() => onPageSizeChange?.(size)}
              className={cn(
                'px-2 py-1 rounded',
                pageSize === size
                  ? 'bg-brand-primary-subtle text-brand-primary'
                  : 'text-text-secondary web:hover:bg-interactive-hover'
              )}
            >
              <Text
                className={cn(
                  'text-sm font-medium',
                  pageSize === size ? 'text-brand-primary' : 'text-text-secondary'
                )}
              >
                {size}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="flex-row items-center gap-4">
        <Text className="text-sm text-text-secondary">
          {startItem}-{endItem} of {totalItems}
        </Text>

        <View className="flex-row gap-1">
          <Pressable
            disabled={!canGoPrevious}
            onPress={() => onPageChange(page - 1)}
            accessibilityLabel="Previous page"
            className={cn(
              'p-2 rounded',
              canGoPrevious
                ? 'web:hover:bg-interactive-hover active:bg-interactive-active'
                : 'opacity-50'
            )}
          >
            <Text className="text-text-secondary">←</Text>
          </Pressable>

          <Pressable
            disabled={!canGoNext}
            onPress={() => onPageChange(page + 1)}
            accessibilityLabel="Next page"
            className={cn(
              'p-2 rounded',
              canGoNext
                ? 'web:hover:bg-interactive-hover active:bg-interactive-active'
                : 'opacity-50'
            )}
          >
            <Text className="text-text-secondary">→</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}
