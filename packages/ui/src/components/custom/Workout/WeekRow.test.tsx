import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { WeekRow } from './WeekRow'
import type { WeekRowWorkout } from './WeekRow'
import { resolveColor } from '../../../theme/resolve-color'
import { WORKOUT_PILL_DELOAD } from '../../../theme/extracted-colors-dataviz'
import { alpha } from '../../../utils/colors'

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
      expect(screen.getByTestId('intensity-target')).toBeInTheDocument()
    })

    it('omits the threshold line when not provided', () => {
      render(<WeekRow {...baseProps} />)
      expect(screen.queryByTestId('intensity-target')).not.toBeInTheDocument()
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

    it('applies the current-week tint and left border from the brand tokens', () => {
      render(<WeekRow {...baseProps} isCurrent />)
      const style = screen.getByTestId('week-row').getAttribute('style') ?? ''
      expect(style).toContain(`background-color: ${resolveColor('brand-primary-subtle')}`)
      expect(style).toContain(`border-left-color: ${resolveColor('brand-primary')}`)
    })
  })

  describe('deload week', () => {
    it('renders all pills with the deload status', () => {
      render(<WeekRow {...baseProps} isDeload />)
      expect(screen.getAllByLabelText(/workout, deload/)).toHaveLength(3)
    })

    it('washes the row with the same deload pin WorkoutPill uses', () => {
      render(<WeekRow {...baseProps} isDeload />)
      const style = screen.getByTestId('week-row').getAttribute('style') ?? ''
      expect(style).toContain(`background-color: ${alpha(WORKOUT_PILL_DELOAD, 0.06)}`)
    })

    it('lets a current deload week keep the brand rail over the deload wash', () => {
      render(<WeekRow {...baseProps} isDeload isCurrent />)
      const style = screen.getByTestId('week-row').getAttribute('style') ?? ''
      expect(style).toContain(`background-color: ${resolveColor('brand-primary-subtle')}`)
      expect(style).toContain(`border-left-color: ${resolveColor('brand-primary')}`)
    })
  })

  describe('interaction', () => {
    it('invokes onPress for a pressable workout', () => {
      const onPress = vi.fn()
      render(<WeekRow {...baseProps} workouts={[{ name: 'Upper', status: 'current', onPress }]} />)
      fireEvent.click(screen.getByTestId('workout-pill-pressable'))
      expect(onPress).toHaveBeenCalledOnce()
    })
  })

  describe('accessibility', () => {
    it('has a descriptive accessibility label', () => {
      render(<WeekRow {...baseProps} />)
      expect(screen.getByLabelText('Week 1 of 4, 3 workouts')).toBeInTheDocument()
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<WeekRow {...baseProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations as a current deload week', async () => {
      const { container } = render(
        <WeekRow {...baseProps} isCurrent isDeload intensityThreshold={0.8} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
