import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { IconBox } from './IconBox'

function MockIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <span data-testid="icon" data-size={size} className={className}>
      icon
    </span>
  )
}

describe('IconBox', () => {
  it('renders the icon component', () => {
    render(<IconBox icon={MockIcon} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('passes correct default size to icon (md = 20)', () => {
    render(<IconBox icon={MockIcon} />)
    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', '20')
  })

  it('passes correct size to icon for sm variant', () => {
    render(<IconBox icon={MockIcon} size="sm" />)
    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', '16')
  })

  it('passes correct size to icon for lg variant', () => {
    render(<IconBox icon={MockIcon} size="lg" />)
    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', '24')
  })

  it('renders with size sm without crashing', () => {
    const { container } = render(<IconBox icon={MockIcon} size="sm" />)
    expect(container.firstChild).toBeTruthy()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders with size md by default without crashing', () => {
    const { container } = render(<IconBox icon={MockIcon} />)
    expect(container.firstChild).toBeTruthy()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders with size lg without crashing', () => {
    const { container } = render(<IconBox icon={MockIcon} size="lg" />)
    expect(container.firstChild).toBeTruthy()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders with color primary without crashing', () => {
    const { container } = render(<IconBox icon={MockIcon} color="primary" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with neutral color by default', () => {
    const { container } = render(<IconBox icon={MockIcon} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with className prop without crashing', () => {
    const { container } = render(<IconBox icon={MockIcon} className="mt-4" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('passes through testID prop', () => {
    render(<IconBox icon={MockIcon} testID="my-icon-box" />)
    expect(screen.getByTestId('my-icon-box')).toBeInTheDocument()
  })

  it('supports all color variants without errors', () => {
    const colors = [
      'primary',
      'secondary',
      'success',
      'error',
      'warning',
      'info',
      'neutral',
    ] as const
    for (const color of colors) {
      const { unmount } = render(<IconBox icon={MockIcon} color={color} />)
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      unmount()
    }
  })

  it('supports all size variants without errors', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    for (const size of sizes) {
      const { unmount } = render(<IconBox icon={MockIcon} size={size} />)
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      unmount()
    }
  })

  it('renders with all props combined', () => {
    render(
      <IconBox icon={MockIcon} color="success" size="lg" className="mt-2" testID="full-icon-box" />
    )
    expect(screen.getByTestId('full-icon-box')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', '24')
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<IconBox icon={MockIcon} color="primary" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
