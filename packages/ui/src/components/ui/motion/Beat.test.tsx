import { act, render, renderHook, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import type { ReactNode } from 'react'
import { Text } from 'react-native'
import { describe, expect, it, vi } from 'vitest'
import { Beat, BeatFrame, useBeatTime } from './Beat'
import { seekClock, type SeekClock } from './clocks'
import { useRawLocalTime } from './hooks'
import { MotionProvider } from './MotionProvider'

function BeatClock() {
  const { t, phase, durationS } = useBeatTime()
  return <Text testID="beat-clock">{`${t} ${phase} ${durationS}`}</Text>
}

function RawTime() {
  return <Text testID="raw">{useRawLocalTime(0)}</Text>
}

/** Each element's tag, attributes and text, with attribute order ignored: that order is not output. */
function domState(root: Element): string[] {
  return [...root.querySelectorAll('*')].map((el) => {
    const attrs = [...el.attributes].map((a) => `${a.name}=${a.value}`).sort()
    return `${el.tagName} ${attrs.join(' ')} ${el.childElementCount ? '' : el.textContent}`
  })
}

function renderAt(clock: SeekClock, children: ReactNode) {
  return render(<MotionProvider clock={clock}>{children}</MotionProvider>)
}

describe('Beat', () => {
  it.each([
    { at: 1.4, mounted: false },
    { at: 1.5, mounted: true },
    { at: 4, mounted: true },
    { at: 5.5, mounted: true },
    { at: 5.6, mounted: false },
  ])('of 2 s to 5 s is mounted at $at: $mounted', ({ at, mounted }) => {
    renderAt(
      seekClock(at),
      <Beat startS={2} durationS={3}>
        <BeatClock />
      </Beat>
    )
    expect(screen.queryByTestId('beat-clock') !== null).toBe(mounted)
  })

  it('moves the time origin to its start, and nests', () => {
    renderAt(
      seekClock(3.25),
      <Beat startS={1} durationS={5}>
        <Beat startS={2} durationS={1}>
          <RawTime />
        </Beat>
      </Beat>
    )
    expect(screen.getByTestId('raw').textContent).toBe('0.25')
  })

  it('reports its local time and phase across the window', () => {
    const clock = seekClock(1.8)
    renderAt(
      clock,
      <Beat startS={2} durationS={3}>
        <BeatClock />
      </Beat>
    )
    expect(screen.getByTestId('beat-clock').textContent).toBe('0 before 3')
    act(() => clock.seek(3))
    expect(screen.getByTestId('beat-clock').textContent).toBe('1 during 3')
    act(() => clock.seek(5.2))
    expect(screen.getByTestId('beat-clock').textContent).toBe('3 after 3')
  })
})

describe('useBeatTime', () => {
  it('throws outside a Beat instead of reading a zero-length window', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      renderHook(useBeatTime, {
        wrapper: ({ children }) => <MotionProvider clock={seekClock(1)}>{children}</MotionProvider>,
      })
    ).toThrow('useBeatTime needs an enclosing <Beat startS durationS>')
    error.mockRestore()
  })
})

describe('BeatFrame', () => {
  function Frame({ clock }: { clock: SeekClock }) {
    return (
      <MotionProvider clock={clock}>
        <Beat startS={2} durationS={3}>
          <BeatFrame kind="title">
            <Text>Release notes</Text>
          </BeatFrame>
        </Beat>
      </MotionProvider>
    )
  }

  it.each([
    { at: 1.6, visible: false },
    { at: 2, visible: true },
    { at: 4.9, visible: true },
    { at: 5.2, visible: false },
  ])('at $at is visible: $visible', ({ at, visible }) => {
    render(<Frame clock={seekClock(at)} />)
    const frame = screen.getByTestId('beat-title')
    expect(frame).toHaveStyle({ opacity: visible ? '1' : '0' })
    expect(frame.getAttribute('aria-hidden')).toBe(visible ? null : 'true')
  })

  it('renders the same frame for a time whatever was seeked before', () => {
    const clock = seekClock(1.6)
    const { container } = render(<Frame clock={clock} />)
    act(() => clock.seek(3))
    const visibleFirst = domState(container)
    act(() => clock.seek(1.6))
    act(() => clock.seek(3))
    expect(domState(container)).toEqual(visibleFirst)
    act(() => clock.seek(1.6))
    const hiddenAfterVisible = domState(container)
    const fresh = render(<Frame clock={seekClock(1.6)} />)
    expect(domState(fresh.container)).toEqual(hiddenAfterVisible)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Frame clock={seekClock(3)} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
