import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import { CircularTimer } from './CircularTimer'

describe('CircularTimer', () => {
  it('renders a timer with a composed progressbar ring', () => {
    render(<CircularTimer durationMs={120000} elapsedMs={30000} />)
    expect(screen.getByTestId('circular-timer')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows the mm:ss remaining in the center while counting down', () => {
    render(<CircularTimer durationMs={120000} elapsedMs={60000} />)
    expect(screen.getByTestId('circular-timer-label')).toHaveTextContent('1:00')
  })

  it('shows the elapsed mm:ss in up mode', () => {
    render(<CircularTimer mode="up" durationMs={120000} elapsedMs={45000} />)
    expect(screen.getByTestId('circular-timer-label')).toHaveTextContent('0:45')
  })

  it('renders the done label (not a time) when a countdown completes', () => {
    render(<CircularTimer durationMs={120000} elapsedMs={120000} doneLabel="GO" />)
    expect(screen.getByTestId('circular-timer-label')).toHaveTextContent('GO')
  })

  it('keeps showing 0:00 at completion when no doneLabel is given', () => {
    render(<CircularTimer durationMs={120000} elapsedMs={120000} />)
    expect(screen.getByTestId('circular-timer-label')).toHaveTextContent('0:00')
  })

  it('renders optional controls below the ring', () => {
    render(<CircularTimer durationMs={120000} elapsedMs={0} controls={<Text>+30s</Text>} />)
    expect(screen.getByText('+30s')).toBeInTheDocument()
  })

  it('defaults its accessibility label to seconds remaining', () => {
    render(<CircularTimer durationMs={120000} elapsedMs={60000} />)
    expect(screen.getAllByLabelText('60 seconds remaining').length).toBeGreaterThan(0)
  })

  it('uses a supplied accessibility label', () => {
    render(
      <CircularTimer durationMs={120000} elapsedMs={60000} accessibilityLabel="Rest, 60s left" />
    )
    expect(screen.getAllByLabelText('Rest, 60s left').length).toBeGreaterThan(0)
  })

  it('emits no NaN when durationMs is 0 (guard)', () => {
    const { container } = render(<CircularTimer durationMs={0} elapsedMs={0} />)
    expect(container.innerHTML).not.toContain('NaN')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <CircularTimer durationMs={120000} elapsedMs={30000} accessibilityLabel="Rest countdown" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
