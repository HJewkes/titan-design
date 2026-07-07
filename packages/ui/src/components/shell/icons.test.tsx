import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { VoltrasMark, BluetoothIcon } from './icons'

describe('shell icons', () => {
  it('render an svg', () => {
    const { container } = render(<VoltrasMark />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('a titled icon is exposed as an accessible image', () => {
    render(<BluetoothIcon title="Devices" />)
    expect(screen.getByRole('img', { name: 'Devices' })).toBeInTheDocument()
  })

  it('an untitled icon is decorative (aria-hidden, no role)', () => {
    const { container } = render(<VoltrasMark />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('role')).toBeNull()
  })

  it('honor size + strokeWidth', () => {
    const { container } = render(<BluetoothIcon size={32} strokeWidth={3} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('32')
    expect(svg.getAttribute('stroke-width')).toBe('3')
  })

  it('a decorative icon has no accessibility violations', async () => {
    const { container } = render(<BluetoothIcon />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
