/**
 * jsdom has no layout, so these drive react-native-web's `onLayout` by hand: a stub
 * ResizeObserver reports the strip, and `offsetWidth` says how wide it is.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { PinnedLiveStrip } from './PinnedLiveStrip'
import { LIVE_STRIP_SCENARIOS as S } from './pinnedLiveStrip-fixture'

let report: ((entries: { target: Element }[]) => void) | null = null
let width = 0

class StubResizeObserver {
  constructor(callback: (entries: { target: Element }[]) => void) {
    report = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => width,
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth')
})

/** Report the strip at `px` wide and let RNW's deferred measure run. */
async function measureAt(px: number) {
  width = px
  const target = screen.getByTestId('pinned-live-strip')
  await act(async () => {
    report?.([{ target }])
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('PinnedLiveStrip before its first measurement', () => {
  it('keeps the measuring frame mounted and paints nothing in it', () => {
    render(<PinnedLiveStrip {...S.set} />)
    expect(screen.getByTestId('pinned-live-strip')).toBeInTheDocument()
    expect(screen.queryByTestId('live-strip-plane')).toBeNull()
    expect(screen.queryByTestId('live-strip-title')).toBeNull()
  })

  it.each([
    [360, 'phone', true],
    [1920, 'wall', false],
  ] as const)('at %ipx draws the %s form first, never the other', async (px, _form, isPhone) => {
    render(<PinnedLiveStrip {...S.set} />)
    await measureAt(px)
    expect(screen.getByTestId('live-strip-plane')).toBeInTheDocument()
    expect(screen.queryByTestId('live-strip-title-row') != null).toBe(isPhone)
  })

  it('draws a forced layout at once, with no measurement', () => {
    render(<PinnedLiveStrip {...S.set} layout="phone" />)
    expect(screen.getByTestId('live-strip-title-row')).toBeInTheDocument()
  })

  it('has no accessibility violations while unmeasured', async () => {
    const { container } = render(<PinnedLiveStrip {...S.set} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
