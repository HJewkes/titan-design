import type { ComponentType } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { compositeOver, contrast } from '../../../theme/color-checks'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import {
  AlertTriangleIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  OctagonXIcon,
  type IconProps,
} from '../../icons'
import { StatusGlyph, type StatusGlyphSize, type StatusGlyphTone } from './StatusGlyph'

const TONE_SHAPES: [StatusGlyphTone, ComponentType<IconProps>][] = [
  ['success', CircleCheckIcon],
  ['warning', AlertTriangleIcon],
  ['error', OctagonXIcon],
  ['neutral', CircleDashedIcon],
]

const TONES = TONE_SHAPES.map(([tone]) => tone)

function glyphSvg(tone: StatusGlyphTone) {
  const { container } = render(<StatusGlyph tone={tone} label={tone} />)
  return container.querySelector('svg')!
}

/** The semantic token behind the glyph's stroke; on web it renders as `var(--color-<token>)`. */
function fillToken(tone: StatusGlyphTone) {
  const stroke = glyphSvg(tone).getAttribute('stroke') ?? ''
  const match = /^var\(--color-(.+)\)$/.exec(stroke)
  expect(match, `stroke "${stroke}" is not a semantic token`).not.toBeNull()
  return match![1] as keyof ReturnType<typeof getSemanticColors>
}

describe('StatusGlyph', () => {
  it.each(TONE_SHAPES)('draws the %s tone with its own shape', (tone, Icon) => {
    const { container: expected } = render(<Icon />)

    const svg = glyphSvg(tone)

    expect(svg.innerHTML).toBe(expected.querySelector('svg')!.innerHTML)
  })

  it('gives every tone a different shape', () => {
    const shapes = new Set(TONES.map((tone) => glyphSvg(tone).innerHTML))

    expect(shapes.size).toBe(TONES.length)
  })

  it('speaks the label as its accessible name', () => {
    render(<StatusGlyph tone="error" label="Failed" />)

    expect(screen.getByRole('img', { name: 'Failed' })).toBeInTheDocument()
  })

  it('hides the inner svg so the label is spoken once', () => {
    expect(glyphSvg('success').getAttribute('aria-hidden')).toBe('true')
  })

  it('grows from sm to xl', () => {
    const width = (size: StatusGlyphSize) => {
      const { container } = render(<StatusGlyph tone="success" label="Fresh" size={size} />)
      return Number(container.querySelector('svg')!.getAttribute('width'))
    }

    expect(width('sm')).toBeLessThan(width('md'))
    expect(width('md')).toBeLessThan(width('lg'))
    expect(width('lg')).toBeLessThan(width('xl'))
  })

  it('draws xl at least the cap height of a 48px h2 word', () => {
    // A ~0.7 cap-height ratio puts a 48px word's capitals near 34px; lg (24px) sat well under it.
    const { container } = render(<StatusGlyph tone="error" label="Grinding" size="xl" />)

    expect(Number(container.querySelector('svg')!.getAttribute('width'))).toBeGreaterThanOrEqual(34)
  })

  const SURFACES = ['surface-base', 'surface-raised'] as const
  const FILL_CASES = TONES.flatMap((tone) => SURFACES.map((surface) => [tone, surface] as const))

  describe.each<ThemeMode>(['dark', 'light'])('%s theme', (mode) => {
    const colors = getSemanticColors(mode)

    it.each(FILL_CASES)('the %s fill clears 3:1 on %s', (tone, surface) => {
      const plane = colors[surface]
      const fill = compositeOver(colors[fillToken(tone)], plane)

      expect(contrast(fill, plane)).toBeGreaterThanOrEqual(3)
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <>
        {TONES.map((tone) => (
          <StatusGlyph key={tone} tone={tone} label={tone} />
        ))}
      </>
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
