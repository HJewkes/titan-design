import { describe, it, expect } from 'vitest'
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
})
