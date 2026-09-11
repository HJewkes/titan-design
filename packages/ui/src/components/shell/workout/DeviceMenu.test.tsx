import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeviceMenu } from './DeviceMenu'
import { type Device } from './DeviceRow'

const devices: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
  { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' },
]

describe('DeviceMenu', () => {
  it('renders the trigger glyph and opens the device list on click', () => {
    render(<DeviceMenu devices={devices} />)
    const trigger = screen.getByRole('button', { name: 'Devices' })
    expect(screen.queryByText('Left Cable')).not.toBeInTheDocument()
    fireEvent.click(trigger)
    expect(screen.getByText('Left Cable')).toBeInTheDocument()
    expect(screen.getByText(/2 bound · 1 available/)).toBeInTheDocument()
  })

  it('reports a controlled open state', () => {
    render(<DeviceMenu devices={devices} isOpen />)
    expect(screen.getByText('Right Cable')).toBeInTheDocument()
  })

  it('fires onSelectDevice when a row is tapped', () => {
    const onSelectDevice = vi.fn()
    render(<DeviceMenu devices={devices} isOpen onSelectDevice={onSelectDevice} />)
    fireEvent.click(screen.getByText('Left Cable'))
    expect(onSelectDevice).toHaveBeenCalledWith(expect.objectContaining({ id: 'Voltra-A3F2' }))
  })

  it('renders regardless of the aggregate worst-of state (degraded / lost bound device)', () => {
    const degraded: Device[] = [{ id: 'D', nickname: 'Left', slot: 'L', state: 'degraded' }]
    const lost: Device[] = [{ id: 'L', nickname: 'Left', slot: 'L', state: 'lost' }]
    expect(render(<DeviceMenu devices={degraded} />).container.firstChild).toBeInTheDocument()
    expect(render(<DeviceMenu devices={lost} />).container.firstChild).toBeInTheDocument()
  })
})
