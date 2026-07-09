import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SetTableHeader } from './SetTableHeader'

describe('SetTableHeader', () => {
  it('renders the five column labels with the lbs weight column by default', () => {
    render(<SetTableHeader />)
    const header = screen.getByTestId('table-header')
    expect(header).toHaveTextContent('SET')
    expect(header).toHaveTextContent('PREV')
    expect(header).toHaveTextContent('REPS')
    expect(header).toHaveTextContent('LBS')
    expect(header).toHaveTextContent('RPE')
  })

  it('shows the KG weight column when unit is kg', () => {
    render(<SetTableHeader unit="kg" />)
    const header = screen.getByTestId('table-header')
    expect(header).toHaveTextContent('KG')
    expect(header).not.toHaveTextContent('LBS')
  })

  it('honors a custom testID so a host card can keep its own', () => {
    render(<SetTableHeader testID="exercise-card-column-headers" />)
    expect(screen.getByTestId('exercise-card-column-headers')).toBeInTheDocument()
    expect(screen.queryByTestId('table-header')).not.toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SetTableHeader />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
