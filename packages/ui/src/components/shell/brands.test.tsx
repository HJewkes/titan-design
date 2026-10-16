import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { contrast } from '../../theme/color-checks'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { capturedByNode } from '../../test/classname-capture'
import { brandKeys, brandPresets, type BrandKey } from './brands'
import { BrandLockup } from './BrandLockup'
import { NavItem } from './NavItem'

const MODES = ['light', 'dark'] as const
// The nav glyph and bar sit on the rail (`background-base`); the lockup mark sits on the
// top bar's chrome gradient, which runs `surface-elevated` → `background-base`.
const PLANES = ['background-base', 'surface-elevated'] as const

const EXPECTED_ACCENTS: Record<BrandKey, string> = {
  voltras: 'brand-primary',
  audiobook: 'dataviz-categorical-1',
  'active-work': 'dataviz-categorical-0',
  agents: 'dataviz-categorical-4',
  brain: 'dataviz-categorical-6',
  console: 'dataviz-categorical-2',
}

// Accent marks measured under 3:1 on a shell plane. Shrink-only: a fix deletes its
// row, and a new miss fails the test. Voltras is its own brand token; the other two
// are the owner's option-1 hues (TD-485), which clear 3:1 on surface-base but not here.
// The 3b light ramp (TD-789) darkens background-base to grey 200; the accents wait for
// the categorical lock, so their misses there are recorded rather than re-coloured.
const KNOWN_NON_TEXT_MISSES = [
  'voltras light background-base 1.73',
  'voltras light surface-elevated 2.44',
  'active-work light background-base 2.05',
  'active-work light surface-elevated 2.90',
  'agents light background-base 3.00',
  'brain dark surface-elevated 2.85',
]

const tokenOf = (className: string) => className.replace(/^(text|bg)-/, '')

function nonTextMisses(): string[] {
  return MODES.flatMap((mode) => {
    const colors = getSemanticColors(mode) as Record<string, string>
    return brandKeys.flatMap((brand) =>
      PLANES.flatMap((plane) => {
        const ratio = contrast(colors[tokenOf(brandPresets[brand].accentClassName)], colors[plane])
        return ratio < 3 ? [`${brand} ${mode} ${plane} ${ratio.toFixed(2)}`] : []
      })
    )
  })
}

describe('brand accents', () => {
  it.each(brandKeys)('paints the %s glyph and nav bar with one accent token', (brand) => {
    const { accentClassName, accentBarClassName } = brandPresets[brand]
    expect(accentClassName).toBe(`text-${EXPECTED_ACCENTS[brand]}`)
    expect(accentBarClassName).toBe(`bg-${EXPECTED_ACCENTS[brand]}`)
  })

  it('puts the lockup mark in the accent and the wordmark on text-primary', () => {
    render(<BrandLockup brand={{ ...brandPresets.brain, mark: <Text testID="mark">*</Text> }} />)
    const markWrapper = screen.getByTestId('mark').parentElement as Element
    expect(capturedByNode.get(markWrapper)).toBe('text-dataviz-categorical-6')
    expect(capturedByNode.get(screen.getByText('BRAIN'))).toContain('text-text-primary')
  })

  it('keeps the active nav label on text-primary while the glyph takes the accent', () => {
    const { accentClassName, accentBarClassName } = brandPresets.brain
    render(
      <NavItem
        icon={<Text>*</Text>}
        label="Graph"
        active
        accentClassName={accentClassName}
        accentBarClassName={accentBarClassName}
      />
    )
    const label = screen.getByText('Graph')
    expect(capturedByNode.get(label)).toContain('text-text-primary')
    expect(capturedByNode.get(label)).not.toContain(accentClassName)
    expect(capturedByNode.get(label.parentElement as Element)).toContain(accentClassName)
  })
})

describe('brand accent contrast on the shell planes', () => {
  // cat-1 and cat-4 also clear 3:1 but belong to audiobook and agents; cat-2 is the free one.
  it.each(MODES)('holds the console accent at 3:1 on both shell planes in %s', (mode) => {
    const colors = getSemanticColors(mode) as Record<string, string>
    const accent = colors[tokenOf(brandPresets.console.accentClassName)]
    PLANES.forEach((plane) => {
      expect(contrast(accent, colors[plane])).toBeGreaterThanOrEqual(3)
    })
  })

  it('holds every accent mark at 3:1 (WCAG 1.4.11) bar the recorded misses', () => {
    expect(nonTextMisses()).toEqual(KNOWN_NON_TEXT_MISSES)
  })

  it.each(MODES)('keeps the text-primary labels at 4.5:1 in %s', (mode) => {
    const colors = getSemanticColors(mode)
    PLANES.forEach((plane) => {
      expect(contrast(colors['text-primary'], colors[plane])).toBeGreaterThanOrEqual(4.5)
    })
  })
})
