import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { WorkoutPill } from './WorkoutPill'

describe('WorkoutPill', () => {
  it('renders the workout name', () => {
    render(<WorkoutPill name="Upper A" status="completed" />)
    expect(screen.getByText('Upper A')).toBeInTheDocument()
  })

  it('shows checkmark for completed status', () => {
    render(<WorkoutPill name="Upper A" status="completed" />)
    expect(screen.getByTestId('workout-pill-check')).toBeInTheDocument()
  })

  it('shows dash for missed status', () => {
    render(<WorkoutPill name="Rest Day" status="missed" />)
    expect(screen.getByTestId('workout-pill-dash')).toBeInTheDocument()
  })

  it('does not show checkmark for current status', () => {
    render(<WorkoutPill name="Lower B" status="current" />)
    expect(screen.queryByTestId('workout-pill-check')).not.toBeInTheDocument()
  })

  it('does not show checkmark for next status', () => {
    render(<WorkoutPill name="Upper B" status="next" />)
    expect(screen.queryByTestId('workout-pill-check')).not.toBeInTheDocument()
  })

  it('does not show checkmark for upcoming status', () => {
    render(<WorkoutPill name="Lower A" status="upcoming" />)
    expect(screen.queryByTestId('workout-pill-check')).not.toBeInTheDocument()
  })

  it('does not show checkmark for deload status', () => {
    render(<WorkoutPill name="Deload Week" status="deload" />)
    expect(screen.queryByTestId('workout-pill-check')).not.toBeInTheDocument()
  })

  it('wraps in Pressable when onPress is provided', () => {
    render(<WorkoutPill name="Upper A" status="completed" onPress={() => {}} />)
    expect(screen.getByTestId('workout-pill-pressable')).toBeInTheDocument()
  })

  it('does not wrap in Pressable when onPress is omitted', () => {
    render(<WorkoutPill name="Upper A" status="completed" />)
    expect(screen.queryByTestId('workout-pill-pressable')).not.toBeInTheDocument()
  })

  it('calls onPress when pressed', () => {
    const onPress = vi.fn()
    render(<WorkoutPill name="Upper A" status="completed" onPress={onPress} />)
    fireEvent.click(screen.getByTestId('workout-pill-pressable'))
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('has correct accessibility label', () => {
    render(<WorkoutPill name="Upper A" status="current" />)
    expect(screen.getByLabelText('Upper A workout, current')).toBeInTheDocument()
  })

  it('has correct accessibility label for missed', () => {
    render(<WorkoutPill name="Rest Day" status="missed" />)
    expect(screen.getByLabelText('Rest Day workout, missed')).toBeInTheDocument()
  })

  it('has correct accessibility label for deload', () => {
    render(<WorkoutPill name="Recovery" status="deload" />)
    expect(screen.getByLabelText('Recovery workout, deload')).toBeInTheDocument()
  })

  it('renders all status variants without error', () => {
    const statuses = ['completed', 'current', 'next', 'upcoming', 'missed', 'deload'] as const
    for (const status of statuses) {
      const { unmount } = render(<WorkoutPill name="Test" status={status} />)
      expect(screen.getByTestId('workout-pill')).toBeInTheDocument()
      unmount()
    }
  })

  describe('pulse', () => {
    it('pulses by default on current status', () => {
      render(<WorkoutPill name="Upper A" status="current" />)
      const pill = screen.getByTestId('workout-pill')
      expect(pill).toBeInTheDocument()
      expect(pill).toHaveStyle({ opacity: 1 })
    })

    it('does not pulse on non-current statuses by default', () => {
      render(<WorkoutPill name="Upper A" status="upcoming" />)
      const pill = screen.getByTestId('workout-pill')
      expect(pill).toBeInTheDocument()
      expect(pill.style.opacity).toBe('')
    })

    it('can force pulse on a non-current status', () => {
      render(<WorkoutPill name="Upper A" status="upcoming" pulse />)
      expect(screen.getByTestId('workout-pill')).toHaveStyle({ opacity: 1 })
    })

    it('can disable pulse on current status', () => {
      render(<WorkoutPill name="Upper A" status="current" pulse={false} />)
      expect(screen.getByTestId('workout-pill').style.opacity).toBe('')
    })
  })

  describe('highlighted prop', () => {
    it('renders without highlighted by default', () => {
      render(<WorkoutPill name="Upper A" status="current" />)
      expect(screen.getByTestId('workout-pill')).toBeInTheDocument()
    })

    it('renders with highlighted prop', () => {
      render(<WorkoutPill name="Upper A" status="current" highlighted />)
      expect(screen.getByTestId('workout-pill')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <WorkoutPill name="Upper A" status="completed" onPress={() => {}} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations as static pill', async () => {
      const { container } = render(
        <WorkoutPill name="Lower B" status="upcoming" />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations for missed status', async () => {
      const { container } = render(
        <WorkoutPill name="Rest Day" status="missed" onPress={() => {}} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('pressable has correct accessibility label', () => {
      render(<WorkoutPill name="Upper A" status="completed" onPress={() => {}} />)
      expect(
        screen.getByLabelText('Upper A workout, completed'),
      ).toBeInTheDocument()
    })
  })
})
