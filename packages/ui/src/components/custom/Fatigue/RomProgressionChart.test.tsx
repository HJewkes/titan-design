import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { RomProgressionChart } from './RomProgressionChart'
import type { RepRomPoint } from './fatigue-model'

const points: RepRomPoint[] = [
  { repNumber: 1, romM: 0.9 },
  { repNumber: 2, romM: 0.88 },
  { repNumber: 3, romM: 0.72 },
]

describe('RomProgressionChart', () => {
  it('renders the caption', () => {
    render(<RomProgressionChart points={points} workingStandardM={0.88} shortThresholdM={0.66} />)
    expect(screen.getByText('ROM · depth vs working range')).toBeInTheDocument()
  })

  it('computes now% against the working standard', () => {
    render(<RomProgressionChart points={points} workingStandardM={0.9} shortThresholdM={0.675} />)
    // current rom 0.72 / working 0.9 = 80%
    expect(screen.getByText('now 80%')).toBeInTheDocument()
  })

  it('falls back to the tallest bar when no working standard is established', () => {
    render(<RomProgressionChart points={points} workingStandardM={null} shortThresholdM={null} />)
    // current rom 0.72 / max 0.9 = 80%
    expect(screen.getByText('now 80%')).toBeInTheDocument()
  })

  it('renders the chart container', () => {
    render(<RomProgressionChart points={points} workingStandardM={0.88} shortThresholdM={0.66} />)
    expect(screen.getByTestId('rom-progression')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <RomProgressionChart points={points} workingStandardM={0.88} shortThresholdM={0.66} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
