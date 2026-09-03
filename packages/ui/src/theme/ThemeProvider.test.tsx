import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { ThemeProvider } from './ThemeProvider'
import { useSurfaceMode } from '../components/ui/surface'

// Reports the surface mode ThemeProvider seeds into the on-surface context.
function ModeProbe() {
  return <Text>{useSurfaceMode()}</Text>
}

describe('ThemeProvider', () => {
  it('renders its children', () => {
    render(
      <ThemeProvider>
        <Text>inside</Text>
      </ThemeProvider>,
    )
    expect(screen.getByText('inside')).toBeInTheDocument()
  })

  it('accepts a light mode without error', () => {
    render(
      <ThemeProvider mode="light">
        <Text>light</Text>
      </ThemeProvider>,
    )
    expect(screen.getByText('light')).toBeInTheDocument()
  })

  it('seeds the on-surface context with an explicit mode', () => {
    render(
      <ThemeProvider mode="light">
        <ModeProbe />
      </ThemeProvider>,
    )
    expect(screen.getByText('light')).toBeInTheDocument()
  })

  it('falls back to dark for mode="system" when no scheme is applied', () => {
    render(
      <ThemeProvider mode="system">
        <ModeProbe />
      </ThemeProvider>,
    )
    expect(screen.getByText('dark')).toBeInTheDocument()
  })
})
