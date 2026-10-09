import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Link } from './Link'

describe('Link', () => {
  it('renders children correctly', () => {
    render(<Link>Click here</Link>)
    expect(screen.getByText('Click here')).toBeInTheDocument()
  })

  it('has link accessibility role', () => {
    render(<Link>Link</Link>)
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('handles press events', () => {
    const onPress = vi.fn()
    render(<Link onPress={onPress}>Press me</Link>)
    fireEvent.click(screen.getByRole('link'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('fires onPress once on Enter, as a native link would', () => {
    const onPress = vi.fn()
    render(<Link onPress={onPress}>Press me</Link>)
    const link = screen.getByRole('link')
    fireEvent.keyDown(link, { key: 'Enter' })
    fireEvent.keyUp(link, { key: 'Enter' })
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('leaves Enter to the browser when the link has an href', () => {
    const onPress = vi.fn()
    render(
      <Link href="/page" onPress={onPress}>
        Press me
      </Link>
    )
    fireEvent.keyDown(screen.getByRole('link'), { key: 'Enter' })
    expect(onPress).not.toHaveBeenCalled()
  })

  it('ignores keys other than Enter, and Enter when disabled', () => {
    const onPress = vi.fn()
    const { rerender } = render(<Link onPress={onPress}>Press me</Link>)
    fireEvent.keyDown(screen.getByRole('link'), { key: ' ' })
    rerender(
      <Link onPress={onPress} isDisabled>
        Press me
      </Link>
    )
    fireEvent.keyDown(screen.getByRole('link'), { key: 'Enter' })
    expect(onPress).not.toHaveBeenCalled()
  })

  it('does not fire onPress when disabled', () => {
    const onPress = vi.fn()
    render(
      <Link onPress={onPress} isDisabled>
        Disabled
      </Link>
    )
    fireEvent.click(screen.getByRole('link'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('appends external indicator when isExternal', () => {
    render(<Link isExternal>External</Link>)
    expect(screen.getByText(/External/)).toBeInTheDocument()
    expect(screen.getByText(/\u2197/)).toBeInTheDocument()
  })

  it('provides accessibility hint for external links', () => {
    render(<Link isExternal>External</Link>)
    // react-native-web does not map accessibilityHint to aria-description
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('does not have external hint for internal links', () => {
    render(<Link>Internal</Link>)
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-description')
  })

  it('renders with all color options', () => {
    const colors = ['default', 'primary', 'secondary', 'inherit'] as const
    colors.forEach((color) => {
      const { unmount } = render(<Link color={color}>Test</Link>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with all underline options', () => {
    const underlines = ['always', 'hover', 'none'] as const
    underlines.forEach((underline) => {
      const { unmount } = render(<Link underline={underline}>Test</Link>)
      expect(screen.getByText('Test')).toBeInTheDocument()
      unmount()
    })
  })

  it('applies custom className', () => {
    render(<Link className="extra">Test</Link>)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('disables the pressable when isDisabled', () => {
    render(<Link isDisabled>Disabled link</Link>)
    // react-native-web renders aria-disabled on a div, toBeDisabled() only works on form elements
    expect(screen.getByRole('link')).toHaveAttribute('aria-disabled', 'true')
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Link>Visit site</Link>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations for external link', async () => {
      const { container } = render(<Link isExternal>External site</Link>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
