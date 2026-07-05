import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { ThemeProvider } from './ThemeProvider'

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
})
