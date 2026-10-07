import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import type { CSSProperties, ReactNode } from 'react'
import { getGlowShadow } from '../../../theme/elevation'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { SurfaceContext } from '../surface'
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

describe('Indicator glow', () => {
  const glowOf = (color: string) => {
    const probe = render(<div style={getGlowShadow(color, 'subtle') as CSSProperties} />)
    return (probe.container.firstChild as HTMLElement).style.boxShadow
  }
  const wrap = (mode: ThemeMode, node: ReactNode) => (
    <SurfaceContext.Provider value={{ mode, level: 'base' }}>{node}</SurfaceContext.Provider>
  )

  it('paints the glow on the solid dot when pulse is ping', () => {
    const { container } = render(<Indicator glow pulse="ping" color="success" />)
    const [pingLayer, solidDot] = Array.from(
      (container.firstChild as HTMLElement).children
    ) as HTMLElement[]
    const expected = glowOf(getSemanticColors('dark')['status-success'])
    expect(expected).not.toBe('')
    expect(solidDot.style.boxShadow).toBe(expected)
    expect(pingLayer.style.boxShadow).toBe('')
  })

  it.each(['dark', 'light'] as const)('defaults the glow to text-tertiary in %s mode', (mode) => {
    const { container } = render(wrap(mode, <Indicator glow />))
    const expected = glowOf(getSemanticColors(mode)['text-tertiary'])
    expect(expected).not.toBe('')
    expect((container.firstChild as HTMLElement).style.boxShadow).toBe(expected)
  })
})
