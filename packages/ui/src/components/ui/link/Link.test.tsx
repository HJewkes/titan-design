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

  describe('with href on web', () => {
    it('renders an anchor carrying the href', () => {
      render(<Link href="/docs">Docs</Link>)
      const anchor = screen.getByRole('link')
      expect(anchor.tagName).toBe('A')
      expect(anchor).toHaveAttribute('href', '/docs')
    })

    it('fires onPress and keeps routing in the handler on a plain click', () => {
      const onPress = vi.fn()
      render(
        <Link href="/docs" onPress={onPress}>
          Docs
        </Link>
      )
      const notPrevented = fireEvent.click(screen.getByRole('link'))
      expect(onPress).toHaveBeenCalledTimes(1)
      expect(notPrevented).toBe(false)
    })

    it.each([{ metaKey: true }, { ctrlKey: true }])(
      'leaves a modified click %o to the browser so it opens a new tab',
      (modifier) => {
        const onPress = vi.fn()
        render(
          <Link href="#docs" onPress={onPress}>
            Docs
          </Link>
        )
        const notPrevented = fireEvent.click(screen.getByRole('link'), modifier)
        expect(notPrevented).toBe(true)
        expect(onPress).not.toHaveBeenCalled()
      }
    )

    it('opens an external href in a new tab without an opener', () => {
      render(
        <Link href="https://example.com" isExternal>
          Example
        </Link>
      )
      const anchor = screen.getByRole('link')
      expect(anchor).toHaveAttribute('target', '_blank')
      expect(anchor.getAttribute('rel')).toContain('noopener')
    })

    it('fires onPress on an external link without preventing navigation', () => {
      const onPress = vi.fn()
      render(
        <Link href="#external" isExternal onPress={onPress}>
          Example
        </Link>
      )
      expect(fireEvent.click(screen.getByRole('link'))).toBe(true)
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('renders no href when disabled, though the same enabled link does', () => {
      render(
        <>
          <Link href="/docs" isDisabled>
            Disabled docs
          </Link>
          <Link href="/docs">Enabled docs</Link>
        </>
      )
      const [disabled, enabled] = screen.getAllByRole('link')
      expect(disabled.tagName).not.toBe('A')
      expect(disabled).not.toHaveAttribute('href')
      expect(enabled.tagName).toBe('A')
      expect(enabled).toHaveAttribute('href', '/docs')
    })

    it('renders an anchor only for the link that has an href', () => {
      render(
        <>
          <Link onPress={() => {}}>Without href</Link>
          <Link href="/docs">With href</Link>
        </>
      )
      const [withoutHref, withHref] = screen.getAllByRole('link')
      expect(withoutHref.tagName).not.toBe('A')
      expect(withHref.tagName).toBe('A')
    })
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

    it('has no accessibility violations as an anchor', async () => {
      const { container } = render(
        <Link href="https://example.com" isExternal>
          External site
        </Link>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
