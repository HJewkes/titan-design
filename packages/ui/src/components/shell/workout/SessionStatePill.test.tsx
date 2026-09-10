import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SessionStatePill } from './SessionStatePill'

describe('SessionStatePill', () => {
  it('labels each state', () => {
    const { rerender } = render(<SessionStatePill state="live" />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
    rerender(<SessionStatePill state="rest" />)
    expect(screen.getByText('REST')).toBeInTheDocument()
    rerender(<SessionStatePill state="idle" />)
    expect(screen.getByText('IDLE')).toBeInTheDocument()
  })

  it('supports a custom label', () => {
    render(<SessionStatePill state="live" label="SET LIVE" />)
    expect(screen.getByText('SET LIVE')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<SessionStatePill state="live" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
