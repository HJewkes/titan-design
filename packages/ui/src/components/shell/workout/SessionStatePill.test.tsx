import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SessionStatePill } from './SessionStatePill'
import { resolveAll, siblingSource, spacingClassesIn } from '../../../test/spacing-resolver'

describe('SessionStatePill', () => {
  it('labels each state', () => {
    const { rerender } = render(<SessionStatePill state="live" />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
    rerender(<SessionStatePill state="rest" />)
    expect(screen.getByText('REST')).toBeInTheDocument()
    rerender(<SessionStatePill state="idle" />)
    expect(screen.getByText('IDLE')).toBeInTheDocument()
  })

  it('supports a custom label', () => {
    render(<SessionStatePill state="live" label="SET LIVE" />)
    expect(screen.getByText('SET LIVE')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<SessionStatePill state="live" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

/**
 * The pill's spacing, pinned (AW-142 wave three).
 *
 * `gap-2` named `gap-inline-md`: a dot beside a label is a horizontal cluster,
 * which is what `inline` means. No pixel moved.
 */
describe('SessionStatePill geometry resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'SessionStatePill.tsx')

  it('ships gap-inline-md', () => {
    expect(spacingClassesIn(source, 'SessionStatePill')).toEqual(['gap-inline-md'])
    expect(resolveAll(['gap-inline-md'])).toEqual(['8px'])
  })
})
