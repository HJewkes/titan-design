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
  it('renders no caption strip — the bars carry the read alone', () => {
    render(<RomProgressionChart points={points} workingStandardM={0.88} shortThresholdM={0.66} />)
    expect(screen.queryByText(/depth vs working range/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^now /)).not.toBeInTheDocument()
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
