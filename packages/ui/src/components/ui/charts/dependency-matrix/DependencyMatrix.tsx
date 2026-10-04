import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import {
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'

import { cn } from '../../../../utils/cn'
import { computeWindow, type FixedWindow } from '../../../../utils/fixed-window'
import { EmptyState } from '../../empty-state'
import { Skeleton } from '../../skeleton'
import { Typography } from '../../typography'
import { MatrixCell } from './MatrixCell'
import { MatrixLegend } from './MatrixLegend'
import {
  DEFAULT_MAX_ITEMS,
  FOLD_ITEM_ID,
  binValue,
  cellKey,
  cellLabel,
  foldItems,
  groupBands,
  indexCells,
  mutualPairs,
  type MatrixStep,
} from './matrix-model'
import type {
  DependencyMatrixProps,
  MatrixCell as MatrixCellData,
  MatrixCellRef,
  MatrixDensity,
  MatrixDirection,
  MatrixFlag,
  MatrixItem,
  MatrixPosition,
  MatrixScale,
} from './types'
import { useMatrixNavigation } from './useMatrixNavigation'

export const CELL_SIZE: Record<MatrixDensity, number> = { comfortable: 32, dense: 20 }
export const ROW_HEADER_WIDTH = 120
export const COLUMN_HEADER_HEIGHT = 96
export const OVERSCAN = 2

interface MatrixModel {
  /** Displayed items, after de-duplication and folding. */
  items: MatrixItem[]
  lookup: Map<string, MatrixCellData>
  /** Largest off-diagonal weight; the top of the intensity scale. */
  max: number
  /** Keys of cells flagged as a cycle or mirrored across the diagonal. */
  cycles: Set<string>
  /** Indexes where a group band begins or ends inside the list. */
  bandEdges: Set<number>
}

function findCycles(cells: MatrixCellData[]): Set<string> {
  const cycles = new Set<string>()
  for (const [a, b] of mutualPairs(cells)) {
    // The fold item sums many items, so edges both ways across it are not one mutual pair.
    if (a === FOLD_ITEM_ID || b === FOLD_ITEM_ID) continue
    cycles.add(cellKey(a, b))
    cycles.add(cellKey(b, a))
  }
  for (const cell of cells) if (cell.flag === 'cycle') cycles.add(cellKey(cell.from, cell.to))
  return cycles
}

function buildModel(items: MatrixItem[], cells: MatrixCellData[], maxItems: number): MatrixModel {
  const index = indexCells(items, cells)
  const indexed = [...index.cells.values(), ...index.diagonal.values()]
  const folded = foldItems(index.items, indexed, maxItems)
  const offDiagonal = folded.cells.filter((cell) => cell.from !== cell.to)
  const count = folded.items.length
  const edges = groupBands(folded.items).flatMap((band) => [band.start, band.end])
  return {
    items: folded.items,
    lookup: new Map(folded.cells.map((cell) => [cellKey(cell.from, cell.to), cell])),
    max: offDiagonal.reduce((max, cell) => Math.max(max, cell.value ?? 0), 0),
    cycles: findCycles(offDiagonal),
    bandEdges: new Set(edges.filter((edge) => edge > 0 && edge < count)),
  }
}

interface ReadingOptions {
  direction: MatrixDirection
  scale: MatrixScale
  showValues: boolean
  formatCellLabel: DependencyMatrixProps['formatCellLabel']
}

interface CellReading {
  ref: MatrixCellRef
  cell: MatrixCellData | undefined
  label: string
  step: MatrixStep | null
  flag: MatrixFlag | undefined
  valueText: string | undefined
}

function readLabel(
  from: MatrixItem,
  to: MatrixItem,
  cell: MatrixCellData | undefined,
  flag: MatrixFlag | undefined,
  options: ReadingOptions
): string {
  if (options.formatCellLabel) {
    const custom = options.formatCellLabel(from, to, cell ? cell.value : null)
    return flag ? `${custom}, ${flag}` : custom
  }
  if (!cell && from.id === to.id) return `${from.label}, same item`
  return cellLabel(from, to, cell && flag ? { ...cell, flag } : cell, options.direction)
}

function readCell(
  model: MatrixModel,
  { row, col }: MatrixPosition,
  options: ReadingOptions
): CellReading {
  const rowFirst = options.direction === 'row-depends-on-column'
  const from = model.items[rowFirst ? row : col]
  const to = model.items[rowFirst ? col : row]
  const key = cellKey(from.id, to.id)
  const cell = model.lookup.get(key)
  const flag = model.cycles.has(key) ? 'cycle' : cell?.flag
  const hasValueText = options.showValues && cell !== undefined && cell.value !== null
  return {
    ref: { from: from.id, to: to.id },
    cell,
    flag,
    label: readLabel(from, to, cell, flag, options),
    step: cell ? binValue(cell.value, model.max, options.scale).step : null,
    valueText: hasValueText ? String(cell.value) : undefined,
  }
}

const extent = (value: number): number => (Number.isFinite(value) ? Math.max(0, value) : 0)

/** The scroll offset that brings item `index` fully into a viewport, moving as little as possible. */
function revealOffset(current: number, index: number, size: number, viewport: number): number {
  const start = index * size
  if (start < current) return start
  return Math.max(current, start + size - viewport)
}

/** The windowed indexes plus the active one, which stays mounted so the grid keeps its tab stop. */
function mountedIndexes(window: FixedWindow, active: number): number[] {
  const indexes = Array.from({ length: window.end - window.start }, (_, i) => window.start + i)
  if (active >= 0 && (active < window.start || active >= window.end)) indexes.push(active)
  return indexes
}

interface Offset {
  x: number
  y: number
  /** A reveal moved the offset, so the scrollers still have to follow it. */
  isReveal: boolean
}

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>

const scrolledTo = (prev: Offset, x: number, y: number): Offset =>
  prev.x === x && prev.y === y ? prev : { x, y, isReveal: false }

/**
 * Two-axis scroll state. react-native-web's ScrollView scrolls one axis, so CSS sticky cannot hold
 * headers on both; the grid nests two scrollers and translates its headers by this offset instead.
 */
function useMatrixViewport(size: number, bodyWidth: number, bodyHeight: number) {
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0, isReveal: false })
  const horizontalRef = useRef<ScrollView>(null)
  const verticalRef = useRef<ScrollView>(null)
  const onScrollX = useCallback((event: ScrollEvent) => {
    const { x } = event.nativeEvent.contentOffset
    setOffset((prev) => scrolledTo(prev, x, prev.y))
  }, [])
  const onScrollY = useCallback((event: ScrollEvent) => {
    const { y } = event.nativeEvent.contentOffset
    setOffset((prev) => scrolledTo(prev, prev.x, y))
  }, [])
  const reveal = useCallback(
    ({ row, col }: MatrixPosition) =>
      setOffset((prev) => {
        const x = revealOffset(prev.x, col, size, bodyWidth)
        const y = revealOffset(prev.y, row, size, bodyHeight)
        return prev.x === x && prev.y === y ? prev : { x, y, isReveal: true }
      }),
    [size, bodyWidth, bodyHeight]
  )
  useEffect(() => {
    if (!offset.isReveal) return
    horizontalRef.current?.scrollTo({ x: offset.x, animated: false })
    verticalRef.current?.scrollTo({ y: offset.y, animated: false })
  }, [offset])
  return { offset, horizontalRef, verticalRef, onScrollX, onScrollY, reveal }
}

interface HeaderProps {
  role: 'rowheader' | 'columnheader'
  item: MatrixItem
  colIndex: number
  hasBand: boolean
  width: number
  height: number
  left: number
  onPress?: (itemId: string) => void
}

function MatrixHeader({
  role,
  item,
  colIndex,
  hasBand,
  width,
  height,
  left,
  onPress,
}: HeaderProps) {
  const isColumn = role === 'columnheader'
  const canPress = onPress !== undefined && item.id !== FOLD_ITEM_ID
  const Container = canPress ? Pressable : View
  const pressProps = canPress ? { onPress: () => onPress(item.id), tabIndex: -1 as const } : {}
  // A column label is a row-header-wide line turned a quarter turn about the header's centre.
  const turned = { width: height, height: width, left: (width - height) / 2 }
  return (
    <Container
      role={role}
      aria-label={item.group ? `${item.label}, ${item.group}` : item.label}
      className={cn(
        'absolute justify-center overflow-hidden border-hairline-strong bg-surface-base',
        isColumn ? 'items-center' : 'z-10 px-inset-sm',
        hasBand && (isColumn ? 'border-l' : 'border-t')
      )}
      style={{ left, width, height }}
      {...pressProps}
      {...{ 'aria-colindex': colIndex }}
    >
      <View
        className={cn('justify-center', isColumn && 'absolute -rotate-90')}
        style={isColumn ? turned : undefined}
      >
        <Typography variant="caption" numberOfLines={1}>
          {item.label}
        </Typography>
      </View>
    </Container>
  )
}

interface LayoutProps {
  model: MatrixModel
  size: number
  offset: { x: number; y: number }
  cols: number[]
  onHeaderPress?: (itemId: string) => void
}

function MatrixHeaderRow({ model, size, offset, cols, onHeaderPress }: LayoutProps) {
  return (
    <View
      role="row"
      className="absolute left-0 right-0 z-20"
      style={{ top: offset.y, height: COLUMN_HEADER_HEIGHT }}
      {...{ 'aria-rowindex': 1 }}
    >
      {cols.map((col) => (
        <MatrixHeader
          key={model.items[col].id}
          role="columnheader"
          item={model.items[col]}
          colIndex={col + 2}
          hasBand={model.bandEdges.has(col)}
          width={size}
          height={COLUMN_HEADER_HEIGHT}
          left={ROW_HEADER_WIDTH + col * size}
          onPress={onHeaderPress}
        />
      ))}
      <View
        aria-hidden
        className="absolute z-10 bg-surface-base"
        style={{ left: offset.x, width: ROW_HEADER_WIDTH, height: COLUMN_HEADER_HEIGHT }}
      />
    </View>
  )
}

interface RowProps extends LayoutProps {
  row: number
  reading: ReadingOptions
  active: MatrixPosition | null
  activeRef: RefObject<View>
  isDisabled: boolean
  onCellPress: (row: number, col: number) => void
  onCellFocus: (row: number, col: number) => void
}

function MatrixRow({ row, model, size, offset, cols, reading, active, ...props }: RowProps) {
  const top = COLUMN_HEADER_HEIGHT + row * size
  return (
    <View
      role="row"
      className="absolute left-0 right-0"
      style={{ top, height: size }}
      {...{ 'aria-rowindex': row + 2 }}
    >
      {cols.map((col) => {
        const cell = readCell(model, { row, col }, reading)
        const isActive = active?.row === row && active.col === col
        return (
          <MatrixCell
            key={model.items[col].id}
            row={row}
            col={col}
            size={size}
            left={ROW_HEADER_WIDTH + col * size}
            label={cell.label}
            step={cell.step}
            flag={cell.flag}
            valueText={cell.valueText}
            isDiagonal={row === col}
            isActive={isActive}
            isDisabled={props.isDisabled}
            bandTop={model.bandEdges.has(row)}
            bandLeft={model.bandEdges.has(col)}
            onPress={props.onCellPress}
            onFocus={props.onCellFocus}
            cellRef={isActive ? props.activeRef : undefined}
          />
        )
      })}
      <MatrixHeader
        role="rowheader"
        item={model.items[row]}
        colIndex={1}
        hasBand={model.bandEdges.has(row)}
        width={ROW_HEADER_WIDTH}
        height={size}
        left={offset.x}
        onPress={props.onHeaderPress}
      />
    </View>
  )
}

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

/** Moves DOM focus to the active cell after a key moved it, and scrolls it into view. */
function useActiveCellFocus(
  position: MatrixPosition | null,
  reveal: (position: MatrixPosition) => void
) {
  const activeRef = useRef<View>(null)
  const focusPending = useRef(false)
  const row = position?.row ?? -1
  const col = position?.col ?? -1
  useEffect(() => {
    if (row >= 0) reveal({ row, col })
  }, [row, col, reveal])
  useEffect(() => {
    if (!focusPending.current) return
    focusPending.current = false
    activeRef.current?.focus()
  })
  const requestFocus = useCallback(() => {
    focusPending.current = true
  }, [])
  return { activeRef, requestFocus }
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
