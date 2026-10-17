import type { RefObject } from 'react'
import { Pressable, View } from 'react-native'

import { cn } from '../../../../utils/cn'
import { Typography } from '../../typography'
import { MatrixCell } from './MatrixCell'
import { COLUMN_HEADER_HEIGHT, ROW_HEADER_WIDTH } from './matrix-layout'
import { FOLD_ITEM_ID } from './matrix-model'
import { readCell, type MatrixModel, type ReadingOptions } from './matrix-reading'
import type { MatrixItem, MatrixPosition } from './types'

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

export function MatrixHeaderRow({ model, size, offset, cols, onHeaderPress }: LayoutProps) {
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

export function MatrixRow({ row, model, size, offset, cols, reading, active, ...props }: RowProps) {
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
            content={cell}
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
