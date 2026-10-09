import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Card } from '../card'
import { Divider } from '../divider'
import { EmptyState } from '../empty-state'
import { Skeleton } from '../skeleton'
import { Typography } from '../typography'
import { CodeViewerBody } from './CodeViewerBody'
import { highlightSummary } from './lineModel'
import { SIZE_METRICS } from './metrics'
import type { CodeViewerProps, HighlightRun, LineRangeState } from './types'
import { useLineRange } from './useLineRange'

const SKELETON_WIDTHS = ['72%', '48%', '86%', '34%', '64%'] as const

function LoadingRows({ count, rowHeight }: { count: number; rowHeight: number }) {
  return (
    <View className="px-inset-md py-inset-sm">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          testID="code-viewer-skeleton"
          className="justify-center"
          style={{ height: rowHeight }}
        >
          <Skeleton width={SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]} height={rowHeight - 6} />
        </View>
      ))}
    </View>
  )
}

/** The flagged ranges in words, so the evidence does not depend on seeing the row wash. */
function HighlightSummary({ runs }: { runs: readonly HighlightRun[] }) {
  const summary = highlightSummary(runs)
  if (summary === null) return null
  return (
    <Typography variant="caption" color="secondary" className="px-inset-md py-inset-xs">
      {summary}
    </Typography>
  )
}

function TruncationNotice() {
  return (
    <Typography variant="caption" color="secondary" className="px-inset-md py-inset-sm">
      Excerpt truncated
    </Typography>
  )
}

type ContentProps = Pick<
  CodeViewerProps,
  | 'focusLine'
  | 'wrap'
  | 'showLineNumbers'
  | 'tabSize'
  | 'size'
  | 'maxHeight'
  | 'loadingLineCount'
  | 'emptyState'
> & { lines: LineRangeState; isLoading: boolean; isDisabled: boolean }

// Loading wins over empty: a viewer still fetching has no text yet, and that is not "no source".
function CodeViewerContent({
  lines,
  isLoading,
  isDisabled,
  focusLine,
  wrap = false,
  showLineNumbers = true,
  tabSize = 4,
  size = 'sm',
  maxHeight,
  loadingLineCount = 8,
  emptyState,
}: ContentProps) {
  const metrics = SIZE_METRICS[size]
  if (isLoading) return <LoadingRows count={loadingLineCount} rowHeight={metrics.rowHeight} />
  if (lines.model.lines.length === 0) return emptyState ?? <EmptyState title="No source to show" />
  return (
    <CodeViewerBody
      lines={lines}
      metrics={metrics}
      focusLine={focusLine}
      wrap={wrap}
      showLineNumbers={showLineNumbers}
      tabSize={tabSize}
      maxHeight={maxHeight}
      isDisabled={isDisabled}
    />
  )
}

/**
 * A read-only view of one window of a source file: 1-based line numbers from `startLine`, flagged
 * line ranges with one neutral treatment, and a gutter listbox for selecting a range of lines.
 *
 * There is no error state: render a failed fetch with `Alert`, and pass a missing source as
 * `emptyState`. Above 500 unwrapped lines the rows are windowed over a fixed row height.
 * `focusLine` does nothing when `wrap` is on: wrapped rows have no known height to scroll by.
 *
 * @example
 * <CodeViewer
 *   accessibilityLabel="Tooltip.tsx, lines 78 to 157"
 *   text={excerpt.text}
 *   startLine={excerpt.startLine}
 *   highlights={excerpt.highlights}
 *   isTruncated={excerpt.truncated}
 * />
 */
export function CodeViewer({
  text,
  startLine,
  highlights,
  selectedRange,
  defaultSelectedRange,
  onSelectedRangeChange,
  language: _language,
  isTruncated = false,
  isLoading = false,
  isDisabled = false,
  header,
  footer,
  accessibilityLabel,
  className,
  focusLine,
  wrap,
  showLineNumbers,
  tabSize,
  size,
  maxHeight,
  loadingLineCount,
  emptyState,
  ...props
}: CodeViewerProps) {
  const lines = useLineRange({
    text,
    startLine,
    highlights,
    selectedRange,
    defaultSelectedRange,
    onSelectedRangeChange,
    isDisabled,
  })
  const content = { focusLine, wrap, showLineNumbers, tabSize, size, maxHeight, loadingLineCount }
  const footerNode = footer ?? (isTruncated && !isLoading ? <TruncationNotice /> : null)

  return (
    <Card
      variant="outline"
      role="region"
      aria-label={accessibilityLabel}
      aria-busy={isLoading || undefined}
      className={cn('py-inset-xs', className)}
      {...props}
    >
      {header ? <View className="px-inset-md py-inset-sm">{header}</View> : null}
      {/* PROPOSED in API-NOTE section 6; the owner rules on it (Q2). Remove this line to switch it off. */}
      {isLoading ? null : <HighlightSummary runs={lines.model.runs} />}
      {header ? <Divider /> : null}
      <CodeViewerContent
        {...content}
        lines={lines}
        isLoading={isLoading}
        isDisabled={isDisabled}
        emptyState={emptyState}
      />
      {footerNode ? <Divider /> : null}
      {footerNode}
    </Card>
  )
}
