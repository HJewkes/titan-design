import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import { BrandLockup } from './BrandLockup'
import { brandKeys, brandPresets, resolveBrand, type BrandPreset } from './brands'
import { siblingSource, spacingClassesAt } from '../../test/spacing-resolver'
import { capturedByNode } from '../../test/classname-capture'

const hyperframes: BrandPreset = {
  mark: <Text testID="hyperframes-mark">*</Text>,
  wordmark: 'HYPERFRAMES',
  accentClassName: 'text-dataviz-categorical-2',
  accentBarClassName: 'bg-dataviz-categorical-2',
  subtitle: 'renders',
}

describe('BrandLockup', () => {
  it('renders the voltras wordmark for the voltras key', () => {
    render(<BrandLockup brand="voltras" />)
    expect(screen.getByText('VOLTRAS')).toBeInTheDocument()
  })

  it('shows the subtitle by default and hides it when showSubtitle is false', () => {
    const { rerender } = render(<BrandLockup brand="voltras" subtitle="wall dashboard" />)
    expect(screen.getByText('/ wall dashboard')).toBeInTheDocument()
    rerender(<BrandLockup brand="voltras" subtitle="wall dashboard" showSubtitle={false} />)
    expect(screen.queryByText('/ wall dashboard')).not.toBeInTheDocument()
  })

  it.each(brandKeys)('renders the %s preset wordmark and subtitle', (brand) => {
    render(<BrandLockup brand={brand} />)
    expect(screen.getByText(brandPresets[brand].wordmark)).toBeInTheDocument()
    expect(screen.getByText(`/ ${brandPresets[brand].subtitle}`)).toBeInTheDocument()
  })

  it('renders an app-supplied BrandPreset with its own mark, wordmark, subtitle and accent', () => {
    render(<BrandLockup brand={hyperframes} />)
    expect(screen.getByText('HYPERFRAMES')).toBeInTheDocument()
    expect(screen.getByText('/ renders')).toBeInTheDocument()
    const markWrapper = screen.getByTestId('hyperframes-mark').parentElement
    expect(capturedByNode.get(markWrapper as Element)).toBe('text-dataviz-categorical-2')
  })

  it('resolves a key to its registry entry and passes a preset through', () => {
    expect(resolveBrand('brain')).toBe(brandPresets.brain)
    expect(resolveBrand(hyperframes)).toBe(hyperframes)
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
    accents.forEach((accent) => expect(accent).toMatch(/^text-(brand|dataviz-categorical|status-info|status-success)/))
    expect(new Set(accents).size).toBe(accents.length)
  })

  // The nav's active bar needs the accent as a background, and a mismatched pair
  // would render a lockup and an active nav item in two different hues.
  it('pairs every accent with the same token as a background', () => {
    brandKeys.forEach((brand) => {
      const { accentClassName, accentBarClassName } = brandPresets[brand]
      expect(accentBarClassName).toMatch(/^bg-(brand|dataviz-categorical|status-info|status-success)/)
      expect(accentBarClassName).toBe(accentClassName.replace(/^text-/, 'bg-'))
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<BrandLockup brand="voltras" />)
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

  it('renders gap-[7px] on the lockup root', () => {
    render(<BrandLockup brand="voltras" />)
    const root = screen.getByText('VOLTRAS').parentElement
    expect(capturedByNode.get(root as Element)?.split(/\s+/)).toContain('gap-[7px]')
    expect(spacingClassesAt(root)).toEqual([])
  })

  it('ships the reason beside it', () => {
    expect(source).toMatch(/\/\/ optical: 7px mark-to-wordmark/)
  })
})
