import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { GapIndicator } from './GapIndicator'

const RESUMED = Date.UTC(2026, 8, 15, 0, 5)

describe('GapIndicator', () => {
  it('is a separator named by the idle time', () => {
    render(<GapIndicator durationMs={1_920_000} />)

    expect(screen.getByRole('separator', { name: '32m idle' })).toHaveTextContent('32m idle')
  })

  it('shows the resume date only when showDate is set', () => {
    const { rerender } = render(<GapIndicator durationMs={720_000} resumedAtMs={RESUMED} isUTC />)
    expect(screen.getByRole('separator')).not.toHaveTextContent('2026')

    rerender(<GapIndicator durationMs={720_000} resumedAtMs={RESUMED} showDate isUTC />)
    expect(screen.getByRole('separator', { name: '12m idle, Sep 15, 2026' })).toHaveTextContent(
      'Sep 15, 2026'
    )
  })

  it('prints the placeholder, never NaN, for a span that is not a duration', () => {
    const { rerender } = render(<GapIndicator durationMs={Number.NaN} />)
    expect(screen.getByRole('separator')).toHaveTextContent('– idle')

    rerender(<GapIndicator durationMs={-60_000} resumedAtMs={Number.NaN} showDate />)
    expect(screen.getByRole('separator')).toHaveTextContent('– idle')
    expect(screen.getByRole('separator')).not.toHaveTextContent('NaN')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <GapIndicator durationMs={1_920_000} resumedAtMs={RESUMED} showDate isUTC />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
