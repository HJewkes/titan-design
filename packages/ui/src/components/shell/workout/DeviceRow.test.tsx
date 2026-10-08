import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DeviceRow, type Device } from './DeviceRow'
import { resolveAll, spacingClassesAt } from '../../../test/spacing-resolver'

const bound: Device = { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' }
const unbound: Device = { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' }

describe('DeviceRow', () => {
  it.each(['connected', 'available', 'degraded', 'lost'] as const)(
    'has no accessibility violations when %s',
    async (state) => {
      const { container } = render(<DeviceRow device={{ ...bound, state }} onPress={vi.fn()} />)
      expect(await axe(container)).toHaveNoViolations()
    }
  )

  it.each([
    ['connected', 'Connected'],
    ['available', 'Available'],
    ['degraded', 'Unstable'],
    ['lost', 'Disconnected'],
  ] as const)('names the %s dot in words, not only by color', (state, name) => {
    render(<DeviceRow device={{ ...bound, state }} />)
    expect(screen.getByRole('img', { name })).toBeInTheDocument()
  })

  it('names a degraded connection unstable', () => {
    render(<DeviceRow device={{ ...bound, state: 'degraded' }} />)
    expect(screen.getByRole('img', { name: /unstable/i })).toBeInTheDocument()
  })
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

  it('renders every connection state without crashing', () => {
    const states = ['connected', 'available', 'degraded', 'lost'] as const
    states.forEach((state) => {
      const { unmount, container } = render(
        <DeviceRow device={{ id: 'X', nickname: 'Cable', slot: 'L', state }} />
      )
      expect(container.firstChild).toBeInTheDocument()
      unmount()
    })
  })
})

/**
 * The device row's spacing, pinned (AW-142 wave three).
 *
 * `px-2 py-[9px]` was 8 across and 9 down — the specimen's pixel, with no
 * optical reason to be off the grain — and squares up to `p-inset-sm` at 8/8.
 * The 10px dot-to-name gap sits between the inline rungs 8 and 12, so it stays
 * the numeric rung `gap-2.5`.
 */
describe('DeviceRow geometry resolves to the spacing tokens', () => {
  it('ships gap-2.5 and p-inset-sm', () => {
    render(<DeviceRow device={bound} />)
    expect(spacingClassesAt(screen.getByText('Left Cable').parentElement)).toEqual([
      'gap-2.5',
      'p-inset-sm',
    ])
    expect(resolveAll(['gap-2.5', 'p-inset-sm'])).toEqual(['10px', '8px'])
  })
})
