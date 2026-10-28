import { useCallback, useState } from 'react'
import type { GestureResponderEvent, ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'

const NESTED_CONTROL = [
  'input',
  'textarea',
  'select',
  'button',
  'a[href]',
  '[contenteditable="true"]',
  ...['button', 'link', 'radio', 'checkbox', 'switch', 'slider', 'textbox', 'combobox', 'tab'].map(
    (role) => `[role="${role}"]`
  ),
].join(', ')

/**
 * Whether a press began on a control nested inside the card. On web the press reaches
 * the card from any descendant, and CSS `:active` holds on every ancestor, so a card
 * pressed by its own radio scaled whole (TD-1012). Native gives the nested control the
 * responder, so the card never sees the press there.
 */
function startsInNestedControl(event: GestureResponderEvent): boolean {
  if (typeof Element === 'undefined') return false
  const target: unknown = event.nativeEvent.target
  const card: unknown = event.currentTarget
  if (!(target instanceof Element) || !(card instanceof Element)) return false
  const control = target.closest(NESTED_CONTROL)
  return control !== null && control !== card
}

/** A clickable card lifts on hover and shrinks while pressed; reduced motion keeps it still. */
function clickableClassName(isPressed: boolean, reducedMotion: boolean): string {
  const base = 'web:cursor-pointer web:transition-all web:duration-100'
  if (reducedMotion) return base
  return cn(base, 'web:hover:-translate-y-0.5', isPressed && 'scale-[0.99]')
}

/** `data-pressed` on web (RNW renders `dataSet`; native ignores it), keeping a caller's own marks. */
function pressedDataSet(props: ViewProps, isPressed: boolean): ViewProps {
  const own = (props as { dataSet?: Record<string, string> }).dataSet
  return { dataSet: { ...own, pressed: isPressed ? 'true' : undefined } } as ViewProps
}

/**
 * A clickable card's hover and its own pressed state, the latter scoped to presses that
 * start on the card itself, as its className and the props its Pressable spreads last.
 */
export function useCardInteraction() {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const onPressIn = useCallback((event: GestureResponderEvent) => {
    if (!startsInNestedControl(event)) setIsPressed(true)
  }, [])
  const onPressOut = useCallback(() => setIsPressed(false), [])
  const onHoverIn = useCallback(() => setIsHovered(true), [])
  const onHoverOut = useCallback(() => setIsHovered(false), [])
  return {
    isHovered,
    className: clickableClassName(isPressed, reducedMotion),
    pressableProps: (props: ViewProps) => ({
      ...props,
      onPressIn,
      onPressOut,
      onHoverIn,
      onHoverOut,
      ...pressedDataSet(props, isPressed),
    }),
  }
}
