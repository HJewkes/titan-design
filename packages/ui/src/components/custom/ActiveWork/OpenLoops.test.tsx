import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { OpenLoops } from './OpenLoops'
import { sessionLinkers } from './session-linkers'
import { INITIATIVE_LOOPS_FIXTURE, INITIATIVE_NOW } from './initiative-fixture'

describe('OpenLoops', () => {
  it('lists a row per loop under a count heading, inside a list', () => {
    render(<OpenLoops loops={INITIATIVE_LOOPS_FIXTURE} now={INITIATIVE_NOW} />)
    expect(screen.getByText('5 open loops')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: '5 open loops' })).toBeInTheDocument()
    expect(screen.getAllByTestId('open-loop')).toHaveLength(INITIATIVE_LOOPS_FIXTURE.length)
  })

  it('labels a task loop with its target ref and a PR loop with its kind', () => {
    render(<OpenLoops loops={INITIATIVE_LOOPS_FIXTURE} now={INITIATIVE_NOW} />)
    const rows = screen.getAllByTestId('open-loop')
    // n4 tracks AW-116; the PR-sweep loop (n3) carries the PR kind.
    expect(within(rows[2]!).getByText('AW-116')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('PR')).toBeInTheDocument()
  })

  it('auto-links references in the loop text when linkers are supplied', () => {
    const onPressTask = vi.fn()
    render(
      <OpenLoops
        loops={INITIATIVE_LOOPS_FIXTURE}
        now={INITIATIVE_NOW}
        linkers={sessionLinkers({ onPressTask })}
      />
    )
    // Row 3's text opens with an AW-22 ref; click the in-prose link, not the kind pill.
    const proseRef = within(screen.getAllByTestId('open-loop')[3]!).getAllByTestId(
      'prose-ref-task'
    )[0]!
    fireEvent.click(proseRef)
    expect(onPressTask).toHaveBeenCalledWith('AW-22')
  })

  it('singularises the heading and shows the empty state for no loops', () => {
    const { rerender } = render(
      <OpenLoops loops={INITIATIVE_LOOPS_FIXTURE.slice(0, 1)} now={INITIATIVE_NOW} />
    )
    expect(screen.getByText('1 open loop')).toBeInTheDocument()
    rerender(<OpenLoops loops={[]} now={INITIATIVE_NOW} />)
    expect(screen.getByText('No open loops')).toBeInTheDocument()
    expect(screen.queryByTestId('open-loop')).not.toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(
      <OpenLoops
        loops={INITIATIVE_LOOPS_FIXTURE}
        now={INITIATIVE_NOW}
        linkers={sessionLinkers({ onPressTask: () => {} })}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
