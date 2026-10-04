import { memo, type Ref } from 'react'
import { Pressable, View } from 'react-native'

import { resolveColor, type ColorToken } from '../../../../theme/resolve-color'
import { cn } from '../../../../utils/cn'
import { Typography } from '../../typography'
import type { MatrixStep } from './matrix-model'
import type { MatrixFlag } from './types'

/** The one hue every intensity step paints; the step sets only the fill layer's opacity. */
export const INTENSITY_TOKEN: ColorToken = 'brand-primary'
export const STEP_OPACITY: Record<MatrixStep, number> = { 1: 0.2, 2: 0.4, 3: 0.65, 4: 0.9 }

const FLAG_RING: Record<MatrixFlag, string> = {
  cycle: 'border-2 border-status-warning',
  violation: 'border-2 border-status-error',
}

// The shape tells the flags apart without colour: a diamond for a cycle, a square for a violation.
const FLAG_MARK: Record<MatrixFlag, string> = {
  cycle: 'rotate-45 bg-status-warning',
  violation: 'bg-status-error',
}

export function MatrixFill({ step }: { step: MatrixStep }) {
  return (
    <View
      testID="matrix-fill"
      className="pointer-events-none absolute inset-0"
      style={{ backgroundColor: resolveColor(INTENSITY_TOKEN), opacity: STEP_OPACITY[step] }}
    />
  )
}

export function MatrixFlagMark({ flag, className }: { flag: MatrixFlag; className?: string }) {
  return (
    <View
      testID={`matrix-flag-${flag}`}
      className={cn('pointer-events-none h-1.5 w-1.5', FLAG_MARK[flag], className)}
    />
  )
}

/** What one cell says and paints; the fields are compared one by one so a re-read cell can skip a render. */
export interface MatrixCellContent {
  label: string
  /** Intensity step, or `null` for a cell with no dependency. */
  step: MatrixStep | null
  flag: MatrixFlag | undefined
  valueText: string | undefined
}

export interface MatrixCellViewProps {
  row: number
  col: number
  size: number
  /** Distance from the row's leading edge, past the row header. */
  left: number
  content: MatrixCellContent
  isActive: boolean
  isDisabled: boolean
  /** A group band starts above or to the left of this cell. */
  bandTop: boolean
  bandLeft: boolean
  onPress: (row: number, col: number) => void
  /** Focus reached a cell that is not the active one, by pointer or assistive technology. */
  onFocus: (row: number, col: number) => void
  cellRef?: Ref<View>
}

function MatrixCellView(props: MatrixCellViewProps) {
  const { row, col, size, left, isActive, onPress, cellRef } = props
  const { label, step, flag, valueText } = props.content
  // Typed as `object` because React Native's `Role` and aria types omit `gridcell` and the indexes.
  const gridProps: object = { role: 'gridcell', 'aria-rowindex': row + 2, 'aria-colindex': col + 2 }
  return (
    <Pressable
      ref={cellRef}
      aria-label={label}
      // Disabled stops the press and reports aria-disabled; the explicit tabIndex keeps the cell readable.
      disabled={props.isDisabled}
      tabIndex={isActive ? 0 : -1}
      onPress={() => onPress(row, col)}
      onFocus={isActive ? undefined : () => props.onFocus(row, col)}
      className={cn(
        'absolute items-center justify-center border-hairline-subtle',
        'web:outline-none web:focus-visible:ring-2 web:focus-visible:ring-interactive-focus',
        row === col && 'bg-hairline-subtle',
        props.bandTop && 'border-t border-t-hairline-strong',
        props.bandLeft && 'border-l border-l-hairline-strong',
        flag && FLAG_RING[flag]
      )}
      style={{ left, width: size, height: size }}
      {...gridProps}
    >
      {step !== null && <MatrixFill step={step} />}
      {flag && <MatrixFlagMark flag={flag} className="absolute right-0.5 top-0.5" />}
      {valueText !== undefined && (
        <Typography variant="caption" numberOfLines={1}>
          {valueText}
        </Typography>
      )}
    </Pressable>
  )
}

const CONTENT_KEYS = ['label', 'step', 'flag', 'valueText'] as const

function isSameCell(prev: MatrixCellViewProps, next: MatrixCellViewProps): boolean {
  const { content: before, ...restBefore } = prev
  const { content: after, ...restAfter } = next
  const keys = Object.keys(restAfter) as (keyof typeof restAfter)[]
  return (
    CONTENT_KEYS.every((key) => before[key] === after[key]) &&
    keys.every((key) => restBefore[key] === restAfter[key])
  )
}

export const MatrixCell = memo(MatrixCellView, isSameCell)
