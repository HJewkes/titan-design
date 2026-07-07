import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeviceRow, type Device } from './DeviceRow'

const bound: Device = { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' }
const unbound: Device = { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' }

describe('DeviceRow', () => {
  it('renders nickname, id, slot binding and connection state', () => {
    render(<DeviceRow device={bound} />)
    expect(screen.getByText('Left Cable')).toBeInTheDocument()
    expect(screen.getByText('Voltra-A3F2')).toBeInTheDocument()
    expect(screen.getByText('SLOT L')).toBeInTheDocument()
    expect(screen.getByText('connected')).toBeInTheDocument()
  })

  it('shows "unbound" for a device with no slot', () => {
    render(<DeviceRow device={unbound} />)
    expect(screen.getByText('unbound')).toBeInTheDocument()
    expect(screen.getByText('available')).toBeInTheDocument()
  })
})
