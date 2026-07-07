import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DateTime, formatDateTime } from './DateTime'

describe('DateTime', () => {
  const testDate = new Date('2024-06-15T14:30:00Z')
  const testTimestamp = testDate.getTime()
  const testISOString = '2024-06-15T14:30:00Z'

  it('renders with Date object', () => {
    render(<DateTime value={testDate} format="date" isUTC />)
    // Should render a formatted date string
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('renders with timestamp', () => {
    render(<DateTime value={testTimestamp} format="date" isUTC />)
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('renders with ISO string', () => {
    render(<DateTime value={testISOString} format="date" isUTC />)
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('renders fallback when value is null', () => {
    render(<DateTime value={null} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renders fallback when value is undefined', () => {
    render(<DateTime value={undefined} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renders custom fallback', () => {
    render(<DateTime value={null} fallback="N/A" />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('forces 24h time with hour12={false}', () => {
    render(<DateTime value={new Date(2024, 0, 1, 16, 12)} format="time" hour12={false} />)
    expect(screen.getByText('16:12')).toBeInTheDocument()
  })

  it('forces 12h time with hour12={true}', () => {
    render(<DateTime value={new Date(2024, 0, 1, 16, 12)} format="time" hour12 />)
    expect(screen.getByText(/4:12/)).toBeInTheDocument()
  })

  it('renders a live clock (ignores value, shows current time)', () => {
    const { container } = render(<DateTime live format="time" hour12={false} />)
    // renders a HH:MM string without crashing
    expect(container.textContent).toMatch(/^\d{1,2}:\d{2}/)
  })

  it('renders Invalid Date for bad input', () => {
    render(<DateTime value="not-a-date" />)
    expect(screen.getByText('Invalid Date')).toBeInTheDocument()
  })

  describe('formats', () => {
    it('renders date format', () => {
      render(<DateTime value={testDate} format="date" isUTC />)
      expect(screen.getByText(/06/)).toBeInTheDocument()
    })

    it('renders time format', () => {
      render(<DateTime value={testDate} format="time" isUTC />)
      // Should contain time portion
      const textContent = screen.getByText(/\d/).textContent
      expect(textContent).toBeDefined()
    })

    it('renders datetime format', () => {
      render(<DateTime value={testDate} format="datetime" isUTC />)
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })

    it('renders short format', () => {
      render(<DateTime value={testDate} format="short" isUTC />)
      expect(screen.getByText(/Jun/)).toBeInTheDocument()
    })

    it('renders medium format', () => {
      render(<DateTime value={testDate} format="medium" isUTC />)
      expect(screen.getByText(/Jun/)).toBeInTheDocument()
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })

    it('renders long format', () => {
      render(<DateTime value={testDate} format="long" isUTC />)
      expect(screen.getByText(/June/)).toBeInTheDocument()
    })

    it('renders full format', () => {
      render(<DateTime value={testDate} format="full" isUTC />)
      expect(screen.getByText(/June/)).toBeInTheDocument()
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })

    it('renders relative format', () => {
      // Use a date far in the past to get a stable relative output
      const pastDate = new Date('2020-01-01T00:00:00Z')
      render(<DateTime value={pastDate} format="relative" />)
      // Should contain "ago" or "year" type relative text
      const el = screen.getByText(/year|ago/)
      expect(el).toBeInTheDocument()
    })
  })

  describe('color variants', () => {
    const colors = ['primary', 'secondary', 'tertiary', 'inherit'] as const
    colors.forEach((color) => {
      it(`renders with color ${color}`, () => {
        render(<DateTime value={testDate} format="short" color={color} isUTC />)
        expect(screen.getByText(/Jun/)).toBeInTheDocument()
      })
    })
  })

  describe('UTC mode', () => {
    it('renders in UTC when isUTC is true', () => {
      render(<DateTime value={testDate} format="date" isUTC />)
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })
  })

  describe('formatDateTime utility', () => {
    it('formats a date value', () => {
      const result = formatDateTime(testDate, 'short', true)
      expect(result).toContain('Jun')
    })

    it('returns fallback for null', () => {
      expect(formatDateTime(null)).toBe('-')
    })

    it('returns fallback for undefined', () => {
      expect(formatDateTime(undefined)).toBe('-')
    })

    it('returns custom fallback', () => {
      expect(formatDateTime(null, 'date', false, 'N/A')).toBe('N/A')
    })

    it('returns Invalid Date for bad input', () => {
      expect(formatDateTime('not-a-date')).toBe('Invalid Date')
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<DateTime value={testDate} format="medium" isUTC />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations with fallback', async () => {
      const { container } = render(<DateTime value={null} fallback="No date" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
