import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { DateSeparator } from './DateSeparator'
import { NOW, localIso } from './coach-thread-fixture'

describe('DateSeparator', () => {
  it('names the current day Today', () => {
    render(<DateSeparator date={localIso(0, 7, 0)} now={NOW} />)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('names the previous day Yesterday, even across midnight', () => {
    render(<DateSeparator date={localIso(1, 23, 59)} now={localIso(0, 0, 1)} />)
    expect(screen.getByText('Yesterday')).toBeInTheDocument()
  })

  it('spells out older days as a date', () => {
    render(<DateSeparator date={localIso(5, 12, 0)} now={NOW} />)
    expect(screen.getByTestId('chat-date-separator')).toHaveTextContent('Sep 12, 2026')
  })

  it('adds the time after the day when asked', () => {
    render(<DateSeparator date={localIso(0, 8, 5)} now={NOW} showTime />)
    expect(screen.getByTestId('chat-date-separator')).toHaveTextContent(/Today.*8:05/)
  })

  it('shows only the time for a pause within a day', () => {
    render(<DateSeparator date={localIso(0, 8, 5)} now={NOW} showDay={false} showTime />)
    const separator = screen.getByTestId('chat-date-separator')
    expect(separator).toHaveTextContent(/8:05/)
    expect(separator).not.toHaveTextContent('Today')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<DateSeparator date={localIso(0, 7, 0)} now={NOW} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
