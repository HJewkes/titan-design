import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { TempoDisplay } from './TempoDisplay'

describe('TempoDisplay', () => {
  it('renders tempo values', () => {
    render(<TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} />)
    expect(screen.getByTestId('tempo-value')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not render Tempo label prefix', () => {
    render(<TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} />)
    expect(screen.queryByText('Tempo')).not.toBeInTheDocument()
  })

  it('renders colored phases by default', () => {
    render(<TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} />)
    const tempoValue = screen.getByTestId('tempo-value')
    expect(tempoValue.children.length).toBeGreaterThan(1)
  })

  it('renders mono variant', () => {
    render(<TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} colored={false} />)
    expect(screen.getByText('1-1-3-0')).toBeInTheDocument()
  })

  it('renders order: concentric-hold-eccentric-idle', () => {
    render(<TempoDisplay concentric={2} hold={3} eccentric={4} idle={1} colored={false} />)
    expect(screen.getByText('2-3-4-1')).toBeInTheDocument()
  })

  it('has correct accessibility label', () => {
    render(<TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} />)
    expect(screen.getByLabelText(/Tempo: 1 second concentric/)).toBeInTheDocument()
  })

  it('is always a Pressable for tooltip', () => {
    render(<TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} />)
    const display = screen.getByTestId('tempo-display')
    expect(display).toBeInTheDocument()
  })

  it('calls onPress when pressed', () => {
    const onPress = vi.fn()
    render(<TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} onPress={onPress} />)
    const display = screen.getByTestId('tempo-display')
    fireEvent.click(display)
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('toggles tooltip on press', () => {
    render(<TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} />)
    expect(screen.queryByTestId('tempo-tooltip')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('tempo-display'))
    expect(screen.getByTestId('tempo-tooltip')).toBeInTheDocument()
  })

  describe('sizes', () => {
    it('renders at sm size', () => {
      render(<TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} size="sm" />)
      expect(screen.getByTestId('tempo-value')).toBeInTheDocument()
    })

    it('renders at md size', () => {
      render(<TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} size="md" />)
      expect(screen.getByTestId('tempo-value')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
