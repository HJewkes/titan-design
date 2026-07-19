import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { axe } from 'jest-axe'
import { Surface } from './Surface'
import {
  onSurfaceColors,
  surfaceBackground,
  useOnSurfaceColor,
  useSurfaceMode,
} from './SurfaceContext'

// A descendant probe that renders the on-surface colour + mode it resolves from
// context, so tests can assert what a nested consumer would actually paint.
function Probe({ role = 'primary' as const, label = 'probe' }) {
  const color = useOnSurfaceColor(role)
  const mode = useSurfaceMode()
  return (
    <Text testID={label} style={{ color }}>
      {mode}
    </Text>
  )
}

describe('Surface (card model)', () => {
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

  it('paints the default flat dark card surface', () => {
    render(<Surface testID="s" />)
    // elevation 0 → base surface (surface-elevated, charcoal 600) with no lightening.
    expect(screen.getByTestId('s')).toHaveStyle({ backgroundColor: '#191919' })
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

describe('Surface (named plane)', () => {
  it.each([
    ['background', '#101010'],
    ['base', '#161616'],
    ['elevated', '#191919'],
    ['raised', '#1C1C1C'],
  ] as const)('maps level %s to the charcoal token %s', (level, hex) => {
    render(<Surface level={level} testID="s" />)
    expect(screen.getByTestId('s')).toHaveStyle({ backgroundColor: hex })
  })

  it('resolves the light-mode background when theme is overridden', () => {
    render(<Surface level="base" theme="light" testID="s" />)
    expect(screen.getByTestId('s')).toHaveStyle({ backgroundColor: '#FFFFFF' })
  })

  it('lets a caller style override the owned background', () => {
    render(<Surface level="base" testID="s" style={{ backgroundColor: '#000000' }} />)
    expect(screen.getByTestId('s')).toHaveStyle({ backgroundColor: '#000000' })
  })
})

describe('Surface on-surface colour context', () => {
  it('gives descendants literal-hex dark text colours', () => {
    render(
      <Surface level="background">
        <Probe role="primary" label="p" />
        <Probe role="secondary" label="s" />
        <Probe role="tertiary" label="t" />
      </Surface>
    )
    expect(screen.getByTestId('p')).toHaveStyle({ color: '#F3F4F6' })
    expect(screen.getByTestId('s')).toHaveStyle({ color: '#9CA3AF' })
    expect(screen.getByTestId('t')).toHaveStyle({ color: '#6B7280' })
  })

  it('resolves dark on-surface colours even with no enclosing Surface', () => {
    render(<Probe role="primary" label="p" />)
    expect(screen.getByTestId('p')).toHaveStyle({ color: '#F3F4F6' })
  })

  it('flows an overridden theme to descendant text', () => {
    render(
      <Surface theme="light">
        <Probe role="primary" label="p" />
      </Surface>
    )
    expect(screen.getByTestId('p')).toHaveStyle({ color: '#121828' })
    expect(screen.getByTestId('p')).toHaveTextContent('light')
  })

  it('inherits mode through a nested Surface that sets only a level', () => {
    render(
      <Surface theme="light" level="background">
        <Surface level="raised">
          <Probe role="primary" label="p" />
        </Surface>
      </Surface>
    )
    expect(screen.getByTestId('p')).toHaveStyle({ color: '#121828' })
  })
})

describe('surface colour helpers', () => {
  it('surfaceBackground returns literal hex per level + mode', () => {
    expect(surfaceBackground('elevated', 'dark')).toBe('#191919')
    expect(surfaceBackground('background', 'dark')).toBe('#101010')
    expect(surfaceBackground('base', 'light')).toBe('#FFFFFF')
  })

  it('onSurfaceColors returns the neutral text ramp as literal hex', () => {
    expect(onSurfaceColors('dark')).toEqual({
      primary: '#F3F4F6',
      secondary: '#9CA3AF',
      tertiary: '#6B7280',
    })
  })
})
