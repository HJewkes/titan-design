import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MuscleStrip, type MuscleStripMuscleData } from './MuscleStrip'
import { MuscleGroup, MUSCLE_DISPLAY_NAMES, type VolumeStatus } from './muscleTaxonomy'

const ALL_MUSCLES = Object.values(MuscleGroup)

function buildData(
  overrides: Partial<Record<MuscleGroup, MuscleStripMuscleData>> = {}
): Record<MuscleGroup, MuscleStripMuscleData> {
  return ALL_MUSCLES.reduce(
    (acc, muscle) => {
      acc[muscle] = overrides[muscle] ?? { sets: 0, target: 0, volumeStatus: 'untrained' }
      return acc
    },
    {} as Record<MuscleGroup, MuscleStripMuscleData>
  )
}

describe('MuscleStrip', () => {
  it('renders all 15 muscle group chips', () => {
    render(<MuscleStrip data={buildData()} />)
    for (const muscle of ALL_MUSCLES) {
      expect(
        screen.getByLabelText(new RegExp(`^${MUSCLE_DISPLAY_NAMES[muscle]} `))
      ).toBeInTheDocument()
    }
  })

  it('renders each chip with its sets/target label', () => {
    render(
      <MuscleStrip
        data={buildData({
          [MuscleGroup.CHEST]: { sets: 12, target: 14, volumeStatus: 'ontrack' },
          [MuscleGroup.LATS]: { sets: 6, target: 14, volumeStatus: 'behind' },
        })}
      />
    )
    expect(screen.getByText('Chest 12/14')).toBeInTheDocument()
    expect(screen.getByText('Lats 6/14')).toBeInTheDocument()
  })

  it('renders each chip with its volume status', () => {
    render(
      <MuscleStrip
        data={buildData({
          [MuscleGroup.CHEST]: { sets: 12, target: 14, volumeStatus: 'over' },
        })}
      />
    )
    expect(screen.getByLabelText('Chest 12/14, volume status: over')).toBeInTheDocument()
  })

  it('carries the pressed muscle group slug to onMusclePress', () => {
    const onMusclePress = vi.fn()
    render(
      <MuscleStrip
        data={buildData({
          [MuscleGroup.QUADS]: { sets: 8, target: 12, volumeStatus: 'target' },
        })}
        onMusclePress={onMusclePress}
      />
    )
    fireEvent.click(screen.getByLabelText('Quads 8/12, volume status: target'))
    expect(onMusclePress).toHaveBeenCalledOnce()
    expect(onMusclePress).toHaveBeenCalledWith(MuscleGroup.QUADS)
  })

  it('does not wrap chips in a pressable when onMusclePress is omitted', () => {
    render(
      <MuscleStrip
        data={buildData({
          [MuscleGroup.CHEST]: { sets: 12, target: 14, volumeStatus: 'ontrack' },
        })}
      />
    )
    expect(screen.queryByTestId('muscle-group-chip-pressable')).not.toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<MuscleStrip data={buildData()} onMusclePress={() => {}} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('status per muscle', () => {
    const statuses: VolumeStatus[] = [
      'untrained',
      'behind',
      'ontrack',
      'target',
      'approaching',
      'over',
    ]

    it.each(statuses)('renders the %s status on a single muscle', (status) => {
      render(
        <MuscleStrip
          data={buildData({
            [MuscleGroup.GLUTES]: { sets: 5, target: 10, volumeStatus: status },
          })}
        />
      )
      expect(screen.getByLabelText(`Glutes 5/10, volume status: ${status}`)).toBeInTheDocument()
    })
  })
})
