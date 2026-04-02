import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StatusPill, StatusPillContent } from './StatusPill'

describe('StatusPill', () => {
  it('renders label and detail text', () => {
    render(<StatusPill progress={65} label="Processing" detail="142/220" />)
    expect(screen.getByText('Processing')).toBeInTheDocument()
    expect(screen.getByText('142/220')).toBeInTheDocument()
  })

  it('applies active status styling', () => {
    const { container } = render(
      <StatusPill progress={50} label="Working" status="active" />
    )
    expect(screen.getByText('Working')).toBeInTheDocument()
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThanOrEqual(1)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('applies success status styling', () => {
    const { container } = render(
      <StatusPill progress={100} label="Done" status="success" />
    )
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders children in dropdown on hover', () => {
    render(
      <StatusPill progress={100} label="Complete" status="success">
        <StatusPillContent>
          <div>Dropdown details</div>
        </StatusPillContent>
      </StatusPill>
    )

    expect(screen.queryByText('Dropdown details')).not.toBeInTheDocument()

    const trigger = screen.getByRole('button')
    fireEvent.mouseEnter(trigger)

    expect(screen.getByText('Dropdown details')).toBeInTheDocument()
  })

  it('shows spinner when active', () => {
    render(<StatusPill progress={50} label="Working" status="active" />)
    expect(screen.getByLabelText('Active')).toBeInTheDocument()
  })
})
