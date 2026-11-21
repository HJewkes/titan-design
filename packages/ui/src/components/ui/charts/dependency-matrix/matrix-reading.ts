import {
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
  MatrixDirection,
  MatrixFlag,
  MatrixItem,
  MatrixPosition,
  MatrixScale,
} from './types'

export interface MatrixModel {
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

export function buildModel(
  items: MatrixItem[],
  cells: MatrixCellData[],
  maxItems: number
): MatrixModel {
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

export interface ReadingOptions {
  direction: MatrixDirection
  scale: MatrixScale
  showValues: boolean
  formatCellLabel: DependencyMatrixProps['formatCellLabel']
}

export interface CellReading {
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

export function readCell(
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
