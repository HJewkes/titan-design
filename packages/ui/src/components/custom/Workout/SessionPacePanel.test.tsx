import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SessionPacePanel } from './SessionPacePanel'

describe('SessionPacePanel', () => {
  it('renders the behind-pace state by default', () => {
    render(<SessionPacePanel />)
    const panel = screen.getByTestId('session-pace-panel')
    expect(panel).toHaveTextContent('Session Pace')
    expect(panel).toHaveTextContent('Behind pace')
  })

  it('renders the ahead-pace state', () => {
    render(<SessionPacePanel state="ahead" />)
    const panel = screen.getByTestId('session-pace-panel')
    expect(panel).toHaveTextContent('Session Pace')
    expect(panel).toHaveTextContent('Ahead of pace')
  })

  it('renders the idle next-session-budget state', () => {
    render(<SessionPacePanel state="idle" />)
    const panel = screen.getByTestId('session-pace-panel')
    expect(panel).toHaveTextContent('Next session budget')
    expect(panel).not.toHaveTextContent('Session Pace')
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SessionPacePanel state="behind" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
