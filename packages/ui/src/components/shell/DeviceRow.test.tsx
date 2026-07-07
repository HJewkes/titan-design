import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeviceRow, type Device } from './DeviceRow'

const bound: Device = { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' }
const unbound: Device = { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' }

describe('DeviceRow', () => {
  it('renders the device name and Bluetooth id', () => {
    render(<DeviceRow device={bound} />)
    expect(screen.getByText('Left Cable')).toBeInTheDocument()
    expect(screen.getByText('Voltra-A3F2')).toBeInTheDocument()
  })

  it('omits the redundant status text and slot pill (dot + name carry it)', () => {
    render(<DeviceRow device={bound} />)
    expect(screen.queryByText('connected')).not.toBeInTheDocument()
    expect(screen.queryByText('SLOT L')).not.toBeInTheDocument()
  })

  it('renders an unbound device by name', () => {
    render(<DeviceRow device={unbound} />)
    expect(screen.getByText('Spare')).toBeInTheDocument()
    expect(screen.getByText('Voltra-77E0')).toBeInTheDocument()
  })
})
