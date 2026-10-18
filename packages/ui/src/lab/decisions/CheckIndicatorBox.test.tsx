import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { CheckIndicatorBox } from './CheckIndicatorBox'
import { CHECK_OPTIONS } from './check-indicator-options'

const baseline = CHECK_OPTIONS.find((o) => o.key === 'current')!

// The baseline must paint what Checkbox ships: since TD-840 that is the SVG CheckMark on the
// on-brand chip, in text-brand, not a ✓ glyph in a host font.
describe('CheckIndicatorBox baseline', () => {
  it('draws the shipped CheckMark in text-brand, not a text glyph', () => {
    const { container } = render(<CheckIndicatorBox option={baseline} size="md" state="checked" />)
    expect(screen.queryByText('✓')).toBeNull()
    expect(container.querySelector('svg polygon')?.getAttribute('fill')).toBe(
      'var(--color-text-brand)'
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<CheckIndicatorBox option={baseline} size="md" state="checked" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
