import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { TimerReadout } from './TimerReadout'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { primitiveRamps } from '../../../theme/tokens/primitives'

const semantic = getSemanticColors('dark')
const LIVE_GREEN = primitiveRamps.green[500]
const SECONDARY = semantic['text-secondary']
const TERTIARY = semantic['text-tertiary']

afterEach(() => {
  vi.useRealTimers()
})

describe('TimerReadout', () => {
  it('renders elapsed mm:ss from a controlled up-timer', () => {
    render(<TimerReadout mode="up" elapsedMs={65 * 1000} />)
    expect(screen.getByTestId('timer-readout-current')).toHaveTextContent('1:05')
  })

  it('renders the default ⏱ glyph', () => {
    render(<TimerReadout elapsedMs={0} />)
    expect(screen.getByTestId('timer-readout-glyph')).toHaveTextContent('⏱')
  })

  it('accepts a custom glyph', () => {
    render(<TimerReadout elapsedMs={0} glyph="◷" />)
    expect(screen.getByTestId('timer-readout-glyph')).toHaveTextContent('◷')
  })

  it('shows the current value in live green while running', () => {
    render(<TimerReadout mode="up" elapsedMs={0} running />)
    expect(screen.getByTestId('timer-readout-current')).toHaveStyle({ color: LIVE_GREEN })
    expect(screen.getByTestId('timer-readout-glyph')).toHaveStyle({ color: LIVE_GREEN })
  })

  it('shows the current value in secondary when paused', () => {
    render(<TimerReadout mode="up" elapsedMs={0} running={false} />)
    expect(screen.getByTestId('timer-readout-current')).toHaveStyle({ color: SECONDARY })
  })

  it('shows remaining time in down mode', () => {
    render(<TimerReadout mode="down" durationMs={90 * 1000} elapsedMs={27 * 1000} running />)
    expect(screen.getByTestId('timer-readout-current')).toHaveTextContent('1:03')
  })

  it('appends the total in dim tertiary when showTotal is set', () => {
    render(
      <TimerReadout mode="up" elapsedMs={42 * 1000} durationMs={60 * 60000} showTotal running />
    )
    const total = screen.getByTestId('timer-readout-total')
    expect(total).toHaveTextContent('/ 60:00')
    expect(total).toHaveStyle({ color: TERTIARY })
  })

  it('omits the total when showTotal is false', () => {
    render(<TimerReadout mode="up" elapsedMs={0} durationMs={60000} />)
    expect(screen.queryByTestId('timer-readout-total')).toBeNull()
  })

  it('self-ticks once per second while running with autoTick', () => {
    vi.useFakeTimers()
    render(<TimerReadout mode="up" autoTick running />)
    expect(screen.getByTestId('timer-readout-current')).toHaveTextContent('0:00')

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByTestId('timer-readout-current')).toHaveTextContent('0:03')
  })
})
