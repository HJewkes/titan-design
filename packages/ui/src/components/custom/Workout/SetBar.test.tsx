import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SetBar, velocityZoneColor, SET_STRIP_ZONES } from './SetBar'

describe('SetBar', () => {
  describe('velocityZoneColor', () => {
    it('maps velocity ratios to their zone pins', () => {
      expect(velocityZoneColor(0.4)).toBe(SET_STRIP_ZONES.slow)
      expect(velocityZoneColor(0.6)).toBe(SET_STRIP_ZONES.moderate)
      expect(velocityZoneColor(0.85)).toBe(SET_STRIP_ZONES.fast)
      expect(velocityZoneColor(1.2)).toBe(SET_STRIP_ZONES.fastest)
    })
  })

  it('done: one colored fill segment per rep, no empties, no pulse', () => {
    render(<SetBar set={{ status: 'done', velocities: [1, 0.8, 0.6, 0.4] }} />)
    expect(screen.getAllByTestId('set-strip-fill')).toHaveLength(4)
    expect(screen.queryByTestId('set-strip-empty')).not.toBeInTheDocument()
    expect(screen.queryByTestId('set-strip-pulse')).not.toBeInTheDocument()
  })

  it('active: performed reps pulse, the remainder is greyed', () => {
    render(<SetBar set={{ status: 'active', velocities: [0.9, 0.7, 0.5], planned: 8 }} />)
    expect(screen.getAllByTestId('set-strip-pulse')).toHaveLength(3)
    expect(screen.getAllByTestId('set-strip-empty')).toHaveLength(5)
  })

  it('todo: a single grey bar, no fills or pulses', () => {
    render(<SetBar set={{ status: 'todo', planned: 10 }} />)
    expect(screen.getAllByTestId('set-strip-empty')).toHaveLength(1)
    expect(screen.queryByTestId('set-strip-fill')).not.toBeInTheDocument()
    expect(screen.queryByTestId('set-strip-pulse')).not.toBeInTheDocument()
  })

  it('defaults to an 8px height and honors the height prop', () => {
    const { rerender } = render(<SetBar set={{ status: 'todo', planned: 3 }} />)
    expect(screen.getByTestId('set-strip-set')).toHaveStyle({ height: '8px' })
    rerender(<SetBar set={{ status: 'todo', planned: 3 }} height={4} />)
    expect(screen.getByTestId('set-strip-set')).toHaveStyle({ height: '4px' })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <SetBar set={{ status: 'active', velocities: [0.9, 0.7], planned: 4 }} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
