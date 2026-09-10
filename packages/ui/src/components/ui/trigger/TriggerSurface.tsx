import React, { isValidElement, cloneElement } from 'react'
import { Pressable, type AccessibilityState } from 'react-native'

type Handler = (...args: never[]) => void
type Handlers = Record<string, Handler | undefined>

export interface TriggerSurfaceProps {
  /** Pressable handlers (onPress, onHoverIn, …) for whichever element owns the interaction. */
  handlers: Handlers
  /** Role for the wrapper when it is the one handling the interaction. */
  accessibilityRole?: 'button'
  /** Merged onto whichever element ends up owning the interaction. */
  accessibilityState?: AccessibilityState
  className?: string
  children: React.ReactNode
}

type ComposableChildProps = Handlers & { accessibilityState?: AccessibilityState }

function chain(childHandler: Handler | undefined, ownHandler: Handler | undefined): Handler {
  return (...args: never[]) => {
    childHandler?.(...args)
    ownHandler?.(...args)
  }
}

/**
 * Give interaction handling to a composed child instead of wrapping it in a second Pressable.
 *
 * React Native Web lets only the innermost pressable in a chain handle a gesture:
 * PressResponder calls `stopPropagation()` on the click that drives `onPress`,
 * and `useHover` contains hover the same way. A trigger that wraps a `Pressable`
 * child (a `Button`, say) in its own `Pressable` therefore never sees the
 * interaction — in a browser the trigger looks completely dead.
 *
 * A component child may be a Pressable, so the handlers are cloned onto it and
 * the wrapper drops the button role — that also leaves one `[role=button]`
 * rather than an invalid button-inside-button pair. The wrapper stays a
 * Pressable, out of the tab order, to still catch children that turn out not to
 * be pressable. Host elements (`<button>`, `<span>`) cannot take these handlers
 * and do not swallow the gesture, so for those the wrapper handles it.
 */
export function TriggerSurface({
  handlers,
  accessibilityRole,
  accessibilityState,
  className,
  children,
}: TriggerSurfaceProps) {
  const child = isValidElement(children) ? children : null
  const childCanCompose = child !== null && typeof child.type !== 'string'

  if (!childCanCompose) {
    return (
      <Pressable
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
        className={className}
        {...handlers}
      >
        {children}
      </Pressable>
    )
  }

  const childElement = child as React.ReactElement<ComposableChildProps>
  const composed: ComposableChildProps = {}
  for (const [name, handler] of Object.entries(handlers)) {
    composed[name] = chain(childElement.props[name], handler)
  }
  composed.accessibilityState = {
    ...childElement.props.accessibilityState,
    ...accessibilityState,
  }

  return (
    <Pressable focusable={false} tabIndex={-1} className={className} {...handlers}>
      {cloneElement(childElement, composed)}
    </Pressable>
  )
}
