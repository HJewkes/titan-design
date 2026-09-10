import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { StatusPill, statusPillColor, type StatusPillStatus } from './StatusPill'
import { resolveColor } from '../../../theme/resolve-color'

const cases: Array<{
  status: StatusPillStatus
  token: 'status-success' | 'status-warning' | 'status-error'
  label: string
}> = [
  { status: 'productive', token: 'status-success', label: 'Productive' },
  { status: 'threshold', token: 'status-warning', label: 'Threshold' },
  { status: 'stop', token: 'status-error', label: 'Stop' },
]

describe('StatusPill', () => {
  it('renders the pill container', () => {
    render(<StatusPill status="productive" />)
    expect(screen.getByTestId('status-pill')).toBeInTheDocument()
  })

  it('composes a status dot', () => {
    render(<StatusPill status="productive" />)
    expect(screen.getByTestId('status-dot')).toBeInTheDocument()
  })

  describe('per-status mapping', () => {
    cases.forEach(({ status, token, label }) => {
      it(`renders the default ${status} label`, () => {
        render(<StatusPill status={status} />)
        expect(screen.getByText(label)).toBeInTheDocument()
      })

      it(`resolves ${status} to the ${token} token`, () => {
        expect(statusPillColor(status)).toBe(resolveColor(token))
      })
    })
  })

  it('exposes the resolved color via statusPillColor', () => {
    expect(statusPillColor('stop')).toBe(resolveColor('status-error'))
  })

  it('renders a custom label override', () => {
    render(<StatusPill status="stop" label="Stop · velocity loss 31%" />)
    expect(screen.getByText('Stop · velocity loss 31%')).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<StatusPill status="threshold" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
