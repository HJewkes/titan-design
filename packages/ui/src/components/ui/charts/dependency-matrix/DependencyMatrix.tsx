import { useCallback, useMemo } from 'react'
import { ScrollView, View } from 'react-native'

import { cn } from '../../../../utils/cn'
import { computeWindow } from '../../../../utils/fixed-window'
import { EmptyState } from '../../empty-state'
import { Skeleton } from '../../skeleton'
import { MatrixLegend } from './MatrixLegend'
import { MatrixHeaderRow, MatrixRow } from './MatrixRows'
import {
  CELL_SIZE,
  COLUMN_HEADER_HEIGHT,
  OVERSCAN,
  ROW_HEADER_WIDTH,
  extent,
  mountedIndexes,
} from './matrix-layout'
import { DEFAULT_MAX_ITEMS } from './matrix-model'
import { buildModel, readCell, type ReadingOptions } from './matrix-reading'
import type { DependencyMatrixProps } from './types'
import { useMatrixNavigation } from './useMatrixNavigation'
import { useActiveCellFocus, useMatrixViewport } from './useMatrixViewport'

interface KeyEvent {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  preventDefault: () => void
}

type GridProps = Omit<DependencyMatrixProps, 'isLoading' | 'emptyState'>

function useMatrixGrid(props: Omit<GridProps, 'accessibilityLabel'>) {
  const { direction = 'row-depends-on-column', maxItems = DEFAULT_MAX_ITEMS, onCellPress } = props
  const { items, cells, isDisabled = false } = props
  const size = CELL_SIZE[props.density ?? 'comfortable']
  const bodyWidth = extent(props.width - ROW_HEADER_WIDTH)
  const bodyHeight = extent(props.height - COLUMN_HEADER_HEIGHT)
  const model = useMemo(() => buildModel(items, cells, maxItems), [items, cells, maxItems])
  const reading = useMemo<ReadingOptions>(
    () => ({
      direction,
      scale: props.scale ?? 'sqrt',
      showValues: props.showValues ?? false,
      formatCellLabel: props.formatCellLabel,
    }),
    [direction, props.scale, props.showValues, props.formatCellLabel]
  )
  const navigation = useMatrixNavigation({
    items: model.items,
    direction,
    activeCell: props.activeCell,
    defaultActiveCell: props.defaultActiveCell,
    onActiveCellChange: props.onActiveCellChange,
    pageRows: Math.max(1, Math.floor(bodyHeight / size)),
  })
  const viewport = useMatrixViewport(size, bodyWidth, bodyHeight)
  const { setActiveCell } = navigation
  const pressCell = useCallback(
    (row: number, col: number) => {
      const { ref, cell } = readCell(model, { row, col }, reading)
      setActiveCell(ref)
      if (!isDisabled) onCellPress?.(cell ?? ref)
    },
    [model, reading, setActiveCell, isDisabled, onCellPress]
  )
  const focusCell = useCallback(
    (row: number, col: number) => setActiveCell(readCell(model, { row, col }, reading).ref),
    [model, reading, setActiveCell]
  )
  return { model, reading, navigation, viewport, pressCell, focusCell, size, bodyWidth, bodyHeight }
}

function MatrixGrid({ accessibilityLabel, className, style, testID, ...props }: GridProps) {
  const grid = useMatrixGrid(props)
  const { model, size, navigation } = grid
  const { offset, horizontalRef, verticalRef, onScrollX, onScrollY, reveal } = grid.viewport
  const { position } = navigation
  const { activeRef, requestFocus } = useActiveCellFocus(position, reveal)
  const count = model.items.length
  const windowOf = (start: number, span: number) =>
    computeWindow({ offset: start, viewport: span, itemSize: size, count, overscan: OVERSCAN })
  const cols = mountedIndexes(windowOf(offset.x, grid.bodyWidth), position?.col ?? -1)
  const rows = mountedIndexes(windowOf(offset.y, grid.bodyHeight), position?.row ?? -1)
  const onKeyDown = (event: KeyEvent) => {
    if (event.key === ' ' && position) {
      event.preventDefault()
      grid.pressCell(position.row, position.col)
    } else if (navigation.handleKey(event.key, event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      requestFocus()
    }
  }
  const content = {
    width: ROW_HEADER_WIDTH + count * size,
    height: COLUMN_HEADER_HEIGHT + count * size,
  }
  const layout = { model, size, offset, cols }
  const onHeaderPress = props.isDisabled ? undefined : props.onHeaderPress
  return (
    <View className={cn('gap-stack-sm', className)} style={style} testID={testID}>
      <View
        role="grid"
        aria-label={accessibilityLabel}
        aria-disabled={props.isDisabled || undefined}
        className="overflow-hidden bg-surface-base"
        style={{ width: extent(props.width), height: extent(props.height) }}
        {...{ 'aria-rowcount': count + 1, 'aria-colcount': count + 1, onKeyDown }}
      >
        <ScrollView
          horizontal
          ref={horizontalRef}
          onScroll={onScrollX}
          scrollEventThrottle={16}
          testID="matrix-scroll-x"
        >
          <ScrollView
            ref={verticalRef}
            onScroll={onScrollY}
            scrollEventThrottle={16}
            // Without this the horizontal scroller's content row shrinks the pane to the viewport.
            className="flex-none"
            style={{ width: content.width, height: extent(props.height) }}
            testID="matrix-scroll-y"
          >
            <View style={content}>
              <MatrixHeaderRow {...layout} onHeaderPress={onHeaderPress} />
              {rows.map((row) => (
                <MatrixRow
                  key={model.items[row].id}
                  {...layout}
                  row={row}
                  reading={grid.reading}
                  active={position}
                  activeRef={activeRef}
                  isDisabled={props.isDisabled ?? false}
                  onCellPress={grid.pressCell}
                  onCellFocus={grid.focusCell}
                  onHeaderPress={onHeaderPress}
                />
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
      <MatrixLegend
        direction={grid.reading.direction}
        hasEdges={model.lookup.size > 0}
        hasCycle={model.cycles.size > 0}
      />
    </View>
  )
}

/**
 * A square dependency matrix over one ordered item list, windowed on both axes, with the WAI-ARIA
 * APG data grid keyboard model. Intensity is one hue at four opacity steps; a cycle carries a mark
 * and the word, never colour alone.
 */
export function DependencyMatrix({
  isLoading = false,
  emptyState,
  ...props
}: DependencyMatrixProps) {
  const { width, height, accessibilityLabel } = props
  if (isLoading) {
    return (
      <Skeleton
        variant="rounded"
        width={width}
        height={height}
        accessibilityLabel={`${accessibilityLabel}, loading`}
      />
    )
  }
  if (props.items.length === 0) {
    return (
      <View className="items-center justify-center" style={{ width, minHeight: height }}>
        {emptyState ?? (
          <EmptyState title="Nothing to compare" description="This matrix has no items yet." />
        )}
      </View>
    )
  }
  return <MatrixGrid {...props} />
}
