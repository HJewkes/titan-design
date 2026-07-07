import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { BrandLockup } from './BrandLockup'

describe('BrandLockup', () => {
  it('renders the wordmark', () => {
    render(<BrandLockup />)
    expect(screen.getByText('VOLTRAS')).toBeInTheDocument()
  })

  it('shows the subtitle by default and hides it when showSubtitle is false', () => {
    const { rerender } = render(<BrandLockup subtitle="wall dashboard" />)
    expect(screen.getByText('/ wall dashboard')).toBeInTheDocument()
    rerender(<BrandLockup subtitle="wall dashboard" showSubtitle={false} />)
    expect(screen.queryByText('/ wall dashboard')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<BrandLockup />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
