import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { expect } from 'vitest'

interface BoundedMountOptions {
  render: () => ReactElement
  selector: string
  max: number
}

/** Fails when a render mounts more than `max` nodes matching `selector`; counts nodes, never time. */
export function expectBoundedMount({
  render: element,
  selector,
  max,
}: BoundedMountOptions): number {
  if (!Number.isFinite(max) || max < 0) {
    throw new Error(`max must be a finite number of at least 0, got ${max}`)
  }
  const { container, unmount } = render(element())
  const mounted = container.querySelectorAll(selector).length
  unmount()
  expect(mounted, `"${selector}" matched nothing, so the bound proves nothing`).toBeGreaterThan(0)
  expect(mounted, `mounted ${mounted} "${selector}" nodes, bound is ${max}`).toBeLessThanOrEqual(
    max
  )
  return mounted
}
