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

  it('applies inline height for each size', () => {
    const { rerender } = render(
      <AppBar size="sm">
        <span>Small</span>
      </AppBar>
    )
    expect(screen.getByRole('banner').style.height).toBe('48px')

    rerender(
      <AppBar size="md">
        <span>Medium</span>
      </AppBar>
    )
    expect(screen.getByRole('banner').style.height).toBe('73px')

    rerender(
      <AppBar size="lg">
        <span>Large</span>
      </AppBar>
    )
    expect(screen.getByRole('banner').style.height).toBe('80px')
  })

  it('applies solid variant inline background by default', () => {
    render(
      <AppBar>
        <span>Solid bar</span>
      </AppBar>
    )
    const bar = screen.getByRole('banner')
    expect(bar.style.backgroundColor).toBeTruthy()
  })

  it('applies glass variant inline backdrop filter', () => {
    render(
      <AppBar variant="glass">
        <span>Glass bar</span>
      </AppBar>
    )
    const bar = screen.getByRole('banner')
    expect(bar.style.backdropFilter).toContain('blur')
  })

  it('accepts custom className without error', () => {
    render(
      <AppBar className="custom-class">
        <span>Content</span>
      </AppBar>
    )
    expect(screen.getByRole('banner')).toBeInTheDocument()
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
  it('renders action children', () => {
    render(
      <AppBar>
        <AppBarActions>
          <button>Login</button>
        </AppBarActions>
      </AppBar>
    )
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('applies auto margin via inline style', () => {
    render(
      <AppBar>
        <AppBarActions>
          <button>Login</button>
        </AppBarActions>
      </AppBar>
    )
    const actions = screen.getByText('Login').parentElement!
    expect(actions.style.marginLeft).toBe('auto')
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

  it('inherits variant from parent — glass applies backdrop filter', () => {
    render(
      <AppBar variant="glass">
        <AppBarSubHeader>
          <span>Sub</span>
        </AppBarSubHeader>
      </AppBar>
    )
    const sub = screen.getByText('Sub').parentElement!
    expect(sub.style.backdropFilter).toContain('blur')
  })

  it('allows variant override — solid overrides glass', () => {
    render(
      <AppBar variant="glass">
        <AppBarSubHeader variant="solid">
          <span>Sub</span>
        </AppBarSubHeader>
      </AppBar>
    )
    const sub = screen.getByText('Sub').parentElement!
    expect(sub.style.backdropFilter).toBeFalsy()
    expect(sub.style.backgroundColor).toBeTruthy()
  })

  it('applies top offset from parent size via inline style', () => {
    render(
      <AppBar size="md">
        <AppBarSubHeader>
          <span>Sub</span>
        </AppBarSubHeader>
      </AppBar>
    )
    const sub = screen.getByText('Sub').parentElement!
    expect(sub.style.top).toBe('73px')
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
