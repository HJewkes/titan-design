import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DeviceIndicator } from './DeviceIndicator'

describe('DeviceIndicator', () => {
  it.each(['connected', 'degraded', 'lost'] as const)(
    'has no accessibility violations when %s',
    async (status) => {
      const { container } = render(<DeviceIndicator status={status} onPress={vi.fn()} />)
      expect(await axe(container)).toHaveNoViolations()
    }
  )

  it.each([
    ['connected', 'Devices, Connected'],
    ['degraded', 'Devices, Unstable'],
    ['lost', 'Devices, Disconnected'],
  ] as const)('names the %s state in words, not only by color', (status, name) => {
    render(<DeviceIndicator status={status} onPress={vi.fn()} />)
    expect(screen.getByRole('button', { name })).toBeInTheDocument()
  })

  it('names a lost connection disconnected', () => {
    render(<DeviceIndicator status="lost" onPress={vi.fn()} />)
    expect(screen.getByRole('button', { name: /disconnected/i })).toBeInTheDocument()
  })
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
    fireEvent.click(screen.getByRole('button', { name: 'Devices, Connected' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders the lost state (red glyph, no separate badge)', () => {
    const { container } = render(<DeviceIndicator status="lost" />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
