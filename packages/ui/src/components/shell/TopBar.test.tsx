import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { TopBar } from './TopBar'
import { type Device } from './DeviceRow'

const devices: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
]

const AT_1612 = new Date(2024, 0, 1, 16, 12) // local 16:12

describe('TopBar', () => {
  it('renders brand, state and a 24h clock', () => {
    render(<TopBar state="live" devices={devices} time={AT_1612} showClock />)
    expect(screen.getByText('VOLTRAS')).toBeInTheDocument()
    expect(screen.getByText('LIVE')).toBeInTheDocument()
    expect(screen.getByText('16:12')).toBeInTheDocument()
  })

  it('hides the clock when showClock is false', () => {
    render(<TopBar state="live" devices={devices} time={AT_1612} showClock={false} />)
    expect(screen.queryByText('16:12')).not.toBeInTheDocument()
  })

  it('hides the subtitle when showSubtitle is false', () => {
    render(<TopBar state="rest" devices={devices} showSubtitle={false} />)
    expect(screen.queryByText('/ wall dashboard')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<TopBar state="live" devices={devices} time={AT_1612} showClock />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
