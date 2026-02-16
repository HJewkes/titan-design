import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Surface } from './Surface'

describe('Surface', () => {
  it('renders children', () => {
    render(
      <Surface>
        <span>Hello</span>
      </Surface>
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('accepts elevation prop without crashing', () => {
    render(
      <Surface elevation={3}>
        <span>Elevated</span>
      </Surface>
    )
    expect(screen.getByText('Elevated')).toBeInTheDocument()
  })

  it('accepts glow props without crashing', () => {
    render(
      <Surface glowColor="#FF7900" glowIntensity="strong">
        <span>Glowing</span>
      </Surface>
    )
    expect(screen.getByText('Glowing')).toBeInTheDocument()
  })

  it('passes className through', () => {
    render(
      <Surface className="p-4" testID="surface">
        <span>Styled</span>
      </Surface>
    )
    expect(screen.getByTestId('surface')).toBeInTheDocument()
  })

  it('passes additional ViewProps', () => {
    render(
      <Surface testID="my-surface">
        <span>Content</span>
      </Surface>
    )
    expect(screen.getByTestId('my-surface')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Surface>
          <span>Accessible surface</span>
        </Surface>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
