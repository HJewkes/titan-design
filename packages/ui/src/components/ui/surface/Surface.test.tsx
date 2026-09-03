import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { axe } from 'jest-axe'
import { Surface } from './Surface'
import {
  onSurfaceColors,
  surfaceBackground,
  pressedLevel,
  useOnSurfaceColor,
  useSurface,
  useSurfaceMode,
} from './SurfaceContext'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { getPressedRecessShadow } from '../../../theme/elevation'

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
    // elevation 0 → base surface (surface-elevated) with no lightening.
    // TD-surface-tokens S-3 re-space: was #2A2827.
    expect(screen.getByTestId('s')).toHaveStyle({ backgroundColor: '#2C2A28' })
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
    ['background', '#1C1916'],
    ['base', '#252321'],
    ['elevated', '#2C2A28'],
    ['raised', '#31302F'],
  ] as const)('maps level %s to the surface-ramp token %s', (level, hex) => {
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

// A descendant probe that reports the surface LEVEL it resolves from context,
// so tests can assert what a nested Surface publishes to its children.
function LevelProbe({ label = 'lvl' }) {
  const { level } = useSurface()
  return <Text testID={label}>{level}</Text>
}

// CIELAB L* (perceptual lightness) — same calc as surface.contract.test, so the
// "darker" assertions measure the metric the ramp was designed against.
function lstar(hex: string): number {
  const h = hex.replace('#', '')
  const lin = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  const y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  return y <= 0.008856 ? y * 903.3 : 116 * Math.cbrt(y) - 16
}

describe('Surface (pressed well)', () => {
  it.each([
    // TD-surface-tokens S-3 re-space: top steps widened (elevated #2C2A28,
    // raised #31302F, overlay #373635); base/background unchanged.
    ['overlay', '#373635', '#31302F'], // → raised
    ['raised', '#31302F', '#2C2A28'], // → elevated
    ['elevated', '#2C2A28', '#252321'], // → base
    ['base', '#252321', '#1C1916'], // → background
  ] as const)(
    'in a %s parent renders one ramp step down (%s → %s), darker than its parent',
    (parent, parentHex, pressedHex) => {
      render(
        <Surface level={parent}>
          <Surface pressed testID="well" />
        </Surface>
      )
      expect(screen.getByTestId('well')).toHaveStyle({ backgroundColor: pressedHex })
      expect(lstar(pressedHex)).toBeLessThan(lstar(parentHex))
    }
  )

  it('with no enclosing Surface (default base) presses to the background plane', () => {
    render(<Surface pressed testID="well" />)
    expect(screen.getByTestId('well')).toHaveStyle({ backgroundColor: '#1C1916' })
  })

  it('clamps at the frame floor: pressed directly in background does not underflow', () => {
    render(
      <Surface level="background">
        <Surface pressed testID="well" />
      </Surface>
    )
    // background (#1C1916) steps down to the frame floor (#100D0A), the bezel.
    expect(screen.getByTestId('well')).toHaveStyle({ backgroundColor: '#100D0A' })
  })

  it('does not step below the floor: pressed within a floor-pressed well stays at frame', () => {
    render(
      <Surface level="background">
        <Surface pressed>
          <Surface pressed testID="deeper" />
        </Surface>
      </Surface>
    )
    expect(screen.getByTestId('deeper')).toHaveStyle({ backgroundColor: '#100D0A' })
  })

  it('publishes the stepped-down level to descendants so a nested press steps again', () => {
    render(
      <Surface level="raised">
        <Surface pressed>
          <LevelProbe label="lvl" />
        </Surface>
      </Surface>
    )
    // raised → elevated; descendants read the well's own level.
    expect(screen.getByTestId('lvl')).toHaveTextContent('elevated')
  })

  it('adds an inner-shadow recess composed with the darker fill (web path)', () => {
    render(
      <Surface level="base">
        <Surface pressed testID="well" />
      </Surface>
    )
    const boxShadow = screen.getByTestId('well').style.boxShadow
    expect(boxShadow).toContain('inset')
  })

  it('reads recessed via the darker fill alone when the shadow path is absent (no-shadow/native)', () => {
    // The recess is carried by BOTH fill + shadow; strip the shadow and the fill
    // still darkens one ramp step, so a pressed surface never becomes invisible.
    render(
      <Surface level="base">
        <Surface pressed testID="well" style={{ boxShadow: undefined }} />
      </Surface>
    )
    expect(screen.getByTestId('well')).toHaveStyle({ backgroundColor: '#1C1916' })
    expect(lstar('#1C1916')).toBeLessThan(lstar('#252321'))
  })

  it('rounds the well by default and honours an explicit rounded override', () => {
    render(
      <Surface level="base">
        <Surface pressed testID="rounded" />
        <Surface pressed rounded={false} testID="flat" />
      </Surface>
    )
    expect(screen.getByTestId('rounded')).toBeInTheDocument()
    expect(screen.getByTestId('flat')).toBeInTheDocument()
  })
})

describe('pressedLevel helper', () => {
  it.each([
    ['overlay', 'raised'],
    ['raised', 'elevated'],
    ['elevated', 'base'],
    ['base', 'background'],
    ['background', 'frame'],
    ['frame', 'frame'],
  ] as const)('steps %s down to %s (clamped at frame)', (parent, expected) => {
    expect(pressedLevel(parent)).toBe(expected)
  })
})

describe('getPressedRecessShadow', () => {
  it('returns an inset recess tuned to the fill colour on the web path', () => {
    const style = getPressedRecessShadow('#1C1916', 'dark') as { boxShadow?: string }
    expect(style.boxShadow).toContain('inset')
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
    const t = getSemanticColors('dark')
    expect(screen.getByTestId('p')).toHaveStyle({ color: t['text-primary'] })
    expect(screen.getByTestId('s')).toHaveStyle({ color: t['text-secondary'] })
    expect(screen.getByTestId('t')).toHaveStyle({ color: t['text-tertiary'] })
  })

  it('resolves dark on-surface colours even with no enclosing Surface', () => {
    render(<Probe role="primary" label="p" />)
    expect(screen.getByTestId('p')).toHaveStyle({
      color: getSemanticColors('dark')['text-primary'],
    })
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
    expect(surfaceBackground('elevated', 'dark')).toBe('#2C2A28')
    expect(surfaceBackground('background', 'dark')).toBe('#1C1916')
    expect(surfaceBackground('base', 'light')).toBe('#FFFFFF')
  })

  it('resolves the frame floor from its own semantic token', () => {
    // The old `inset` level had no token and fell back to a primitive. `frame`
    // has `background-frame`, which is what let SurfaceContext drop the special
    // case in surfaceBackground().
    expect(surfaceBackground('frame', 'dark')).toBe(getSemanticColors('dark')['background-frame'])
  })

  it('onSurfaceColors returns the text ramp as literal hex', () => {
    const t = getSemanticColors('dark')
    const got = onSurfaceColors('dark')
    expect(got).toEqual({
      primary: t['text-primary'],
      secondary: t['text-secondary'],
      tertiary: t['text-tertiary'],
    })
    // The actual contract this test guards: LITERAL hex, never a var() — under
    // the RNW alias resolveColor() returns 'var(--color-…)', which silently
    // breaks any consumer doing colour maths on the result.
    for (const [role, value] of Object.entries(got)) {
      expect(value, role).toMatch(/^#[0-9A-F]{6}$/i)
    }
  })
})
