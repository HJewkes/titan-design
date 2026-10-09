import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { capturedClassNames } from '../../../test/classname-capture'
import { ToolCallRow } from './ToolCallRow'
import {
  SESSION_ALL_ERRORS,
  SESSION_DEFAULT,
  SESSION_HOSTILE,
  SESSION_PENDING,
} from './session-fixture'
import type { SessionTimeline, TimelineToolCall } from './session-types'

const callsOf = (s: SessionTimeline) => s.turns.flatMap((t) => t.toolCalls)
const firstWhere = (s: SessionTimeline, test: (c: TimelineToolCall) => boolean) =>
  callsOf(s).find(test)!

const SUCCEEDED = firstWhere(SESSION_DEFAULT, (c) => c.outcome === 'success' && c.name === 'Read')
const FAILED = firstWhere(SESSION_ALL_ERRORS, () => true)
const PENDING = firstWhere(SESSION_PENDING, (c) => c.outcome === 'pending')
const MARKUP_ERROR = firstWhere(SESSION_HOSTILE, (c) => (c.errorMessage ?? '').includes('<b>'))

describe('ToolCallRow', () => {
  it('names the row by tool, summary, outcome and duration', () => {
    render(<ToolCallRow call={{ ...SUCCEEDED, durationMs: 1_200 }} isUTC />)

    expect(
      screen.getByRole('group', { name: `Read, ${SUCCEEDED.inputSummary}, succeeded, 1.2 s` })
    ).toBeInTheDocument()
  })

  it('prints no outcome word at rest; the dot carries it', () => {
    render(<ToolCallRow call={FAILED} />)

    expect(screen.queryByText('failed')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'failed' })).toBeInTheDocument()
  })

  it('shows the outcome word when the keyboard reaches the dot', () => {
    render(<ToolCallRow call={SUCCEEDED} />)

    fireEvent.focus(screen.getByRole('button', { name: 'succeeded' }))

    expect(screen.getByText('succeeded')).toBeInTheDocument()
  })

  it('shows the outcome word when the keyboard reaches a pressable row', () => {
    render(<ToolCallRow call={FAILED} onPress={() => {}} />)
    expect(screen.queryByText('failed')).not.toBeInTheDocument()

    fireEvent.focus(screen.getByRole('button', { name: new RegExp(`^${FAILED.name}, `) }))

    expect(screen.getByText('failed')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'failed' })).toBeInTheDocument()
  })

  it('centres the family badge on the row rather than pinning it to the top', () => {
    render(<ToolCallRow call={SUCCEEDED} />)

    const classes = (capturedClassNames.get('tool-badge') ?? '').split(/\s+/)
    expect(classes).toContain('self-center')
    expect(classes).not.toContain('self-start')
  })

  it('prints no duration for a pending call', () => {
    render(<ToolCallRow call={PENDING} isUTC />)

    const row = screen.getByRole('group')
    expect(row).toHaveAccessibleName(`${PENDING.name}, ${PENDING.inputSummary}, pending`)
    expect(row).not.toHaveTextContent(/\d+(\.\d)? ?(ms|s)\b/)
  })

  it('reads an unknown outcome as no result status, not a success', () => {
    render(<ToolCallRow call={{ ...SUCCEEDED, outcome: 'unknown' }} />)

    expect(screen.getByRole('button', { name: 'no result status' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'succeeded' })).not.toBeInTheDocument()
  })

  it('keeps error text behind a disclosure, as literal text', () => {
    render(<ToolCallRow call={MARKUP_ERROR} />)
    const disclosure = screen.getByRole('button', { name: /^Error text/ })
    expect(screen.queryByText(MARKUP_ERROR.errorMessage!)).not.toBeInTheDocument()

    fireEvent.click(disclosure)

    expect(screen.getByText(MARKUP_ERROR.errorMessage!)).toBeInTheDocument()
    expect(document.querySelector('b')).toBeNull()
  })

  it('is not a button without onPress', () => {
    render(<ToolCallRow call={SUCCEEDED} />)

    expect(screen.queryByRole('button', { name: /^Read, / })).not.toBeInTheDocument()
  })

  it('with onPress, is a native button that presses once with the call', () => {
    const onPress = vi.fn()
    render(<ToolCallRow call={SUCCEEDED} onPress={onPress} />)
    const row = screen.getByRole('button', { name: /^Read, / })

    fireEvent.click(row)

    // A native button: the browser turns Enter and Space into this click, which jsdom does not.
    expect(row.tagName).toBe('BUTTON')
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledWith(SUCCEEDED)
  })

  it('keeps the error disclosure a separate control beside a pressable row', () => {
    const onPress = vi.fn()
    render(<ToolCallRow call={FAILED} onPress={onPress} />)

    fireEvent.click(screen.getByRole('button', { name: /^Error text/ }))

    expect(onPress).not.toHaveBeenCalled()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('renders every hostile call without NaN and with a name for an empty tool', () => {
    const { container } = render(
      <>
        {callsOf(SESSION_HOSTILE).map((call, i) => (
          <ToolCallRow key={i} call={call} />
        ))}
      </>
    )

    expect(container).not.toHaveTextContent('NaN')
    expect(screen.getByText('Unnamed tool')).toBeInTheDocument()
  })

  it('shows no time stamp when the call has none', () => {
    render(<ToolCallRow call={{ ...SUCCEEDED, atMs: null }} isUTC />)

    expect(screen.getByRole('group')).not.toHaveTextContent(/\d\d:\d\d/)
  })

  it.each([
    ['succeeded', SUCCEEDED],
    ['failed', FAILED],
    ['pending', PENDING],
  ])('has no accessibility violations in a list (%s)', async (_name, call) => {
    const { container } = render(
      <ul>
        <li>
          <ToolCallRow call={call} isUTC onPress={() => {}} />
        </li>
        <li>
          <ToolCallRow call={call} isUTC />
        </li>
      </ul>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
