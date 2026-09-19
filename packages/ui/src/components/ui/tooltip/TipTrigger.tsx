import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native'

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
 * Story and test seam, deliberately left out of the package barrel: the TipTrigger whose `label`
 * matches is open from the first paint and stays open whatever the pointer or focus does. Review
 * frames need a tip open by state; a simulated focus is lost as soon as another frame takes focus.
 */
export const PinnedTipContext = createContext<string | null>(null)

/** On the web, close an open tip on Escape and on a press outside its trigger. */
function useDismissOnWeb(open: boolean, close: () => void, trigger: RefObject<View | null>) {
  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof document === 'undefined') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onPointer = (e: PointerEvent) => {
      const node = trigger.current as unknown as Node | null
      if (node && !node.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open, close, trigger])
}

/**
 * One tip that opens on hover (web), focus (keyboard) and press (native) — the
 * three affordances share a single open state, because RNW ends a wrapper's
 * hover the moment a nested Pressable claims the pointer. On the web it also
 * closes on Escape and on a press outside the trigger, and the open tip
 * describes the trigger for screen readers.
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
  const [focusedOpen, setOpen] = useState(false)
  const pinned = useContext(PinnedTipContext) === label
  const open = pinned || focusedOpen
  const trigger = useRef<View>(null)
  const tipId = `tip-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const close = useCallback(() => setOpen(false), [])
  useDismissOnWeb(focusedOpen, close, trigger)
  return (
    <Tooltip
      isOpen={open}
      placement={placement}
      usePortal={usePortal}
      style={style}
      content={<View nativeID={tipId}>{content}</View>}
    >
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel={label}
        aria-describedby={open ? tipId : undefined}
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
