import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SessionHeader } from './SessionHeader'

const baseProps = {
  title: 'Pull A · Intensification',
  status: 'ex 3/5 · set 2 live',
}

describe('SessionHeader', () => {
  it('renders the session title', () => {
    render(<SessionHeader {...baseProps} />)
    expect(screen.getByTestId('session-rail-title')).toHaveTextContent('Pull A · Intensification')
  })

  it('renders the mono status sub-line', () => {
    render(<SessionHeader {...baseProps} />)
    expect(screen.getByTestId('session-rail-status')).toHaveTextContent('ex 3/5 · set 2 live')
  })

  it('omits the status line when no status is given', () => {
    render(<SessionHeader title="Pull A" />)
    expect(screen.queryByTestId('session-rail-status')).not.toBeInTheDocument()
  })

  it('defaults the eyebrow to "Live session" with a live dot', () => {
    render(<SessionHeader {...baseProps} />)
    expect(screen.getByTestId('session-rail-eyebrow')).toHaveTextContent('Live session')
    expect(screen.getByTestId('status-dot')).toBeInTheDocument()
  })

  it('renders a custom eyebrow', () => {
    render(<SessionHeader {...baseProps} eyebrow="Session ended" />)
    expect(screen.getByTestId('session-rail-eyebrow')).toHaveTextContent('Session ended')
  })

  it('hides the live dot when live is false', () => {
    render(<SessionHeader {...baseProps} live={false} />)
    expect(screen.queryByTestId('status-dot')).not.toBeInTheDocument()
    expect(screen.getByTestId('session-rail-eyebrow')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SessionHeader {...baseProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
