import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ScheduleTiles, compactUntil } from './ScheduleTiles'
import { resolveColor } from '../../../theme/resolve-color'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

// A fixed reference; the compact Until label is deterministic from (when - now).
const NOW = Date.now()

describe('ScheduleTiles', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<ScheduleTiles now={NOW} when={NOW + 5 * HOUR} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders Date, Time, and Until tiles', () => {
    render(<ScheduleTiles now={NOW} when={NOW + 2 * DAY} />)
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Until')).toBeInTheDocument()
  })

  it('does not accent the Until value when more than a day away', () => {
    const when = NOW + 2 * DAY
    render(<ScheduleTiles now={NOW} when={when} />)
    const value = screen.getByText(compactUntil(when - NOW))
    expect(value.style.color).toBe('')
  })

  it('accents the Until value with the brand token when less than a day away', () => {
    const when = NOW + 5 * HOUR
    render(<ScheduleTiles now={NOW} when={when} />)
    const value = screen.getByText(compactUntil(when - NOW))
    expect(value).toHaveStyle({ color: resolveColor('brand-primary') })
  })
})
