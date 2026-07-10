import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ExpandedDrawer } from './ExpandedDrawer'
import type { SetRowProps } from './SetRow'

const sets: SetRowProps[] = [
  { mode: 'completed', setNumber: 1, reps: 8, weight: 135, unit: 'lbs' },
  { mode: 'completed', setNumber: 2, reps: 8, weight: 135, unit: 'lbs' },
  { mode: 'active', setNumber: 3, reps: null, weight: null, unit: 'lbs', isNextSet: true },
]

const baseProps = { name: 'Bench Press', sets }

describe('ExpandedDrawer', () => {
  it('renders the exercise name', () => {
    render(<ExpandedDrawer {...baseProps} />)
    expect(screen.getByTestId('expanded-drawer-name')).toHaveTextContent('Bench Press')
  })

  it('renders the column header row', () => {
    render(<ExpandedDrawer {...baseProps} />)
    const header = screen.getByTestId('table-header')
    expect(header).toHaveTextContent('SET')
    expect(header).toHaveTextContent('RPE')
  })

  it('reflects the unit in the header weight column', () => {
    render(<ExpandedDrawer {...baseProps} unit="kg" />)
    expect(screen.getByTestId('table-header')).toHaveTextContent('KG')
  })

  it('renders one SetRow per set', () => {
    render(<ExpandedDrawer {...baseProps} />)
    expect(screen.getAllByTestId('set-row')).toHaveLength(3)
  })

  it('renders no rows for an empty set list', () => {
    render(<ExpandedDrawer name="Bench Press" sets={[]} />)
    expect(screen.queryByTestId('set-row')).not.toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ExpandedDrawer {...baseProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
