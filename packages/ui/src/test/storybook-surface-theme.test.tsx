import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react-vite'
import preview from '../../.storybook/preview'
import { surfaceModeFromGlobals } from '../../.storybook/withSurfaceTheme'
import { useSurface } from '../components/ui/surface/SurfaceContext'
import { PLANE_ORDER, surfaceBackground } from '../theme/surface-planes'
import type { ThemeMode } from '../theme/tokens/semantic'
import * as BodyweightGoalCardStories from '../components/custom/Workout/BodyweightGoalCard.stories'

// VW-397: the Storybook theme toggle must reach SurfaceContext, not only the <html> class.

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1, 7), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

function planeColors(mode: ThemeMode): Set<string> {
  return new Set(PLANE_ORDER.map((level) => hexToRgb(surfaceBackground(level, mode))))
}

function renderedBackgrounds(theme: ThemeMode): string[] {
  const { Default } = composeStories(BodyweightGoalCardStories, {
    decorators: preview.decorators,
    initialGlobals: { theme },
  })
  const { container } = render(<Default />)
  return [...container.querySelectorAll<HTMLElement>('*')].map((el) => el.style.backgroundColor)
}

describe('Storybook theme toggle reaches the surface planes', () => {
  it('paints a custom story on light planes under the light theme', () => {
    const backgrounds = renderedBackgrounds('light')
    const light = planeColors('light')
    const dark = planeColors('dark')

    expect(backgrounds.some((bg) => light.has(bg))).toBe(true)
    expect(backgrounds.filter((bg) => dark.has(bg) && !light.has(bg))).toEqual([])
  })

  it('keeps the dark planes under the dark theme', () => {
    const backgrounds = renderedBackgrounds('dark')
    const light = planeColors('light')
    const dark = planeColors('dark')

    expect(backgrounds.some((bg) => dark.has(bg))).toBe(true)
    expect(backgrounds.filter((bg) => light.has(bg) && !dark.has(bg))).toEqual([])
  })
})

function ModeProbe() {
  const { mode, level } = useSurface()
  return <output data-testid="probe">{`${mode}/${level}`}</output>
}

const ProbeStory = { render: () => <ModeProbe /> }

function probedSurface(theme: string): string {
  const { Default } = composeStories(
    { default: { title: 'Probe', component: ModeProbe }, Default: ProbeStory },
    { decorators: preview.decorators, initialGlobals: { theme } }
  )
  render(<Default />)
  return screen.getByTestId('probe').textContent ?? ''
}

describe('useSurface under the preview decorators', () => {
  it('reads light from the base plane when the theme global is light', () => {
    expect(probedSurface('light')).toBe('light/base')
  })

  it('reads dark from the base plane when the theme global is dark', () => {
    expect(probedSurface('dark')).toBe('dark/base')
  })

  it('falls back to dark when the theme global is unset or unknown', () => {
    expect(surfaceModeFromGlobals({})).toBe('dark')
    expect(surfaceModeFromGlobals({ theme: 'sepia' })).toBe('dark')
  })
})
