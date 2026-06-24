import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { PrBadge } from './PrBadge'

describe('PrBadge', () => {
  it('renders star and default PR label', () => {
    render(<PrBadge animate={false} />)
    expect(screen.getByText(/\u2605 PR e1RM/)).toBeInTheDocument()
  })

  it('renders with animation wrapper when animate is true', () => {
    render(<PrBadge animate />)
    expect(screen.getByTestId('pr-badge-animated')).toBeInTheDocument()
  })

  it('renders without animation wrapper when animate is false', () => {
    render(<PrBadge animate={false} />)
    expect(screen.queryByTestId('pr-badge-animated')).not.toBeInTheDocument()
  })

  it('defaults to animated', () => {
    render(<PrBadge />)
    expect(screen.getByTestId('pr-badge-animated')).toBeInTheDocument()
  })

  it('sets accessibility label with resolved label', () => {
    render(<PrBadge animate={false} />)
    expect(
      screen.getByLabelText('Personal record: PR e1RM'),
    ).toBeInTheDocument()
  })

  describe('type prop', () => {
    it('generates label from e1rm type', () => {
      render(<PrBadge type="e1rm" animate={false} />)
      expect(screen.getByText(/PR e1RM/)).toBeInTheDocument()
    })

    it('generates label from weight type', () => {
      render(<PrBadge type="weight" animate={false} />)
      expect(screen.getByText(/PR Weight/)).toBeInTheDocument()
    })

    it('generates label from reps type', () => {
      render(<PrBadge type="reps" animate={false} />)
      expect(screen.getByText(/PR Reps/)).toBeInTheDocument()
    })

    it('generates label from volume type', () => {
      render(<PrBadge type="volume" animate={false} />)
      expect(screen.getByText(/PR Volume/)).toBeInTheDocument()
    })

    it('generates label from velocity type', () => {
      render(<PrBadge type="velocity" animate={false} />)
      expect(screen.getByText(/PR Velocity/)).toBeInTheDocument()
    })
  })

  describe('custom label', () => {
    it('uses custom label over auto-generated', () => {
      render(<PrBadge label="PR 5RM" animate={false} />)
      expect(screen.getByText(/PR 5RM/)).toBeInTheDocument()
    })

    it('sets accessibility label with custom label', () => {
      render(<PrBadge label="PR 5RM" animate={false} />)
      expect(
        screen.getByLabelText('Personal record: PR 5RM'),
      ).toBeInTheDocument()
    })
  })

  describe('compact mode', () => {
    it('renders only star icon when compact', () => {
      render(<PrBadge compact animate={false} />)
      const star = screen.getByTestId('pr-badge-star')
      expect(star).toHaveTextContent('\u2605')
    })

    it('does not show label text in compact mode', () => {
      render(<PrBadge compact animate={false} />)
      expect(screen.queryByText(/PR e1RM/)).not.toBeInTheDocument()
    })

    it('has correct accessibility label in compact mode', () => {
      render(<PrBadge compact animate={false} />)
      expect(
        screen.getByLabelText('Personal record: PR e1RM'),
      ).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<PrBadge animate={false} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations in compact mode', async () => {
      const { container } = render(<PrBadge compact animate={false} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
