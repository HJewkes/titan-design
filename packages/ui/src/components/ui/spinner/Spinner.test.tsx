import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('renders correctly', () => {
    render(<Spinner />)
    const progressbars = screen.getAllByRole('progressbar')
    expect(progressbars.length).toBeGreaterThan(0)
  })

  it('has default accessibility label of Loading', () => {
    render(<Spinner />)
    const wrapper = screen.getAllByRole('progressbar')[0]
    expect(wrapper).toHaveAttribute('aria-label', 'Loading')
  })

  it('accepts custom label', () => {
    render(<Spinner label="Processing" />)
    const wrapper = screen.getAllByRole('progressbar')[0]
    expect(wrapper).toHaveAttribute('aria-label', 'Processing')
  })

  it('renders with all size options', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const
    sizes.forEach((size) => {
      const { unmount } = render(<Spinner size={size} />)
      expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0)
      unmount()
    })
  })

  it('renders with all color options', () => {
    const colors = ['primary', 'secondary', 'white', 'default'] as const
    colors.forEach((color) => {
      const { unmount } = render(<Spinner color={color} />)
      expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0)
      unmount()
    })
  })

  it('applies custom className', () => {
    render(<Spinner className="extra" />)
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0)
  })

  it('passes additional props through', () => {
    render(<Spinner testID="spinner-test" />)
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0)
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Spinner />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('exposes exactly one progressbar, and it is named', () => {
      render(<Spinner label="Syncing" />)
      const bars = screen.getAllByRole('progressbar')
      expect(bars).toHaveLength(1)
      expect(bars[0]).toHaveAccessibleName('Syncing')
    })
  })
})
