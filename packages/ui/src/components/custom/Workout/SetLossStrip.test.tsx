import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SetLossStrip } from './SetLossStrip'
import {
  BILATERAL_SETS,
  NOT_SCORED_SETS,
  NO_DATA_SETS,
  SESSION_SETS,
  WARMUP_SETS,
} from './setLossStripFixture'
import type { SetLossStripSet } from './setLossStripModel'

// Phone geometry: a 96px plot cell less a 4px ring inset top and bottom, on the default 40% ceiling.
const INNER_PLOT = 88
const INSET = 4
const pxFor = (lossPct: number) => (lossPct / 40) * INNER_PLOT

function heightOf(testId: string): number {
  return parseFloat(screen.getByTestId(testId).style.height)
}

function bottomOf(testId: string): number {
  return parseFloat(screen.getByTestId(testId).style.bottom)
}

const working = (index: number, lossPct: number | null): SetLossStripSet => ({
  index,
  lossPct,
  purpose: 'working',
  reps: 8,
  loadLabel: '100lb',
})

describe('SetLossStrip', () => {
  it('draws the hatch for a set with no loss, never a zero-height bar', () => {
    render(<SetLossStrip sets={NO_DATA_SETS} />)

    expect(screen.getByTestId('set-loss-nodata-2')).toBeInTheDocument()
    expect(screen.queryByTestId('set-loss-bar-2')).toBeNull()
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('rings the marked set by its index, not by its array position', () => {
    // Indices start at 1, so a position lookup would ring set 3 instead of set 2.
    render(<SetLossStrip sets={SESSION_SETS} markedIndex={2} markedTone="warning" />)

    expect(screen.getByTestId('set-loss-ring-2')).toBeInTheDocument()
    expect(screen.queryAllByTestId(/^set-loss-ring-/)).toHaveLength(1)
  })

  it('gives an equal loss an equal height in strips with different peaks', () => {
    render(
      <>
        <SetLossStrip sets={[working(1, 12), working(2, 15)]} testID="low" />
        <SetLossStrip sets={[working(7, 12), working(8, 35)]} testID="high" />
      </>
    )

    expect(heightOf('set-loss-bar-1')).toBeCloseTo(pxFor(12))
    expect(heightOf('set-loss-bar-7')).toBeCloseTo(pxFor(12))
    expect(heightOf('set-loss-bar-8')).toBeCloseTo(pxFor(35))
  })

  it('places the VL lines at the thresholds it is given', () => {
    render(<SetLossStrip sets={SESSION_SETS} thresholds={[15, 25, 35]} />)

    expect(bottomOf('set-loss-vl-15')).toBeCloseTo(INSET + pxFor(15))
    expect(bottomOf('set-loss-vl-25')).toBeCloseTo(INSET + pxFor(25))
    expect(bottomOf('set-loss-vl-35')).toBeCloseTo(INSET + pxFor(35))
    expect(screen.queryByTestId('set-loss-vl-10')).toBeNull()
    expect(screen.getByText('VL 35%')).toBeInTheDocument()
  })

  it('names every set and its loss in the accessible label', () => {
    render(<SetLossStrip sets={NO_DATA_SETS} markedIndex={3} markedLabel="Grinding" />)

    expect(
      screen.getByRole('img', {
        name: 'Velocity loss by set: #1 14%, #2 no data, #3 22%. #3 marked, Grinding.',
      })
    ).toBeInTheDocument()
  })

  it('says which sets are warm-ups and which were not scored', () => {
    render(<SetLossStrip sets={[...WARMUP_SETS.slice(0, 1), ...NOT_SCORED_SETS.slice(1, 2)]} />)

    expect(
      screen.getByRole('img', { name: 'Velocity loss by set: #1 warm-up 4%, #2 not scored 18%.' })
    ).toBeInTheDocument()
  })

  it('draws warm-up bars narrower than working bars', () => {
    render(<SetLossStrip sets={WARMUP_SETS} />)

    const warmup = parseFloat(screen.getByTestId('set-loss-bar-1').style.width)
    const work = parseFloat(screen.getByTestId('set-loss-bar-3').style.width)
    expect(warmup).toBeLessThan(work)
  })

  it('draws a not-scored bar hollow, at working width', () => {
    render(<SetLossStrip sets={NOT_SCORED_SETS} />)

    const hollow = screen.getByTestId('set-loss-bar-2')
    const scored = screen.getByTestId('set-loss-bar-1')
    expect(hollow.style.backgroundColor).toBe('')
    expect(hollow.style.borderTopWidth).not.toBe('')
    expect(hollow.style.width).toBe(scored.style.width)
  })

  it('shows the side label in place of the set number', () => {
    render(<SetLossStrip sets={BILATERAL_SETS} />)

    expect(screen.getByText('#1 L')).toBeInTheDocument()
    expect(screen.getByText('#2 R')).toBeInTheDocument()
  })

  it('marks reps over and under target with their own triangles', () => {
    render(<SetLossStrip sets={SESSION_SETS} />)

    expect(screen.getByTestId('set-loss-repmark-over-2')).toBeInTheDocument()
    expect(screen.getByTestId('set-loss-repmark-under-4')).toBeInTheDocument()
    expect(screen.queryByTestId(/set-loss-repmark-.*-3/)).toBeNull()
  })

  it('dots the session-best e1RM only', () => {
    render(<SetLossStrip sets={SESSION_SETS} bestE1rmIndex={2} />)

    expect(screen.getByTestId('set-loss-best-2')).toBeInTheDocument()
    expect(screen.queryAllByTestId(/^set-loss-best-/)).toHaveLength(1)
  })

  it('omits the e1RM row when no set has one', () => {
    render(<SetLossStrip sets={WARMUP_SETS} />)

    expect(screen.queryByText('e1RM')).toBeNull()
  })

  it('pads to the minimum column count so stacked strips line up', () => {
    const { container } = render(<SetLossStrip sets={NO_DATA_SETS} columns={5} />)
    const strip = within(container).getByTestId('set-loss-strip')

    const loadRow = screen.getByText('Load').parentElement?.parentElement
    const cells = loadRow?.lastElementChild?.children
    expect(strip).toBeInTheDocument()
    expect(cells).toHaveLength(5)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <SetLossStrip
        sets={SESSION_SETS}
        markedIndex={4}
        markedTone="error"
        markedLabel="Grinding"
        bestE1rmIndex={2}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
