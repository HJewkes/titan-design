import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Divider } from './Divider'

describe('Divider', () => {
  it('renders correctly', () => {
    const { container } = render(<Divider />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('defaults to horizontal orientation', () => {
    const { container } = render(<Divider />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with vertical orientation', () => {
    const { container } = render(<Divider orientation="vertical" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with horizontal orientation', () => {
    const { container } = render(<Divider orientation="horizontal" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Divider className="my-4" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('passes additional props through', () => {
    const { container } = render(<Divider testID="divider" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('has accessibilityRole of none', () => {
    const { container } = render(<Divider />)
    expect(container.firstChild).toHaveAttribute('role', 'presentation')
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Divider />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations in vertical orientation', async () => {
      const { container } = render(<Divider orientation="vertical" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
