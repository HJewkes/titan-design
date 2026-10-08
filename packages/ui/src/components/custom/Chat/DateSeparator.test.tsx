import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

  it('takes its day names from labels', () => {
    const labels = { today: 'Hoy', yesterday: 'Ayer' }
    const { rerender } = render(
      <DateSeparator date={localIso(0, 7, 0)} now={NOW} labels={labels} />
    )
    expect(screen.getByText('Hoy')).toBeInTheDocument()
    rerender(<DateSeparator date={localIso(1, 7, 0)} now={NOW} labels={labels} />)
    expect(screen.getByText('Ayer')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<DateSeparator date={localIso(0, 7, 0)} now={NOW} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  describe('as a times toggle', () => {
    it('is a named button that presses through to the handler', () => {
      const onPress = vi.fn()
      render(<DateSeparator date={localIso(0, 7, 0)} now={NOW} onPress={onPress} />)

      fireEvent.click(screen.getByRole('button', { name: 'Show message times' }))

      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('names the hide action and reports expanded while times show', () => {
      render(<DateSeparator date={localIso(0, 7, 0)} now={NOW} onPress={() => {}} timesShown />)

      expect(screen.getByRole('button', { name: 'Hide message times' })).toHaveAttribute(
        'aria-expanded',
        'true'
      )
    })

    it('stays plain text when nothing is wired to it', () => {
      render(<DateSeparator date={localIso(0, 7, 0)} now={NOW} />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('has no accessibility violations as a button', async () => {
      const { container } = render(
        <DateSeparator date={localIso(0, 7, 0)} now={NOW} onPress={() => {}} />
      )

      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
