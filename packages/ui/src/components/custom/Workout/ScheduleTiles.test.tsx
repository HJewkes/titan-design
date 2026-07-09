import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScheduleTiles } from './ScheduleTiles'
import { formatDateTime } from '../DateTime/DateTime'
import { primitiveRamps } from '../../../theme/tokens/primitives'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const ORANGE = primitiveRamps.orange[400]

// Anchor `now` to the real clock so the injected accent calc and the relative
// Until text (which formatDateTime derives from the real clock) stay in sync.
const NOW = Date.now()

describe('ScheduleTiles', () => {
  it('renders Date, Time, and Until tiles', () => {
    render(<ScheduleTiles now={NOW} when={NOW + 2 * DAY} />)
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Until')).toBeInTheDocument()
  })

  it('does not accent the Until value when more than a day away', () => {
    const when = NOW + 2 * DAY
    render(<ScheduleTiles now={NOW} when={when} />)
    const value = screen.getByText(formatDateTime(when, 'relative'))
    expect(value.style.color).toBe('')
  })

  it('accents the Until value orange when less than a day away', () => {
    const when = NOW + 5 * HOUR
    render(<ScheduleTiles now={NOW} when={when} />)
    const value = screen.getByText(formatDateTime(when, 'relative'))
    expect(value).toHaveStyle({ color: ORANGE })
  })
})
