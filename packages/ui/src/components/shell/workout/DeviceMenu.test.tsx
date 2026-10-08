import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DeviceMenu } from './DeviceMenu'
import { type Device } from './DeviceRow'
import { resolveAll, spacingClassesAt } from '../../../test/spacing-resolver'
import { capturedByNode } from '../../../test/classname-capture'

const devices: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
  { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' },
]

describe('DeviceMenu', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<DeviceMenu devices={devices} isOpen onSelectDevice={vi.fn()} />)
    expect(await axe(container)).toHaveNoViolations()
  })
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

/**
 * The menu panel's spacing, pinned (AW-142 wave three).
 *
 * The panel's 7px inset was the specimen's own pixel, not an optical
 * correction, and normalises to the 8px rung as `p-inset-sm`. The 10px drop
 * from the trigger and the header's 6px top are on the numeric scale with no
 * semantic key, so they are numeric rungs and no pixel moved there.
 */
describe('DeviceMenu geometry resolves to the spacing tokens', () => {
  const header = () => screen.getByText(/bound · .* available/)

  it.each([
    ['the panel', () => header().parentElement, ['mt-2.5', 'p-inset-sm'], ['10px', '8px']],
    ['the header label', header, ['px-2', 'pt-1.5', 'pb-2'], ['8px', '6px', '8px']],
  ] as const)('%s ships its spacing tokens', (_label, find, classes, pixels) => {
    render(<DeviceMenu devices={devices} isOpen />)
    expect(spacingClassesAt(find())).toEqual([...classes])
    expect(resolveAll([...classes])).toEqual([...pixels])
  })

  it('leaves no arbitrary spacing value behind', () => {
    render(<DeviceMenu devices={devices} isOpen />)
    const rendered = [header().parentElement, header()].map((node) =>
      capturedByNode.get(node as Element)
    )
    rendered.forEach((classes) =>
      expect(classes).not.toMatch(/\b(p|px|py|pt|pb|m|mt|gap)-\[[0-9.]+px\]/)
    )
  })
})
