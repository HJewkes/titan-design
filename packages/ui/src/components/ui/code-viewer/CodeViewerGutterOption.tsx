import {
  Platform,
  Pressable,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type ViewStyle,
} from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography } from '../typography'
import { rowWashClassName } from './CodeViewerLine'
import type { CodeViewerMetrics } from './metrics'

export interface GutterPress {
  onPress: (line: number, isExtending: boolean) => void
  /** Native only: arms the next press to extend the range. */
  onLongPress: (line: number) => void
}

export interface GutterOptionProps {
  id: string
  line: number
  count: number
  posinset: number
  metrics: CodeViewerMetrics
  numberWidth: number
  height: number
  isFlagged: boolean
  isSelected: boolean
  hasFocusMark: boolean
  isDisabled: boolean
  press: GutterPress
  style?: ViewStyle
}

// React Native has no listbox role, so off the web each line is its own toggle button.
function optionSemantics(
  { id, line, count, posinset, isFlagged, isSelected, isDisabled, press }: GutterOptionProps,
  isWeb: boolean
): PressableProps {
  const name = `Line ${line}${isFlagged ? ', flagged' : ''}`
  if (!isWeb) {
    return {
      accessibilityRole: 'button',
      accessibilityLabel: name,
      accessibilityState: { selected: isSelected, disabled: isDisabled },
      onLongPress: () => press.onLongPress(line),
    }
  }
  return {
    id,
    role: 'option',
    'aria-label': name,
    'aria-selected': isSelected,
    'aria-setsize': count,
    'aria-posinset': posinset,
    // The listbox holds focus and points at the option; an option is never a tab stop.
    focusable: false,
    tabIndex: -1,
  } as PressableProps
}

export function GutterOption(props: GutterOptionProps) {
  const { line, metrics, numberWidth, height, isFlagged, isSelected, hasFocusMark } = props
  const isWeb = Platform.OS === 'web'
  const onPress = (event: GestureResponderEvent) => {
    const native = event?.nativeEvent as { shiftKey?: boolean } | undefined
    props.press.onPress(line, native?.shiftKey === true)
  }
  return (
    <Pressable
      {...optionSemantics(props, isWeb)}
      testID="code-line-number"
      disabled={props.isDisabled}
      onPress={onPress}
      className={cn(
        'justify-start px-inset-sm',
        rowWashClassName(isFlagged, isSelected),
        hasFocusMark && 'bg-interactive-focus'
      )}
      style={[{ height }, props.style]}
    >
      {isFlagged ? (
        <View aria-hidden className="absolute bottom-0 left-0 top-0 w-0.5 bg-border-prominent" />
      ) : null}
      <Typography
        variant="mono"
        color="tertiary"
        align="right"
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        // The React Native form of `select-none`, so a copied selection is the source alone.
        selectable={false}
        className={cn('select-none', metrics.textClassName)}
        style={{ minWidth: numberWidth }}
      >
        {String(line)}
      </Typography>
    </Pressable>
  )
}
