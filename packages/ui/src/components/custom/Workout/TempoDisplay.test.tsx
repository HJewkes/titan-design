import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { TempoDisplay } from './TempoDisplay'

// tempo = [eccentric, pauseBottom, concentric, pauseTop]
describe('TempoDisplay', () => {
  it('renders tempo values', () => {
    render(<TempoDisplay tempo={[3, 1, 1, 0]} />)
    expect(screen.getByTestId('tempo-value')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders the TEMPO label prefix', () => {
    render(<TempoDisplay tempo={[3, 1, 1, 0]} />)
    expect(screen.getByText('TEMPO')).toBeInTheDocument()
  })

  it('renders colored phases by default', () => {
    render(<TempoDisplay tempo={[3, 1, 1, 0]} />)
    const tempoValue = screen.getByTestId('tempo-value')
    expect(tempoValue.children.length).toBeGreaterThan(1)
  })

  it('renders order: eccentric-pauseBottom-concentric-pauseTop', () => {
    render(<TempoDisplay tempo={[4, 3, 2, 1]} />)
    expect(screen.getByTestId('tempo-value')).toHaveTextContent('4-3-2-1')
  })

  it('has correct accessibility label', () => {
    render(<TempoDisplay tempo={[3, 1, 1, 0]} />)
    expect(
      screen.getByLabelText(
        'Tempo: 3 second eccentric, 1 second pause, 1 second concentric, 0 second pause'
      )
    ).toBeInTheDocument()
  })

  it('is always a Pressable for tooltip', () => {
    render(<TempoDisplay tempo={[3, 1, 1, 0]} />)
    const display = screen.getByTestId('tempo-display')
    expect(display).toBeInTheDocument()
  })

  it('calls onPress when pressed', () => {
    const onPress = vi.fn()
    render(<TempoDisplay tempo={[3, 1, 1, 0]} onPress={onPress} />)
    const display = screen.getByTestId('tempo-display')
    fireEvent.click(display)
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('toggles tooltip on press', () => {
    render(<TempoDisplay tempo={[3, 1, 1, 0]} />)
    expect(screen.queryByTestId('tempo-tooltip')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('tempo-display'))
    expect(screen.getByTestId('tempo-tooltip')).toBeInTheDocument()
  })

  it('does not show tooltip when showInfo is false', () => {
    render(<TempoDisplay tempo={[3, 1, 1, 0]} showInfo={false} />)
    fireEvent.click(screen.getByTestId('tempo-display'))
    expect(screen.queryByTestId('tempo-tooltip')).not.toBeInTheDocument()
  })

  describe('sizes', () => {
    it('renders at sm size', () => {
      render(<TempoDisplay tempo={[3, 1, 1, 0]} size="sm" />)
      expect(screen.getByTestId('tempo-value')).toBeInTheDocument()
    })

    it('renders at md size', () => {
      render(<TempoDisplay tempo={[3, 1, 1, 0]} size="md" />)
      expect(screen.getByTestId('tempo-value')).toBeInTheDocument()
    })

    it('overrides the digit font size via fontSize', () => {
      render(<TempoDisplay tempo={[3, 1, 1, 0]} fontSize={32} showLabel={false} />)
      expect(screen.getByText('3')).toHaveStyle({ fontSize: 32 })
    })
  })

  describe('live phase-fill', () => {
    it('is inert by default (no active fill) for backward-compatible static use', () => {
      render(<TempoDisplay tempo={[3, 1, 1, 0]} />)
      expect(screen.queryByTestId('tempo-live-active')).not.toBeInTheDocument()
    })

    it('renders the active phase as a live countdown readout with a fill', () => {
      render(
        <TempoDisplay
          tempo={[3, 1, 1, 0]}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 1000 }}
        />
      )
      expect(screen.getByTestId('tempo-live-active')).toBeInTheDocument()
      // eccentric target 3s, 1s in → 2.0s remaining (countdown is the default)
      expect(screen.getByText('2.0')).toBeInTheDocument()
      // the static eccentric digit is replaced by the readout
      expect(screen.queryByText('3')).not.toBeInTheDocument()
    })

    it('counts elapsed up when liveReadout is countup', () => {
      render(
        <TempoDisplay
          tempo={[4, 1, 2, 3]}
          liveReadout="countup"
          live={{ activePhase: 'eccentric', phaseElapsedMs: 1500 }}
        />
      )
      // 1.5s elapsed of the 4s eccentric → 1.5 counting up (unique among the target readouts)
      expect(screen.getByText('1.5')).toBeInTheDocument()
    })

    it('marks no phase active when idle (activePhase null)', () => {
      render(<TempoDisplay tempo={[3, 1, 1, 0]} live={{ activePhase: null, phaseElapsedMs: 0 }} />)
      expect(screen.queryByTestId('tempo-live-active')).not.toBeInTheDocument()
    })

    it('locks the phases completed earlier in the rep, and resets on the first phase', () => {
      // Concentric active (3rd phase) → eccentric + pauseBottom are locked done.
      const mid = render(
        <TempoDisplay
          tempo={[3, 1, 2, 1]}
          live={{ activePhase: 'concentric', phaseElapsedMs: 800 }}
        />
      )
      expect(mid.getAllByTestId('tempo-live-done')).toHaveLength(2)
      // Back to the first phase (next rep) → nothing is locked yet.
      mid.rerender(
        <TempoDisplay
          tempo={[3, 1, 2, 1]}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 200 }}
        />
      )
      expect(mid.queryByTestId('tempo-live-done')).not.toBeInTheDocument()
    })

    it('colours the TEMPO label live-muted while live', () => {
      const { getByText, rerender } = render(<TempoDisplay tempo={[3, 1, 1, 0]} />)
      const restColor = getByText('TEMPO').style.color
      rerender(
        <TempoDisplay
          tempo={[3, 1, 1, 0]}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 500 }}
        />
      )
      expect(getByText('TEMPO').style.color).not.toBe(restColor)
    })

    it('shows upcoming phases as their prescribed time and the active as the live readout', () => {
      render(
        <TempoDisplay
          tempo={[5, 3, 2, 1]}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 1000 }}
        />
      )
      // active eccentric: 5s target, 1s in → 4.0 remaining
      expect(screen.getByText('4.0')).toBeInTheDocument()
      // upcoming pauseBottom shows its prescribed 3s as 3.0 (no bare integer digits in live mode)
      expect(screen.getByText('3.0')).toBeInTheDocument()
      expect(screen.queryByText('5')).not.toBeInTheDocument()
    })

    it('freezes a completed phase at its actual final time, not the target', () => {
      render(
        <TempoDisplay
          tempo={[3, 1, 2, 2]}
          live={{ activePhase: 'concentric', phaseElapsedMs: 500, completed: { eccentric: 3400 } }}
        />
      )
      // eccentric ran 3.4s vs its 3s target → countdown froze at 3.0 − 3.4 = −0.4, not the target
      expect(screen.getByText('-0.4')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TempoDisplay tempo={[3, 1, 1, 0]} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
