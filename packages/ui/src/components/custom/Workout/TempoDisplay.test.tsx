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

  it('renders mono variant', () => {
    render(<TempoDisplay tempo={[3, 1, 1, 0]} colored={false} />)
    expect(screen.getByText('3-1-1-0')).toBeInTheDocument()
  })

  it('renders order: eccentric-pauseBottom-concentric-pauseTop', () => {
    render(<TempoDisplay tempo={[4, 3, 2, 1]} colored={false} />)
    expect(screen.getByText('4-3-2-1')).toBeInTheDocument()
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

    it('renders an active fill overlay for the in-progress phase when live', () => {
      render(
        <TempoDisplay
          tempo={[3, 1, 1, 0]}
          live={{ activePhase: 'eccentric', phaseElapsedMs: 1500 }}
        />
      )
      expect(screen.getByTestId('tempo-live-active')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('marks no phase active when idle (activePhase null)', () => {
      render(<TempoDisplay tempo={[3, 1, 1, 0]} live={{ activePhase: null, phaseElapsedMs: 0 }} />)
      expect(screen.queryByTestId('tempo-live-active')).not.toBeInTheDocument()
    })

    it('still renders all four phase digits in live mode', () => {
      render(
        <TempoDisplay
          tempo={[4, 3, 2, 1]}
          live={{ activePhase: 'concentric', phaseElapsedMs: 500 }}
        />
      )
      for (const digit of ['4', '3', '2', '1']) {
        expect(screen.getByText(digit)).toBeInTheDocument()
      }
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
