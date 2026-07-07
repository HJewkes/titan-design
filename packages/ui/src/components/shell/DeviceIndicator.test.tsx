import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeviceIndicator } from './DeviceIndicator'

describe('DeviceIndicator', () => {
  it('renders each connection state', () => {
    const states = ['connected', 'degraded', 'lost'] as const
    states.forEach((status) => {
      const { unmount, container } = render(<DeviceIndicator status={status} />)
      expect(container.firstChild).toBeInTheDocument()
      unmount()
    })
  })

  it('exposes a button role and fires onPress when interactive', () => {
    const onPress = vi.fn()
    render(<DeviceIndicator onPress={onPress} />)
    fireEvent.click(screen.getByRole('button', { name: 'Devices' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders an alert badge without crashing', () => {
    const { container } = render(<DeviceIndicator status="lost" alert />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
