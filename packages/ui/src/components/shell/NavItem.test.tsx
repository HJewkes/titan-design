import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NavItem } from './NavItem'
import { ActivityIcon } from '../icons'

const icon = <ActivityIcon size={20} color="currentColor" />

describe('NavItem', () => {
  it('renders the label and is exposed as a tab', () => {
    render(<NavItem icon={icon} label="Live" />)
    expect(screen.getByRole('tab', { name: 'Live' })).toBeInTheDocument()
  })

  it('shows the accent bar when active', () => {
    render(<NavItem icon={icon} label="Live" active />)
    expect(screen.getByTestId('nav-item-accent')).toBeInTheDocument()
  })

  it('hides the accent bar when inactive', () => {
    render(<NavItem icon={icon} label="Live" />)
    expect(screen.queryByTestId('nav-item-accent')).toBeNull()
  })

  it('fires onPress when tapped', () => {
    const onPress = vi.fn()
    render(<NavItem icon={icon} label="Live" onPress={onPress} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Live' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders the live-elsewhere state', () => {
    const { container } = render(<NavItem icon={icon} label="Live" live />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
