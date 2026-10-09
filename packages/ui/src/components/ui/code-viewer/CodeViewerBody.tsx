import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native'
import { CodeViewerGutter } from './CodeViewerGutter'
import { CodeViewerLine } from './CodeViewerLine'
import { contentWidth } from './lineModel'
import { CODE_ROW_PADDING, WINDOWED_MAX_HEIGHT, type CodeViewerMetrics } from './metrics'
import type { LineRangeState } from './types'
import { focusOffset, useFocusLine } from './useFocusLine'
import { useLineWindow, windowRows, WINDOWING_THRESHOLD } from './useLineWindow'

export interface CodeViewerBodyProps {
  lines: LineRangeState
  metrics: CodeViewerMetrics
  focusLine?: number
  wrap: boolean
  showLineNumbers: boolean
  tabSize: number
  maxHeight?: number
  isDisabled: boolean
}

const GROW = { flexGrow: 1 }
// Scrollers take keyboard focus so their content can be scrolled without a pointer.
const FOCUSABLE = { tabIndex: 0 } as ScrollViewProps

// Wrapped rows have no fixed height, so each reports its own for the gutter number beside it.
function useWrappedRowHeights(wrap: boolean, rowHeight: number) {
  const [heights, setHeights] = useState<Record<number, number>>({})
  const onRowHeight = useCallback(
    (index: number, height: number) =>
      setHeights((known) =>
        (known[index] ?? rowHeight) === height ? known : { ...known, [index]: height }
      ),
    [rowHeight]
  )
  const heightOf = useCallback(
    (index: number) => (wrap ? (heights[index] ?? rowHeight) : rowHeight),
    [heights, rowHeight, wrap]
  )
  return { heightOf, onRowHeight: wrap ? onRowHeight : undefined }
}

function useCodeScroll({ lines, metrics, focusLine, wrap, maxHeight }: CodeViewerBodyProps) {
  const { model, activeLine } = lines
  const count = model.lines.length
  const { rowHeight } = metrics
  const isWindowed = !wrap && count > WINDOWING_THRESHOLD
  const cap = maxHeight ?? (isWindowed ? WINDOWED_MAX_HEIGHT : undefined)
  const position = {
    startLine: model.startLine,
    count,
    rowHeight,
    viewport: wrap ? undefined : cap,
  }
  const scrollRef = useRef<ScrollView>(null)
  const { window, setOffset } = useLineWindow({
    count,
    rowHeight,
    viewport: cap ?? 0,
    isWindowed,
    pinnedIndex: activeLine - model.startLine,
    initialOffset: () =>
      focusLine === undefined ? 0 : focusOffset({ ...position, line: focusLine }),
  })
  const scrollTo = useCallback(
    (y: number) => {
      scrollRef.current?.scrollTo({ y, animated: false })
      setOffset(y)
    },
    [setOffset]
  )
  const { revealLine, trackOffset } = useFocusLine({ ...position, focusLine, scrollTo })
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { y } = event.nativeEvent.contentOffset
    trackOffset(y)
    setOffset(y)
  }
  return { scrollRef, window, cap, onScroll, revealLine }
}

/** The scrolling rows: the code column, and the gutter listbox beside it. */
export function CodeViewerBody(props: CodeViewerBodyProps) {
  const { lines, metrics, wrap, showLineNumbers, tabSize, isDisabled } = props
  const { model, selectedRange } = lines
  const { scrollRef, window, cap, onScroll, revealLine } = useCodeScroll(props)
  const { heightOf, onRowHeight } = useWrappedRowHeights(wrap, metrics.rowHeight)
  const width = useMemo(
    () => contentWidth(model.lines, metrics.advance, tabSize) + CODE_ROW_PADDING * 2,
    [model.lines, metrics.advance, tabSize]
  )
  const rows = windowRows({ ...window, pinnedOutside: null }).map((index) => {
    const line = model.startLine + index
    const isSelected =
      selectedRange !== null && selectedRange.startLine <= line && line <= selectedRange.endLine
    return (
      <CodeViewerLine
        key={line}
        index={index}
        text={model.lines[index]}
        metrics={metrics}
        wrap={wrap}
        tabSize={tabSize}
        isFlagged={model.runByLine.has(line)}
        isSelected={isSelected}
        onRowHeight={onRowHeight}
      />
    )
  })
  const column = (
    <View className="grow" style={wrap ? undefined : { minWidth: width }}>
      <View style={{ height: window.padBefore }} />
      {rows}
      <View style={{ height: window.padAfter }} />
    </View>
  )
  return (
    <ScrollView
      ref={scrollRef}
      testID="code-viewer-scroll"
      style={cap === undefined ? undefined : { maxHeight: cap }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      {...(wrap ? FOCUSABLE : {})}
    >
      {/* Reversed so the code scroller precedes the gutter in the tab order while sitting right of it. */}
      <View className="flex-row-reverse">
        <CodeColumn wrap={wrap}>{column}</CodeColumn>
        {showLineNumbers ? (
          <CodeViewerGutter
            lines={lines}
            window={window}
            metrics={metrics}
            isDisabled={isDisabled}
            heightOf={heightOf}
            onReveal={revealLine}
          />
        ) : null}
      </View>
    </ScrollView>
  )
}

// Unwrapped, the code scrolls sideways under a gutter that stays put; this scroller takes the
// focus, and the browser passes its vertical arrow keys up to the outer scroller.
function CodeColumn({ wrap, children }: { wrap: boolean; children: ReactNode }) {
  if (wrap) return <View className="min-w-0 flex-1">{children}</View>
  return (
    <ScrollView
      horizontal
      testID="code-viewer-code"
      className="flex-1 web:-outline-offset-2"
      contentContainerStyle={GROW}
      {...FOCUSABLE}
    >
      {children}
    </ScrollView>
  )
}
