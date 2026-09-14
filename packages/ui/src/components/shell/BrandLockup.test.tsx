import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { BrandLockup } from './BrandLockup'
import { brandKeys, brandPresets } from './brands'
import { siblingSource } from '../../test/spacing-resolver'

describe('BrandLockup', () => {
  it('renders the voltras wordmark by default', () => {
    render(<BrandLockup />)
    expect(screen.getByText('VOLTRAS')).toBeInTheDocument()
  })

  it('shows the subtitle by default and hides it when showSubtitle is false', () => {
    const { rerender } = render(<BrandLockup subtitle="wall dashboard" />)
    expect(screen.getByText('/ wall dashboard')).toBeInTheDocument()
    rerender(<BrandLockup subtitle="wall dashboard" showSubtitle={false} />)
    expect(screen.queryByText('/ wall dashboard')).not.toBeInTheDocument()
  })

  it.each(brandKeys)('renders the %s preset wordmark and subtitle', (brand) => {
    render(<BrandLockup brand={brand} />)
    expect(screen.getByText(brandPresets[brand].wordmark)).toBeInTheDocument()
    expect(screen.getByText(`/ ${brandPresets[brand].subtitle}`)).toBeInTheDocument()
  })

  it('lets an app override the preset parts', () => {
    render(<BrandLockup brand="brain" wordmark="HYPERFRAMES" subtitle="renders" />)
    expect(screen.getByText('HYPERFRAMES')).toBeInTheDocument()
    expect(screen.getByText('/ renders')).toBeInTheDocument()
    expect(screen.queryByText('BRAIN')).not.toBeInTheDocument()
  })

  // nativewind compiles className to style, so the rendered accent colour is not
  // assertable in jsdom. Assert the token CHOICE instead: every preset picks a
  // semantic `text-*` token, and no two apps share one.
  it('gives every brand a distinct semantic accent token', () => {
    const accents = brandKeys.map((brand) => brandPresets[brand].accentClassName)
    accents.forEach((accent) => expect(accent).toMatch(/^text-(brand|data)-/))
    expect(new Set(accents).size).toBe(accents.length)
  })

  // The nav's active bar needs the accent as a background, and a mismatched pair
  // would render a lockup and an active nav item in two different hues.
  it('pairs every accent with the same token as a background', () => {
    brandKeys.forEach((brand) => {
      const { accentClassName, accentBarClassName } = brandPresets[brand]
      expect(accentBarClassName).toMatch(/^bg-(brand|data)-/)
      expect(accentBarClassName).toBe(accentClassName.replace(/^text-/, 'bg-'))
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<BrandLockup />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

/**
 * The lockup's spacing, pinned (AW-142 wave three).
 *
 * 7px mark-to-wordmark is an optical gap, not a rung, and stays — with its
 * reason in the source. Asserting the comment as well as the value keeps the
 * two from drifting apart.
 */
describe('BrandLockup keeps its optical 7px gap', () => {
  const source = siblingSource(import.meta.url, 'BrandLockup.tsx')

  it('ships gap-[7px] with the reason beside it', () => {
    expect(source).toContain('gap-[7px]')
    expect(source).toMatch(/\/\/ optical: 7px mark-to-wordmark/)
  })
})
