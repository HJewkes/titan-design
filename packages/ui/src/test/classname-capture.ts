import { createElement, forwardRef, useCallback, type ComponentType, type Ref } from 'react'

/**
 * `className` per `testID`, captured as each element renders — the seam a
 * spacing assertion binds to when a component has more than one `className`
 * per source function, where `spacingClassesIn`'s single source-text match
 * can't tell rows apart (see AW-142). NativeWind never runs under vitest (see
 * `spacing-resolver.ts`'s header for why `className` itself never reaches the
 * DOM here), so this map — not the DOM — is what a resolver reads back;
 * nothing renders differently, so snapshots elsewhere stay byte-identical.
 * Cleared after every test in `setup.ts` so no test reads another's capture.
 */
export const capturedClassNames = new Map<string, string>()

/** `className` per host node, for elements found by role, text or label rather than `testID`. */
export const capturedByNode = new WeakMap<object, string>()

/**
 * Hosts that rendered an `Animated.*` wrapper with a `className`. NativeWind
 * does not apply `className` to `Animated.View`, so a render-bound spacing
 * assertion on one would go green on a class that never renders.
 */
export const animatedNodes = new WeakSet<object>()
export const animatedTestIds = new Set<string>()

function assign<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node)
  else if (ref) (ref as { current: T | null }).current = node
}

/**
 * Wraps a react-native-web primitive to record its `className` by `testID` and
 * by host node. `animated` marks the `Animated.*` wrappers.
 */
export function captureClassName<P extends { className?: string; testID?: string }>(
  Component: ComponentType<P>,
  { animated = false }: { animated?: boolean } = {}
): ComponentType<P> {
  const Captured = forwardRef<unknown, P>(function CaptureClassName(props, ref) {
    const { className, testID } = props
    if (testID != null) {
      if (className != null) capturedClassNames.set(testID, className)
      else capturedClassNames.delete(testID)
      if (animated && className != null) animatedTestIds.add(testID)
      else animatedTestIds.delete(testID)
    }
    const captureRef = useCallback(
      (node: unknown) => {
        if (node && typeof node === 'object') {
          if (className != null) capturedByNode.set(node, className)
          else capturedByNode.delete(node)
          if (animated && className != null) animatedNodes.add(node)
          else animatedNodes.delete(node)
        }
        assign(ref, node)
      },
      [className, ref]
    )
    // The caller's ref is only forwarded into the callback, never read during render.
    // eslint-disable-next-line react-hooks/refs
    return createElement(Component, { ...props, ref: captureRef } as P)
  })
  Captured.displayName = `CaptureClassName(${Component.displayName ?? Component.name ?? 'Component'})`
  return Captured as unknown as ComponentType<P>
}
