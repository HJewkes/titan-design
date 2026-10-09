import { useId, useRef, useState } from 'react'
import { Platform, View, type ViewProps, type ViewStyle } from 'react-native'
import { GutterOption, type GutterPress } from './CodeViewerGutterOption'
import type { CodeViewerMetrics } from './metrics'
import type { LineRangeState } from './types'
import { windowRows, type LineWindow } from './useLineWindow'

// React Native's `Role` union omits `'listbox'`; React Native Web emits it as written.
const LISTBOX_ROLE = 'listbox' as ViewProps['role']

interface GutterKeyEvent {
  key: string
  shiftKey: boolean
  preventDefault: () => void
}

// The line a navigation key moves the active line to, or `null` for any other key.
function keyTarget(key: string, { model, activeLine }: LineRangeState): number | null {
  const targets: Record<string, number> = {
    ArrowUp: Math.max(activeLine - 1, model.startLine),
    ArrowDown: Math.min(activeLine + 1, model.lastLine),
    Home: model.startLine,
    End: model.lastLine,
  }
  return targets[key] ?? null
}

function useGutterKeys(
  lines: LineRangeState,
  isDisabled: boolean,
  onReveal: (line: number) => void
) {
  const navigate = (target: number, isExtending: boolean) => {
    if (isExtending) lines.extendSelection(target - lines.activeLine)
    else lines.moveActiveTo(target)
    // Revealed even when the active line does not change: it may have been scrolled out of view.
    onReveal(target)
  }
  return (event: GutterKeyEvent) => {
    if (isDisabled) return
    const target = keyTarget(event.key, lines)
    const isArrow = event.key === 'ArrowUp' || event.key === 'ArrowDown'
    if (target !== null) navigate(target, isArrow && event.shiftKey)
    else if (event.key === ' ') lines.toggleActive()
    else if (event.key === 'Escape') lines.clearSelection()
    else return
    event.preventDefault()
  }
}

export interface CodeViewerGutterProps {
  lines: LineRangeState
  window: LineWindow
  metrics: CodeViewerMetrics
  isDisabled: boolean
  /** A wrapped row's measured height; the fixed row height otherwise. */
  heightOf: (index: number) => number
  /** Scrolls a file line into view after a navigation key. */
  onReveal: (line: number) => void
}

function useGutterPress(lines: LineRangeState, focusList: () => void): GutterPress {
  // Touch has no Shift key: a long press arms the next press to extend the range instead.
  const isArmed = useRef(false)
  const onLongPress = (line: number) => {
    lines.clearSelection()
    lines.moveActiveTo(line)
    isArmed.current = true
  }
  const onPress = (line: number, isExtending: boolean) => {
    if (isExtending || isArmed.current) lines.extendSelection(line - lines.activeLine)
    else lines.selectLine(line)
    isArmed.current = false
    focusList()
  }
  return { onPress, onLongPress }
}

/** The line numbers, which on the web are also an APG Listbox for selecting a range of lines. */
export function CodeViewerGutter({
  lines,
  window,
  metrics,
  isDisabled,
  heightOf,
  onReveal,
}: CodeViewerGutterProps) {
  const baseId = useId()
  const listRef = useRef<View>(null)
  const [isFocused, setIsFocused] = useState(false)
  const { model, activeLine, selectedRange } = lines
  const isWeb = Platform.OS === 'web'
  const press = useGutterPress(lines, () => listRef.current?.focus?.())
  const optionId = (line: number) => `${baseId}-line-${line}`
  const onKeyDown = useGutterKeys(lines, isDisabled, onReveal)
  const listboxProps = {
    role: LISTBOX_ROLE,
    'aria-label': 'Select lines',
    'aria-multiselectable': true,
    'aria-activedescendant': optionId(activeLine),
    'aria-disabled': isDisabled || undefined,
    tabIndex: isDisabled ? undefined : 0,
    onKeyDown,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  } as ViewProps

  const renderOption = (index: number, style?: ViewStyle) => {
    const line = model.startLine + index
    const isSelected =
      selectedRange !== null && selectedRange.startLine <= line && line <= selectedRange.endLine
    return (
      <GutterOption
        key={line}
        id={optionId(line)}
        line={line}
        count={model.lines.length}
        posinset={index + 1}
        metrics={metrics}
        numberWidth={model.gutterDigits * metrics.advance}
        height={heightOf(index)}
        isFlagged={model.runByLine.has(line)}
        isSelected={isSelected}
        hasFocusMark={!!isFocused && line === activeLine}
        isDisabled={isDisabled}
        press={press}
        style={style}
      />
    )
  }
  const { pinnedOutside } = window
  const inWindow = windowRows({ ...window, pinnedOutside: null })

  return (
    <View
      ref={listRef}
      testID="code-viewer-gutter"
      // Inset, because the scroller around the gutter would clip a focus ring drawn outside it.
      className="web:-outline-offset-2"
      {...(isWeb ? listboxProps : {})}
    >
      <View style={{ height: window.padBefore }} />
      {inWindow.map((index) => renderOption(index))}
      <View style={{ height: window.padAfter }} />
      {pinnedOutside === null
        ? null
        : renderOption(pinnedOutside, {
            position: 'absolute',
            top: pinnedOutside * metrics.rowHeight,
            left: 0,
            right: 0,
          })}
    </View>
  )
}
