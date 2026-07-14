import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { RestTimer } from './RestTimer'

const defaultProps = {
  totalSeconds: 150,
  elapsedMs: 30000,
  onSkip: vi.fn(),
  onAddTime: vi.fn(),
  visible: true,
}

describe('RestTimer', () => {
  describe('time display formatting', () => {
    it('displays 2:30 for 150s total with 0 elapsed', () => {
      render(<RestTimer {...defaultProps} elapsedMs={0} />)
      expect(screen.getByTestId('rest-timer-time')).toHaveTextContent('2:30')
    })

    it('displays 2:00 for 150s total with 30s elapsed', () => {
      render(<RestTimer {...defaultProps} elapsedMs={30000} />)
      expect(screen.getByTestId('rest-timer-time')).toHaveTextContent('2:00')
    })

    it('displays 0:05 for 150s total with 145s elapsed', () => {
      render(<RestTimer {...defaultProps} elapsedMs={145000} />)
      expect(screen.getByTestId('rest-timer-time')).toHaveTextContent('0:05')
    })

    it('pads seconds with leading zero', () => {
      render(<RestTimer {...defaultProps} totalSeconds={65} elapsedMs={0} />)
      expect(screen.getByTestId('rest-timer-time')).toHaveTextContent('1:05')
    })

    it('displays 0:00 when elapsed equals total', () => {
      render(<RestTimer {...defaultProps} elapsedMs={150000} />)
      expect(screen.getByTestId('rest-timer-time')).toHaveTextContent('0:00')
    })
  })

  describe('progress bar', () => {
    it('sets width to 0% when elapsed is 0', () => {
      render(<RestTimer {...defaultProps} elapsedMs={0} />)
      const fill = screen.getByTestId('rest-timer-progress-fill')
      expect(fill).toHaveStyle({ width: '0%' })
    })

    it('sets width to 50% when half elapsed', () => {
      render(<RestTimer {...defaultProps} totalSeconds={100} elapsedMs={50000} />)
      const fill = screen.getByTestId('rest-timer-progress-fill')
      expect(fill).toHaveStyle({ width: '50%' })
    })

    it('clamps width to 100% when elapsed exceeds total', () => {
      render(<RestTimer {...defaultProps} elapsedMs={200000} />)
      const fill = screen.getByTestId('rest-timer-progress-fill')
      expect(fill).toHaveStyle({ width: '100%' })
    })
  })

  describe('button interactions', () => {
    it('fires onSkip when skip button is pressed', () => {
      const onSkip = vi.fn()
      render(<RestTimer {...defaultProps} onSkip={onSkip} />)
      fireEvent.click(screen.getByTestId('rest-timer-skip'))
      expect(onSkip).toHaveBeenCalledOnce()
    })

    it('fires onAddTime when +30s button is pressed', () => {
      const onAddTime = vi.fn()
      render(<RestTimer {...defaultProps} onAddTime={onAddTime} />)
      fireEvent.click(screen.getByTestId('rest-timer-add-time'))
      expect(onAddTime).toHaveBeenCalledOnce()
    })
  })

  describe('display-only mode', () => {
    it('renders the Skip and +30s actions by default', () => {
      render(<RestTimer {...defaultProps} />)
      expect(screen.getByTestId('rest-timer-skip')).toBeInTheDocument()
      expect(screen.getByTestId('rest-timer-add-time')).toBeInTheDocument()
    })

    it('hides the Skip and +30s actions when displayOnly', () => {
      render(<RestTimer {...defaultProps} displayOnly />)
      expect(screen.queryByTestId('rest-timer-skip')).not.toBeInTheDocument()
      expect(screen.queryByTestId('rest-timer-add-time')).not.toBeInTheDocument()
    })

    it('keeps the countdown, progress bar, and next-set line when displayOnly', () => {
      render(
        <RestTimer
          {...defaultProps}
          elapsedMs={30000}
          displayOnly
          nextSetInfo="Bench Press — Set 3 of 4"
        />
      )
      expect(screen.getByTestId('rest-timer-time')).toHaveTextContent('2:00')
      expect(screen.getByTestId('rest-timer-progress-fill')).toBeInTheDocument()
      expect(screen.getByTestId('rest-timer-next-set')).toHaveTextContent(
        'Bench Press — Set 3 of 4'
      )
    })

    it('does not fire callbacks in display-only mode (controls absent)', () => {
      const onSkip = vi.fn()
      const onAddTime = vi.fn()
      render(<RestTimer {...defaultProps} onSkip={onSkip} onAddTime={onAddTime} displayOnly />)
      expect(screen.queryByLabelText('Skip rest')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Add 30 seconds')).not.toBeInTheDocument()
      expect(onSkip).not.toHaveBeenCalled()
      expect(onAddTime).not.toHaveBeenCalled()
    })
  })

  describe('next set info', () => {
    it('displays nextSetInfo when provided', () => {
      render(<RestTimer {...defaultProps} nextSetInfo="Bench Press — Set 3 of 4" />)
      expect(screen.getByTestId('rest-timer-next-set')).toHaveTextContent(
        'Bench Press — Set 3 of 4'
      )
    })

    it('does not render next set element when nextSetInfo is not provided', () => {
      render(<RestTimer {...defaultProps} />)
      expect(screen.queryByTestId('rest-timer-next-set')).not.toBeInTheDocument()
    })
  })

  describe('visibility', () => {
    it('renders nothing when visible is false', () => {
      render(<RestTimer {...defaultProps} visible={false} />)
      expect(screen.queryByTestId('rest-timer')).not.toBeInTheDocument()
    })

    it('renders when visible is true', () => {
      render(<RestTimer {...defaultProps} visible />)
      expect(screen.getByTestId('rest-timer')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('clamps remaining to 0 when elapsed exceeds total', () => {
      render(<RestTimer {...defaultProps} elapsedMs={200000} />)
      expect(screen.getByTestId('rest-timer-time')).toHaveTextContent('0:00')
    })

    it('displays full time when elapsed is 0', () => {
      render(<RestTimer {...defaultProps} totalSeconds={90} elapsedMs={0} />)
      expect(screen.getByTestId('rest-timer-time')).toHaveTextContent('1:30')
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<RestTimer {...defaultProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has timer role with remaining seconds in label', () => {
      render(<RestTimer {...defaultProps} totalSeconds={90} elapsedMs={30000} />)
      expect(screen.getByLabelText('Rest timer, 60 seconds remaining')).toBeInTheDocument()
    })

    it('skip button has accessible label', () => {
      render(<RestTimer {...defaultProps} />)
      expect(screen.getByLabelText('Skip rest')).toBeInTheDocument()
    })

    it('add time button has accessible label', () => {
      render(<RestTimer {...defaultProps} />)
      expect(screen.getByLabelText('Add 30 seconds')).toBeInTheDocument()
    })
  })
})

describe('RestTimer zero-duration timer (NaN guard)', () => {
  it('emits a valid 100% width (not NaN) when totalSeconds is 0', () => {
    const { container } = render(<RestTimer {...defaultProps} totalSeconds={0} elapsedMs={0} />)
    expect(screen.getByTestId('rest-timer-progress-fill')).toHaveStyle({ width: '100%' })
    expect(container.innerHTML).not.toContain('NaN')
  })
})

describe('RestTimer ring variant', () => {
  const ringProps = { ...defaultProps, variant: 'ring' as const }

  it('renders the ring (composed CircularProgress) instead of the linear bar', () => {
    render(<RestTimer {...ringProps} />)
    expect(screen.getByTestId('rest-timer-ring')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.queryByTestId('rest-timer-progress-track')).not.toBeInTheDocument()
  })

  it('shows the mm:ss countdown in the ring center while resting', () => {
    render(<RestTimer {...ringProps} totalSeconds={120} elapsedMs={60000} />)
    expect(screen.getByTestId('circular-timer-label')).toHaveTextContent('1:00')
  })

  it('shows GO (not a time) when rest is complete', () => {
    render(<RestTimer {...ringProps} totalSeconds={120} elapsedMs={120000} />)
    expect(screen.getByTestId('circular-timer-label')).toHaveTextContent('GO')
  })

  it('labels the completed ring as rest complete', () => {
    render(<RestTimer {...ringProps} totalSeconds={120} elapsedMs={125000} />)
    expect(screen.getByLabelText('Rest complete, next set ready')).toBeInTheDocument()
  })

  it('labels the resting ring with seconds remaining', () => {
    render(<RestTimer {...ringProps} totalSeconds={120} elapsedMs={60000} />)
    expect(screen.getByLabelText('Rest timer, 60 seconds remaining')).toBeInTheDocument()
  })

  it('renders the next-set line and controls by default', () => {
    render(<RestTimer {...ringProps} nextSetInfo="Next · Bench · set 3 of 4" />)
    expect(screen.getByTestId('rest-timer-next-set')).toHaveTextContent('Next · Bench · set 3 of 4')
    expect(screen.getByTestId('rest-timer-add-time')).toBeInTheDocument()
    expect(screen.getByTestId('rest-timer-skip')).toBeInTheDocument()
  })

  it('hides the controls in displayOnly mode (keeps ring + next-set)', () => {
    render(<RestTimer {...ringProps} nextSetInfo="Next" displayOnly />)
    expect(screen.getByTestId('rest-timer-ring')).toBeInTheDocument()
    expect(screen.getByTestId('rest-timer-next-set')).toBeInTheDocument()
    expect(screen.queryByTestId('rest-timer-skip')).not.toBeInTheDocument()
    expect(screen.queryByTestId('rest-timer-add-time')).not.toBeInTheDocument()
  })

  it('fires onSkip / onAddTime from the ring controls', () => {
    const onSkip = vi.fn()
    const onAddTime = vi.fn()
    render(<RestTimer {...ringProps} onSkip={onSkip} onAddTime={onAddTime} />)
    fireEvent.click(screen.getByTestId('rest-timer-skip'))
    fireEvent.click(screen.getByTestId('rest-timer-add-time'))
    expect(onSkip).toHaveBeenCalledOnce()
    expect(onAddTime).toHaveBeenCalledOnce()
  })

  it('respects visible=false', () => {
    render(<RestTimer {...ringProps} visible={false} />)
    expect(screen.queryByTestId('rest-timer-ring')).not.toBeInTheDocument()
  })

  it('emits no NaN when totalSeconds is 0', () => {
    const { container } = render(<RestTimer {...ringProps} totalSeconds={0} elapsedMs={0} />)
    expect(container.innerHTML).not.toContain('NaN')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <RestTimer {...ringProps} nextSetInfo="Next · Bench · set 3 of 4" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
