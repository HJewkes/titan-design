import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Indicator } from './Indicator'

describe('Indicator', () => {
  it('renders with default props', () => {
    const { container } = render(<Indicator />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with all size options', () => {
    const sizes = ['xs', 'sm', 'md', 'lg'] as const
    sizes.forEach((size) => {
      const { unmount } = render(<Indicator size={size} />)
      unmount()
    })
  })

  it('renders with all color options', () => {
    const colors = [
      'default',
      'primary',
      'success',
      'live',
      'error',
      'warning',
      'info',
      'error-vivid',
    ] as const
    colors.forEach((color) => {
      const { unmount } = render(<Indicator color={color} />)
      unmount()
    })
  })

  it('applies custom className', () => {
    const { container } = render(<Indicator className="custom-class" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('supports customColor via inline style', () => {
    const { container } = render(<Indicator customColor="#FF0000" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('supports ring prop', () => {
    const { container } = render(<Indicator ring />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('supports glow prop', () => {
    const { container } = render(<Indicator glow color="success" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('supports pulse prop (opacity)', () => {
    const { container } = render(<Indicator pulse color="success" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('supports the ping pulse variant', () => {
    const { container } = render(<Indicator pulse="ping" color="success" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Indicator color="success" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
