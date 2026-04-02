import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  AppBar,
  AppBarBrand,
  AppBarNav,
  AppBarActions,
  AppBarSubHeader,
} from './AppBar'

describe('AppBar', () => {
  it('renders children', () => {
    render(
      <AppBar>
        <span>Header content</span>
      </AppBar>
    )
    expect(screen.getByText('Header content')).toBeInTheDocument()
  })

  it('has banner accessibility role', () => {
    render(
      <AppBar>
        <span>Nav</span>
      </AppBar>
    )
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('applies sticky position classes by default', () => {
    render(
      <AppBar testID="bar">
        <span>Content</span>
      </AppBar>
    )
    const bar = screen.getByRole('banner')
    expect(bar.className).toContain('sticky')
    expect(bar.className).toContain('top-0')
    expect(bar.className).toContain('z-50')
  })

  it('applies fixed position classes', () => {
    render(
      <AppBar position="fixed">
        <span>Content</span>
      </AppBar>
    )
    const bar = screen.getByRole('banner')
    expect(bar.className).toContain('fixed')
    expect(bar.className).toContain('left-0')
    expect(bar.className).toContain('right-0')
  })

  it('applies glass variant with backdrop blur classes', () => {
    render(
      <AppBar variant="glass">
        <span>Glass bar</span>
      </AppBar>
    )
    const bar = screen.getByRole('banner')
    expect(bar.className).toContain('backdrop-blur-lg')
    expect(bar.className).toContain('shadow-sm')
  })

  it('applies solid variant classes by default', () => {
    render(
      <AppBar>
        <span>Solid bar</span>
      </AppBar>
    )
    const bar = screen.getByRole('banner')
    expect(bar.className).toContain('bg-surface-base')
    expect(bar.className).toContain('border-b')
  })

  it('applies size classes', () => {
    const { rerender } = render(
      <AppBar size="sm">
        <span>Small</span>
      </AppBar>
    )
    expect(screen.getByRole('banner').className).toContain('h-12')

    rerender(
      <AppBar size="lg">
        <span>Large</span>
      </AppBar>
    )
    expect(screen.getByRole('banner').className).toContain('h-20')
  })

  it('merges custom className', () => {
    render(
      <AppBar className="custom-class">
        <span>Content</span>
      </AppBar>
    )
    expect(screen.getByRole('banner').className).toContain('custom-class')
  })
})

describe('AppBarBrand', () => {
  it('renders children', () => {
    render(
      <AppBar>
        <AppBarBrand>
          <span>Brand Logo</span>
        </AppBarBrand>
      </AppBar>
    )
    expect(screen.getByText('Brand Logo')).toBeInTheDocument()
  })

  it('renders as a button when onClick is provided', () => {
    render(
      <AppBar>
        <AppBarBrand onClick={() => {}}>
          <span>Clickable Brand</span>
        </AppBarBrand>
      </AppBar>
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const onClick = vi.fn()
    render(
      <AppBar>
        <AppBarBrand onClick={onClick}>
          <span>Click me</span>
        </AppBarBrand>
      </AppBar>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not render as button without onClick', () => {
    render(
      <AppBar>
        <AppBarBrand>
          <span>Static Brand</span>
        </AppBarBrand>
      </AppBar>
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('AppBarNav', () => {
  it('renders navigation children', () => {
    render(
      <AppBar>
        <AppBarNav>
          <span>Dashboard</span>
          <span>Settings</span>
        </AppBarNav>
      </AppBar>
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })
})

describe('AppBarActions', () => {
  it('renders action children on the right', () => {
    render(
      <AppBar>
        <AppBarActions>
          <button>Login</button>
        </AppBarActions>
      </AppBar>
    )
    const actions = screen.getByText('Login').parentElement!
    expect(actions.className).toContain('ml-auto')
  })
})

describe('AppBarSubHeader', () => {
  it('renders below main bar', () => {
    render(
      <AppBar variant="glass">
        <span>Main bar</span>
        <AppBarSubHeader>
          <span>Sub content</span>
        </AppBarSubHeader>
      </AppBar>
    )
    expect(screen.getByText('Sub content')).toBeInTheDocument()
  })

  it('inherits variant from parent AppBar', () => {
    render(
      <AppBar variant="glass">
        <AppBarSubHeader testID="sub">
          <span>Sub</span>
        </AppBarSubHeader>
      </AppBar>
    )
    const sub = screen.getByText('Sub').parentElement!
    expect(sub.className).toContain('backdrop-blur-lg')
  })

  it('allows variant override', () => {
    render(
      <AppBar variant="glass">
        <AppBarSubHeader variant="solid" testID="sub">
          <span>Sub</span>
        </AppBarSubHeader>
      </AppBar>
    )
    const sub = screen.getByText('Sub').parentElement!
    expect(sub.className).toContain('bg-surface-base')
    expect(sub.className).not.toContain('backdrop-blur-lg')
  })

  it('applies sticky positioning with correct top offset', () => {
    render(
      <AppBar size="md">
        <AppBarSubHeader testID="sub">
          <span>Sub</span>
        </AppBarSubHeader>
      </AppBar>
    )
    const sub = screen.getByText('Sub').parentElement!
    expect(sub.className).toContain('sticky')
    expect(sub.className).toContain('top-[73px]')
  })
})

describe('full composition', () => {
  it('renders complete AppBar with all slots', () => {
    render(
      <AppBar position="sticky" variant="glass">
        <AppBarBrand onClick={() => {}}>
          <span>My App</span>
        </AppBarBrand>
        <AppBarNav>
          <span>Dashboard</span>
          <span>Settings</span>
        </AppBarNav>
        <AppBarActions>
          <button>Sign In</button>
        </AppBarActions>
      </AppBar>
    )

    expect(screen.getByText('My App')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })
})
