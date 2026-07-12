import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { StatusPill, statusPillColor, type StatusPillStatus } from './StatusPill'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'

const t = getSemanticColors('dark')

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
      it(`maps ${status} to the ${token} color and default label`, () => {
        render(<StatusPill status={status} />)
        const text = screen.getByTestId('status-pill-label')
        expect(text).toHaveTextContent(label)
        expect(text).toHaveStyle({ color: t[token] })
      })

      it(`tints the ${status} capsule from the ${token} token`, () => {
        render(<StatusPill status={status} />)
        expect(screen.getByTestId('status-pill')).toHaveStyle({
          backgroundColor: alpha(t[token], 0.14),
          borderTopColor: alpha(t[token], 0.4),
        })
      })
    })
  })

  it('exposes the resolved color via statusPillColor', () => {
    expect(statusPillColor('stop')).toBe(t['status-error'])
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
