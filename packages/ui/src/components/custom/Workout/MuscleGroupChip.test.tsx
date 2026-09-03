import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MuscleGroupChip } from './MuscleGroupChip'

describe('MuscleGroupChip', () => {
  it('renders muscle group name', () => {
    render(<MuscleGroupChip name="Chest" />)
    expect(screen.getByText('Chest')).toBeInTheDocument()
  })

  it('renders the colored dot', () => {
    render(<MuscleGroupChip name="Quads" volumeStatus="ontrack" />)
    expect(screen.getByTestId('muscle-group-chip-dot')).toBeInTheDocument()
  })

  it('sets accessibility label with name and status', () => {
    render(<MuscleGroupChip name="Back" volumeStatus="behind" />)
    expect(screen.getByLabelText('Back, volume status: behind')).toBeInTheDocument()
  })

  it('sets accessibility label with no status when omitted', () => {
    render(<MuscleGroupChip name="Biceps" />)
    expect(screen.getByLabelText('Biceps, volume status: no status')).toBeInTheDocument()
  })

  it('wraps in Pressable when onPress is provided', () => {
    const onPress = vi.fn()
    render(<MuscleGroupChip name="Chest" onPress={onPress} />)
    const pressable = screen.getByTestId('muscle-group-chip-pressable')
    fireEvent.click(pressable)
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('does not render Pressable when onPress is omitted', () => {
    render(<MuscleGroupChip name="Chest" />)
    expect(screen.queryByTestId('muscle-group-chip-pressable')).not.toBeInTheDocument()
  })

  it('renders all volume status variants without error', () => {
    const statuses = ['untrained', 'behind', 'ontrack', 'target', 'over'] as const
    const { rerender } = render(<MuscleGroupChip name="Test" volumeStatus="untrained" />)
    for (const status of statuses) {
      rerender(<MuscleGroupChip name="Test" volumeStatus={status} />)
      expect(screen.getByText('Test')).toBeInTheDocument()
    }
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <MuscleGroupChip name="Chest" volumeStatus="ontrack" onPress={() => {}} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations as static chip', async () => {
      const { container } = render(<MuscleGroupChip name="Quads" volumeStatus="behind" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('pressable has correct accessibility label', () => {
      render(<MuscleGroupChip name="Back" volumeStatus="target" onPress={() => {}} />)
      expect(screen.getByLabelText('Back, volume status: target')).toBeInTheDocument()
    })
  })
})
