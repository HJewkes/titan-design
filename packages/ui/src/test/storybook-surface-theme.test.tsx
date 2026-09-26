import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react-vite'
import preview from '../../.storybook/preview'
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
