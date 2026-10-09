import { memo } from 'react'
import { Platform, View, type LayoutChangeEvent, type TextStyle } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography } from '../typography'
import { expandTabs } from './lineModel'
import type { CodeViewerMetrics } from './metrics'

/** One wash for flagged lines (evidence, never a status colour) and one for the reader's selection. */
export function rowWashClassName(isFlagged: boolean, isSelected: boolean): string {
  if (isSelected) return 'bg-interactive-selected'
  return isFlagged ? 'bg-interactive-hover' : ''
}

export interface CodeViewerLineProps {
  index: number
  text: string
  metrics: CodeViewerMetrics
  wrap: boolean
  tabSize: number
  isFlagged: boolean
  isSelected: boolean
  /** Reports a wrapped row's height so its gutter number can match it. */
  onRowHeight?: (index: number, height: number) => void
}

export const CodeViewerLine = memo(function CodeViewerLine({
  index,
  text,
  metrics,
  wrap,
  tabSize,
  isFlagged,
  isSelected,
  onRowHeight,
}: CodeViewerLineProps) {
  const isWeb = Platform.OS === 'web'
  const onLayout = onRowHeight
    ? (event: LayoutChangeEvent) => onRowHeight(index, event.nativeEvent.layout.height)
    : undefined
  return (
    <View
      testID="code-line"
      onLayout={onLayout}
      className={cn('px-inset-md', rowWashClassName(isFlagged, isSelected))}
      style={wrap ? { minHeight: metrics.rowHeight } : { height: metrics.rowHeight }}
    >
      <Typography
        variant="mono"
        className={cn(metrics.textClassName, !wrap && 'web:whitespace-pre')}
        // Web keeps the tab characters so a copy is faithful; native has no `tab-size`.
        style={isWeb ? ({ tabSize } as TextStyle) : undefined}
      >
        {isWeb ? text : expandTabs(text, tabSize)}
      </Typography>
    </View>
  )
})
