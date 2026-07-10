import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SetsRepsLoad } from './SetsRepsLoad'

describe('SetsRepsLoad', () => {
  it('renders the sets, reps and load values', () => {
    render(<SetsRepsLoad sets={5} reps={8} load={145} />)
    const line = screen.getByTestId('sets-reps-load')
    expect(line).toHaveTextContent('5')
    expect(line).toHaveTextContent('8')
    expect(line).toHaveTextContent('145')
  })

  it('renders the × and @ separators', () => {
    render(<SetsRepsLoad sets={3} reps={10} load={90} />)
    const line = screen.getByTestId('sets-reps-load')
    expect(line).toHaveTextContent('×')
    expect(line).toHaveTextContent('@')
  })

  it('defaults the unit label to lb', () => {
    render(<SetsRepsLoad sets={3} reps={10} load={90} />)
    expect(screen.getByTestId('sets-reps-load')).toHaveTextContent('lb')
  })

  it('accepts a custom unit label', () => {
    render(<SetsRepsLoad sets={3} reps={10} load={40} unit="kg" />)
    expect(screen.getByTestId('sets-reps-load')).toHaveTextContent('kg')
  })

  it('supports rep ranges', () => {
    render(<SetsRepsLoad sets={3} reps="15-20" load={40} />)
    expect(screen.getByTestId('sets-reps-load')).toHaveTextContent('15-20')
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SetsRepsLoad sets={5} reps={8} load={145} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
