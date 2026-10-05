// Compile-time contract checks for DependencyMatrix types; `pnpm type-check` is the test.
import type { DependencyMatrixProps, MatrixCell, MatrixCellRef } from './types'

const cycleCell: MatrixCell = { from: 'a', to: 'b', value: 3, flag: 'cycle' }
const violationCell: MatrixCell = { from: 'a', to: 'b', value: null, flag: 'violation' }

// @ts-expect-error flag is a closed union, so a free string is rejected
const errorCell: MatrixCell = { from: 'a', to: 'b', value: 1, flag: 'error' }

const bareRef: MatrixCellRef = { from: 'a', to: 'b' }

const onCellPress: NonNullable<DependencyMatrixProps['onCellPress']> = (cell) => {
  const hasData = 'value' in cell
  return hasData ? cell.value : cell.from
}
onCellPress(cycleCell)
onCellPress(bareRef)

const handlerTakingCellsOnly = (cell: MatrixCell): number | null => cell.value
// @ts-expect-error onCellPress also receives a bare MatrixCellRef, so a cell-only handler is rejected
const narrowHandler: DependencyMatrixProps['onCellPress'] = handlerTakingCellsOnly

export const typecheckSubjects = [violationCell, errorCell, narrowHandler]
