import { afterAll, beforeAll, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DateSeparator } from './DateSeparator'

// Runs in the `local-time` fork project: a thread cannot change its zone after start.
// Denver springs forward on 2026-03-08 (a 23-hour day) and falls back on 2026-11-01 (25 hours).
describe('DateSeparator across a DST change', () => {
  let zone: string | undefined

  beforeAll(() => {
    zone = process.env.TZ
    process.env.TZ = 'America/Denver'
  })

  afterAll(() => {
    if (zone === undefined) delete process.env.TZ
    else process.env.TZ = zone
  })

  // Built inside each test, after the zone is pinned, so the wall-clock times are Denver's.
  const local = (month: number, day: number, hour: number, minute: number) =>
    new Date(2026, month - 1, day, hour, minute)
  const afterSpringForward = () => local(3, 9, 0, 30)

  it('spells out the day before yesterday after a 23-hour day', () => {
    render(<DateSeparator date={local(3, 7, 12, 0)} now={afterSpringForward()} />)
    expect(screen.getByTestId('chat-date-separator')).toHaveTextContent('Mar 7, 2026')
  })

  it('still names the 23-hour day Yesterday', () => {
    render(<DateSeparator date={local(3, 8, 12, 0)} now={afterSpringForward()} />)
    expect(screen.getByText('Yesterday')).toBeInTheDocument()
  })

  it('names the evening before a 25-hour day Yesterday late on that day', () => {
    render(<DateSeparator date={local(10, 31, 23, 30)} now={local(11, 1, 23, 30)} />)
    expect(screen.getByText('Yesterday')).toBeInTheDocument()
  })
})
