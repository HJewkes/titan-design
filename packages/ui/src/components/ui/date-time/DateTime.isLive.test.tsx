import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { pinDefaultLocale } from '../../../test/pin-locale'
import { DateTime } from './DateTime'

describe('DateTime isLive', () => {
  beforeEach(() => {
    pinDefaultLocale('en-US')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T14:30:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  const html = (el: React.ReactElement) => render(el).container.innerHTML

  it('isLive ticks like the deprecated live alias', () => {
    const props = { format: 'time', hour12: false, isUTC: true, seconds: true } as const
    const a = render(<DateTime isLive {...props} />)
    const b = render(<DateTime live {...props} />)
    expect(a.container.innerHTML).toBe(b.container.innerHTML)
    act(() => vi.advanceTimersByTime(5000))
    expect(a.container.innerHTML).toBe(b.container.innerHTML)
    expect(a.container.textContent).toBe('14:30:05')
  })

  it('isLive without a value is a clock that honours refreshMs', () => {
    const { container } = render(
      <DateTime isLive format="time" hour12={false} isUTC seconds refreshMs={2000} />
    )
    expect(container.textContent).toBe('14:30:00')
    act(() => vi.advanceTimersByTime(2000))
    expect(container.textContent).toBe('14:30:02')
  })

  it('isLive keeps a relative value relative to the current time', () => {
    const fiveMinAgo = Date.now() - 5 * 60_000
    const { container } = render(<DateTime live value={fiveMinAgo} format="relative" />)
    expect(container.textContent).toBe('5 minutes ago')
    act(() => vi.advanceTimersByTime(60_000))
    expect(container.textContent).toBe('6 minutes ago')
  })

  it('ticks a live relative value once per displayed unit, not every second', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const threeDaysAgo = Date.now() - 3 * 86_400_000
    const { container } = render(<DateTime isLive value={threeDaysAgo} format="relative" />)
    expect(container.textContent).toBe('3 days ago')
    const delays = setIntervalSpy.mock.calls.map(([, ms]) => ms)
    expect(delays).toEqual([3_600_000])
  })

  it('shows the current time at once when isLive turns on after mount', async () => {
    const props = { format: 'time', hour12: false, isUTC: true, seconds: true } as const
    const { container, rerender } = render(<DateTime isLive={false} {...props} />)
    vi.setSystemTime(new Date('2024-01-15T14:40:00Z'))
    rerender(<DateTime isLive {...props} />)
    await act(async () => {})
    expect(container.textContent).toBe('14:40:00')
  })

  it('isLive renders the fallback for an unparseable value', () => {
    const { container } = render(<DateTime isLive value="nope" fallback="n/a" />)
    expect(container.textContent).toBe('n/a')
  })

  it('isLive={false} wins over live and renders the value', () => {
    const out = html(
      <DateTime isLive={false} live value="2020-02-03T04:05:06Z" format="date" isUTC />
    )
    expect(out).toBe(html(<DateTime value="2020-02-03T04:05:06Z" format="date" isUTC />))
    expect(out).not.toContain('2024')
  })

  it('isLive wins over live={false}', () => {
    const { container } = render(<DateTime isLive live={false} format="date" isUTC />)
    expect(container.textContent).toContain('2024')
  })
})
