import { createElement, forwardRef, type ComponentType } from 'react'

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

/** Wraps a react-native-web primitive to record its `className` by `testID`. */
export function captureClassName<P extends { className?: string; testID?: string }>(
  Component: ComponentType<P>
): ComponentType<P> {
  const Captured = forwardRef<unknown, P>(function CaptureClassName(props, ref) {
    const { className, testID } = props
    if (testID != null) {
      if (className != null) capturedClassNames.set(testID, className)
      else capturedClassNames.delete(testID)
    }
    return createElement(Component, { ...props, ref } as P)
  })
  Captured.displayName = `CaptureClassName(${Component.displayName ?? Component.name ?? 'Component'})`
  return Captured as unknown as ComponentType<P>
}
