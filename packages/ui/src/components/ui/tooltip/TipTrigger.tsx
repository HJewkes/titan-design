import { useState, type ReactNode } from 'react'
import { Pressable, type StyleProp, type ViewStyle } from 'react-native'

import { Tooltip, type TooltipPlacement } from './Tooltip'

export interface TipTriggerProps {
  /** Tip card contents. */
  content: ReactNode
  /** Accessible name of the trigger itself, read before the tip opens. */
  label: string
  placement?: TooltipPlacement
  /** Box of the tooltip wrapper, which sits between the parent and the trigger. */
  style?: StyleProp<ViewStyle>
  /** Box of the pressable; defaults to the wrapper's. */
  pressableStyle?: StyleProp<ViewStyle>
  /**
   * Escape overflow-clipping ancestors by rendering into a portal (web). Off
   * keeps the tip in flow, which is what honours the `-start` / `-end` half of a
   * placement — the portal positions on the cardinal alone and always centres.
   */
  usePortal?: boolean
  testID?: string
  children: ReactNode
}

/**
 * One tip that opens on hover (web), focus (keyboard) and press (native) — the
 * three affordances share a single open state, because RNW ends a wrapper's
 * hover the moment a nested Pressable claims the pointer.
 *
 * @example
 * <TipTrigger label="Goal status: behind" content={<Basis />}>
 *   <Pill tone="warning">Behind</Pill>
 * </TipTrigger>
 */
export function TipTrigger({
  content,
  label,
  placement = 'top',
  style,
  pressableStyle,
  usePortal = true,
  testID,
  children,
}: TipTriggerProps) {
  const [open, setOpen] = useState(false)
  return (
    <Tooltip
      isOpen={open}
      placement={placement}
      usePortal={usePortal}
      style={style}
      content={content}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onHoverIn={() => setOpen(true)}
        onHoverOut={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onPress={() => setOpen((wasOpen) => !wasOpen)}
        style={pressableStyle ?? style}
        testID={testID}
      >
        {children}
      </Pressable>
    </Tooltip>
  )
}
