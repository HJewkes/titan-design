import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ReadinessCheck, type ReadinessFactor } from './ReadinessCheck'

function makeFactors(overrides: Partial<Record<string, number>> = {}): ReadinessFactor[] {
  return [
    { id: 'sleep', label: 'Sleep', value: overrides.sleep ?? 4, onChange: vi.fn() },
    { id: 'soreness', label: 'Soreness', value: overrides.soreness ?? 3, onChange: vi.fn() },
    { id: 'motivation', label: 'Motivation', value: overrides.motivation ?? 5, onChange: vi.fn() },
    { id: 'stress', label: 'Stress', value: overrides.stress ?? 3, onChange: vi.fn() },
  ]
}

const baseProps = {
  score: 78,
  warmUpCompleted: false,
  onConfirm: vi.fn(),
}

describe('ReadinessCheck', () => {
  describe('rendering', () => {
    it('renders the title and one row per factor', () => {
      render(<ReadinessCheck {...baseProps} factors={makeFactors()} />)
      expect(screen.getByTestId('readiness-check-title')).toHaveTextContent(
        'How are you feeling?',
      )
      expect(screen.getByTestId('readiness-check-factor-sleep')).toBeInTheDocument()
      expect(screen.getByTestId('readiness-check-factor-stress')).toBeInTheDocument()
    })

    it('renders five emoji options per factor', () => {
      render(<ReadinessCheck {...baseProps} factors={makeFactors()} />)
      // 4 factors x 5 options
      expect(screen.getAllByTestId('readiness-check-emoji')).toHaveLength(20)
    })

    it('shows the score in the gauge', () => {
      render(<ReadinessCheck {...baseProps} factors={makeFactors()} score={64} />)
      expect(screen.getByTestId('readiness-check-score-value')).toHaveTextContent('64')
    })
  })

  describe('interaction', () => {
    it('calls the factor onChange with the tapped 1-5 level', () => {
      const factors = makeFactors()
      render(<ReadinessCheck {...baseProps} factors={factors} />)
      const sleepOptions = screen
        .getByTestId('readiness-check-factor-sleep')
        .querySelectorAll('[data-testid="readiness-check-emoji"]')
      fireEvent.click(sleepOptions[0])
      expect(factors[0].onChange).toHaveBeenCalledWith(1)
      fireEvent.click(sleepOptions[4])
      expect(factors[0].onChange).toHaveBeenCalledWith(5)
    })

    it('marks the selected level as checked', () => {
      render(<ReadinessCheck {...baseProps} factors={makeFactors({ sleep: 2 })} />)
      const sleepOptions = screen
        .getByTestId('readiness-check-factor-sleep')
        .querySelectorAll('[data-testid="readiness-check-emoji"]')
      expect(sleepOptions[1]).toHaveAttribute('aria-checked', 'true')
      expect(sleepOptions[0]).toHaveAttribute('aria-checked', 'false')
    })

    it('fires onConfirm when the start button is pressed', () => {
      const onConfirm = vi.fn()
      render(<ReadinessCheck {...baseProps} factors={makeFactors()} onConfirm={onConfirm} />)
      fireEvent.click(screen.getByTestId('readiness-check-confirm'))
      expect(onConfirm).toHaveBeenCalledOnce()
    })
  })

  describe('warm-up validation', () => {
    it('does not render the warm-up card until completed', () => {
      render(
        <ReadinessCheck
          {...baseProps}
          factors={makeFactors()}
          warmUpValidation={{ velocityDeficit: 5, recommendation: 'OK', status: 'good' }}
        />,
      )
      expect(screen.queryByTestId('readiness-check-warmup')).not.toBeInTheDocument()
    })

    it('renders deficit, recommendation, and status badge once completed', () => {
      render(
        <ReadinessCheck
          {...baseProps}
          factors={makeFactors()}
          warmUpCompleted
          warmUpValidation={{
            velocityDeficit: 18,
            recommendation: 'Reduce load today.',
            status: 'caution',
          }}
        />,
      )
      expect(screen.getByTestId('readiness-check-warmup-deficit')).toHaveTextContent(
        '18% below 14-day average',
      )
      expect(screen.getByTestId('readiness-check-warmup-recommendation')).toHaveTextContent(
        'Reduce load today.',
      )
      expect(screen.getByTestId('readiness-check-warmup-badge')).toHaveTextContent('Caution')
    })

    it('phrases a zero deficit as on-average rather than "below"', () => {
      render(
        <ReadinessCheck
          {...baseProps}
          factors={makeFactors()}
          warmUpCompleted
          warmUpValidation={{ velocityDeficit: 0, recommendation: 'Proceed.', status: 'good' }}
        />,
      )
      expect(screen.getByTestId('readiness-check-warmup-deficit')).toHaveTextContent(
        'Velocity on 14-day average',
      )
    })

    it('phrases a negative deficit as above average', () => {
      render(
        <ReadinessCheck
          {...baseProps}
          factors={makeFactors()}
          warmUpCompleted
          warmUpValidation={{ velocityDeficit: -6, recommendation: 'Proceed.', status: 'good' }}
        />,
      )
      expect(screen.getByTestId('readiness-check-warmup-deficit')).toHaveTextContent(
        'Velocity 6% above 14-day average',
      )
    })
  })

  describe('accessibility', () => {
    it('labels each emoji as a radio with level and factor', () => {
      render(<ReadinessCheck {...baseProps} factors={makeFactors()} />)
      const radio = screen.getByLabelText('Sleep level 3 of 5')
      expect(radio).toHaveAttribute('role', 'radio')
    })

    it('groups each factor as a radiogroup', () => {
      render(<ReadinessCheck {...baseProps} factors={makeFactors()} />)
      const groups = screen.getAllByRole('radiogroup')
      expect(groups).toHaveLength(4)
    })

    it('exposes the readiness score on the gauge', () => {
      render(<ReadinessCheck {...baseProps} factors={makeFactors()} score={78} />)
      expect(
        screen.getByLabelText('Readiness score: 78 out of 100'),
      ).toBeInTheDocument()
    })

    it('has no accessibility violations', async () => {
      const { container } = render(
        <ReadinessCheck {...baseProps} factors={makeFactors()} />,
      )
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations with warm-up and all features', async () => {
      const { container } = render(
        <ReadinessCheck
          factors={makeFactors()}
          score={88}
          warmUpCompleted
          warmUpValidation={{
            velocityDeficit: 6,
            recommendation: 'Warm up thoroughly.',
            status: 'moderate',
          }}
          onConfirm={vi.fn()}
        />,
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
