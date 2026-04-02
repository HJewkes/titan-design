import React from 'react'
import { View, Text, Pressable, ScrollView, Platform } from 'react-native'
import { cn } from '../../../utils/cn'

export interface Column<T> {
  id: string
  header: React.ReactNode
  width?: string
  align?: 'start' | 'center' | 'end'
  cell: (item: T, index: number) => React.ReactNode
  headerClassName?: string
  cellClassName?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowKey: (item: T) => string
  rowClassName?: (item: T, index: number) => string
  onRowClick?: (item: T) => void
  stickyHeader?: boolean
  emptyMessage?: string | React.ReactNode
  animateRows?: boolean
  className?: string
}

const alignTextMap = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
} as const

const alignJustifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
} as const

function buildGridTemplate<T>(columns: Column<T>[]): string {
  return columns.map((col) => col.width ?? '1fr').join(' ')
}

function CellWrapper({
  align,
  className,
  children,
}: {
  align?: 'start' | 'center' | 'end'
  className?: string
  children: React.ReactNode
}) {
  const alignment = align ?? 'start'
  return (
    <div
      className={cn(
        'flex items-center',
        alignTextMap[alignment],
        alignJustifyMap[alignment],
        className
      )}
    >
      {children}
    </div>
  )
}

function WebDataTable<T>({
  data,
  columns,
  rowKey,
  rowClassName,
  onRowClick,
  stickyHeader,
  emptyMessage = 'No data',
  animateRows,
  className,
}: DataTableProps<T>) {
  const gridTemplateColumns = buildGridTemplate(columns)

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div
        className={cn(
          'bg-surface-elevated/50 border-b border-border',
          stickyHeader && 'sticky top-0 z-10 backdrop-blur-sm'
        )}
        style={{ display: 'grid', gridTemplateColumns }}
        role="row"
      >
        {columns.map((col) => (
          <CellWrapper
            key={col.id}
            align={col.align}
            className={cn(
              'px-4 py-3 font-mono text-xs text-text-tertiary uppercase tracking-wider',
              col.headerClassName
            )}
          >
            {typeof col.header === 'string' ? (
              <span>{col.header}</span>
            ) : (
              col.header
            )}
          </CellWrapper>
        ))}
      </div>

      {/* Rows */}
      {data.length === 0 ? (
        <div
          className="px-4 py-8 text-center text-text-tertiary"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
          }}
        >
          <div style={{ gridColumn: '1 / -1' }}>
            {typeof emptyMessage === 'string' ? (
              <span>{emptyMessage}</span>
            ) : (
              emptyMessage
            )}
          </div>
        </div>
      ) : (
        data.map((item, index) => {
          const rowContent = (
            <>
              {columns.map((col) => (
                <CellWrapper
                  key={col.id}
                  align={col.align}
                  className={cn('px-4 py-3.5', col.cellClassName)}
                >
                  {(() => {
                    const content = col.cell(item, index)
                    return typeof content === 'string' || typeof content === 'number' ? (
                      <span>{content}</span>
                    ) : (
                      content
                    )
                  })()}
                </CellWrapper>
              ))}
            </>
          )

          const sharedClassName = cn(
            'border-b border-border-subtle last:border-b-0 transition-colors hover:bg-white/[0.025]',
            onRowClick && 'cursor-pointer',
            animateRows && 'animate-[rowFadeIn_var(--duration-normal,300ms)_var(--ease-out,ease-out)_backwards]',
            rowClassName?.(item, index)
          )

          const sharedStyle: React.CSSProperties = {
            display: 'grid',
            gridTemplateColumns,
            alignItems: 'center',
            ...(animateRows ? { animationDelay: `${index * 40}ms` } : {}),
          }

          if (onRowClick) {
            return (
              <div
                key={rowKey(item)}
                className={sharedClassName}
                style={sharedStyle}
                role="row"
                onClick={() => onRowClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onRowClick(item)
                  }
                }}
                tabIndex={0}
              >
                {rowContent}
              </div>
            )
          }

          return (
            <div
              key={rowKey(item)}
              className={sharedClassName}
              style={sharedStyle}
              role="row"
            >
              {rowContent}
            </div>
          )
        })
      )}
    </div>
  )
}

function NativeDataTable<T>({
  data,
  columns,
  rowKey,
  rowClassName,
  onRowClick,
  emptyMessage = 'No data',
  className,
}: DataTableProps<T>) {
  return (
    <ScrollView horizontal className={cn('w-full', className)}>
      <View>
        {/* Header */}
        <View className="flex-row bg-surface-elevated/50 border-b border-border">
          {columns.map((col) => (
            <View key={col.id} className={cn('px-4 py-3', col.headerClassName)}>
              {typeof col.header === 'string' ? (
                <Text className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
                  {col.header}
                </Text>
              ) : (
                col.header
              )}
            </View>
          ))}
        </View>

        {/* Rows */}
        {data.length === 0 ? (
          <View className="px-4 py-8 items-center">
            {typeof emptyMessage === 'string' ? (
              <Text className="text-text-tertiary">{emptyMessage}</Text>
            ) : (
              emptyMessage
            )}
          </View>
        ) : (
          data.map((item, index) => {
            const row = (
              <View
                className={cn(
                  'flex-row border-b border-border-subtle',
                  rowClassName?.(item, index)
                )}
              >
                {columns.map((col) => (
                  <View key={col.id} className={cn('px-4 py-3.5', col.cellClassName)}>
                    {(() => {
                      const content = col.cell(item, index)
                      return typeof content === 'string' || typeof content === 'number' ? (
                        <Text>{String(content)}</Text>
                      ) : (
                        content
                      )
                    })()}
                  </View>
                ))}
              </View>
            )

            if (onRowClick) {
              return (
                <Pressable key={rowKey(item)} onPress={() => onRowClick(item)}>
                  {row}
                </Pressable>
              )
            }

            return <View key={rowKey(item)}>{row}</View>
          })
        )}
      </View>
    </ScrollView>
  )
}

/**
 * DataTable component for grid-based tabular data display with typed columns.
 *
 * Uses CSS Grid on web for precise column sizing. Falls back to a horizontal
 * ScrollView with View rows on native.
 *
 * @example
 * <DataTable
 *   data={items}
 *   columns={[
 *     { id: 'name', header: 'Name', width: '1fr', cell: (item) => item.name },
 *     { id: 'status', header: 'Status', width: '140px', cell: (item) => item.status },
 *   ]}
 *   rowKey={(item) => item.id}
 *   stickyHeader
 * />
 */
export function DataTable<T>(props: DataTableProps<T>) {
  return Platform.select({
    web: <WebDataTable {...props} />,
    default: <NativeDataTable {...props} />,
  }) as React.ReactElement
}
