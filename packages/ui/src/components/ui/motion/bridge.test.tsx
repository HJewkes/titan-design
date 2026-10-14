import { act, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import { afterEach, describe, expect, it } from 'vitest'
import { Beat } from './Beat'
import { rafClock, seekClock } from './clocks'
import { useMotionTime, useWaitUntil } from './hooks'
import { MotionProvider } from './MotionProvider'

function Now() {
  return <Text testID="now">{useMotionTime()}</Text>
}

function WaitsOn({ promise }: { promise: Promise<unknown> }) {
  useWaitUntil(promise)
  return null
}

function bridge() {
  const api = window.__titanMotion
  if (!api) throw new Error('window.__titanMotion is not published')
  return api
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => (resolve = r))
  return { promise, resolve }
}

/** Resolves true if `promise` has settled once every queued microtask has run. */
async function hasSettled(promise: Promise<unknown>): Promise<boolean> {
  let done = false
  void promise.then(() => (done = true))
  await new Promise((r) => setTimeout(r, 0))
  return done
}

function appendImage(complete: boolean): HTMLImageElement {
  const img = document.createElement('img')
  img.alt = ''
  Object.defineProperty(img, 'complete', { configurable: true, get: () => complete })
  document.body.append(img)
  return img
}

afterEach(() => {
  for (const img of Array.from(document.images)) img.remove()
})

describe('window.__titanMotion', () => {
  // Mutation caught: MotionProvider not publishing the bridge.
  it('is published on web by a provider on a seek clock, with its duration', () => {
    render(<MotionProvider clock={seekClock()} durationS={12} />)
    expect(bridge().duration).toBe(12)
  })

  // Mutation caught: the effect returning no cleanup, leaving a stale bridge behind.
  it('is removed when the provider unmounts', () => {
    const { unmount } = render(<MotionProvider clock={seekClock()} durationS={1} />)
    unmount()
    expect(window.__titanMotion).toBeUndefined()
  })

  // Mutation caught: cleanup deleting the bridge unconditionally.
  it('keeps a newer provider’s bridge when an older provider unmounts', () => {
    const older = render(<MotionProvider clock={seekClock()} durationS={1} />)
    render(<MotionProvider clock={seekClock()} durationS={2} />)
    older.unmount()
    expect(bridge().duration).toBe(2)
  })

  // Mutation caught: dropping the seek-clock check, so live playback exposes a seek it ignores.
  it('is not published for a rAF clock', () => {
    render(<MotionProvider clock={rafClock()} durationS={3} />)
    expect(window.__titanMotion).toBeUndefined()
  })
})

describe('__titanMotion.seek', () => {
  // Mutation caught: seeking without flushSync, so the frame commits after seek returns.
  it('commits the frame before it returns', () => {
    const reactGlobals = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    const actEnvironment = reactGlobals.IS_REACT_ACT_ENVIRONMENT
    reactGlobals.IS_REACT_ACT_ENVIRONMENT = false
    try {
      render(
        <MotionProvider clock={seekClock()} durationS={5}>
          <Now />
        </MotionProvider>
      )
      bridge().seek(2.5)
      expect(screen.getByTestId('now').textContent).toBe('2.5')
    } finally {
      reactGlobals.IS_REACT_ACT_ENVIRONMENT = actEnvironment
    }
  })

  // Mutation caught: removing the clamp, so a renderer's overshoot seeks outside the timeline.
  it.each([
    { to: -1, shows: '0' },
    { to: 9, shows: '5' },
  ])('clamps $to into [0, 5]', ({ to, shows }) => {
    render(
      <MotionProvider clock={seekClock(1)} durationS={5}>
        <Now />
      </MotionProvider>
    )
    act(() => bridge().seek(to))
    expect(screen.getByTestId('now').textContent).toBe(shows)
  })

  // Mutation caught: clamping before the finiteness check, which turns Infinity into the end.
  it('rejects a non-finite time instead of clamping it', () => {
    render(<MotionProvider clock={seekClock()} durationS={5} />)
    expect(() => bridge().seek(Infinity)).toThrow(RangeError)
  })

  // Mutation caught: Beat ignoring its ±0.5 s margin, so children outlive the window.
  it('unmounts a Beat’s children outside its window ±0.5 s and remounts them inside', () => {
    render(
      <MotionProvider clock={seekClock(3)} durationS={10}>
        <Beat startS={2} durationS={3}>
          <Text testID="content">in beat</Text>
        </Beat>
      </MotionProvider>
    )
    act(() => bridge().seek(5.6))
    expect(screen.queryByTestId('content')).toBeNull()
    act(() => bridge().seek(1.5))
    expect(screen.getByTestId('content')).toBeInTheDocument()
    act(() => bridge().seek(1.4))
    expect(screen.queryByTestId('content')).toBeNull()
  })
})

describe('__titanMotion.ready', () => {
  // Mutation caught: ready() not awaiting the useWaitUntil promises.
  it('waits for a useWaitUntil promise', async () => {
    const slow = deferred()
    render(
      <MotionProvider clock={seekClock()} durationS={1}>
        <WaitsOn promise={slow.promise} />
      </MotionProvider>
    )
    const ready = bridge().ready()
    expect(await hasSettled(ready)).toBe(false)
    slow.resolve()
    expect(await hasSettled(ready)).toBe(true)
  })

  // Mutation caught: ready() not awaiting pending <img> elements.
  it('waits on a slow image until it loads', async () => {
    render(<MotionProvider clock={seekClock()} durationS={1} />)
    const img = appendImage(false)
    const ready = bridge().ready()
    expect(await hasSettled(ready)).toBe(false)
    img.dispatchEvent(new Event('load'))
    expect(await hasSettled(ready)).toBe(true)
  })

  // Mutation caught: listening for load only, so a broken image hangs the render.
  it('settles when a slow image fails', async () => {
    render(<MotionProvider clock={seekClock()} durationS={1} />)
    const img = appendImage(false)
    const ready = bridge().ready()
    img.dispatchEvent(new Event('error'))
    expect(await hasSettled(ready)).toBe(true)
  })

  // Mutation caught: waiting on every image, so an already-loaded one blocks forever.
  it('does not wait on an image that has already loaded', async () => {
    render(<MotionProvider clock={seekClock()} durationS={1} />)
    appendImage(true)
    expect(await hasSettled(bridge().ready())).toBe(true)
  })
})

describe('MotionProvider with the bridge', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <MotionProvider clock={seekClock()} durationS={1}>
        <Now />
      </MotionProvider>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
