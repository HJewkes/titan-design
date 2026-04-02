import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StepProgress, Step } from './StepProgress'

describe('StepProgress', () => {
  it('renders steps with labels', () => {
    render(
      <StepProgress>
        <Step label="A" value={50} />
        <Step label="B" value={0} />
      </StepProgress>
    )
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('shows checkmark when isComplete', () => {
    render(
      <StepProgress>
        <Step label="A" value={100} isComplete />
      </StepProgress>
    )
    expect(screen.getByText('\u2713')).toBeInTheDocument()
    expect(screen.queryByText('A')).not.toBeInTheDocument()
  })

  it('applies locked styling', () => {
    render(
      <StepProgress>
        <Step label="L" value={0} isLocked />
      </StepProgress>
    )
    const step = screen.getByTestId('step-L')
    expect(step).toHaveAttribute('aria-disabled', 'true')
  })

  it('fires click handler on active steps', () => {
    const handleClick = vi.fn()
    render(
      <StepProgress>
        <Step label="C" value={50} onClick={handleClick} />
      </StepProgress>
    )
    fireEvent.click(screen.getByTestId('step-C'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire click handler on locked steps', () => {
    const handleClick = vi.fn()
    render(
      <StepProgress>
        <Step label="X" value={0} isLocked onClick={handleClick} />
      </StepProgress>
    )
    fireEvent.click(screen.getByTestId('step-X'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('uses smaller size in compact mode', () => {
    const { container } = render(
      <StepProgress compact>
        <Step label="S" value={25} />
      </StepProgress>
    )
    const progressbar = container.querySelector('[role="progressbar"]')
    expect(progressbar).toBeInTheDocument()
    const style = (progressbar as HTMLElement)?.style
    expect(style?.width).toBe('28px')
    expect(style?.height).toBe('28px')
  })

  it('uses default size without compact mode', () => {
    const { container } = render(
      <StepProgress>
        <Step label="D" value={25} />
      </StepProgress>
    )
    const progressbar = container.querySelector('[role="progressbar"]')
    const style = (progressbar as HTMLElement)?.style
    expect(style?.width).toBe('40px')
    expect(style?.height).toBe('40px')
  })
})
