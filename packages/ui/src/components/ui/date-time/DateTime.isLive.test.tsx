import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { DateTime } from './DateTime'

describe('DateTime isLive', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T14:30:00Z'))
  })
  afterEach(() => vi.useRealTimers())

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

  it('isLive ignores value and honours refreshMs', () => {
    const { container } = render(
      <DateTime isLive value={0} format="time" hour12={false} isUTC seconds refreshMs={2000} />
    )
    expect(container.textContent).toBe('14:30:00')
    act(() => vi.advanceTimersByTime(2000))
    expect(container.textContent).toBe('14:30:02')
  })

  it('isLive={false} wins over live and renders the value', () => {
    const out = html(
      <DateTime isLive={false} live value="2020-02-03T04:05:06Z" format="date" isUTC />
    )
    expect(out).toBe(html(<DateTime value="2020-02-03T04:05:06Z" format="date" isUTC />))
    expect(out).not.toContain('2024')
  })

  it('isLive wins over live={false}', () => {
    const { container } = render(<DateTime isLive live={false} value={0} format="date" isUTC />)
    expect(container.textContent).toContain('2024')
  })
})
