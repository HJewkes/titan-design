import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SetRow } from './SetRow'

const baseProps = {
  mode: 'completed' as const,
  setNumber: 1,
  reps: 8,
  weight: 135,
  unit: 'lbs' as const,
}

describe('SetRow', () => {
  describe('completed mode', () => {
    it('renders set number, reps, weight', () => {
      render(<SetRow {...baseProps} />)
      expect(screen.getByTestId('set-row')).toBeInTheDocument()
      expect(screen.getByTestId('set-row-set-number')).toHaveTextContent('1')
      expect(screen.getByTestId('set-row-reps')).toHaveTextContent('8')
      expect(screen.getByTestId('set-row-weight')).toHaveTextContent('135')
    })

    it('displays previous data when provided', () => {
      render(<SetRow {...baseProps} previous={{ reps: 6, weight: 130 }} />)
      expect(screen.getByTestId('set-row-previous')).toHaveTextContent(
        '6 x 130',
      )
    })

    it('displays dash when no previous data', () => {
      render(<SetRow {...baseProps} />)
      expect(screen.getByTestId('set-row-previous')).toHaveTextContent('\u2014')
    })

    it('applies reduced opacity for non-next completed sets', () => {
      render(<SetRow {...baseProps} />)
      const row = screen.getByTestId('set-row')
      expect(row).toHaveStyle({ opacity: 0.55 })
    })
  })

  describe('active mode', () => {
    it('renders target values when reps/weight are null', () => {
      render(
        <SetRow
          mode="active"
          setNumber={2}
          reps={null}
          weight={null}
          unit="lbs"
          targets={{ reps: 10, weight: 150 }}
        />,
      )
      expect(screen.getByTestId('set-row-target-reps')).toHaveTextContent('10')
      expect(screen.getByTestId('set-row-target-weight')).toHaveTextContent(
        '150',
      )
    })

    it('renders dashes when no targets and values are null', () => {
      render(
        <SetRow mode="active" setNumber={2} reps={null} weight={null} unit="lbs" />,
      )
      expect(screen.getByTestId('set-row-reps')).toHaveTextContent('\u2014')
      expect(screen.getByTestId('set-row-weight')).toHaveTextContent('\u2014')
    })
  })

  describe('isNextSet highlighting', () => {
    it('applies highlight styles for active isNextSet', () => {
      render(
        <SetRow
          mode="active"
          setNumber={1}
          reps={null}
          weight={null}
          unit="lbs"
          isNextSet
        />,
      )
      const row = screen.getByTestId('set-row')
      const style = row.getAttribute('style') ?? ''
      expect(style).toContain('background-color')
      expect(style).toContain('border')
    })

    it('does not apply highlight for non-next active sets', () => {
      render(
        <SetRow mode="active" setNumber={1} reps={null} weight={null} unit="lbs" />,
      )
      const row = screen.getByTestId('set-row')
      expect(row).not.toHaveStyle({
        backgroundColor: 'rgba(255,121,0,0.06)',
      })
    })
  })

  describe('history mode', () => {
    it('renders like completed mode', () => {
      render(
        <SetRow mode="history" setNumber={3} reps={5} weight={200} unit="kg" />,
      )
      expect(screen.getByTestId('set-row-reps')).toHaveTextContent('5')
      expect(screen.getByTestId('set-row-weight')).toHaveTextContent('200')
    })
  })

  describe('velocity strip', () => {
    it('renders velocity strip when velocities provided', () => {
      render(
        <SetRow {...baseProps} velocities={[1.1, 0.95, 0.82]} />,
      )
      expect(screen.getByTestId('set-row-velocity-strip')).toBeInTheDocument()
    })

    it('does not render velocity strip when no velocities', () => {
      render(<SetRow {...baseProps} />)
      expect(
        screen.queryByTestId('set-row-velocity-strip'),
      ).not.toBeInTheDocument()
    })

    it('passes onVelocityToggle to velocity strip', () => {
      const onToggle = vi.fn()
      render(
        <SetRow
          {...baseProps}
          velocities={[1.1, 0.95]}
          onVelocityToggle={onToggle}
        />,
      )
      const pressable = screen.getByTestId('velocity-strip-pressable')
      fireEvent.click(pressable)
      expect(onToggle).toHaveBeenCalledOnce()
    })
  })

  describe('set type badge', () => {
    it('renders set type badge instead of set number', () => {
      render(<SetRow {...baseProps} setType="W" />)
      expect(screen.getByTestId('set-row-type-badge')).toHaveTextContent('W')
    })

    it('does not render type badge when setType is not provided', () => {
      render(<SetRow {...baseProps} />)
      expect(
        screen.queryByTestId('set-row-type-badge'),
      ).not.toBeInTheDocument()
    })
  })

  describe('PR badges', () => {
    it('renders PR badges when provided', () => {
      render(
        <SetRow
          {...baseProps}
          prBadges={[{ type: 'e1rm', label: 'PR e1RM' }]}
        />,
      )
      expect(screen.getByTestId('set-row-pr-badges')).toBeInTheDocument()
    })

    it('does not render PR badges container when no badges', () => {
      render(<SetRow {...baseProps} />)
      expect(
        screen.queryByTestId('set-row-pr-badges'),
      ).not.toBeInTheDocument()
    })
  })

  describe('RPE', () => {
    it('displays RPE value with color coding', () => {
      render(<SetRow {...baseProps} rpe={9.5} />)
      expect(screen.getByTestId('set-row-rpe')).toHaveTextContent('9.5')
    })

    it('displays dash when RPE is null', () => {
      render(<SetRow {...baseProps} rpe={null} />)
      expect(screen.getByTestId('set-row-rpe')).toHaveTextContent('\u2014')
    })
  })

  describe('accessibility', () => {
    it('has correct accessibility label', () => {
      render(<SetRow {...baseProps} />)
      expect(
        screen.getByLabelText('Set 1: 8 reps at 135 lbs'),
      ).toBeInTheDocument()
    })

    it('has correct accessibility label with null values', () => {
      render(
        <SetRow mode="active" setNumber={2} reps={null} weight={null} unit="kg" />,
      )
      expect(
        screen.getByLabelText('Set 2: no reps'),
      ).toBeInTheDocument()
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<SetRow {...baseProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations with all features', async () => {
      const { container } = render(
        <SetRow
          {...baseProps}
          rpe={8}
          velocities={[1.1, 0.95]}
          setType="W"
          prBadges={[{ type: 'e1rm', label: 'PR e1RM' }]}
          previous={{ reps: 6, weight: 130 }}
        />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
