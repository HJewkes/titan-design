import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Avatar, AvatarBadge, AvatarGroup } from './Avatar'

describe('Avatar', () => {
  it('renders correctly with default props', () => {
    render(<Avatar />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('renders fallback text', () => {
    render(<Avatar fallback="JD" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('uses fallback as accessibility label when no alt provided', () => {
    render(<Avatar fallback="JD" />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'JD')
  })

  it('uses alt as accessibility label', () => {
    render(<Avatar alt="John Doe" fallback="JD" />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'John Doe')
  })

  it('uses default accessibility label when no alt or fallback', () => {
    render(<Avatar />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Avatar')
  })

  it('renders with image source', () => {
    render(<Avatar source={{ uri: 'https://example.com/avatar.jpg' }} alt="User" />)
    const imgs = screen.getAllByRole('img')
    expect(imgs.length).toBeGreaterThan(0)
  })

  it('renders with all size options', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const
    sizes.forEach((size) => {
      const { unmount } = render(<Avatar size={size} fallback="AB" />)
      expect(screen.getByRole('img')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders empty placeholder when no source or fallback', () => {
    const { container } = render(<Avatar />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Avatar className="extra" />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  describe('AvatarBadge', () => {
    it('renders with default success color', () => {
      const { container } = render(<AvatarBadge />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders with all color options', () => {
      const colors = ['success', 'error', 'warning', 'default'] as const
      colors.forEach((color) => {
        const { unmount } = render(<AvatarBadge color={color} />)
        unmount()
      })
    })

    it('accepts custom className', () => {
      const { container } = render(<AvatarBadge className="extra" />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('AvatarGroup', () => {
    it('renders children avatars', () => {
      render(
        <AvatarGroup>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      )
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
    })

    it('limits visible avatars with max prop', () => {
      render(
        <AvatarGroup max={2}>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
          <Avatar fallback="C" />
          <Avatar fallback="D" />
        </AvatarGroup>
      )
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
      expect(screen.getByText('+2')).toBeInTheDocument()
    })

    it('shows no +N indicator when all avatars fit', () => {
      render(
        <AvatarGroup max={5}>
          <Avatar fallback="A" />
          <Avatar fallback="B" />
        </AvatarGroup>
      )
      expect(screen.queryByText(/\+/)).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <AvatarGroup className="extra">
          <Avatar fallback="A" />
        </AvatarGroup>
      )
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Avatar fallback="JD" alt="John Doe" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has correct image role', () => {
      render(<Avatar fallback="JD" />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })
})
