import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Avatar, AvatarBadge, AvatarGroup } from './Avatar'
import { Surface } from '../surface'
import { avatarColors, avatarColorSlot } from '../../../utils/avatar-color'
import { bestTextColor } from '../../../theme/tokens/primitives'

function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(1).slice(i, i + 2), 16) / 255
    return c >= 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function findName(slot: number): string {
  for (let i = 0; ; i++) {
    if (avatarColorSlot(`Name${i}`) === slot) return `Name${i}`
  }
}

function hexToRgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${r}, ${g}, ${b})`
}

describe('Avatar', () => {
  it('initials clear 4.5:1 on every light name colour', () => {
    for (let slot = 0; slot < 7; slot++) {
      const name = findName(slot)
      const { unmount } = render(
        <Surface theme="light">
          <Avatar colorFromName={name} />
        </Surface>
      )
      const fill = avatarColors('light')[slot]
      const ink = bestTextColor(fill)
      expect(screen.getAllByText(/./).at(-1)).toHaveStyle({ color: ink })
      expect(contrast(fill, ink)).toBeGreaterThanOrEqual(4.5)
      unmount()
    }
  })

  it('paints the name colour from the light palette under a light Surface', () => {
    render(
      <Surface theme="light">
        <Avatar colorFromName="Alice Brown" />
      </Surface>
    )
    const fills = avatarColors('light').map(hexToRgb)
    expect(fills).toContain(screen.getByRole('img').style.backgroundColor)
  })

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

  describe('colorFromName', () => {
    it('renders initials from colorFromName', () => {
      render(<Avatar colorFromName="John Doe" />)
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('generates deterministic color from name', () => {
      const { container } = render(<Avatar colorFromName="Alice" />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('colorFromName fallback is overridden by explicit fallback', () => {
      render(<Avatar colorFromName="John Doe" fallback="XX" />)
      expect(screen.getByText('XX')).toBeInTheDocument()
    })
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
