import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  TempoBar,
  getTempoPacingState,
  getTempoFillPct,
  TEMPO_PACING,
} from './TempoBar'

const TARGET = { concentric: 1, hold: 1, eccentric: 3 }

describe('getTempoPacingState', () => {
  it('returns none when there is no target', () => {
    expect(getTempoPacingState(1000, null)).toBe('none')
  })

  it('returns none for a sub-threshold target', () => {
    expect(getTempoPacingState(1000, TEMPO_PACING.minPhaseDurationMs - 1)).toBe('none')
  })

  it('returns on-pace when within the behind threshold', () => {
    expect(getTempoPacingState(1000, 1000)).toBe('on-pace')
    expect(getTempoPacingState(1100, 1000)).toBe('on-pace') // +10%, under 15%
  })

  it('returns behind once elapsed exceeds the behind threshold', () => {
    expect(getTempoPacingState(1200, 1000)).toBe('behind') // +20%, over 15%
  })
})

describe('getTempoFillPct', () => {
  it('fills fully when there is no target', () => {
    expect(getTempoFillPct(500, null)).toBe(100)
  })

  it('is proportional to elapsed vs target', () => {
    expect(getTempoFillPct(500, 1000)).toBe(50)
  })

  it('clamps at 100 when past target', () => {
    expect(getTempoFillPct(2000, 1000)).toBe(100)
  })
})

describe('TempoBar', () => {
  it('renders the bar with phase labels', () => {
    render(<TempoBar activePhase={null} phaseElapsedMs={0} target={TARGET} />)
    expect(screen.getByTestId('tempo-bar')).toBeInTheDocument()
    expect(screen.getByText('Con')).toBeInTheDocument()
    expect(screen.getByText('Hold')).toBeInTheDocument()
    expect(screen.getByText('Ecc')).toBeInTheDocument()
  })

  it('renders the active segment with an elapsed/target label', () => {
    render(<TempoBar activePhase="concentric" phaseElapsedMs={600} target={TARGET} />)
    expect(screen.getByTestId('tempo-segment-active-Con')).toBeInTheDocument()
    expect(screen.getByText('0.6 / 1.0')).toBeInTheDocument()
  })

  it('shows only elapsed when the active phase has no target', () => {
    render(<TempoBar activePhase="concentric" phaseElapsedMs={800} />)
    expect(screen.getByText('0.8')).toBeInTheDocument()
  })

  it('marks a completed phase that hit its target with a check', () => {
    render(
      <TempoBar
        activePhase="hold"
        phaseElapsedMs={100}
        completed={{ concentric: 950 }}
        target={TARGET}
      />,
    )
    expect(screen.getByTestId('tempo-segment-completed-Con')).toBeInTheDocument()
    expect(screen.getByText('0.9 ✓')).toBeInTheDocument()
  })

  it('marks a completed phase that missed its target with a cross', () => {
    render(
      <TempoBar
        activePhase="hold"
        phaseElapsedMs={100}
        completed={{ eccentric: 4000 }}
        target={TARGET}
      />,
    )
    // eccentric target 3s, 4s elapsed => behind => cross
    expect(screen.getByText('4.0 ✗')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <TempoBar
        activePhase="eccentric"
        phaseElapsedMs={1500}
        completed={{ concentric: 900, hold: 1000 }}
        target={TARGET}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
