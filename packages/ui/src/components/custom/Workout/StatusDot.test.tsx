import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { StatusDot } from './StatusDot'

describe('StatusDot', () => {
  it('renders a dot', () => {
    render(<StatusDot variant="success" />)
    expect(screen.getByTestId('status-dot')).toBeInTheDocument()
  })

  it('shows icon at md size', () => {
    render(<StatusDot variant="success" size="md" icon="check" />)
    expect(screen.getByText('\u2713')).toBeInTheDocument()
  })

  it('does not show icon at sm size', () => {
    render(<StatusDot variant="success" size="sm" icon="check" />)
    expect(screen.queryByText('\u2713')).not.toBeInTheDocument()
  })

  it('renders exclamation icon', () => {
    render(<StatusDot variant="warning" size="md" icon="exclamation" />)
    expect(screen.getByText('!')).toBeInTheDocument()
  })

  it('renders dash icon', () => {
    render(<StatusDot variant="error" size="md" icon="dash" />)
    expect(screen.getByText('\u2014')).toBeInTheDocument()
  })

  it('renders label text when provided', () => {
    render(<StatusDot variant="success" label="On track" />)
    expect(screen.getByText('On track')).toBeInTheDocument()
  })

  it('does not render label when omitted', () => {
    render(<StatusDot variant="success" />)
    expect(screen.queryByText('On track')).not.toBeInTheDocument()
  })

  it('defaults to sm size', () => {
    render(<StatusDot variant="neutral" />)
    expect(screen.getByTestId('status-dot')).toBeInTheDocument()
  })

  it('sets accessibility label with variant', () => {
    render(<StatusDot variant="warning" />)
    expect(screen.getByLabelText('warning status')).toBeInTheDocument()
  })

  describe('solid variants', () => {
    it('renders all solid variant types without error', () => {
      const { rerender } = render(<StatusDot variant="success" />)
      expect(screen.getByTestId('status-dot')).toBeInTheDocument()

      rerender(<StatusDot variant="warning" />)
      expect(screen.getByTestId('status-dot')).toBeInTheDocument()

      rerender(<StatusDot variant="error" />)
      expect(screen.getByTestId('status-dot')).toBeInTheDocument()

      rerender(<StatusDot variant="neutral" />)
      expect(screen.getByTestId('status-dot')).toBeInTheDocument()
    })
  })

  describe('ring variants', () => {
    it('renders on-track variant', () => {
      render(<StatusDot variant="on-track" />)
      expect(screen.getByTestId('status-dot')).toBeInTheDocument()
      expect(screen.getByLabelText('on-track status')).toBeInTheDocument()
    })

    it('renders deviation variant', () => {
      render(<StatusDot variant="deviation" />)
      expect(screen.getByTestId('status-dot')).toBeInTheDocument()
      expect(screen.getByLabelText('deviation status')).toBeInTheDocument()
    })

    it('renders future variant', () => {
      render(<StatusDot variant="future" />)
      expect(screen.getByTestId('status-dot')).toBeInTheDocument()
      expect(screen.getByLabelText('future status')).toBeInTheDocument()
    })

    it('renders the future variant with a 1px dashed border', () => {
      render(<StatusDot variant="future" />)
      const dot = screen.getByTestId('status-dot')
      expect(dot.style.borderTopStyle).toBe('dashed')
      expect(dot.style.borderTopWidth).toBe('1px')
    })
  })

  describe('md size', () => {
    it('renders at md size without error', () => {
      render(<StatusDot variant="success" size="md" />)
      expect(screen.getByTestId('status-dot')).toBeInTheDocument()
    })
  })

  describe('glow', () => {
    it('applies a box-shadow when glow is set on a solid variant', () => {
      render(<StatusDot variant="success" glow />)
      const dot = screen.getByTestId('status-dot')
      expect(dot.style.boxShadow).toContain('rgba(20,184,166,0.4)')
    })

    it('applies a box-shadow when glow is set on a ring variant', () => {
      render(<StatusDot variant="on-track" glow />)
      const dot = screen.getByTestId('status-dot')
      expect(dot.style.boxShadow).toContain('rgba(20,184,166,0.4)')
    })

    it('applies a gray box-shadow when glow is set on the future variant', () => {
      render(<StatusDot variant="future" glow />)
      const dot = screen.getByTestId('status-dot')
      expect(dot.style.boxShadow).toContain('rgba(107,114,128,0.4)')
    })

    it('does not apply a box-shadow when glow is not set', () => {
      render(<StatusDot variant="on-track" />)
      const dot = screen.getByTestId('status-dot')
      expect(dot.style.boxShadow).toBe('')
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <StatusDot variant="success" size="md" icon="check" label="On track" />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations for ring variants', async () => {
      const { container } = render(
        <StatusDot variant="on-track" size="md" icon="check" label="On track" />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations without label', async () => {
      const { container } = render(<StatusDot variant="warning" size="md" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations for all solid variants', async () => {
      for (const variant of ['success', 'warning', 'error', 'neutral'] as const) {
        const { container, unmount } = render(<StatusDot variant={variant} />)
        const results = await axe(container)
        expect(results).toHaveNoViolations()
        unmount()
      }
    })

    it('sets combined accessibility label when label prop is provided', () => {
      render(<StatusDot variant="success" label="On track" />)
      expect(screen.getByLabelText('success status: On track')).toBeInTheDocument()
    })
  })
})
