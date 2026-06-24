import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { WeekRow } from './WeekRow'
import type { WeekRowWorkout } from './WeekRow'

const workouts: WeekRowWorkout[] = [
  { name: 'Upper', status: 'completed' },
  { name: 'Lower', status: 'current' },
  { name: 'Full', status: 'upcoming' },
]

const baseProps = {
  weekNumber: 1,
  totalWeeks: 4,
  workouts,
  intensityLevel: 0.55,
}

describe('WeekRow', () => {
  describe('rendering', () => {
    it('renders the week number label', () => {
      render(<WeekRow {...baseProps} />)
      expect(screen.getByTestId('week-row-number')).toHaveTextContent('W1')
    })

    it('renders a workout pill for each workout', () => {
      render(<WeekRow {...baseProps} />)
      expect(screen.getAllByTestId('workout-pill')).toHaveLength(3)
    })

    it('renders the intensity bar', () => {
      render(<WeekRow {...baseProps} />)
      expect(screen.getByTestId('week-row-intensity')).toBeInTheDocument()
      expect(screen.getByTestId('intensity-bar')).toBeInTheDocument()
    })

    it('passes the threshold through to the intensity bar', () => {
      render(<WeekRow {...baseProps} intensityThreshold={0.8} />)
      expect(screen.getByTestId('intensity-threshold')).toBeInTheDocument()
    })

    it('omits the threshold line when not provided', () => {
      render(<WeekRow {...baseProps} />)
      expect(screen.queryByTestId('intensity-threshold')).not.toBeInTheDocument()
    })
  })

  describe('current week', () => {
    it('renders the current week marker dot', () => {
      render(<WeekRow {...baseProps} isCurrent />)
      expect(screen.getByTestId('week-row-current-dot')).toBeInTheDocument()
    })

    it('does not render the marker dot when not current', () => {
      render(<WeekRow {...baseProps} />)
      expect(screen.queryByTestId('week-row-current-dot')).not.toBeInTheDocument()
    })

    it('applies the current-week tint and left border', () => {
      render(<WeekRow {...baseProps} isCurrent />)
      const style = screen.getByTestId('week-row').getAttribute('style') ?? ''
      expect(style).toContain('background-color')
      expect(style).toContain('border-left')
    })
  })

  describe('deload week', () => {
    it('renders all pills with the deload status', () => {
      render(<WeekRow {...baseProps} isDeload />)
      expect(screen.getAllByLabelText(/workout, deload/)).toHaveLength(3)
    })

    it('applies a purple tint to the row', () => {
      render(<WeekRow {...baseProps} isDeload />)
      const style = screen.getByTestId('week-row').getAttribute('style') ?? ''
      expect(style).toContain('background-color')
    })
  })

  describe('interaction', () => {
    it('invokes onPress for a pressable workout', () => {
      const onPress = vi.fn()
      render(
        <WeekRow
          {...baseProps}
          workouts={[{ name: 'Upper', status: 'current', onPress }]}
        />,
      )
      fireEvent.click(screen.getByTestId('workout-pill-pressable'))
      expect(onPress).toHaveBeenCalledOnce()
    })
  })

  describe('accessibility', () => {
    it('has a descriptive accessibility label', () => {
      render(<WeekRow {...baseProps} />)
      expect(
        screen.getByLabelText('Week 1 of 4, 3 workouts'),
      ).toBeInTheDocument()
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<WeekRow {...baseProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations as a current deload week', async () => {
      const { container } = render(
        <WeekRow {...baseProps} isCurrent isDeload intensityThreshold={0.8} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
